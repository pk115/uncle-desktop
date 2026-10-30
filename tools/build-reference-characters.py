"""Package six generated poses into the existing 4x6 companion atlas format.

Artwork comes from imagegen; this only isolates, aligns and packages the poses.
Usage: python tools/build-reference-characters.py SOURCE_DIRECTORY
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[1]
STATES = ['idle', 'thinking', 'attention', 'success', 'error', 'sleep']
WIDTH, HEIGHT = 320, 420


def build(character, source):
    image = Image.open(source).convert('RGBA')
    rgba = np.array(image)
    assert rgba[:, :, 3].min() == 0, 'Source must have genuine transparency'
    labels, _ = label(rgba[:, :, 3] > 80)
    counts = np.bincount(labels.ravel())
    figures = [(i, bounds) for i, bounds in enumerate(find_objects(labels), 1)
               if bounds and counts[i] > 3000]
    assert len(figures) == 6, f'{character}: expected six separate figures, found {len(figures)}'
    figures.sort(key=lambda item: (item[1][0].start + item[1][0].stop) / 2)
    ordered = sorted(figures[:3], key=lambda item: item[1][1].start)
    ordered += sorted(figures[3:], key=lambda item: item[1][1].start)
    poses = []
    for component, (ys, xs) in ordered:
        # Isolate the pose, including its soft alpha edge, without its neighbor.
        mask = binary_dilation(labels == component, iterations=2)
        isolated = rgba.copy()
        isolated[:, :, 3] = np.where(mask, rgba[:, :, 3], 0)
        bounds = (max(0, xs.start - 2), max(0, ys.start - 2),
                  min(image.width, xs.stop + 2), min(image.height, ys.stop + 2))
        poses.append(Image.fromarray(isolated).crop(bounds))
    standing_scale = min(300 / max(p.width for p in poses[:5]),
                         396 / max(p.height for p in poses[:5]))
    out = ROOT / 'assets' / 'characters' / character
    out.mkdir(parents=True, exist_ok=True)
    atlas = Image.new('RGBA', (1280, 2520))
    for row, (pose, state) in enumerate(zip(poses, STATES)):
        scale = min(standing_scale, 300 / pose.width, 396 / pose.height)
        resized = pose.resize((round(pose.width * scale), round(pose.height * scale)), Image.Resampling.LANCZOS)
        base = Image.new('RGBA', (WIDTH, HEIGHT))
        base.alpha_composite(resized, ((WIDTH - resized.width) // 2, 417 - resized.height))
        assert base.getchannel('A').getbbox()[3] < HEIGHT
        # Existing renderer also provides speech motion. Four small breathing
        # offsets reuse the six authored poses rather than inventing walk frames.
        for column, rise in enumerate([0, 1, 2, 1]):
            frame = Image.new('RGBA', (WIDTH, HEIGHT))
            frame.alpha_composite(base, (0, -rise))
            atlas.alpha_composite(frame, (column * WIDTH, row * HEIGHT))
        bounds = base.getchannel('A').getbbox()
        face = base.crop((55, bounds[1], 265, min(HEIGHT, bounds[1] + 160)))
        face.thumbnail((244, 244), Image.Resampling.LANCZOS)
        portrait = Image.new('RGBA', (256, 256))
        portrait.alpha_composite(face, ((256 - face.width) // 2, (256 - face.height) // 2))
        portrait.save(out / ('portrait.png' if row == 0 else state + '.png'))
    atlas.save(out / 'atlas.webp', lossless=True, method=6)
    preview = Image.new('RGB', (640, 1260), '#211c30')
    thumb = atlas.resize(preview.size, Image.Resampling.LANCZOS)
    preview.paste(thumb, (0, 0), thumb)
    preview.save(out / 'preview.jpg', quality=90)
    print(f'{character}: six poses, 24 frames, transparent 1280x2520 atlas')


if __name__ == '__main__':
    sources = Path(sys.argv[1]).resolve()
    # Pudding now uses her exact original portrait; package it separately with
    # package-pudding-portrait.py rather than restoring the superseded redesign.
    for character in ['mochi', 'lili', 'luna']:
        build(character, sources / (character + '.png'))
