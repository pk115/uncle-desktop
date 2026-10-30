'use strict';

// Vibecoding from your phone: projects in one workspace folder, each with its coding agent (Claude
// Code or Codex). A prompt runs the agent headless in that folder and resumes its last session; its
// steps stream out as short progress lines. Claude Code asks your phone before any tool that needs
// permission (uncle-approve-mcp.js); Codex runs sandboxed to the project folder. Then diff, commit,
// PR, undo.

const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');

const NAME = /^[a-z0-9][a-z0-9-_]{0,48}$/i;
// git and gh: real programs, no shell (so a commit message is never a command)
const exec = (file, args, cwd) => new Promise((resolve, reject) => execFile(file, args, { cwd, windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, out, errOut) => (err ? reject(new Error((errOut || err.message).trim().slice(0, 400))) : resolve(out.trim()))));

// a step of Claude Code's (stream-json) or Codex's (--json) as one short line, or null
function progressLine(evt) {
  if (evt.type === 'assistant') {
    const use = evt.message?.content?.find((c) => c.type === 'tool_use');
    if (!use) return null;
    const i = use.input || {};
    const target = i.file_path || i.path || i.command || i.pattern || i.url || i.description || '';
    return `🔧 ${use.name}${target ? `: ${String(target).replace(/\s+/g, ' ').slice(0, 120)}` : ''}`;
  }
  const item = evt.item;
  if (evt.type === 'item.completed' && item) {
    if (item.type === 'command_execution') return `🔧 run: ${String(item.command || '').slice(0, 120)}`;
    if (item.type === 'file_change') return `✏️ ${(item.changes || []).map((c) => c.path).join(', ').slice(0, 160)}`;
  }
  return null;
}

function createVibe({ getSettings, saveState, getState, approveScript, nodePath = process.execPath, port, token, run = spawn, log = () => {} }) {
  const jobs = new Map(); // project -> child process

  const workspace = () => getSettings().workspace;
  const dirOf = (name) => {
    if (!NAME.test(name || '')) throw new Error('ชื่อโปรเจกต์ใช้ได้แค่ a-z 0-9 - _ (ไม่เกิน 49 ตัว)');
    return path.join(workspace(), name);
  };
  const projects = () => {
    try { return fs.readdirSync(workspace(), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name); } catch { return []; }
  };

  async function create(name, agent = 'claude') {
    const dir = dirOf(name);
    if (fs.existsSync(dir)) throw new Error(`มีโปรเจกต์ ${name} อยู่แล้ว`);
    fs.mkdirSync(dir, { recursive: true });
    await exec('git', ['init', '-q'], dir);
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n.uncle/\n.env\n');
    saveState(name, { agent: agent === 'codex' ? 'codex' : 'claude', session: null });
    return dir;
  }

  // the agent on a prompt; onLine(progress) as it works; resolves with its final answer
  function send(name, prompt, onLine = () => {}) {
    const dir = dirOf(name);
    if (!fs.existsSync(dir)) throw new Error(`ไม่มีโปรเจกต์ ${name}`);
    if (jobs.has(name)) throw new Error(`${name} กำลังทำงานอยู่ พิมพ์ /stop เพื่อหยุดก่อน`);
    const state = getState(name) || { agent: 'claude', session: null };
    let file, args, env = { ...process.env };
    if (state.agent === 'codex') {
      file = 'codex';
      args = state.session ? ['exec', 'resume', state.session, '--json', '-'] : ['exec', '--json', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-'];
    } else {
      // her approval server: Claude Code asks it before anything that needs your permission
      const mcpConfig = path.join(dir, '.uncle', 'approve-mcp.json');
      fs.mkdirSync(path.dirname(mcpConfig), { recursive: true });
      fs.writeFileSync(mcpConfig, JSON.stringify({ mcpServers: { uncle: { command: nodePath, args: [approveScript], env: { ELECTRON_RUN_AS_NODE: '1', UNCLE_PORT: String(port), UNCLE_APPROVE_TOKEN: token, UNCLE_PROJECT: name } } } }));
      file = 'claude';
      args = ['-p', '--output-format', 'stream-json', '--verbose', '--mcp-config', mcpConfig, '--permission-prompt-tool', 'mcp__uncle__approve', ...(state.session ? ['--resume', state.session] : [])];
    }
    return new Promise((resolve, reject) => {
      // the prompt goes in on stdin, never as an argument: npm's .cmd wrappers need a shell on Windows,
      // and your words must never reach one
      const win = process.platform === 'win32' && file === 'codex'; // npm's codex.cmd needs cmd; claude is a real program
      const quoted = win ? args.map((x) => (/[\s"&|<>^]/.test(x) ? `"${x.replace(/"/g, '\\"')}"` : x)) : args; // paths with spaces, through cmd
      const child = run(file, quoted, { cwd: dir, env, windowsHide: true, shell: win });
      jobs.set(name, child);
      child.stdin?.end(prompt);
      let buffer = '', answer = '', errors = '';
      child.stdout.on('data', (chunk) => {
        buffer += chunk;
        let nl;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim(); buffer = buffer.slice(nl + 1);
          let evt; try { evt = JSON.parse(line); } catch { continue; }
          const session = evt.session_id || evt.thread_id;
          if (session && session !== state.session) { state.session = session; saveState(name, state); }
          const step = progressLine(evt);
          if (step) onLine(step);
          if (evt.type === 'result') answer = evt.result || answer;
          if (evt.type === 'item.completed' && evt.item?.type === 'agent_message') answer = evt.item.text || answer;
        }
      });
      child.stderr.on('data', (d) => { errors += d; if (errors.length > 4000) errors = errors.slice(-4000); });
      child.on('error', (err) => { jobs.delete(name); reject(new Error(`เรียก ${file} ไม่ได้: ${err.message}`)); });
      child.on('exit', (code, signal) => {
        jobs.delete(name);
        if (signal) return resolve('หยุดแล้ว');
        if (code !== 0 && !answer) return reject(new Error(errors.trim().slice(-400) || `${file} จบด้วยรหัส ${code}`));
        resolve(answer || 'เสร็จแล้ว');
      });
    });
  }

  function stop(name) {
    const child = jobs.get(name);
    if (!child) return false;
    child.kill();
    return true;
  }

  // what changed since the last commit: the stats, and the diff itself (cut short)
  async function diff(name) {
    const dir = dirOf(name);
    await exec('git', ['add', '-A', '--intent-to-add'], dir).catch(() => {});
    const stat = await exec('git', ['diff', '--stat'], dir);
    const text = await exec('git', ['diff'], dir);
    return { stat: stat || 'ยังไม่มีอะไรเปลี่ยน', text };
  }
  async function commit(name, message) {
    const dir = dirOf(name);
    await exec('git', ['add', '-A'], dir);
    await exec('git', ['commit', '-q', '-m', message || 'Changes from Uncle Desktop'], dir);
    return exec('git', ['log', '--oneline', '-1'], dir);
  }
  // a branch of its own, pushed, and a pull request (gh must be signed in; the repo needs a remote)
  async function pullRequest(name, title) {
    const dir = dirOf(name);
    const branch = `uncle/${Date.now().toString(36)}`;
    await exec('git', ['checkout', '-q', '-b', branch], dir);
    await exec('git', ['push', '-q', '-u', 'origin', branch], dir);
    return exec('gh', ['pr', 'create', '--fill', ...(title ? ['--title', title] : [])], dir);
  }
  const undo = async (name) => { await exec('git', ['revert', '--no-edit', 'HEAD'], dirOf(name)); return exec('git', ['log', '--oneline', '-1'], dirOf(name)); };
  const busy = (name) => jobs.has(name);
  // a picture from your phone, in the project (.uncle/inbox, kept out of git) for the agent to read
  function saveImage(name, bytes) {
    const file = path.join(dirOf(name), '.uncle', 'inbox', `${Date.now()}.jpg`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    return path.relative(dirOf(name), file).split(path.sep).join('/');
  }

  return { projects, create, send, stop, diff, commit, pullRequest, undo, busy, dirOf, saveImage };
}

module.exports = { createVibe, progressLine, NAME };
