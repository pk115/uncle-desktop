// Audio and video from your phone (Telegram), decoded with Chromium: voice messages into the 16 kHz
// WAV her speech recognition reads, videos into a few pictures and their sound.
import { wav16 } from './listening-audio.js';

const bytesOf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const base64Of = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };

// any audio Chromium plays (Opus voice notes, AAC in an MP4…) as 16 kHz mono WAV, base64; max 2 minutes
export async function toWav({ data }) {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(bytesOf(data).buffer);
    const length = Math.min(audio.length, audio.sampleRate * 120), mono = new Float32Array(length);
    for (let c = 0; c < audio.numberOfChannels; c++) { const ch = audio.getChannelData(c); for (let i = 0; i < length; i++) mono[i] += ch[i] / audio.numberOfChannels; }
    return base64Of(wav16([mono], audio.sampleRate));
  } finally { context.close(); }
}

// a video: up to 6 evenly spaced pictures (JPEG, 640 px at most) and its sound as WAV, if it has any
export async function videoParts({ data, mime }) {
  const url = URL.createObjectURL(new Blob([bytesOf(data)], { type: mime || 'video/mp4' }));
  const video = document.createElement('video');
  video.muted = true; video.preload = 'auto'; video.src = url;
  try {
    await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = () => reject(new Error('เปิดวิดีโอนี้ไม่ได้')); });
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight, 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const frames = [];
    const count = duration > 2 ? 6 : 1;
    for (let i = 0; i < count; i++) {
      video.currentTime = count === 1 ? 0 : (duration * (i + 0.5)) / count;
      await new Promise((resolve) => { video.onseeked = resolve; setTimeout(resolve, 3000); });
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    }
    const wav = await toWav({ data }).catch(() => ''); // no sound track: just the pictures
    return { frames, wav, duration };
  } finally { URL.revokeObjectURL(url); }
}
