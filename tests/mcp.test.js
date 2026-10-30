const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createMcp, readOnly } = require('../src/main/mcp');

test('MCP: connects a server from mcp.json, lists its tools and calls them', { timeout: 60000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uncle-mcp-'));
  const mcp = createMcp({ file: path.join(dir, 'mcp.json') });
  mcp.save({ echo: { command: process.execPath, args: [path.join(__dirname, 'fixtures', 'mcp-echo-server.js')] }, off: { command: 'nope', disabled: true } });
  try {
    const info = await mcp.start();
    assert.deepEqual(info.find((s) => s.name === 'echo').status, 'ready');
    assert.equal(info.find((s) => s.name === 'off').status, 'off');
    const tools = mcp.tools();
    assert.deepEqual(tools.map((t) => [t.name, t.readOnly]), [['search_notes', true], ['send_note', false]]);
    assert.equal(await mcp.call('echo', 'search_notes', { query: 'tax' }), 'found: tax');
    await assert.rejects(mcp.call('echo', 'nope'), /ไม่มีเครื่องมือ/);
  } finally { await mcp.stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('MCP: read-only by hint, else by name', () => {
  assert.ok(readOnly({ name: 'list-events' })); assert.ok(readOnly({ name: 'search_emails' })); assert.ok(readOnly({ name: 'get-current-time' }));
  assert.ok(!readOnly({ name: 'send_email' })); assert.ok(!readOnly({ name: 'delete-event' })); assert.ok(!readOnly({ name: 'create-event' }));
  assert.ok(readOnly({ name: 'do_it', annotations: { readOnlyHint: true } }));
});
