"""Pack 24 independently authored imagegen poses (four columns, six rows).

python tools/package-expressive-characters.py CHARACTER SOURCE_PNG
Only isolates and normalizes supplied artwork; it does not invent animation.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[1]
STATES = ['idle', 'thinking', 'attention', 'success', 'error', 'sleep']


def extract(source, expected):
    image = Image.open(source).convert('RGBA')
    rgba = np.array(image)
    assert rgba[:, :, 3].min() == 0, 'Genuine transparency is required'
    labels, _ = label(rgba[:, :, 3] > 60)
    counts = np.bincount(labels.ravel())
    # Each connected figure must have a substantial body, not just hair flecks.
    figures = [(i, b) for i, b in enumerate(find_objects(labels), 1) if b and counts[i] > 1800]
    assert len(figures) == expected, f'Expected {expected} separate poses, found {len(figures)}'
    figures.sort(key=lambda item: (item[1][0].start + item[1][0].stop) / 2)
    ordered = []
    for row in range(expected // 4):
        ordered.extend(sorted(figures[row * 4:row * 4 + 4], key=lambda item: item[1][1].start))
    poses = []
    for component, (ys, xs) in ordered:
        isolated = rgba.copy()
        keep = binary_dilation(labels == component, iterations=2)
        isolated[:, :, 3] = np.where(keep, rgba[:, :, 3], 0)
        bounds = (max(0, xs.start - 2), max(0, ys.start - 2), min(image.width, xs.stop + 2), min(image.height, ys.stop + 2))
        poses.append(Image.fromarray(isolated).crop(bounds))
    return poses


def build(character, source, happy_source=None):
    assert character in ['mochi', 'lili', 'luna', 'pudding']
    poses = extract(source, 20 if happy_source else 24)
    if happy_source:
        poses[12:12] = extract(happy_source, 4)
    # Keep body proportions constant. Align by the upper head rather than a
    # waving hand or moving tail, which would make the face slide sideways.
    centers = []
    for pose in poses:
        head = pose.getchannel('A').crop((0, 0, pose.width, round(pose.height * .20))).getbbox()
        centers.append((head[0] + head[2]) / 2)
    reach = max(max(cx, p.width - cx) / p.height for p, cx in zip(poses, centers))
    height = min(396, 146 / reach)
    atlas = Image.new('RGBA', (1280, 2520))
    out = ROOT / 'assets/characters' / character
    out.mkdir(parents=True, exist_ok=True)
    frames = []
    for i, (pose, cx) in enumerate(zip(poses, centers)):
        scale = height / pose.height
        resized = pose.resize((round(pose.width * scale), round(pose.height * scale)), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (320, 420))
        frame.alpha_composite(resized, (round(160 - cx * scale), 417 - resized.height))
        bbox = frame.getchannel('A').getbbox()
        assert bbox and bbox[0] > 0 and bbox[2] < 320 and bbox[3] < 420, 'Pose clipped at frame edge'
        frames.append(frame)
        atlas.alpha_composite(frame, (i % 4 * 320, i // 4 * 420))
    for row, state in enumerate(STATES):
        assert len({frame.tobytes() for frame in frames[row * 4:row * 4 + 4]}) == 4, 'Every state needs four authored frames'
        frame = frames[row * 4]
        top = frame.getchannel('A').getbbox()[1]
        face = frame.crop((75, top, 245, min(top + 170, 420))).resize((256, 256), Image.Resampling.LANCZOS)
        face.save(out / ('portrait.png' if row == 0 else state + '.png'))
    atlas.save(out / 'atlas.webp', lossless=True, method=6)
    preview = Image.new('RGB', atlas.size, '#211c30')
    preview.paste(atlas, (0, 0), atlas)
    preview.thumbnail((640, 1260))
    preview.save(out / 'preview.jpg', quality=95)
    print(f'{character}: 24 unique authored frames, height={height:.1f}, head-top={frames[0].getchannel("A").getbbox()[1]}')


if __name__ == '__main__':
    build(sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]) if len(sys.argv) > 3 else None)
