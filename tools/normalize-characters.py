"""Normalize generated 4x6 atlases using one scale and a shared feet anchor.

Usage: python tools/normalize-characters.py --character character-id RAW.png
Only writes derived assets inside this project's assets/characters directory.
"""
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[1]
STATES = ['idle', 'thinking', 'attention', 'success', 'error', 'sleep']
WIDTH, HEIGHT = 320, 420


def normalize(source, character):
    image = Image.open(source).convert('RGBA')
    assert image.width % 4 == 0 and image.height % 6 == 0, 'Expected a 4x6 atlas'
    assert image.getchannel('A').getextrema()[0] == 0, 'Background must be transparent'
    rgba = np.array(image)
    labels, _ = label(rgba[:, :, 3] > 80)
    counts = np.bincount(labels.ravel())
    components = [(i, box) for i, box in enumerate(find_objects(labels), 1) if counts[i] > image.width * image.height / 600]
    assert len(components) == 24, f'Expected 24 isolated figures, found {len(components)}'
    components.sort(key=lambda item: (item[1][0].start + item[1][0].stop) / 2)
    ordered = []
    for row in range(6):
        ordered.extend(sorted(components[row * 4:row * 4 + 4], key=lambda item: item[1][1].start))
    frames, bounds = [], []
    for component_id, slices in ordered:
        # Generated cell boundaries vary slightly; isolate the whole figure so hands are never clipped.
        ys, xs = slices
        box = (max(0, xs.start - 2), max(0, ys.start - 2), min(image.width, xs.stop + 2), min(image.height, ys.stop + 2))
        assert box[0] > 0 and box[2] < image.width, 'Figure clipped at atlas edge'
        mask = binary_dilation(labels == component_id, iterations=2)
        clean = rgba.copy()
        clean[:, :, 3] = np.where(mask, rgba[:, :, 3], 0)
        frame = Image.fromarray(clean).crop(box)
        frames.append(frame)
        bounds.append((0, 0, frame.width, frame.height))
    scale = min((WIDTH - 20) / max(b[2] - b[0] for b in bounds), (HEIGHT - 20) / max(b[3] - b[1] for b in bounds))
    atlas = Image.new('RGBA', (WIDTH * 4, HEIGHT * 6))
    out = ROOT / 'assets' / 'characters' / character
    out.mkdir(parents=True, exist_ok=True)
    normalized = []
    for i, (frame, box) in enumerate(zip(frames, bounds)):
        crop = frame.crop(box)
        crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        slot = Image.new('RGBA', (WIDTH, HEIGHT))
        slot.alpha_composite(crop, ((WIDTH - crop.width) // 2, HEIGHT - 2 - crop.height))
        assert slot.getchannel('A').getbbox()[3] <= HEIGHT - 1
        normalized.append(slot)
        atlas.alpha_composite(slot, ((i % 4) * WIDTH, (i // 4) * HEIGHT))
    atlas.save(out / 'atlas.webp', lossless=True, method=6)
    for row, state in enumerate(STATES):
        # Use the upper head region of the same shipped frame for dialogue portraits.
        frame = normalized[row * 4]
        box = frame.getchannel('A').getbbox()
        top, bottom = box[1], min(HEIGHT, box[1] + 195)
        face = frame.crop((30, top, WIDTH - 30, bottom))
        portrait = Image.new('RGBA', (256, 256))
        face.thumbnail((244, 244), Image.Resampling.LANCZOS)
        portrait.alpha_composite(face, ((256 - face.width) // 2, (256 - face.height) // 2))
        portrait.save(out / ('portrait.png' if row == 0 else f'{state}.png'))
    # A compact contact sheet makes checking all frames and state order easy.
    preview = Image.new('RGB', (WIDTH * 4 // 2, HEIGHT * 6 // 2), '#26313d')
    small = atlas.resize(preview.size, Image.Resampling.LANCZOS)
    preview.paste(small, (0, 0), small)
    preview.save(out / 'preview.jpg', quality=90)
    print(f'{character}: 24 frames, scale={scale:.3f}, {out / "atlas.webp"}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--angry')
    parser.add_argument('--blacky')
    parser.add_argument('--character', nargs=2, action='append', metavar=('ID', 'SOURCE'))
    args = parser.parse_args()
    jobs = list(args.character or [])
    if args.angry:
        jobs.append(('angry-boy', args.angry))
    if args.blacky:
        jobs.append(('blacky', args.blacky))
    if not jobs:
        parser.error('Provide --character ID SOURCE')
    for character, source in jobs:
        if not character or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in character):
            parser.error('Character ID must contain only lowercase letters, digits and hyphens')
        normalize(source, character)
