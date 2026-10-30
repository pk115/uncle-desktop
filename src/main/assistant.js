'use strict';

// Her personal assistant: Gmail and Google Calendar through their MCP servers (mcp.js), set up with
// one Google OAuth key file, and two watchers: important mail as it arrives, and each meeting a few
// minutes before it starts. Both servers run with npx (Node.js), at pinned versions.

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const PRESETS = {
  gmail: {
    label: 'Gmail', pkg: '@gongrzhe/server-gmail-autoauth-mcp@1.1.11',
    env: (dir) => ({ GMAIL_OAUTH_PATH: path.join(dir, 'google-oauth.json'), GMAIL_CREDENTIALS_PATH: path.join(dir, 'gmail-token.json') }),
  },
  calendar: {
    label: 'Google Calendar', pkg: '@cocal/google-calendar-mcp@2.8.1',
    env: (dir) => ({ GOOGLE_OAUTH_CREDENTIALS: path.join(dir, 'google-oauth.json'), GOOGLE_CALENDAR_MCP_TOKEN_PATH: path.join(dir, 'calendar-token.json') }),
  },
};
const MAIL_QUERY = 'is:unread is:important newer_than:1d';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// search_emails' text: "ID: …\nSubject: …\nFrom: …\nDate: …" blocks
function mailsFrom(text) {
  return String(text).split(/\n\s*\n/).map((block) => {
    const field = (name) => new RegExp(`^${name}: (.*)$`, 'm').exec(block)?.[1]?.trim() || '';
    return { id: field('ID'), subject: field('Subject'), from: field('From'), date: field('Date') };
  }).filter((m) => m.id);
}

// list-events' JSON, wherever its events sit: [{ id, summary, start (ms), link }] with a time of day
function eventsFrom(text) {
  let data;
  try { data = JSON.parse(text); } catch { return []; }
  const found = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const start = v.start?.dateTime || (typeof v.start === 'string' && v.start.includes('T') ? v.start : null);
      if (start && (v.summary !== undefined || v.id)) {
        const meet = v.hangoutLink || v.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;
        const inLocation = /https?:\/\/\S+/.exec(v.location || '')?.[0];
        found.push({ id: v.id || `${v.summary}@${start}`, summary: v.summary || '(ไม่มีชื่อ)', start: Date.parse(start), link: meet || inLocation || v.htmlLink || '' });
      } else Object.values(v).forEach(walk);
    }
  };
  walk(data);
  return found.filter((e) => Number.isFinite(e.start));
}

function createAssistant({ mcp, dir, getConfig, alert, log = () => {}, run = spawn }) {
  const keys = path.join(dir, 'google-oauth.json');
  const seenMail = new Set();
  const warned = new Set();
  let mailSeeded = false, events = [], timers = [];

  const connected = (kind) => Boolean(mcp.config()[kind]);
  const hasKeys = () => fs.existsSync(keys);

  // your Google OAuth key file (a "Desktop app" client), kept beside her settings
  function useKeys(file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.installed?.client_id) throw new Error('ไฟล์นี้ไม่ใช่ OAuth client แบบ Desktop app ของ Google (ต้องมี "installed")');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(file, keys);
  }

  // signs in once (your browser opens), then adds the server to mcp.json and reconnects
  async function connect(kind) {
    const preset = PRESETS[kind];
    if (!preset) throw new Error('ไม่รู้จักบริการนี้');
    if (!hasKeys()) throw new Error('ยังไม่มีไฟล์ Google OAuth key');
    const env = preset.env(dir);
    await new Promise((resolve, reject) => {
      const child = run(npx, ['-y', preset.pkg, 'auth'], { env: { ...process.env, ...env }, shell: process.platform === 'win32', windowsHide: true });
      const timer = setTimeout(() => { child.kill(); reject(new Error('รอการเข้าสู่ระบบนานเกินไป ลองใหม่อีกครั้ง')); }, 5 * 60000);
      child.stderr?.on('data', (d) => log(`[${kind} auth] ${String(d).trim().slice(0, 200)}`));
      child.on('error', () => { clearTimeout(timer); reject(new Error('เรียก npx ไม่ได้ ต้องติดตั้ง Node.js ก่อน (nodejs.org)')); });
      child.on('exit', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`เข้าสู่ระบบ ${preset.label} ไม่สำเร็จ (${code})`)); });
    });
    mcp.save({ ...mcp.config(), [kind]: { command: 'npx', args: ['-y', preset.pkg], env } });
    await mcp.start();
    if (!mcp.ready(kind)) throw new Error(`${preset.label} เชื่อมไม่สำเร็จ: ${mcp.info().find((s) => s.name === kind)?.error || ''}`);
  }
  async function disconnect(kind) {
    const { [kind]: _gone, ...rest } = mcp.config();
    mcp.save(rest);
    for (const f of Object.values(PRESETS[kind].env(dir))) if (f !== keys) fs.rmSync(f, { force: true });
    await mcp.start();
  }

  // important mail: what's new since the last look (the first look only remembers what's there)
  async function checkMail() {
    const cfg = getConfig();
    if (cfg.mailAlerts === false || !mcp.ready('gmail')) return;
    const mails = mailsFrom(await mcp.call('gmail', 'search_emails', { query: cfg.mailQuery || MAIL_QUERY, maxResults: 10 }));
    for (const m of mails) {
      if (seenMail.has(m.id)) continue;
      seenMail.add(m.id);
      if (mailSeeded) alert({ kind: 'mail', ...m, link: `https://mail.google.com/mail/u/0/#all/${m.id}` });
    }
    mailSeeded = true;
  }
  // the next three hours of your calendar
  async function loadEvents() {
    if (getConfig().eventAlerts === false || !mcp.ready('calendar')) return;
    const now = new Date();
    events = eventsFrom(await mcp.call('calendar', 'list-events', { calendarId: 'primary', timeMin: now.toISOString(), timeMax: new Date(now.getTime() + 3 * 3600000).toISOString() }, { max: 200000 }));
  }
  // each meeting, once, `eventLead` minutes before it starts
  function checkEvents(now = Date.now()) {
    const cfg = getConfig();
    if (cfg.eventAlerts === false) return;
    const lead = (cfg.eventLead || 10) * 60000;
    for (const e of events) {
      if (warned.has(e.id) || e.start - now > lead || e.start < now - 60000) continue;
      warned.add(e.id);
      alert({ kind: 'event', ...e, minutes: Math.max(0, Math.round((e.start - now) / 60000)) });
    }
  }

  function start() {
    const safely = (fn) => () => Promise.resolve().then(fn).catch((err) => log(`[assistant] ${err.message}`));
    timers = [setInterval(safely(checkMail), 3 * 60000), setInterval(safely(loadEvents), 5 * 60000), setInterval(() => checkEvents(), 30000)];
    timers.forEach((t) => t.unref?.());
    setTimeout(safely(async () => { await checkMail(); await loadEvents(); checkEvents(); }), 15000).unref?.();
  }
  const stop = () => timers.forEach(clearInterval);

  return { start, stop, connect, disconnect, useKeys, hasKeys, connected, checkMail, loadEvents, checkEvents, PRESETS };
}

module.exports = { createAssistant, mailsFrom, eventsFrom, PRESETS, MAIL_QUERY };
