// Wake matching only accepts a prefix; mentioning the name mid-conversation cannot send a command.
export function wakeCommand(text, words) {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/[\u0e48-\u0e4b]/g, '').replace(/[\s\p{P}\p{S}]/gu, '');
  const raw = String(text || '');
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    const wanted = normalize(word);
    if (!wanted || !normalize(raw).startsWith(wanted)) continue;
    for (let i = 1; i <= raw.length; i++) {
      if (normalize(raw.slice(0, i)) === wanted) return raw.slice(i).replace(/^[\s,，.!?:;。]+/, '').trim();
    }
  }
  return null;
}

export function wav16(chunks, rate) {
  const length = chunks.reduce((n, c) => n + c.length, 0), samples = new Float32Array(length);
  let at = 0; for (const chunk of chunks) { samples.set(chunk, at); at += chunk.length; }
  const count = Math.floor(length * 16000 / rate), bytes = new Uint8Array(44 + count * 2), view = new DataView(bytes.buffer);
  const ascii = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) {
    const begin = Math.floor(i * rate / 16000), end = Math.max(begin + 1, Math.floor((i + 1) * rate / 16000));
    let sum = 0; for (let j = begin; j < Math.min(end, length); j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (end - begin)));
    view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  return bytes;
}

// Energy VAD keeps a brief lead-in; silence and output audio are never transcribed.
export class Utterance {
  constructor(rate, threshold, silenceSeconds = 0.9) { this.silenceSeconds = silenceSeconds; this.rate = rate; this.threshold = threshold; this.minimumSeconds = 0.25; this.reset(); }
  reset() { this.chunks = []; this.lead = []; this.samples = 0; this.voiced = 0; this.quiet = 0; }
  push(samples) {
    const rms = Math.sqrt(samples.reduce((n, x) => n + x * x, 0) / samples.length);
    const voice = rms >= this.threshold;
    if (!this.chunks.length && !voice) { this.lead.push(samples.slice()); while (this.lead.reduce((n, c) => n + c.length, 0) > this.rate * 0.25) this.lead.shift(); return null; }
    if (!this.chunks.length) { this.chunks = this.lead; this.lead = []; }
    this.chunks.push(samples.slice()); this.samples += samples.length;
    if (voice) { this.voiced += samples.length; this.quiet = 0; } else this.quiet += samples.length;
    if (this.quiet > this.rate * this.silenceSeconds || this.samples > this.rate * 24) return this.finish();
    return null;
  }
  finish() { const result = this.voiced >= this.rate * this.minimumSeconds ? wav16(this.chunks, this.rate) : null; this.reset(); return result; }
}
