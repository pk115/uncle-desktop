export function characterPrompt(description) {
  return `Create ONE desktop companion character: ${description.trim() || 'a friendly cute black cat with golden eyes'}.
Single character, front-facing or slight three-quarter view, full body with entire head, hands, feet and tail visible. Centered upright resting pose. Keep generous empty margins. Clear readable silhouette, consistent anatomy and natural hands. Genuine transparent PNG background with an alpha channel, no scenery, floor, cast shadow, text, watermark or drawn checkerboard. Portrait canvas 768 × 1024 pixels. If a reference image is attached, preserve its face, hairstyle, outfit and colors. This is a single static cutout, NOT a sprite sheet or collage. Use only original character designs or references I have permission to use.`;
}

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

export class CharacterImport {
  constructor({ host, lang, onAdded, onBack }) {
    this.host = host;
    this.th = lang === 'th';
    this.onAdded = onAdded;
    this.onBack = onBack;
    const t = (th, en) => this.th ? th : en;
    this.root = el('form', '', 'character-import');
    this.root.hidden = true;
    this.root.noValidate = true;
    const back = el('button', t('← กลับไปเลือกตัวละคร', '← Back to characters'), 'character-import__back');
    back.type = 'button';
    back.onclick = onBack;
    const heading = el('h2', t('เพิ่มเพื่อนจากภาพเดียว', 'Add a friend from one image'));
    const intro = el('p', t('เลือกภาพ → ตั้งชื่อ → ใช้งานได้เลย • ตัวที่เพิ่มจะแสดงเป็นภาพนิ่ง', 'Choose an image → give it a name → ready to use. Imported characters use a still image.'));
    const columns = el('div', '', 'character-import__columns');
    const left = el('div');
    const upload = el('label', '', 'character-import__upload');
    this.image = el('img');
    this.image.alt = t('ภาพตัวอย่างตัวละครของคุณ', 'Your character preview');
    this.image.hidden = true;
    this.placeholder = el('span', t('＋ เลือกภาพตัวละคร', '＋ Choose character image'));
    this.file = el('input');
    this.file.type = 'file';
    this.file.accept = 'image/png';
    this.file.setAttribute('aria-label', t('เลือกภาพ PNG', 'Choose PNG'));
    upload.append(this.image, this.placeholder, this.file);
    const spec = el('p', t('PNG ไม่เกิน 10 MB • แนะนำภาพพื้นหลังโปร่งใส', 'PNG up to 10 MB. Transparent background recommended.'), 'character-import__hint');
    this.warning = el('p', '', 'character-import__warning');
    left.append(upload, spec, this.warning);
    const right = el('div');
    this.name = el('input');
    this.name.type = 'text';
    this.name.maxLength = 40;
    this.name.placeholder = t('เช่น มะลิ', 'e.g. Mali');
    this.name.required = true;
    this.name.autocomplete = 'off';
    this.name.id = 'import-character-name';
    const nameLabel = el('label', t('ชื่อตัวละคร *', 'Character name *'));
    nameLabel.htmlFor = this.name.id;
    this.personality = el('textarea');
    this.personality.maxLength = 500;
    this.personality.rows = 3;
    this.personality.id = 'import-character-personality';
    this.personality.placeholder = t('เช่น ร่าเริง ชอบให้กำลังใจ พูดเป็นกันเอง', 'e.g. Cheerful, encouraging and friendly');
    const personalityLabel = el('label', t('นิสัยตอนคุย (ไม่ใส่ก็ได้)', 'Chat personality (optional)'));
    personalityLabel.htmlFor = this.personality.id;
    const note = el('p', t('ใช้ภาพนี้ทุกสถานะ เหมาะกับภาพเต็มตัวหรือครึ่งตัว', 'This image is used for every state. Full-body and half-body images both work.'), 'character-import__hint');
    right.append(nameLabel, this.name, personalityLabel, this.personality, note);
    columns.append(left, right);
    const help = el('details', '', 'character-import__help');
    help.append(el('summary', t('ยังไม่มีภาพ? ดาวน์โหลดตัวอย่าง / สร้างด้วย AI', 'Need an image? Download an example / create with AI')));
    const example = el('div', '', 'character-import__example');
    const exampleImage = el('img');
    exampleImage.src = '../../assets/characters/example.png';
    exampleImage.alt = 'Blacky';
    const download = el('button', t('↓ บันทึก PNG ตัวอย่าง', '↓ Save example PNG'));
    download.type = 'button';
    download.onclick = async () => {
      try { if (await host.downloadCharacterSample()) this.message.textContent = t('บันทึกภาพตัวอย่างแล้ว', 'Example saved.'); }
      catch { this.message.textContent = t('บันทึกไม่สำเร็จ ลองอีกครั้ง', 'Could not save. Please try again.'); }
    };
    example.append(exampleImage, download, el('p', t('ตัวอย่างเป็นภาพเต็มตัวโปร่งใส พร้อมนำมาลองเพิ่มได้', 'The example is a transparent full-body image, ready to import.')));
    const descriptionLabel = el('label', t('อยากได้ตัวละครหน้าตาแบบไหน?', 'What should your character look like?'));
    this.description = el('input');
    this.description.id = 'import-character-description';
    this.description.maxLength = 800;
    this.description.placeholder = t('เช่น แมวสีครีม ใส่เสื้อฮู้ดฟ้า สไตล์ 3D น่ารัก', 'e.g. A cream cat in a blue hoodie, cute 3D style');
    descriptionLabel.htmlFor = this.description.id;
    this.prompt = el('textarea');
    this.prompt.readOnly = true;
    this.prompt.rows = 5;
    this.prompt.setAttribute('aria-label', t('พรอมป์ต์สำหรับสร้างภาพด้วย AI', 'AI image prompt'));
    const refreshPrompt = () => { this.prompt.value = characterPrompt(this.description.value); };
    this.description.oninput = refreshPrompt;
    refreshPrompt();
    const copy = el('button', t('คัดลอกพรอมป์ต์', 'Copy prompt'));
    copy.type = 'button';
    copy.onclick = async () => {
      try { await host.copyCharacterPrompt(this.prompt.value); this.message.textContent = t('คัดลอกแล้ว นำไปวางใน AI สร้างภาพได้เลย', 'Copied. Paste it into your image AI.'); }
      catch { this.message.textContent = t('คัดลอกไม่สำเร็จ ลองเลือกข้อความแล้วคัดลอกเอง', 'Could not copy. Select and copy the text manually.'); }
    };
    help.append(example, descriptionLabel, this.description, this.prompt, copy, el('p', t('1. บอกหน้าตาและคัดลอกพรอมป์ต์  2. นำไปใช้ใน AI สร้างภาพที่คุณเลือก  3. บันทึก PNG แล้วกลับมาเลือกภาพด้านบน\nแอปไม่ได้สร้างภาพหรือเรียกเก็บค่าบริการ AI ในหน้านี้', '1. Describe and copy the prompt. 2. Use it in your preferred image AI. 3. Save a PNG and choose it above. This screen does not generate images or charge for AI.')));
    this.message = el('p', '', 'character-import__message');
    this.message.setAttribute('role', 'status');
    this.submit = el('button', t('เพิ่มและใช้ตัวละครนี้', 'Add and use character'), 'character-picker__apply');
    this.submit.type = 'submit';
    this.submit.disabled = true;
    this.root.append(back, heading, intro, columns, help, this.message, this.submit);
    this.name.oninput = () => this.validate();
    this.file.onchange = () => this.readFile(this.file.files[0]);
    this.root.onsubmit = async (e) => {
      e.preventDefault();
      if (!this.draft || !this.name.value.trim() || this.busy) return;
      this.setBusy(true);
      try {
        const character = await host.addCharacter({ token: this.draft.token, name: this.name.value.trim(), personality: this.personality.value.trim() });
        this.draft = null;
        await onAdded(character);
        this.reset();
      } catch (error) {
        this.message.textContent = t('เพิ่มไม่สำเร็จ: ', 'Could not add: ') + error.message;
      } finally { this.setBusy(false); }
    };
  }
  validate() { this.submit.disabled = this.busy || !this.draft || !this.name.value.trim(); }
  setBusy(busy) {
    this.busy = busy;
    for (const input of this.root.querySelectorAll('input, textarea, button')) input.disabled = busy;
    this.submit.textContent = busy ? (this.th ? 'กำลังเพิ่ม…' : 'Adding…') : (this.th ? 'เพิ่มและใช้ตัวละครนี้' : 'Add and use character');
    this.validate();
  }
  async readFile(file) {
    this.draft = null;
    this.image.hidden = true;
    this.placeholder.hidden = false;
    this.warning.textContent = '';
    this.message.textContent = '';
    this.validate();
    if (!file) return;
    this.setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error(this.th ? 'ภาพต้องไม่เกิน 10 MB' : 'Image must be 10 MB or smaller');
      const draft = await this.host.previewCharacter(new Uint8Array(await file.arrayBuffer()));
      this.draft = draft;
      this.image.src = draft.preview;
      this.image.hidden = false;
      this.placeholder.hidden = true;
      if (!draft.transparent) this.warning.textContent = this.th ? 'ภาพนี้มีพื้นหลังติดมาด้วย แอปจะไม่ลบพื้นหลังให้อัตโนมัติ' : 'This image has a background. The app will not remove it automatically.';
      if (!this.name.value) this.name.value = file.name.replace(/\.[^.]+$/, '').slice(0, 40);
    } catch (error) { this.message.textContent = error.message; }
    finally { this.file.value = ''; this.setBusy(false); if (this.draft) this.name.focus(); }
  }
  reset() {
    this.root.reset();
    this.draft = null;
    this.image.hidden = true;
    this.placeholder.hidden = false;
    this.warning.textContent = this.message.textContent = '';
    this.prompt.value = characterPrompt('');
    this.validate();
  }
}
