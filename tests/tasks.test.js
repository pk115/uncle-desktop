const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createTasks } = require('../src/main/tasks');

test('tasks: add, list by due date, done by words, nag once when due within the hour', () => {
  let t = Date.parse('2026-11-01T09:00:00Z');
  const tasks = createTasks({ file: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-')), 'tasks.json'), now: () => t++ });
  tasks.add('ส่งรายงาน', '2026-11-01T09:30:00Z');
  tasks.add('ซื้อนม');
  tasks.add('โทรหาลูกค้า', '2026-11-03T09:00:00Z');
  assert.deepEqual(tasks.open().map((x) => x.text), ['ส่งรายงาน', 'โทรหาลูกค้า', 'ซื้อนม']);
  assert.deepEqual(tasks.dueSoon().map((x) => x.text), ['ส่งรายงาน']);
  assert.deepEqual(tasks.dueSoon(), []);
  tasks.done('นม');
  assert.deepEqual(tasks.open().map((x) => x.text), ['ส่งรายงาน', 'โทรหาลูกค้า']);
  assert.throws(() => tasks.done('ไม่มีงานนี้'), /ไม่พบงาน/);
});
