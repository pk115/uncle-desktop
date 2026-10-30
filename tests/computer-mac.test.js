const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execSync, spawn } = require('node:child_process');
const readline = require('node:readline');

// the Swift helper, compiled and asked over its JSON lines like computer.js does (CI's macOS runner;
// no Accessibility there, so reading windows must say how to allow it)
test('the macOS computer helper builds and answers', { skip: process.platform !== 'darwin', timeout: 300000 }, async () => {
  const root = path.join(__dirname, '..');
  execSync('npm run build:mac-helper', { cwd: root, stdio: 'inherit' });
  const child = spawn(path.join(root, 'native', 'uncle-computer'), ['0', '', '--no-prompt']);
  const lines = readline.createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const ask = async (request) => { child.stdin.write(`${JSON.stringify(request)}\n`); return JSON.parse((await lines.next()).value); };
  try {
    const cursor = await ask({ id: 'a', action: 'cursor' });
    assert.equal(cursor.ok, true); assert.equal(typeof cursor.value.x, 'number');
    const trusted = await ask({ id: 'b', action: 'trusted' });
    const read = await ask({ id: 'c', action: 'read', window: 0 });
    if (!trusted.value.trusted) assert.match(read.error, /Accessibility/);
    assert.equal((await ask({ id: 'd', action: 'nope', window: 1 })).ok, false);
  } finally { child.kill(); }
});
