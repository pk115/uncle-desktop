const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSpeech, speechSettings } = require('../src/main/speech');

test('Edge Thai voices require consent but no API key and preserve rate', async () => {
  let called = 0;
  const service = createSpeech({ edge: async (text, voice, rate) => { called++; assert.equal(text, 'ใช่ไหมคะ'); assert.equal(voice, 'th-TH-PremwadeeNeural'); assert.equal(rate, 1.25); return { audio: 'fixture', format: 'mp3' }; } });
  const options = { provider: 'edge', voice: 'th-TH-PremwadeeNeural', rate: 1.25 };
  await assert.rejects(service.speak('ใช่ไหมคะ', options), /ยินยอม/); assert.equal(called, 0);
  const result = await service.speak('ใช่ไหมคะ', { ...options, cloudConsent: true }); assert.equal(result.format, 'mp3');
  await assert.rejects(service.speak('ใช่ไหมคะ', { ...options, voice: 'untrusted', cloudConsent: true }), /เลือกเสียง/);
});
test('Stop aborts Edge synthesis as well as cloud speech', async () => {
  const service = createSpeech({ edge: (_text, _voice, _rate, signal) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('stopped')), { once: true })) });
  const pending = service.speak('ทดสอบ', { provider: 'edge', voice: 'th-TH-NiwatNeural', cloudConsent: true });
  service.stop(); await assert.rejects(pending, /stopped/);
});
test('speech settings reject invalid providers, rates, volume and consent types', () => {
  assert.equal(speechSettings().auto, false);
  for (const value of [{ provider: 'unknown' }, { volume: 2 }, { rate: 99 }, { cloudConsent: 'yes' }, { auto: 1 }]) assert.throws(() => speechSettings(value));
  assert.equal(speechSettings({ provider: 'openai', voice: 'coral', secret: 'not allowed' }).secret, undefined);
});
test('cloud voice requires consent/key and sends bounded Thai text to the fixed endpoint', async () => {
  let request;
  const wav = Buffer.alloc(44); wav.write('RIFF', 0); wav.write('WAVE', 8);
  const service = createSpeech({ fetcher: async (url, init) => { request = { url, init }; return { ok: true, arrayBuffer: async () => wav }; } });
  const options = { provider: 'openai', voice: 'coral', cloudConsent: false };
  await assert.rejects(service.speak('สวัสดี', options, 'test-key'), /ยินยอม/);
  await assert.rejects(service.speak('สวัสดี', { ...options, cloudConsent: true }), /API key/);
  assert.equal(request, undefined);
  const result = await service.speak('สวัสดี', { ...options, cloudConsent: true }, 'test-key');
  assert.equal(request.url, 'https://api.openai.com/v1/audio/speech');
  assert.equal(JSON.parse(request.init.body).input, 'สวัสดี');
  assert.equal(JSON.parse(request.init.body).response_format, 'wav');
  assert.equal(Buffer.from(result.audio, 'base64').toString('ascii', 0, 4), 'RIFF');
  await assert.rejects(service.speak('x'.repeat(2001), options, 'test-key'));
});
test('voice requests can be canceled and provider failures do not disclose request credentials', async () => {
  const service = createSpeech({ fetcher: (_url, init) => new Promise((_resolve, reject) => { init.signal.addEventListener('abort', () => reject(new Error('aborted'))); }) });
  const pending = service.speak('hello', { provider: 'openai', voice: 'coral', cloudConsent: true }, 'secret');
  service.stop(); await assert.rejects(pending, /aborted/);
  const failure = createSpeech({ fetcher: async () => ({ ok: false, status: 401 }) });
  await assert.rejects(failure.speak('hello', { provider: 'openai', voice: 'coral', cloudConsent: true }, 'secret'), /API key ไม่ถูกต้อง/);
});
test('spoken chat removes code blocks, links and formatting, and limits long replies', async () => {
  const { speechText } = await import(pathToFileURL(path.join(__dirname, '../src/renderer/js/speech.js')).href);
  assert.equal(speechText('**สวัสดี** [อ่านต่อ](https://example.com) ```js\nsecret()\n```'), 'สวัสดี อ่านต่อ');
  assert.equal(speechText('x'.repeat(3000)).length, 2000);
});

test('mouth levels stay shut on silence and open with loudness, whatever the voice volume', async () => {
  const { mouthLevels } = await import(pathToFileURL(path.join(__dirname, '../src/renderer/js/speech.js')).href);
  const rate = 1200, step = rate / 12;
  const voice = (gain) => Float32Array.from({ length: step * 12 }, (_, i) => (i < step * 2 ? 0 : gain * (Math.floor(i / step) / 12) * Math.sin(i)));
  const loud = mouthLevels(voice(0.9), rate), soft = mouthLevels(voice(0.1), rate);
  assert.equal(loud.length, 12);
  assert.deepEqual(loud.slice(0, 2), [0, 0]);
  assert.equal(loud.at(-1), 1);
  assert.ok(loud.slice(2).every((level, i, all) => i === 0 || level >= all[i - 1]));
  assert.deepEqual(soft, loud);
  assert.deepEqual(mouthLevels(new Float32Array(rate), rate), new Array(12).fill(0));
});
