const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
test('image prompt describes a single transparent character and preserves the user description', async () => {
  const { characterPrompt } = await import(pathToFileURL(path.join(__dirname, '../src/renderer/js/character-import.js')).href);
  const prompt = characterPrompt('  แมวสีครีม เสื้อฟ้า  ');
  assert.match(prompt, /แมวสีครีม เสื้อฟ้า/);
  assert.match(prompt, /transparent PNG/);
  assert.match(prompt, /single static cutout, NOT a sprite sheet/);
  assert.match(characterPrompt('  '), /friendly cute black cat/);
});
