const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');

// the real script on a real Mac (CI's macOS runner): its first line is a snapshot of the windows
test('windows.jxa prints a window snapshot on macOS', { skip: process.platform !== 'darwin', timeout: 30000 }, async () => {
  const child = spawn('osascript', ['-l', 'JavaScript', path.join(__dirname, '..', 'src', 'main', 'windows.jxa'), '0']);
  let out = '', err = '';
  child.stderr.on('data', (d) => { err += d; });
  const line = await new Promise((resolve, reject) => {
    child.stdout.on('data', (d) => { out += d; if (out.includes('\n')) resolve(out.split('\n')[0]); });
    child.on('exit', (code) => reject(new Error(`exited ${code}: ${err}`)));
  }).finally(() => child.kill());
  const snap = JSON.parse(line);
  assert.equal(typeof snap.fg, 'number');
  assert.ok(Array.isArray(snap.wins) && Array.isArray(snap.ai));
  for (const w of snap.wins) assert.ok(['id', 'x', 'y', 'w', 'h'].every((k) => typeof w[k] === 'number'));
});
