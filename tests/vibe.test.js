const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');
const { createVibe, progressLine } = require('../src/main/vibe');

// commits in the tests need a name, CI has none
Object.assign(process.env, { GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' });

test('vibe: progress lines from Claude Code and Codex events', () => {
  assert.equal(progressLine({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: 'src/app.js' } }] } }), '🔧 Edit: src/app.js');
  assert.equal(progressLine({ type: 'item.completed', item: { type: 'command_execution', command: 'npm test' } }), '🔧 run: npm test');
  assert.equal(progressLine({ type: 'assistant', message: { content: [{ type: 'text', text: 'hi' }] } }), null);
});

test('vibe: create a project, run its agent (resuming its session), commit, refuse bad names', async () => {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'uncle-vibe-'));
  const state = {}; let spawned = null;
  // a fake Claude Code: streams one tool step and a result
  const run = (file, args, opts) => {
    spawned = { file, args, cwd: opts.cwd };
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = () => {}; child.stdin = { end: (p) => { spawned.prompt = p; } };
    setImmediate(() => {
      child.stdout.emit('data', `${JSON.stringify({ type: 'system', session_id: 's1' })}\n${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'index.html' } }] } })}\n`);
      fs.writeFileSync(path.join(opts.cwd, 'index.html'), '<h1>cafe</h1>');
      child.stdout.emit('data', `${JSON.stringify({ type: 'result', result: 'ทำหน้าแรกแล้ว', session_id: 's1' })}\n`);
      child.emit('exit', 0, null);
    });
    return child;
  };
  const vibe = createVibe({ getSettings: () => ({ workspace: ws }), getState: (n) => state[n], saveState: (n, s) => { state[n] = { ...s }; }, approveScript: 'x.js', port: 1, token: 't', run });
  try {
    assert.throws(() => vibe.dirOf('../etc'), /ชื่อโปรเจกต์/);
    await vibe.create('cafe-shop');
    assert.deepEqual(vibe.projects(), ['cafe-shop']);
    const lines = [];
    assert.equal(await vibe.send('cafe-shop', 'ทำหน้าแรก', (l) => lines.push(l)), 'ทำหน้าแรกแล้ว');
    assert.deepEqual(lines, ['🔧 Write: index.html']);
    assert.equal(state['cafe-shop'].session, 's1');
    assert.ok(spawned.args.includes('--permission-prompt-tool') && !spawned.args.includes('--resume'));
    await vibe.send('cafe-shop', 'ต่อ');
    assert.deepEqual(spawned.args.slice(-2), ['--resume', 's1']);
    assert.match((await vibe.diff('cafe-shop')).stat, /index\.html/);
    assert.match(await vibe.commit('cafe-shop', 'first page'), /first page/);
  } finally { fs.rmSync(ws, { recursive: true, force: true }); }
});

test('vibe: the approval server answers Claude Code over MCP', { timeout: 20000 }, async () => {
  const http = require('node:http');
  let asked = null;
  const server = http.createServer((req, res) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { asked = { token: req.headers['x-uncle-token'], ...JSON.parse(b) }; res.end(JSON.stringify({ allow: true })); }); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'hooks', 'uncle-approve-mcp.js')], { env: { ...process.env, UNCLE_PORT: String(server.address().port), UNCLE_APPROVE_TOKEN: 'tok', UNCLE_PROJECT: 'cafe' } });
  const replies = [];
  child.stdout.on('data', (d) => replies.push(...String(d).trim().split('\n').map((l) => JSON.parse(l))));
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })}\n${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'approve', arguments: { tool_name: 'Bash', input: { command: 'npm i' } } } })}\n`);
  for (let i = 0; i < 100 && replies.length < 2; i++) await new Promise((r) => setTimeout(r, 50));
  child.kill(); server.close();
  assert.deepEqual(asked, { token: 'tok', tool_name: 'Bash', input: { command: 'npm i' }, project: 'cafe' });
  assert.deepEqual(JSON.parse(replies[1].result.content[0].text), { behavior: 'allow', updatedInput: { command: 'npm i' } });
});
