'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { CHARACTERS, characterFor } = require('../src/main/characters');

global.matchMedia ??= () => ({ matches: false, addEventListener() {} });
const load = (file) => import(pathToFileURL(path.join(__dirname, '../src/renderer/js', file)).href);

test('only shipped character IDs resolve, and each has the complete asset set', () => {
  assert.equal(characterFor('blacky').name, 'Blacky');
  assert.equal(characterFor('capri').renderer, 'capri');
  for (const id of ['bald-man', 'lazy-boy', 'angry-guy', 'drunk-uncle', 'vulture', 'chubby-girl', 'cute-girl', 'fatty-girl', 'pinky', 'mira']) {
    assert.equal(characterFor(id).id, id, `Missing requested character: ${id}`);
  }
  assert.equal(characterFor('../../missing').id, 'angry-boy');
  assert.equal(characterFor(null).id, 'angry-boy');
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length);
  for (const character of CHARACTERS) {
    if (character.renderer !== 'capri') assert.equal(character.columns * character.rows, 24);
    const expressions = character.renderer === 'capri' ? [] : ['thinking', 'attention', 'success', 'error', 'sleep'].map((s) => `${character.id}/${s}.png`);
    for (const asset of [character.atlas, character.portrait, ...expressions]) {
      assert.ok(fs.statSync(path.join(__dirname, '../assets/characters', asset)).size > 1000, asset);
    }
  }
});

test('animation priority keeps permission visible, and reactions return to the current work state', async () => {
  const { animationFor, frameFor } = await load('character-renderer.js');
  assert.equal(animationFor({ mode: 'alert', reaction: 'success' }), 'attention');
  assert.equal(animationFor({ mode: 'work', reaction: 'error' }), 'error');
  assert.equal(animationFor({ mode: 'work' }), 'thinking');
  assert.equal(animationFor({ mode: 'idle', act: 'victory' }), 'success');
  assert.equal(animationFor({ mode: 'sleep' }), 'sleep');
  assert.equal(animationFor({ mode: 'idle' }), 'idle');
  assert.equal(frameFor('error', 0), 16);
  assert.equal(frameFor('error', 250), 17);
  assert.equal(frameFor('error', 1000), 16);
  assert.equal(frameFor('sleep', 9500, 4, true), 20);
  assert.ok(frameFor('unknown', 500) < 4);
});

test('character copy changes identity without mutating the original locale or another character', async () => {
  const { linesFor, LINES } = await load('lines.js');
  const original = LINES.th.welcome.hi;
  for (const character of CHARACTERS) {
    const text = linesFor('th', 'codex', character);
    assert.match(text.welcome.hi, new RegExp(character.name));
    assert.match(text.welcome.about, /Codex/);
    if (character.renderer !== 'capri') assert.doesNotMatch(text.chat.note, /Capri/);
    assert.equal(linesFor('th', 'codex', character), text);
  }
  assert.equal(LINES.th.welcome.hi, original);
});

test('chat uses the selected game character personality for text and vision', async () => {
  const { Chat } = await load('chat.js');
  const chat = Object.create(Chat.prototype);
  chat.powers = () => [];
  let remembered;
  chat.host = { chatRemember(history, characterId) { remembered = { history, characterId }; } };
  for (const character of CHARACTERS) {
    chat.brain = { lang: 'th', assistant: 'codex', watching: true, context: () => '', character };
    assert.ok(chat.persona().startsWith(character.personality));
    assert.ok(chat.lookPersona().startsWith(character.personality));
    assert.match(chat.persona(), /ตอบเป็นภาษาไทย/);
    chat.history = [];
    chat.remember({ role: 'assistant', content: character.name });
    assert.equal(remembered.characterId, character.id);
    assert.equal(remembered.history[0].content, character.name);
  }
});
