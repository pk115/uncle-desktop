import { CharacterImport } from './character-import.js';
const COPY = {
  th: { title: 'เลือกเพื่อนบนเดสก์ท็อป', subtitle: 'ดูหน้าตาก่อนเลือก เปลี่ยนตัวได้ทุกเมื่อ', original: 'ตัวละครต้นฉบับ', game: 'ตัวละครจากเกมของคุณ', active: 'กำลังใช้งาน', select: 'ใช้ตัวละครนี้', current: 'กำลังใช้ตัวนี้อยู่', close: 'ปิด', loading: 'กำลังเปลี่ยน…', failed: 'เปลี่ยนไม่สำเร็จ ลองอีกครั้ง' },
  en: { title: 'Choose your desktop companion', subtitle: 'Preview a character before choosing. Switch anytime.', original: 'Original character', game: 'Your game character', active: 'Currently active', select: 'Use this character', current: 'Already active', close: 'Close', loading: 'Switching…', failed: 'Could not switch. Please try again.' },
};

export class CharacterPicker {
  constructor({ root, characters, currentId, lang, host, onChoose, onVisibility }) {
    this.root = root;
    this.characters = characters;
    this.currentId = this.pendingId = currentId;
    this.lang = lang;
    this.host = host;
    this.t = COPY[lang] || COPY.en;
    this.onChoose = onChoose;
    this.onVisibility = onVisibility;
    this.cards = new Map();
    const box = document.createElement('div');
    box.className = 'character-picker__box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'character-picker-title');
    const header = document.createElement('header');
    const eyebrow = document.createElement('span');
    eyebrow.className = 'character-picker__eyebrow';
    eyebrow.textContent = lang === 'th' ? 'ตัวละครของคุณ' : 'DESKTOP COMPANIONS';
    const title = document.createElement('h1');
    title.id = 'character-picker-title';
    title.textContent = this.t.title;
    const subtitle = document.createElement('p');
    subtitle.textContent = this.t.subtitle;
    const close = document.createElement('button');
    close.className = 'character-picker__close';
    close.type = 'button';
    close.textContent = '✕';
    close.setAttribute('aria-label', this.t.close);
    close.onclick = () => this.hide();
    header.append(eyebrow, title, subtitle, close);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'character-picker__add';
    add.textContent = lang === 'th' ? '＋ เพิ่มตัวละครของฉัน' : '＋ Add my character';
    add.onclick = () => this.showImport();
    header.append(add);
    const grid = document.createElement('div');
    grid.className = 'character-picker__grid';
    this.grid = grid;
    // Original first, followed by the user's characters.
    for (const character of [...characters].sort((a, b) => Number(b.renderer === 'capri') - Number(a.renderer === 'capri'))) this.appendCard(character);
    const footer = document.createElement('footer');
    this.footer = footer;
    this.addButton = add;
    this.status = document.createElement('p');
    this.status.setAttribute('role', 'status');
    this.apply = document.createElement('button');
    this.apply.type = 'button';
    this.apply.className = 'character-picker__apply';
    this.apply.onclick = async () => {
      this.apply.disabled = true;
      this.apply.textContent = this.t.loading;
      try {
        await this.onChoose(this.pendingId);
        this.hide();
      } catch {
        this.status.textContent = this.t.failed;
      } finally {
        this.update();
      }
    };
    this.remove = document.createElement('button');
    this.remove.type = 'button';
    this.remove.className = 'character-picker__remove';
    this.remove.textContent = lang === 'th' ? 'ลบตัวละครนี้' : 'Delete character';
    this.remove.onclick = async () => {
      if (this.confirmDelete !== this.pendingId) {
        this.confirmDelete = this.pendingId;
        this.status.textContent = lang === 'th' ? 'กดลบอีกครั้งเพื่อยืนยัน ประวัติแชตยังอยู่' : 'Click delete again to confirm. Chat history is kept.';
        return;
      }
      this.remove.disabled = true;
      try {
        const cfg = await host.removeCharacter(this.pendingId);
        this.pendingId = this.currentId = cfg.characterId;
        this.setCharacters(cfg.characters);
        this.status.textContent = '';
      } catch (error) { this.status.textContent = error.message; }
      finally { this.remove.disabled = false; this.confirmDelete = null; this.update(); }
    };
    footer.append(this.remove, this.status, this.apply);
    this.importer = new CharacterImport({ host, lang,
      onBack: () => this.closeImport(),
      onAdded: async (character) => {
        const cfg = await host.getConfig();
        this.setCharacters(cfg.characters);
        await this.onChoose(character.id);
        this.importer.setBusy(false);
        this.closeImport();
        this.hide();
      },
    });
    box.append(header, grid, this.importer.root, footer);
    root.replaceChildren(box);
    for (const event of ['mousedown', 'mouseup', 'click']) root.addEventListener(event, (e) => e.stopPropagation());
    root.addEventListener('click', (e) => { if (e.target === root) this.hide(); });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); if (this.importer.busy) return; this.importer.root.hidden ? this.hide() : this.closeImport(); }
      if (e.key === 'Tab') {
        const buttons = [...root.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary')].filter((e) => e.getClientRects().length);
        const first = buttons[0], last = buttons.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    this.update();
  }

  async preview(character) {
    const image = new Image();
    image.src = character.custom ? character.atlas : `../../assets/characters/${character.atlas}`;
    await image.decode();
    if (character.renderer === 'capri') return image.src;
    const canvas = document.createElement('canvas');
    canvas.width = character.frameWidth;
    canvas.height = character.frameHeight;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  }

  get open() { return !this.root.hidden; }

  setCharacters(characters) {
    if (characters.map((c) => c.id).join() === this.characters.map((c) => c.id).join()) return;
    this.characters = characters;
    const existing = new Set(characters.map((c) => c.id));
    for (const [id, card] of this.cards) if (!existing.has(id)) { card.remove(); this.cards.delete(id); }
    for (const character of characters) {
      if (this.cards.has(character.id)) continue;
      this.appendCard(character);
    }
    this.update();
  }

  appendCard(character) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'character-card'; card.dataset.characterId = character.id;
    const art = document.createElement('div'); art.className = 'character-card__art';
    const image = document.createElement('img'); image.alt = character.name;
    this.preview(character).then((src) => { image.src = src; }).catch(() => { image.src = character.custom ? character.portrait : `../../assets/characters/${character.portrait}`; });
    art.append(image);
    const name = document.createElement('strong'); name.textContent = character.name;
    const description = document.createElement('span'); description.className = 'character-card__description';
    description.textContent = character.custom ? (this.lang === 'th' ? 'เพิ่มเอง · ภาพนิ่ง' : 'Imported · Still image') : character.renderer === 'capri' ? this.t.original : this.lang === 'th' ? character.nameTh.split(' · ').slice(1).join(' · ') || this.t.game : this.t.game;
    const badge = document.createElement('span'); badge.className = 'character-card__badge'; badge.textContent = this.t.active;
    card.append(art, name, description, badge);
    card.onclick = () => { this.confirmDelete = null; this.status.textContent = ''; this.pendingId = character.id; this.update(); };
    this.cards.set(character.id, card); this.grid.append(card);
  }

  showImport() {
    this.grid.hidden = this.footer.hidden = this.addButton.hidden = true;
    this.importer.root.hidden = false;
    this.importer.file.focus();
  }
  closeImport() {
    if (this.importer.busy) return;
    this.importer.root.hidden = true;
    this.grid.hidden = this.footer.hidden = this.addButton.hidden = false;
    this.addButton.focus();
  }

  update() {
    for (const [id, card] of this.cards) {
      card.setAttribute('aria-pressed', String(id === this.pendingId));
      card.querySelector('.character-card__badge').hidden = id !== this.currentId;
    }
    this.apply.disabled = this.pendingId === this.currentId;
    this.remove.hidden = !this.characters.find((c) => c.id === this.pendingId)?.custom;
    this.apply.textContent = this.apply.disabled ? this.t.current : this.t.select;
  }

  setCurrent(id) {
    if (id !== this.currentId) this.currentId = this.pendingId = id;
    this.update();
  }

  show() {
    this.confirmDelete = null;
    this.closeImport();
    this.pendingId = this.currentId;
    this.status.textContent = '';
    this.update();
    this.root.hidden = false;
    this.onVisibility(true);
    this.cards.get(this.currentId)?.focus();
  }

  hide() {
    if (this.importer.busy) return;
    this.confirmDelete = null;
    this.root.hidden = true;
    this.onVisibility(false);
  }
}
