const test = require('node:test');
const assert = require('node:assert/strict');
const { chatWithTools, parseCall } = require('../src/main/tool-chat');

const tools = [
  { server: 'gmail', name: 'search_emails', description: 'Search', schema: { properties: { query: {} }, required: ['query'] }, readOnly: true },
  { server: 'gmail', name: 'send_email', description: 'Send', schema: { properties: { to: {} } }, readOnly: false },
];
// a scripted AI: each turn streams its reply in small pieces
const scripted = (replies) => { let i = 0; const seen = []; return { seen, chat: async (messages, send) => { seen.push(messages); const r = replies[i++]; for (let k = 0; k < r.length; k += 4) send(r.slice(k, k + 4)); return r; } }; };

test('tool chat: a read tool runs without asking, its call never shows, the answer streams', async () => {
  const ai = scripted(['{"mcp":"gmail/search_emails","args":{"query":"is:unread"}}', 'มีเมลใหม่ 2 ฉบับ']);
  let shown = '', called = null;
  const text = await chatWithTools({ tools, messages: [{ role: 'system', content: 'You are her.' }, { role: 'user', content: 'เมลใหม่?' }], chat: ai.chat,
    call: async (s, n, a) => { called = [s, n, a]; return 'ID: 1'; }, confirm: async () => assert.fail('no asking for reads'), send: (t) => { shown += t; } });
  assert.equal(text, 'มีเมลใหม่ 2 ฉบับ'); assert.equal(shown, 'มีเมลใหม่ 2 ฉบับ');
  assert.deepEqual(called, ['gmail', 'search_emails', { query: 'is:unread' }]);
  assert.match(ai.seen[0][0].content, /TOOLS\..*gmail\/search_emails\(query\*\)/s);
  assert.match(ai.seen[1].at(-1).content, /untrusted data/);
});

test('tool chat: a write tool asks first; declined, it never runs', async () => {
  const ai = scripted(['{"mcp":"gmail/send_email","args":{"to":"a@b.c"}}', 'ไม่ได้ส่งนะ']);
  let ran = false;
  await chatWithTools({ tools, messages: [{ role: 'user', content: 'ส่ง' }], chat: ai.chat, call: async () => { ran = true; }, confirm: async () => false, send: () => {} });
  assert.equal(ran, false); assert.match(ai.seen[1].at(-1).content, /declined/);
});

test('tool chat: plain answers and unknown tools', async () => {
  assert.equal(parseCall('สวัสดี', tools), null);
  assert.deepEqual(parseCall('```json\n{"mcp":"x/y"}\n```', tools), { unknown: 'x/y' });
  let shown = '';
  const ai = scripted(['ok']);
  assert.equal(await chatWithTools({ tools, messages: [], chat: ai.chat, call: async () => {}, confirm: async () => true, send: (t) => { shown += t; } }), 'ok');
  assert.equal(shown, 'ok');
});
