export function confirmationAnswer(text) {
  const value = String(text || '').toLowerCase().replace(/[\p{P}\p{S}\s]/gu, '').replace(/(?:นะครับ|นะคะ|ครับ|ค่ะ|คะ|นะ)$/, '');
  if (/^(?:ไม่|ไม่ใช่|ไม่ต้อง|ไม่ต้องทำ|ยกเลิก|หยุด|อย่าทำ|no|nope|cancel|stop)$/.test(value)) return false;
  if (/^(?:ใช่|ใช่แล้ว|ยืนยัน|ตกลง|ทำเลย|เอาเลย|ได้เลย|yes|yeah|confirm|ok|okay)$/.test(value)) return true;
  return null;
}

export function voiceTimeNumbers(text) {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const numbers = digits.map((word, n) => [word, n]);
  for (let n = 10; n < 100; n++) {
    const tens = Math.floor(n / 10), unit = n % 10;
    numbers.push([(tens === 1 ? '' : tens === 2 ? 'ยี่' : digits[tens]) + 'สิบ' + (unit === 1 ? 'เอ็ด' : unit ? digits[unit] : ''), n]);
  }
  const lookup = new Map(numbers);
  const pattern = new RegExp(`(${[...lookup.keys()].sort((a,b)=>b.length-a.length).join('|')})(?=\\s*(?:นาที|ชั่วโมง|วินาที|โมง))`, 'g');
  return text.replace(pattern, word => String(lookup.get(word)));
}

// Voice uses the existing deterministic tools. A model's promise is never a success receipt.
export async function runVoiceCommand({ chat, text, ask, respond, fallback, active = () => true }) {
  text = voiceTimeNumbers(text);
  if (/^\s*(?:ช่วย|กรุณา)?\s*(?:ลบ(?:ไฟล์|โฟลเดอร์|ข้อมูล)|ส่ง(?:ข้อความ|เมล|อีเมล)|ซื้อ|โอนเงิน)/.test(text)) {
    await respond('คำสั่งนี้ยังไม่รองรับผ่านเสียง จึงยังไม่ได้ดำเนินการค่ะ'); return true;
  }
  if (!active()) return true;
  const asked = chat.asked(text);
  const close = /^\s*(?:ช่วย|กรุณา)?\s*(?:ปิด(?:แอป|โปรแกรม|หน้าต่าง)?|close)\s*(.*?)\s*(?:ด้วย|ครับ|ค่ะ)?\s*$/i.exec(text);
  if (asked?.kind !== 'media' && (asked?.kind === 'close' || close)) {
    const name = asked?.name || close[1];
    if (!name) { ask({ question: 'ต้องการปิดโปรแกรมอะไรคะ?', clarify: answer => fallback(`ปิดโปรแกรม ${answer}`) }); return true; }
    const app = await chat.host.findApp(name);
    if (!active()) return true;
    if (!app) { await respond(`ไม่พบโปรแกรม ${name} ที่เปิดอยู่ จึงยังไม่ได้ปิดค่ะ`); return true; }
    ask({ question: `ให้ปิด ${app.label || app.name} ใช่ไหมคะ? โปรแกรมอาจมีงานที่ยังไม่บันทึก ตอบใช่ หรือยกเลิกค่ะ`, execute: async () => {
      const result = await chat.host.closeApp(app.process || app.name, false);
      return result.error ? 'ปิดโปรแกรมไม่สำเร็จค่ะ' : result.running ? `${app.label || app.name} ยังเปิดอยู่ อาจกำลังรอให้บันทึกงาน กรุณาตรวจหน้าต่างโปรแกรมค่ะ` : `ปิด ${app.label || app.name} แล้วค่ะ`;
    } }); return true;
  }
  if (!asked) {
    if (/^\s*(?:ช่วย)?(?:เปิด(?:แอป|โปรแกรม)?|เล่นเพลง)\s*$/.test(text)) { ask({ question: 'ต้องการเปิดโปรแกรมหรือเพลงอะไรคะ?', clarify: answer => fallback(`${text.trim()} ${answer}`) }); return true; }
    return false;
  }
  if (asked.kind === 'look') {
    ask({ question: 'ให้ดูภาพหน้าจอและส่งให้โมเดล AI ที่เลือกไว้ใช่ไหมคะ?', execute: () => fallback(text, true) }); return true;
  }
  if (asked.kind === 'remind' && !asked.at) {
    ask({ question: 'ต้องการให้เตือนเมื่อไหร่คะ? เช่น อีกห้านาที หรือพรุ่งนี้เวลาเก้าโมง', clarify: answer => fallback(`${text} ${answer}`) }); return true;
  }
  const result = await chat.doNow(asked);
  if (!active()) return true;
  if (result?.offer) {
    const item = result.offer;
    ask({ question: `ให้เปิด ${item.name} ใช่ไหมคะ? รายการนี้อาจเรียกใช้โปรแกรมหรือสคริปต์`, execute: async () => {
      const launched = await chat.host.launch(item); return launched.ok ? `เปิด ${item.name} แล้วค่ะ` : `เปิด ${item.name} ไม่สำเร็จค่ะ`;
    } }); return true;
  }
  if (!result?.line) {
    if (asked.kind === 'open') ask({ question: 'ยังหาโปรแกรมชื่อนี้ไม่พบ บอกชื่อโปรแกรมที่ต้องการอีกครั้งได้ไหมคะ?', clarify: answer => fallback(`เปิดโปรแกรม ${answer}`) });
    else await respond('ยังทำคำสั่งนี้ไม่สำเร็จค่ะ กรุณาลองใหม่');
    return true;
  }
  await respond(result.line); return true;
}
