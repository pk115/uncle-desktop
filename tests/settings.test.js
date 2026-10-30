const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('key presses become accelerators by physical key, whatever the keyboard layout', async () => {
  const { accelerator } = await import(pathToFileURL(path.join(__dirname, '../src/renderer/js/settings.js')));
  const press = (code, mods = {}) => accelerator({ code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods });
  assert.equal(press('KeyV', { ctrlKey: true, altKey: true }), 'Control+Alt+V'); // a Thai layout types "อ" there
  assert.equal(press('Digit5', { shiftKey: true, metaKey: true }), 'Shift+Super+5');
  assert.equal(press('F9', { altKey: true }), 'Alt+F9');
  assert.equal(press('Space', { ctrlKey: true }), 'Control+Space');
  assert.equal(press('KeyV'), null); // needs a modifier
  assert.equal(press('ControlLeft', { ctrlKey: true }), null); // a modifier alone isn't a key
  assert.equal(press('Semicolon', { ctrlKey: true }), null);
});
