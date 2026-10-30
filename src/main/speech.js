'use strict';
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const { spawn, execFile } = require('node:child_process');
const run = require('node:util').promisify(execFile);
const { Worker } = require('node:worker_threads');

const CLOUD_VOICES = ['coral', 'alloy', 'nova', 'onyx'];
const EDGE_VOICES = [{ id: 'th-TH-PremwadeeNeural', name: 'เปรมวดี — หญิง', lang: 'th-TH' }, { id: 'th-TH-NiwatNeural', name: 'นิวัฒน์ — ชาย', lang: 'th-TH' }];
const DEFAULT_SPEECH = { provider: 'windows', voice: '', volume: 0.7, rate: 1, auto: false, cloudConsent: false };
function speechSettings(value = {}) {
  if (!value || typeof value !== 'object' || !['windows', 'openai', 'edge'].includes(value.provider ?? 'windows') || typeof (value.voice ?? '') !== 'string' || (value.voice || '').length > 300) throw new Error('การตั้งค่าเสียงไม่ถูกต้อง');
  const settings = { ...DEFAULT_SPEECH, ...Object.fromEntries(Object.keys(DEFAULT_SPEECH).filter((key) => key in value).map((key) => [key, value[key]])) };
  if (!Number.isFinite(settings.volume) || settings.volume < 0 || settings.volume > 1 || !Number.isFinite(settings.rate) || settings.rate < 0.5 || settings.rate > 2 || typeof settings.auto !== 'boolean' || typeof settings.cloudConsent !== 'boolean') throw new Error('การตั้งค่าเสียงไม่ถูกต้อง');
  return settings;
}
function edgeSynthesize(text, voice, rate, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('หยุดเสียงแล้ว'));
    // A worker can be terminated on Stop, closing its WebSocket and pending audio request.
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const { EdgeTTS } = require(workerData.module);
      const keepAlive = setInterval(() => {}, 1000);
      (async () => {
        const percent = Math.round((workerData.rate - 1) * 100);
        const tts = new EdgeTTS({ voice: workerData.voice, lang: 'th-TH', rate: (percent >= 0 ? '+' : '') + percent + '%', timeout: 15000 });
        const chunks = []; let size = 0;
        for await (const chunk of tts.streamAudio(workerData.text)) {
          if (!Buffer.isBuffer(chunk)) continue;
          size += chunk.length; if (size > 16 * 1024 * 1024) throw Error('Audio too large'); chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        if (!bytes.length || bytes.length > 16 * 1024 * 1024) throw Error('Invalid audio');
        parentPort.postMessage({ audio: bytes.toString('base64'), format: 'mp3' });
      })().catch(() => parentPort.postMessage({ error: true })).finally(() => clearInterval(keepAlive));
    `, { eval: true, workerData: { module: require.resolve('node-edge-tts'), text, voice, rate } });
    let settled = false;
    const abort = () => finish(new Error('หยุดเสียงแล้ว'));
    const finish = (error, value) => { if (settled) return; settled = true; signal.removeEventListener('abort', abort); worker.terminate().catch(() => {}); error ? reject(error) : resolve(value); };
    signal.addEventListener('abort', abort, { once: true });
    worker.on('message', value => value.error ? finish(new Error('บริการเสียงไทย Edge ไม่พร้อม กรุณาตรวจอินเทอร์เน็ตหรือลองเลือก OpenAI')) : finish(null, value));
    worker.on('error', () => finish(new Error('เริ่มบริการเสียงไทย Edge ไม่สำเร็จ')));
    worker.on('exit', () => { if (!settled) finish(new Error('บริการเสียงไทย Edge หยุดทำงาน')); });
  });
}
// `say -v ?` lines, "Kanya   th_TH    # สวัสดี", as the voices speech.ps1 lists on Windows
function parseSayVoices(out) {
  return out.split('\n').map((l) => l.match(/^(.+?)\s+([a-z]{2,3}_[A-Za-z0-9]+)\s+#/)).filter(Boolean)
    .map(([, name, lang]) => ({ id: name.trim(), name: name.trim(), lang: lang.replace('_', '-') }));
}
// macOS's own voices through `say`, in the shape speech.ps1 answers with
async function mac(action, payload, signal) {
  if (action === 'voices') return parseSayVoices((await run('say', ['-v', '?'], { signal, timeout: 15000 })).stdout);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'uncle-say-')), file = path.join(dir, 'speech.wav');
  try {
    await run('say', ['-v', payload.voice, '-r', String(Math.round(175 * payload.rate)), '--file-format=WAVE', '--data-format=LEI16@22050', '-o', file, '--', payload.text], { signal, timeout: 60000 })
      .catch(() => { throw new Error(signal?.aborted ? 'หยุดเสียงแล้ว' : 'macOS สร้างเสียงไม่สำเร็จ กรุณาตรวจเสียงที่ติดตั้ง'); });
    return { audio: (await fs.readFile(file)).toString('base64') };
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}
function createSpeech({ script = path.join(__dirname, 'speech.ps1'), fetcher = fetch, edge = edgeSynthesize } = {}) {
  let running = null;
  let cachedVoices = null;
  function stop() { running?.abort(); running = null; }
  function windows(action, payload, signal) {
    if (process.platform === 'darwin') return mac(action, payload, signal);
    return new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-Action', action], { windowsHide: true, signal });
      let out = '', settled = false;
      const timer = setTimeout(() => { child.kill(); finish(new Error('ระบบเสียงใช้เวลานานเกินไป')); }, 60000);
      const finish = (err, result) => { if (settled) return; settled = true; clearTimeout(timer); err ? reject(err) : resolve(result); };
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { out += chunk; if (out.length > 16 * 1024 * 1024) { child.kill(); finish(new Error('เสียงตอบยาวเกินไป')); } });
      child.stderr.resume();
      child.on('error', (err) => finish(err));
      child.on('close', (code) => {
        if (code !== 0) return finish(new Error(signal?.aborted ? 'หยุดเสียงแล้ว' : 'Windows สร้างเสียงไม่สำเร็จ กรุณาตรวจเสียงที่ติดตั้ง'));
        try { finish(null, JSON.parse(out.replace(/^\uFEFF/, '').trim() || '[]')); } catch { finish(new Error('อ่านข้อมูลเสียง Windows ไม่สำเร็จ')); }
      });
      child.stdin.on('error', () => {});
      child.stdin.end(payload ? JSON.stringify(payload) : '');
    });
  }
  async function voices(refresh = false) {
    if (!['win32', 'darwin'].includes(process.platform)) return [];
    if (!cachedVoices || refresh) {
      const list = await windows('voices');
      cachedVoices = Array.isArray(list) ? list : [list];
    }
    return cachedVoices;
  }
  async function speak(text, options, key) {
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) throw new Error('ข้อความเสียงต้องมี 1–2000 ตัวอักษร');
    const settings = speechSettings(options);
    stop();
    const controller = new AbortController(); running = controller;
    const timeout = setTimeout(() => controller.abort(), settings.provider === 'edge' ? 20000 : 90000);
    try {
      if (settings.provider === 'windows') {
        const list = await voices();
        if (controller.signal.aborted) throw new Error('หยุดเสียงแล้ว');
        const selected = list.find((v) => v.id === settings.voice) || (!settings.voice ? list.find((v) => /^th/i.test(v.lang)) : null);
        if (!selected) throw new Error('ไม่พบเสียงที่เลือก กรุณาติดตั้งเสียงภาษาไทยในเครื่อง (Windows หรือ macOS) แล้วกดรีเฟรช');
        if (/[\u0e00-\u0e7f]/.test(text) && !/^th/i.test(selected.lang)) throw new Error('เสียงที่เลือกไม่รองรับภาษาไทย กรุณาติดตั้งเสียงไทยหรือเลือกเสียง AI ออนไลน์');
        return await windows('speak', { text, voice: selected.id, rate: settings.rate }, controller.signal);
      }
      if (settings.provider === 'edge') {
        if (!settings.cloudConsent) throw new Error('กรุณายินยอมส่งข้อความไป Microsoft Edge TTS ในหน้าเสียงพูดก่อน');
        if (!EDGE_VOICES.some(v => v.id === settings.voice)) throw new Error('กรุณาเลือกเสียงไทย Edge');
        return await edge(text, settings.voice, settings.rate, controller.signal);
      }
      if (!settings.cloudConsent) throw new Error('กรุณายินยอมส่งข้อความไป OpenAI ก่อนใช้เสียงออนไลน์');
      if (!key) throw new Error('กรุณาใส่ OpenAI API key ในหน้าตั้งค่าเสียง');
      if (!CLOUD_VOICES.includes(settings.voice)) throw new Error('กรุณาเลือกเสียงออนไลน์');
      const response = await fetcher('https://api.openai.com/v1/audio/speech', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: settings.voice, input: text, response_format: 'wav', speed: settings.rate }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'OpenAI API key ไม่ถูกต้อง' : response.status === 429 ? 'โควตาหรือเครดิต OpenAI ไม่เพียงพอ กรุณาตรวจบัญชี' : `บริการเสียงออนไลน์ขัดข้อง (${response.status})`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 16 * 1024 * 1024 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error('บริการไม่ได้ส่งเสียง WAV ที่รองรับกลับมา');
      return { audio: bytes.toString('base64') };
    } finally { clearTimeout(timeout); if (running === controller) running = null; }
  }
  return { voices, speak, stop };
}
module.exports = { createSpeech, parseSayVoices, speechSettings, DEFAULT_SPEECH, CLOUD_VOICES, EDGE_VOICES };
