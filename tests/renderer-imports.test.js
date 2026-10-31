'use strict';
// Every file the renderer imports is in the repository (a file left out of a commit broke a release:
// the window came up empty).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('every renderer import is a tracked file', () => {
  const root = path.join(__dirname, '..');
  const tracked = new Set(execFileSync('git', ['ls-files', 'src/renderer'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean));
  const missing = [];
  for (const file of tracked) {
    if (!file.endsWith('.js') || file.includes('/vendor/')) continue;
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [, spec] of code.matchAll(/(?:import\s[^'"]*?from\s*|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = path.posix.join(path.posix.dirname(file), spec);
      if (!tracked.has(target)) missing.push(`${file} -> ${spec}`);
    }
  }
  assert.deepStrictEqual(missing, []);
});
