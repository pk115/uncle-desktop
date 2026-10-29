'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { TRAY, LANGS } = require('../src/main/labels');

global.matchMedia ??= () => ({ matches: false, addEventListener() {} });
const load = (name) => import(pathToFileURL(path.join(__dirname, '../src/renderer/js', name)).href);
const tokens = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('Thai translates every locale entry without losing interpolation or array structure', async () => {
  const { LINES, linesFor } = await load('lines.js');
  function compare(en, th, key = '') {
    if (en === null) return assert.equal(th, null, key);
    if (typeof en === 'string') {
      assert.equal(typeof th, 'string', key);
      assert.deepEqual(tokens(th), tokens(en), key);
      assert.ok(/[\u0E00-\u0E7F]/.test(th) || /^(AI|GB|MB|CLAUDE)$/.test(th), key);
      return;
    }
    assert.deepEqual(Object.keys(th).sort(), Object.keys(en).sort(), key);
    for (const k of Object.keys(en)) compare(en[k], th[k], `${key}.${k}`);
  }
  compare(LINES.en, LINES.th);
  assert.deepEqual(Object.keys(TRAY.th).sort(), Object.keys(TRAY.en).sort());
  assert.ok(LANGS.includes('th'));
  for (const assistant of ['claude', 'codex', 'agy']) {
    const text = linesFor('th', assistant);
    assert.match(text.welcome.connect, /[\u0E00-\u0E7F]/);
    assert.match(text.welcome.restart, /[\u0E00-\u0E7F]/);
    const strings = (value) => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
    if (assistant !== 'claude') assert.doesNotMatch(strings(text).join('\n'), /Claude|settings\.json|\.claude/);
  }
});

test('Thai reminders support relative times, Thai digits, tomorrow and invalid times', async () => {
  const { parseReminder, parseWhen } = await load('reminders.js');
  const now = new Date(2026, 9, 29, 10, 0).getTime();
  assert.deepEqual(parseReminder('เตือนฉันให้พักสายตาอีก 10 นาที', now), { at: now + 600000, text: 'พักสายตา' });
  assert.deepEqual(parseReminder('ช่วยเตือนดื่มน้ำใน ๑๕ นาทีด้วย', now), { at: now + 900000, text: 'ดื่มน้ำ' });
  assert.equal(parseWhen('อีก 1 ชั่วโมง 30 นาที', now).at, now + 5400000);
  assert.equal(parseWhen('อีกครึ่งชั่วโมง', now).at, now + 1800000);
  const reminder = parseReminder('เตือนประชุมพรุ่งนี้เวลา ๐๙:๓๐', now);
  assert.equal(reminder.at, new Date(2026, 9, 30, 9, 30).getTime());
  assert.equal(reminder.text, 'ประชุม');
  assert.equal(parseWhen('เวลา 25:00', now), null);
  assert.equal(parseReminder('เตือนอีก 0 นาที', now).at, null);
  assert.equal(parseReminder('เตือนอีก 8 ชั่วโมง', now).at, now + 28800000);
  assert.equal(parseReminder('remind me to rest in 10 minutes', now).at, now + 600000);
});

test('Thai chat understands names, memory and existing tools; its prompt requests Thai', async () => {
  const { Chat } = await load('chat.js');
  const chat = Object.create(Chat.prototype);
  chat.brain = { lang: 'th', assistant: 'codex', watching: true, context: () => '' };
  chat.apps = [];
  chat.powers = () => [];
  assert.deepEqual(chat.asked('เรียกฉันว่าปุ๊กกี้'), { kind: 'name', name: 'ปุ๊กกี้' });
  assert.deepEqual(chat.asked('จำไว้ว่าฉันชอบแมว'), { kind: 'memo', text: 'ฉันชอบแมว' });
  assert.deepEqual(chat.asked('ช่วยดูหน้าจอของฉันด้วย'), { kind: 'look' });
  assert.deepEqual(chat.asked('แคปหน้าจอ'), { kind: 'shot' });
  assert.deepEqual(chat.asked('เพิ่มเสียง'), { kind: 'media', action: 'volup' });
  assert.deepEqual(chat.asked('เปิดเพลง ลม บน YouTube'), { kind: 'youtube', song: 'ลม' });
  assert.deepEqual(chat.asked('ค้นหาแมวใน Google'), { kind: 'web', query: 'แมว' });
  assert.equal(chat.asked('ไม่ต้องดูหน้าจอ'), null);
  assert.equal(chat.asked('อย่าเปิดโปรแกรม'), null);
  assert.equal(chat.asked('ไม่ต้องเตือนฉันอีก 10 นาที'), null);
  assert.match(chat.persona(), /ตอบเป็นภาษาไทย/);
});

test('Thai rendering keeps tone marks attached and formats durations in Thai', async () => {
  const { graphemes, duration } = await load('util.js');
  const word = 'ปุ๊กกี้';
  const clusters = graphemes(word);
  assert.equal(clusters.join(''), word);
  assert.ok(clusters.every((cluster) => !/^\p{M}/u.test(cluster)));
  assert.equal(duration(65000, 'th'), '1 นาที 5 วินาที');
  assert.equal(duration(3600000, 'th'), '1 ชั่วโมง 0 นาที');
});
