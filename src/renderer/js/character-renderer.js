import { clamp, lerp, reducedMotion } from './util.js';
import { SpriteRenderer, SPRITE as CAPRI } from './sprite.js';

// Use one coordinate system for drawing, dragging, collision and effect anchors.
export const SPRITE = {
  width: 320, height: 420, pad: 56,
  head: { x: 160, y: 110 }, feet: { x: 160, y: 418 }, hip: 270,
  shoulder: { x: 120, y: 220 }, hand: { x: 35, y: 250 }, mirror: 320,
};

// Small audio-driven body motion complements authored mouth frames; older
// character atlases still use this as their speech feedback.
function talkStretch(ctx, renderer, talk = 0) {
  renderer.talk = reducedMotion.matches ? 0 : lerp(renderer.talk || 0, talk, 0.5);
  if (renderer.talk < 0.01) return;
  const x = SPRITE.pad + SPRITE.feet.x, y = SPRITE.pad + SPRITE.feet.y;
  ctx.translate(x, y);
  ctx.scale(1 - renderer.talk * 0.015, 1 + renderer.talk * 0.03);
  ctx.translate(-x, -y);
}

export const ANIMATION_ROWS = Object.freeze({ idle: 0, thinking: 1, attention: 2, success: 3, error: 4, sleep: 5 });

export function animationFor({ mode = 'idle', act = '', reaction = '' } = {}) {
  if (mode === 'alert') return 'attention';
  if (reaction) return reaction;
  if (['flinch', 'glare', 'sulk', 'ko'].includes(act)) return 'error';
  if (['victory', 'hop'].includes(act)) return 'success';
  if (mode === 'sleep') return 'sleep';
  if (mode === 'work' || ['curious', 'look', 'gaze'].includes(act)) return 'thinking';
  return 'idle';
}

export function frameFor(state, elapsed, fps = 4, still = false) {
  const row = ANIMATION_ROWS[state] ?? ANIMATION_ROWS.idle;
  const step = Math.max(0, Math.floor(elapsed * fps / 1000));
  // Keep most of the idle cycle open-eyed; blinking should be occasional.
  const idle = [0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 3, 0];
  const column = still ? 0 : state === 'idle' ? idle[step % idle.length] : step % 4;
  return row * 4 + column;
}

export function sourceRect(character, framing = 'full') {
  return framing === 'bust'
    ? (character.bustCrop || { x: 55, y: 14, width: 210, height: 275.625 })
    : { x: 0, y: 0, width: SPRITE.width, height: SPRITE.height };
}

export function speakingFrame(state, elapsed, fps, still, talk, expressive) {
  // Authored attention frames have closed, open and rounded mouths. This is
  // audio-driven expression switching, not phoneme-level lip sync.
  if (expressive && talk > 0.04 && state !== 'sleep' && state !== 'error' && !still) {
    return 8 + (talk < 0.15 ? 3 : 1 + Math.floor(elapsed / 140) % 2);
  }
  return frameFor(state, elapsed, fps, still);
}

export class CharacterRenderer {
  constructor(canvas, image, character) {
    if (image.naturalWidth !== character.columns * SPRITE.width || image.naturalHeight !== character.rows * SPRITE.height) {
      throw new Error(`Invalid character atlas: ${character.id}`);
    }
    this.canvas = canvas;
    this.image = image;
    this.character = character;
    this.ctx = canvas.getContext('2d');
    this.frameCanvas = document.createElement('canvas');
    this.frameCanvas.width = SPRITE.width;
    this.frameCanvas.height = SPRITE.height;
    this.frameCtx = this.frameCanvas.getContext('2d', { willReadFrequently: true });
    this.state = 'idle';
    this.started = performance.now();
    this.frame = -1;
    this.selectFrame(0);
  }

  selectFrame(frame) {
    if (this.frame === frame) return;
    this.frame = frame;
    const { width, height } = SPRITE;
    this.frameCtx.clearRect(0, 0, width, height);
    const crop = sourceRect(this.character, this.framing);
    this.frameCtx.drawImage(this.image, frame % 4 * width + crop.x, Math.floor(frame / 4) * height + crop.y, crop.width, crop.height, 0, 0, width, height);
    this.pixels = this.frameCtx.getImageData(0, 0, width, height).data;
  }

  setFraming(framing) {
    this.framing = framing === 'bust' ? 'bust' : 'full';
    const frame = this.frame;
    this.frame = -1;
    this.selectFrame(frame);
  }

  resize(scale) {
    this.scale = scale;
    const dpr = window.devicePixelRatio || 1;
    const width = (SPRITE.width + SPRITE.pad * 2) * scale;
    const height = (SPRITE.height + SPRITE.pad * 2) * scale;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  draw(p, context = {}) {
    const now = performance.now();
    const state = animationFor(context);
    if (state !== this.state) {
      this.state = state;
      this.started = now;
    }
    this.selectFrame(speakingFrame(state, now - this.started, this.character.fps, reducedMotion.matches, context.talk, this.character.expressive));
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const scale = this.scale * (window.devicePixelRatio || 1);
    ctx.scale(scale, scale);
    talkStretch(ctx, this, context.talk);
    ctx.globalAlpha = clamp((p.alpha ?? 1) * (1 - (p.dissolve || 0)), 0, 1);
    ctx.translate(SPRITE.pad + SPRITE.width / 2, SPRITE.pad);
    ctx.scale(Math.max(0.01, 1 - (p.collapse || 0)), 1);
    // From the atlas, not frameCanvas: a bust crop resampled twice comes out blurry.
    const crop = sourceRect(this.character, this.framing), f = this.frame;
    ctx.drawImage(this.image, f % 4 * SPRITE.width + crop.x, Math.floor(f / 4) * SPRITE.height + crop.y, crop.width, crop.height, -SPRITE.width / 2, 0, SPRITE.width, SPRITE.height);
    ctx.restore();
  }
}

// Keep Capri's original shader and acting; copy its offscreen drawing into the shared canvas.
class CapriRenderer {
  constructor(canvas, image, character) {
    this.canvas = canvas;
    this.character = character;
    this.ctx = canvas.getContext('2d');
    this.source = document.createElement('canvas');
    this.legacy = new SpriteRenderer(this.source, image);
    this.legacy.resize(1);
    const mask = document.createElement('canvas');
    mask.width = SPRITE.width;
    mask.height = SPRITE.height;
    const ctx = mask.getContext('2d');
    const offset = SPRITE.feet.x - CAPRI.feet.x;
    ctx.drawImage(image, offset, 0);
    this.pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
    for (let y = 0; y < CAPRI.height; y++) {
      for (let x = 0; x < CAPRI.width; x++) {
        if (CAPRI.armL(x, y) && CAPRI.mirror - x < CAPRI.width) {
          const to = (y * SPRITE.width + offset + CAPRI.mirror - x) * 4 + 3;
          this.pixels[to] = Math.max(this.pixels[to], this.pixels[(y * SPRITE.width + offset + x) * 4 + 3]);
        }
      }
    }
  }

  resize(scale) { CharacterRenderer.prototype.resize.call(this, scale); }

  draw(p, context) {
    this.state = animationFor(context);
    this.legacy.draw(p);
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = this.scale * (window.devicePixelRatio || 1);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    talkStretch(ctx, this, context?.talk);
    ctx.drawImage(this.source, SPRITE.feet.x - CAPRI.feet.x, 0, CAPRI.width + CAPRI.pad * 2, CAPRI.height + CAPRI.pad * 2);
  }

  dispose() { this.legacy.gl.getExtension('WEBGL_lose_context')?.loseContext(); }
}

export function createCharacterRenderer(canvas, image, character) {
  return character.renderer === 'capri' ? new CapriRenderer(canvas, image, character) : new CharacterRenderer(canvas, image, character);
}
