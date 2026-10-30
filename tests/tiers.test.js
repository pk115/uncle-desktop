const test = require('node:test');
const assert = require('node:assert/strict');
const { tierModel } = require('../src/main/tiers');

test('brain tiers pick the smallest, middle and biggest model', () => {
  const ollama = ['llama3.1:70b', 'qwen2.5:7b', 'gemma3:1b', 'qwen3:14b'];
  assert.equal(tierModel(ollama, 'normal'), 'gemma3:1b');
  assert.equal(tierModel(ollama, 'higher'), 'qwen2.5:7b');
  assert.equal(tierModel(ollama, 'max'), 'llama3.1:70b');
  const gemini = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  assert.equal(tierModel(gemini, 'normal'), 'gemini-2.5-flash-lite');
  assert.equal(tierModel(gemini, 'max'), 'gemini-2.5-pro');
  assert.equal(tierModel([], 'max'), null);
});
