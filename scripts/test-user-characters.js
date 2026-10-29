'use strict';
// Run with Electron to exercise the actual native image decoder, encoder and bitmap layout.
const { app, nativeImage } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createUserCharacters } = require('../src/main/user-characters');

app.whenReady().then(() => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-import-test-'));
  try {
    const catalog = [{ id: 'angry-boy' }];
    const store = createUserCharacters(root, nativeImage, catalog);
    store.load();
    const sample = fs.readFileSync(path.join(__dirname, '../assets/characters/example.png'));
    assert.throws(() => store.preview(Buffer.from('<svg onload="bad()"/>')));
    assert.throws(() => store.preview(Buffer.alloc(10 * 1024 * 1024 + 1)));
    const empty = nativeImage.createFromBitmap(Buffer.alloc(4 * 8 * 8), { width: 8, height: 8 }).toPNG();
    assert.throws(() => store.preview(empty), /ว่างเปล่า/);
    const draft = store.preview(sample);
    assert.equal(draft.transparent, true);
    assert.ok(draft.preview.startsWith('data:image/png;base64,'));
    assert.throws(() => store.add({ token: 'not-selected', name: 'wrong' }));
    assert.throws(() => store.add({ token: draft.token, name: '' }));
    const character = store.add({ token: draft.token, name: 'แมวทดลอง <b>', personality: 'พูดไทยและให้กำลังใจ' });
    assert.equal(character.name, 'แมวทดลอง <b>');
    assert.match(character.personality, /พูดไทย/);
    assert.equal(catalog.length, 2);
    assert.throws(() => store.add({ token: draft.token, name: 'duplicate' }));
    const atlas = nativeImage.createFromPath(store.imagePath(character.id, 'atlas.png'));
    assert.deepEqual(atlas.getSize(), { width: 1280, height: 2520 });
    const first = atlas.crop({ x: 0, y: 0, width: 320, height: 420 }).toBitmap();
    const last = atlas.crop({ x: 960, y: 2100, width: 320, height: 420 }).toBitmap();
    assert.deepEqual(first, last, 'Still image must be identical in all states');
    assert.ok(first.some((value, i) => i % 4 === 3 && value > 80), 'Imported frame must contain visible pixels');
    assert.equal(first[3], 0, 'Outer margin stays transparent');
    assert.equal(nativeImage.createFromPath(store.imagePath(character.id, 'portrait.png')).getSize().width, 320);
    const restored = [{ id: 'angry-boy' }];
    const reopened = createUserCharacters(root, nativeImage, restored);
    reopened.load(); reopened.load();
    assert.equal(restored.length, 2, 'Persistence without duplicates');
    assert.equal(restored[1].name, character.name);
    assert.throws(() => reopened.remove('angry-boy'));
    assert.throws(() => reopened.imagePath('../escape', 'portrait.png'));
    assert.throws(() => reopened.imagePath(character.id, '../character.json'));
    reopened.remove(character.id);
    assert.equal(restored.length, 1);
    assert.equal(fs.existsSync(path.join(root, character.id)), false);
    console.log('PASS custom characters: real PNG import, rejection, transparency, 24 static frames, persistence, safe removal');
  } finally {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('companion-import-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
  app.quit();
}).catch((error) => { console.error(error); app.exit(1); });
