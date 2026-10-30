'use strict';

// Her side of Telegram (telegram.js carries the messages): what you type, say, photograph or film
// on your phone, answered by her AI with her tools; tools that write ask you with buttons; her
// alerts sent on when you want them (always, or only while you're away from the computer).

const HELP = `คุยกับฉันได้เลย:
• พิมพ์ถาม — "พรุ่งนี้มีนัดอะไร", "สรุปเมลวันนี้"
• ส่งข้อความเสียง — ฉันฟังภาษาไทยได้
• ส่งรูป — "อ่านใบเสร็จนี้", "นี่คืออะไร"
• ส่งวิดีโอสั้น — ฉันดูภาพและฟังเสียงในคลิป
/new เริ่มเรื่องใหม่ · /help ดูวิธีใช้`;

function createPhone({ telegram, settings, answer, transcribe, speak, media, idleSeconds = () => 0, log = () => {} }) {
  const history = []; // the last turns with your phone, for follow-ups
  const asks = new Map(); // a tool waiting for your tap: id -> resolve
  const remember = (role, content) => { history.push({ role, content }); while (history.length > 12) history.shift(); };

  // a tool that writes: buttons on your phone (or no, if approving from the phone is off)
  function confirm(chatId, tool, args) {
    if (!settings().switches.approve) return Promise.resolve(false);
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2, 10);
      asks.set(id, resolve);
      const detail = Object.entries(args).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n').slice(0, 600);
      telegram.send(chatId, `ขออนุญาตใช้ ${tool.server}/${tool.name}\n${detail}`, [[{ text: '✓ อนุญาต', data: `ask:${id}:yes` }, { text: '✗ ไม่ต้อง', data: `ask:${id}:no` }]]).catch(() => resolve(false));
      setTimeout(() => { if (asks.delete(id)) resolve(false); }, 5 * 60000).unref?.();
    });
  }

  // her answer to you, in words (and in her voice, when you'd like that)
  async function reply(chatId, question, { images = [], heardVoice = false } = {}) {
    await telegram.typing(chatId);
    const text = await answer({ history: [...history], text: question, images, confirm: (tool, args) => confirm(chatId, tool, args) });
    remember('user', question); remember('assistant', text);
    await telegram.send(chatId, text || '…');
    const voice = settings().voiceReply;
    if (text && (voice === 'always' || (voice === 'voice' && heardVoice))) {
      try {
        const audio = await speak(text);
        if (audio) await telegram.sendFile(chatId, 'audio', audio.bytes, `uncle.${audio.ext}`, audio.mime);
      } catch (err) { log(`[phone] voice reply: ${err.message}`); }
    }
  }

  async function onMessage(m) {
    const { chatId } = m;
    try {
      if (m.kind === 'callback') {
        const [, id, yes] = /^ask:(\w+):(yes|no)$/.exec(m.data) || [];
        const resolve = asks.get(id);
        if (resolve) { asks.delete(id); resolve(yes === 'yes'); await telegram.send(chatId, yes === 'yes' ? 'อนุญาตแล้ว กำลังทำ…' : 'ไม่ทำนะ'); }
        return;
      }
      if (!settings().switches.chat) return telegram.send(chatId, 'การคุยผ่าน Telegram ปิดอยู่ เปิดได้ที่ ตั้งค่า › Telegram บนคอม');
      if (m.kind === 'text') {
        if (/^\/(start|help)\b/.test(m.text)) return telegram.send(chatId, HELP);
        if (/^\/new\b/.test(m.text)) { history.length = 0; return telegram.send(chatId, 'เริ่มเรื่องใหม่แล้ว'); }
        return await reply(chatId, m.text);
      }
      if (m.kind === 'voice') {
        await telegram.typing(chatId, 'record_voice');
        const wav = await media('toWav', { data: (await telegram.download(m.fileId)).toString('base64'), mime: m.mime });
        const heard = (await transcribe(Buffer.from(wav, 'base64'))).trim();
        if (!heard) return telegram.send(chatId, 'ไม่ได้ยินอะไรเลย ลองอัดใหม่อีกทีนะ');
        await telegram.send(chatId, `🎙 ได้ยินว่า: ${heard}`);
        return await reply(chatId, heard, { heardVoice: true });
      }
      if (m.kind === 'photo') {
        const image = (await telegram.download(m.fileId)).toString('base64');
        return await reply(chatId, m.caption || 'ดูรูปนี้แล้วบอกหน่อยว่าเป็นอะไร มีอะไรน่าสนใจ', { images: [image] });
      }
      if (m.kind === 'video') {
        if (m.size > 20 * 1024 * 1024) return telegram.send(chatId, 'คลิปใหญ่เกิน 20 MB Telegram ไม่ให้ bot ดาวน์โหลด ลองส่งคลิปสั้นลง');
        await telegram.typing(chatId);
        const parts = await media('videoParts', { data: (await telegram.download(m.fileId)).toString('base64'), mime: m.mime });
        const heard = parts.wav ? (await transcribe(Buffer.from(parts.wav, 'base64')).catch(() => '')).trim() : '';
        const ask = `${m.caption || 'ดูคลิปนี้แล้วสรุปว่าเกิดอะไรขึ้น'}\n(ภาพ ${parts.frames.length} เฟรมจากคลิป ${Math.round(parts.duration)} วินาที${heard ? `, เสียงในคลิปว่า: "${heard}"` : ''})`;
        return await reply(chatId, ask, { images: parts.frames });
      }
    } catch (err) {
      log(`[phone] ${err.message}`);
      await telegram.send(chatId, `ขอโทษนะ ทำไม่สำเร็จ: ${err.message}`.slice(0, 500)).catch(() => {});
    }
    return undefined;
  }

  // one of her alerts, to your phone: always, or only while you're away (5 minutes without input)
  async function notify(alert) {
    const s = settings(), chatId = s.chatId;
    if (!chatId || s.notify === 'off' || (s.notify === 'away' && idleSeconds() < 300)) return;
    const link = /^https:\/\//.test(alert.link || '') ? alert.link : '';
    const text = alert.kind === 'mail' ? `📧 เมลสำคัญจาก ${alert.from}\n${alert.subject}`
      : alert.kind === 'event' ? `📅 อีก ${alert.minutes} นาที: ${alert.summary}`
        : alert.kind === 'news' ? `📰 ${alert.title}\n${alert.text || ''}`
          : alert.kind === 'agent' ? `🤖 ${alert.message}`
            : `${alert.kind === 'error' ? '⚠️' : '💬'} ${alert.message || alert.text || ''}`;
    await telegram.send(chatId, text, link ? [[{ text: alert.kind === 'mail' ? 'เปิดเมล' : alert.kind === 'event' ? 'เข้าประชุม' : 'เปิด', url: link }]] : undefined);
  }

  return { onMessage, notify, confirm, history };
}

module.exports = { createPhone, HELP };
