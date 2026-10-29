export function speechText(text) {
  return String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/[*#`_>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

const node = (tag, text = '') => { const el = document.createElement(tag); el.textContent = text; return el; };
export class Speech {
  constructor({ host, root, stopButton, onVisibility, lastReply }) {
    Object.assign(this, { host, root, stopButton, onVisibility, lastReply });
    this.settings = { provider: 'windows', voice: '', volume: 0.7, rate: 1, auto: false, cloudConsent: false };
    this.serial = 0;
    root.className = 'character-picker'; root.hidden = true;
    const box = node('div'); box.className = 'character-picker__box speech-box'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'speech-title');
    const title = node('h1', 'เสียงพูดภาษาไทย'); title.id = 'speech-title';
    const close = node('button', '✕'); close.type = 'button'; close.className = 'speech-close'; close.setAttribute('aria-label', 'ปิดหน้าตั้งค่าเสียง'); close.onclick = () => this.hide();
    const providerLabel = node('label', 'เลือกบริการเสียง');
    this.provider = node('select'); this.provider.id = 'speech-provider'; providerLabel.htmlFor = this.provider.id;
    for (const [id, label] of [['edge', 'เสียงไทย Edge — ออนไลน์ ไม่ต้องใส่คีย์'], ['windows', 'Windows — อ่านในเครื่อง ใช้เสียงที่ติดตั้งไว้'], ['openai', 'OpenAI — เสียง AI ออนไลน์']]) { const option = node('option', label); option.value = id; this.provider.append(option); }
    this.voice = node('select'); this.voice.id = 'speech-voice';
    const voiceLabel = node('label', 'เสียงที่ใช้'); voiceLabel.htmlFor = this.voice.id;
    this.note = node('p');
    this.local = node('div');
    const install = node('button', 'เปิดการตั้งค่าเสียง Windows'); install.onclick = () => host.speechWindowsSettings();
    const refresh = node('button', 'รีเฟรชรายชื่อเสียง'); refresh.onclick = () => this.load(true);
    this.local.append(install, refresh);
    this.cloud = node('div');
    this.key = node('input'); this.key.type = 'password'; this.key.id = 'speech-key'; this.key.autocomplete = 'off'; this.key.placeholder = 'เว้นว่างถ้ามีคีย์บันทึกไว้แล้ว'; this.key.maxLength = 512;
    const keyLabel = node('label', 'OpenAI API key (เก็บแบบเข้ารหัสในเครื่อง)'); keyLabel.htmlFor = this.key.id;
    this.keyLabel = keyLabel;
    this.consent = node('input'); this.consent.type = 'checkbox'; this.consent.id = 'speech-consent';
    this.consentCaption = document.createTextNode(' ยินยอมส่งข้อความที่อ่านไป OpenAI และรับทราบว่าอาจมีค่าบริการ API');
    const consentLabel = node('label'); consentLabel.htmlFor = this.consent.id; consentLabel.append(this.consent, this.consentCaption);
    this.cloudNote = node('p');
    this.cloud.append(keyLabel, this.key, consentLabel, this.cloudNote);
    this.volume = node('input'); this.volume.id = 'speech-volume'; this.volume.type = 'range'; this.volume.min = 0; this.volume.max = 1; this.volume.step = 0.05;
    const volumeLabel = node('label', 'ระดับเสียงพูด'); volumeLabel.htmlFor = this.volume.id;
    this.volume.oninput = () => { if (this.gain) this.gain.gain.value = Number(this.volume.value); };
    this.rate = node('select'); this.rate.id = 'speech-rate';
    for (const [value, label] of [[0.75, 'ช้า'], [1, 'ปกติ'], [1.25, 'เร็ว'], [1.5, 'เร็วมาก']]) { const option = node('option', label); option.value = value; this.rate.append(option); }
    const rateLabel = node('label', 'ความเร็ว'); rateLabel.htmlFor = this.rate.id;
    this.auto = node('input'); this.auto.type = 'checkbox'; this.auto.id = 'speech-auto';
    const autoLabel = node('label'); autoLabel.htmlFor = this.auto.id; autoLabel.append(this.auto, document.createTextNode(' อ่านคำตอบแชตอัตโนมัติ (อ่านสูงสุด 2,000 ตัวอักษรต่อคำตอบ)'));
    this.sample = node('textarea'); this.sample.id = 'speech-sample'; this.sample.rows = 2; this.sample.maxLength = 2000; this.sample.value = 'สวัสดีค่ะ ฉันเป็นเพื่อน AI ของคุณ วันนี้มีอะไรให้ช่วยไหมคะ';
    const sampleLabel = node('label', 'ข้อความทดสอบ — แก้ไขได้'); sampleLabel.htmlFor = this.sample.id;
    this.status = node('p'); this.status.className = 'speech-status'; this.status.setAttribute('role', 'status');
    const actions = node('div'); actions.className = 'speech-actions';
    this.test = node('button', '▶ ทดสอบเสียง'); this.test.onclick = () => this.tryPlay(this.sample.value);
    const read = node('button', 'อ่านข้อความตอบล่าสุด'); read.onclick = () => this.tryPlay(this.lastReply());
    const stop = node('button', '■ หยุดเสียง'); stop.onclick = () => this.stop();
    const save = node('button', 'บันทึก'); save.className = 'character-picker__apply'; save.onclick = async () => { try { await this.save(); this.status.textContent = 'บันทึกการตั้งค่าแล้ว'; } catch (error) { this.error(error); } };
    actions.append(this.test, read, stop, save);
    box.append(title, close, providerLabel, this.provider, voiceLabel, this.voice, this.note, this.local, this.cloud, volumeLabel, this.volume, rateLabel, this.rate, autoLabel, sampleLabel, this.sample, this.status, actions);
    root.replaceChildren(box);
    this.provider.onchange = () => { this.stop(); this.key.value = ''; this.consent.checked = false; this.renderVoices(); };
    for (const event of ['mousedown', 'mouseup', 'click']) root.addEventListener(event, (e) => e.stopPropagation());
    root.addEventListener('click', (e) => { if (e.target === root) this.hide(); });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.hide(); }
      if (e.key === 'Tab') {
        const fields = [...root.querySelectorAll('button,input,select,textarea')].filter((el) => !el.disabled && el.getClientRects().length);
        if (e.shiftKey && document.activeElement === fields[0]) { e.preventDefault(); fields.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === fields.at(-1)) { e.preventDefault(); fields[0].focus(); }
      }
    });
    stopButton.onclick = () => { const failed = this.lastError; this.stop(); if (failed) this.show(); };
    for (const event of ['mousedown', 'mouseup', 'click']) stopButton.addEventListener(event, (e) => e.stopPropagation());
  }
  get open() { return !this.root.hidden; }
  get active() { return !this.stopButton.hidden && !this.lastError; }
  configure(config) {
    const settings = config.speech || this.settings;
    if (JSON.stringify(settings) !== JSON.stringify(this.settings) || config.muted || this.characterId && this.characterId !== config.characterId) this.stop();
    this.settings = settings; this.muted = config.muted; this.characterId = config.characterId;
  }
  async load(refresh = false) {
    try {
      this.info = await this.host.speechInfo(refresh); this.settings = this.info.settings;
      this.provider.value = this.settings.provider; this.volume.value = this.settings.volume; this.rate.value = this.settings.rate;
      this.auto.checked = this.settings.auto; this.consent.checked = this.settings.cloudConsent; this.key.value = '';
      this.renderVoices();
    } catch (error) { this.error(error); }
  }
  renderVoices() {
    if (!this.info) return;
    const local = this.provider.value === 'windows';
    const edge = this.provider.value === 'edge';
    this.local.hidden = !local; this.cloud.hidden = local;
    this.key.hidden = edge; this.keyLabel.hidden = edge;
    this.consentCaption.textContent = edge ? ' ยินยอมส่งข้อความที่อ่านไป Microsoft Edge TTS เพื่อสร้างเสียงไทยออนไลน์' : ' ยินยอมส่งข้อความที่อ่านไป OpenAI และรับทราบว่าอาจมีค่าบริการ API';
    this.cloudNote.textContent = edge ? 'มีเสียงไทยชายและหญิงให้เลือกทันที ไม่ต้องติดตั้งเสียง Windows หรือใส่คีย์ ต้องใช้อินเทอร์เน็ตและบริการภายนอก อาจใช้งานไม่ได้เมื่อบริการเปลี่ยน ไม่ส่งเสียงไมค์หรือภาพหน้าจอผ่าน TTS' : 'เสียงสร้างโดย AI ใช้เฉพาะข้อความที่สั่งให้อ่าน ไม่ส่งเสียงไมค์หรือภาพหน้าจอ คีย์นี้ใช้ร่วมกับ OpenAI ในหน้าแชต';
    this.voice.replaceChildren();
    const voices = local ? this.info.voices : edge ? this.info.edgeVoices : this.info.cloudVoices.map((id) => ({ id, name: id, lang: 'ไทยและภาษาอื่น' }));
    for (const v of voices) { const option = node('option', `${v.name} · ${v.lang}`); option.value = v.id; this.voice.append(option); }
    if (voices.some((v) => v.id === this.settings.voice)) this.voice.value = this.settings.voice;
    else this.voice.value = voices.find((v) => /^th/i.test(v.lang))?.id || voices[0]?.id || '';
    this.note.textContent = local ? (voices.some((v) => /^th/i.test(v.lang)) ? 'พบเสียงภาษาไทย อ่านได้โดยไม่ส่งข้อความออกจากเครื่อง' : 'ยังไม่พบเสียงภาษาไทย ติดตั้งเสียงไทยใน Windows หรือเลือกเสียงไทย Edge ที่ใช้ได้ทันทีผ่านอินเทอร์เน็ต') : edge ? 'เสียงไทยพร้อมใช้ผ่าน Microsoft Edge TTS · ต้องใช้อินเทอร์เน็ต · ไม่ต้องใส่ API key' : `ส่งข้อความไป OpenAI เพื่อสร้างเสียง AI${this.info.hasKey ? ' · มีคีย์บันทึกไว้แล้ว' : ' · ยังไม่มีคีย์'}`;
  }
  async show() { this.root.hidden = false; this.status.textContent = ''; this.onVisibility(true); await this.load(); this.provider.focus(); }
  hide() { this.root.hidden = true; this.key.value = ''; this.onVisibility(false); }
  async save() {
    const settings = { provider: this.provider.value, voice: this.voice.value, volume: Number(this.volume.value), rate: Number(this.rate.value), auto: this.auto.checked, cloudConsent: this.consent.checked };
    if (settings.provider !== 'windows' && !settings.cloudConsent) throw new Error('กรุณายินยอมส่งข้อความไปบริการเสียงออนไลน์ก่อน');
    this.settings = await this.host.speechSave(settings, settings.provider === 'openai' ? this.key.value.trim() : ''); this.key.value = ''; return this.settings;
  }
  error(error) { this.status.textContent = String(error.message || error).replace(/^Error invoking remote method '[^']+': (?:Error: )?/, ''); }
  async tryPlay(text) { try { await this.save(); await this.play(text); } catch (error) { this.error(error); } }
  async play(text) {
    text = speechText(text);
    if (!text) throw new Error('ยังไม่มีข้อความให้อ่าน');
    if (this.muted) throw new Error('แอปปิดเสียงอยู่ กรุณาเปิดเสียงในเมนูคลิกขวาก่อน');
    this.stop(); const serial = this.serial;
    this.stopButton.textContent = '■ หยุดเสียงพูด';
    this.stopButton.hidden = false; this.status.textContent = 'กำลังสร้างเสียง…';
    try {
      this.context ||= new AudioContext(); await this.context.resume();
      const result = await this.host.speechSpeak(text);
      if (serial !== this.serial) return;
      const bytes = Uint8Array.from(atob(result.audio), (c) => c.charCodeAt(0));
      const buffer = await this.context.decodeAudioData(bytes.buffer);
      if (serial !== this.serial) return;
      this.source = this.context.createBufferSource(); this.gain = this.context.createGain();
      this.source.buffer = buffer; this.gain.gain.value = this.settings.volume;
      this.source.connect(this.gain).connect(this.context.destination);
      this.source.onended = () => { if (serial === this.serial) { this.stopButton.hidden = true; this.status.textContent = 'อ่านจบแล้ว'; this.source = null; } };
      this.source.start(); this.status.textContent = 'กำลังอ่าน…';
    } catch (error) { if (serial === this.serial) { this.stopButton.hidden = true; throw error; } }
  }
  stop() { const active = this.source || !this.stopButton.hidden; this.serial++; this.lastError = false; this.host.speechStop(); if (this.source) { this.source.onended = null; this.source.stop(); this.source = null; } this.stopButton.hidden = true; if (active) this.status.textContent = 'หยุดเสียงแล้ว'; }
  reply(text) { if (this.settings.auto) this.play(text).catch((error) => { this.error(error); if (!this.open) { this.lastError = true; this.stopButton.textContent = 'เสียงพูดไม่พร้อม — เปิดตั้งค่า'; this.stopButton.hidden = false; } }); }
}
