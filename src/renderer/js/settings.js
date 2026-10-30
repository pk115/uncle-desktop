// All her settings in one place: what's ready at a glance, a button into each existing panel, her
// shortcuts, and her personality.md / me.md.
const el = (tag, text = '') => { const n = document.createElement(tag); n.textContent = text; return n; };

const KEYS = { Space: 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' };
// A key press as an Electron accelerator ('Control+Alt+V'), or null without a modifier and a key.
// By e.code, so a Thai keyboard layout gives the same keys as an English one.
export function accelerator(e) {
  const mods = [e.ctrlKey && 'Control', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Super'].filter(Boolean);
  const key = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : /^Digit\d$/.test(e.code) ? e.code.slice(5) : /^F\d{1,2}$/.test(e.code) ? e.code : KEYS[e.code];
  return mods.length && key ? [...mods, key].join('+') : null;
}
const shown = (keys) => (keys ? keys.replace('Control', 'Ctrl').replace('Super', 'Win') : 'ปิดอยู่');

const HOTKEYS = [['toggle', 'ซ่อน / เรียกตัวละคร'], ['voice', 'เริ่ม / หยุดพูด'], ['mute', 'ปิดไมค์ทันที']];
const PROVIDERS = { ollama: 'Ollama', openai: 'OpenAI', gemini: 'Gemini', claude: 'Claude Code', custom: 'เซิร์ฟเวอร์ที่ตั้งเอง' };
const SPEECH = { edge: 'เสียงไทย Edge', windows: 'เสียง Windows', openai: 'OpenAI' };
const STT = { local: 'ถอดเสียงในเครื่อง', gemini: 'Gemini', openai: 'OpenAI' };

export class Settings {
  constructor({ host, root, onOpen, onVisibility }) {
    Object.assign(this, { host, root, onOpen, onVisibility });
    root.className = 'character-picker'; root.hidden = true;
    const box = el('div'); box.className = 'character-picker__box speech-box settings-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'settings-title');
    const title = el('h1', 'ตั้งค่าทั้งหมด'); title.id = 'settings-title';
    const close = el('button', '✕'); close.type = 'button'; close.className = 'speech-close'; close.setAttribute('aria-label', 'ปิดหน้าตั้งค่า'); close.onclick = () => this.hide();
    box.append(title, close);

    // what's set, each with the panel that changes it
    box.append(el('h2', 'ภาพรวม'));
    this.rows = {};
    for (const [id, label, button] of [['ai', 'AI แชต', 'ตั้งค่า AI'], ['characters', 'ตัวละคร', 'เลือกตัวละคร'], ['speech', 'เสียงพูด', 'ตั้งค่าเสียงพูด'], ['listening', 'สั่งงานด้วยเสียง', 'ตั้งค่าไมค์'], ['customize', 'ชื่อ / ความจำ', 'แก้ไข']]) {
      const row = el('div'); row.className = 'settings-row';
      const value = el('span'); this.rows[id] = value;
      const open = el('button', button); open.type = 'button'; open.onclick = () => { this.hide(); this.onOpen(id); };
      row.append(el('b', label), value, open);
      box.append(row);
    }

    // her shortcuts: click a field, press the keys
    box.append(el('h2', 'คีย์ลัด'), el('p', 'คลิกช่องแล้วกดปุ่มที่ต้องการ ต้องมี Ctrl, Alt, Shift หรือ Win ร่วมด้วย · Backspace เพื่อปิดคีย์ลัดนั้น'));
    this.keys = {};
    for (const [id, label] of HOTKEYS) {
      const input = el('input'); input.id = `hotkey-${id}`; input.readOnly = true;
      const caption = el('label', label); caption.htmlFor = input.id;
      input.onkeydown = (e) => {
        if (e.key === 'Tab' || e.key === 'Escape') return;
        e.preventDefault();
        if (e.key === 'Backspace' || e.key === 'Delete') input.dataset.keys = '';
        else input.dataset.keys = accelerator(e) ?? input.dataset.keys;
        input.value = shown(input.dataset.keys);
      };
      this.keys[id] = input;
      box.append(caption, input);
    }
    const keyActions = el('div'); keyActions.className = 'speech-actions';
    const saveKeys = el('button', 'บันทึกคีย์ลัด'); saveKeys.type = 'button'; saveKeys.onclick = () => this.saveKeys();
    const defaults = el('button', 'คืนค่าเริ่มต้น'); defaults.type = 'button'; defaults.onclick = () => this.saveKeys({ toggle: 'Control+Alt+C', voice: 'Control+Alt+V', mute: 'Control+Alt+M' });
    keyActions.append(saveKeys, defaults);
    box.append(keyActions);

    // her personality and what she knows of you, as files
    box.append(el('h2', 'บุคลิกและความจำระยะยาว'), el('p', 'สองไฟล์นี้ส่งให้ AI ทุกครั้งที่คุย เปิดแก้ใน Notepad บันทึกแล้วมีผลตอนเปิดแชตครั้งถัดไป'));
    this.noteState = {};
    for (const [id, label, button] of [['personality', 'personality.md — บุคลิกที่อยากให้เป็น', 'แก้ไข personality.md'], ['me', 'me.md — สิ่งที่รู้เกี่ยวกับคุณ', 'แก้ไข me.md']]) {
      const row = el('div'); row.className = 'settings-row';
      const value = el('span'); this.noteState[id] = value;
      const open = el('button', button); open.type = 'button'; open.onclick = () => this.openNotes(id);
      row.append(el('b', label), value, open);
      box.append(row);
    }
    this.learn = el('input'); this.learn.type = 'checkbox'; this.learn.id = 'settings-learn';
    this.learn.onchange = () => this.host.setConfig({ learn: this.learn.checked });
    const learnLabel = el('label'); learnLabel.htmlFor = this.learn.id;
    learnLabel.append(this.learn, document.createTextNode(' ให้จดสิ่งที่เรียนรู้ลง me.md เองทุก 5 รอบที่คุย (ใช้ AI ตัวเดียวกับแชต ไม่ทำกับ Claude Code)'));
    box.append(learnLabel);

    this.status = el('p'); this.status.className = 'speech-status'; this.status.setAttribute('role', 'status');
    box.append(this.status);
    root.replaceChildren(box);

    for (const event of ['mousedown', 'mouseup', 'click']) root.addEventListener(event, (e) => e.stopPropagation());
    root.addEventListener('click', (e) => { if (e.target === root) this.hide(); });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.hide(); }
      if (e.key === 'Tab') {
        const fields = [...root.querySelectorAll('button,input')].filter((n) => !n.disabled && n.getClientRects().length);
        if (e.shiftKey && document.activeElement === fields[0]) { e.preventDefault(); fields.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === fields.at(-1)) { e.preventDefault(); fields[0].focus(); }
      }
    });
  }
  get open() { return !this.root.hidden; }

  async show() {
    this.root.hidden = false; this.status.textContent = ''; this.onVisibility(true);
    await this.load();
    this.root.querySelector('button:not(.speech-close)')?.focus();
  }
  hide() { if (this.root.hidden) return; this.root.hidden = true; this.onVisibility(false); }

  async load() {
    try {
      const [cfg, notes] = await Promise.all([this.host.getConfig(), this.host.notes()]);
      const keys = cfg.hotkeys || {};
      this.rows.ai.textContent = [PROVIDERS[cfg.provider] || cfg.provider, cfg.chatModel].filter(Boolean).join(' · ');
      this.rows.characters.textContent = cfg.character?.name || '';
      this.rows.speech.textContent = `${SPEECH[cfg.speech?.provider] || 'ยังไม่ได้ตั้ง'}${cfg.speech?.auto ? ' · อ่านคำตอบเอง' : ''}`;
      this.rows.listening.textContent = `${STT[cfg.listening?.provider] || 'ยังไม่ได้ตั้ง'} · ${cfg.listening?.mode === 'wake' ? 'รอคำเรียก' : 'กดพูด'}`;
      this.rows.customize.textContent = `${cfg.userName || 'ยังไม่ได้บอกชื่อ'} · จำไว้ ${(cfg.memories || []).length} เรื่อง`;
      for (const [id] of HOTKEYS) { this.keys[id].dataset.keys = keys[id] || ''; this.keys[id].value = shown(keys[id]); }
      for (const id of ['personality', 'me']) this.noteState[id].textContent = notes[id] ? `${notes[id].split('\n').filter(Boolean).length} บรรทัด` : 'ยังว่าง';
      this.learn.checked = cfg.learn !== false;
    } catch (error) { this.error(error); }
  }

  async saveKeys(keys = Object.fromEntries(HOTKEYS.map(([id]) => [id, this.keys[id].dataset.keys]))) {
    try {
      const result = await this.host.saveHotkeys(keys);
      for (const [id] of HOTKEYS) { this.keys[id].dataset.keys = result.hotkeys[id] || ''; this.keys[id].value = shown(result.hotkeys[id]); }
      this.status.textContent = result.taken.length
        ? `โปรแกรมอื่นใช้ ${result.taken.map((id) => shown(keys[id])).join(', ')} อยู่ จึงคงคีย์เดิมไว้`
        : 'บันทึกคีย์ลัดแล้ว';
    } catch (error) { this.error(error); }
  }

  async openNotes(id) {
    const failed = await this.host.openNotes(id).catch((error) => error.message);
    this.status.textContent = failed ? `เปิดไฟล์ไม่ได้: ${failed}` : 'เปิดใน Notepad แล้ว บันทึกไฟล์แล้วเปิดแชตใหม่';
  }

  error(error) { this.status.textContent = String(error.message || error).replace(/^Error invoking remote method '[^']+': (?:Error: )?/, ''); }
}
