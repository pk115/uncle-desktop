"""Package Mira's generated full-body art and existing dedicated bust frames."""
import importlib.util
import json
from pathlib import Path

from PIL import Image
import numpy as np
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'character-sources/mira-motion-v1'
CHARACTER = ROOT / 'assets/characters/mira'
spec = importlib.util.spec_from_file_location('mochi_packer', ROOT / 'tools/package-mochi-motion.py')
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)


def clean(image):
    pixels = np.array(image.convert('RGBA'))
    labels, _ = label(pixels[:, :, 3] > 80)
    sizes = np.bincount(labels.ravel())
    assert len(sizes) > 1 and sizes[1:].max() > 10000, 'Missing figure'
    keep = binary_dilation(labels == 1 + np.argmax(sizes[1:]), iterations=1)
    pixels[:, :, 3] = np.where(keep, pixels[:, :, 3], 0)
    result = Image.fromarray(pixels)
    bounds = result.getchannel('A').getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < image.width and bounds[3] < image.height, 'Figure clipped'
    return result.crop(bounds)


def extract(filename, indices=range(4), mirror=False, height=560):
    sheet = Image.open(SOURCE / filename).convert('RGBA')
    frames = []
    for i in indices:
        left, right = round(i * sheet.width / 4), round((i + 1) * sheet.width / 4)
        pose = clean(sheet.crop((left, 0, right, sheet.height)))
        if mirror:
            pose = pose.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        frames.append(common.register(pose, height=height))
    return frames


def save(view, frames, tracks, crop):
    out = CHARACTER / f'action-v1-{view}'
    result = common.packer.pack({'sourceDetail': 'Mira full-body and bust motion frames'},
        [({'id': 'body', 'role': 'composite', 'tracks': tracks}, frames)], out, (320, 640), 2048)
    result['crop'] = crop
    (out / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')


def build():
    speech = extract('speech.png')
    states = extract('states.png')
    frames = speech + states + extract('speech2.png')
    tracks = {'idle': [0], 'blink': [0, 5, 0], 'thinking': [0], 'attention': [0],
              'success': [3], 'error': [4], 'sleep': [5], 'talkNeutral': [0],
              'talkPrepare': [8], 'talkSoft': [1], 'talkRound': [2],
              'talkEmphasis': [10], 'talkRest': [11], 'talk': [1, 2, 10]}
    actions = {'walk': extract('walk.png', mirror=True), 'sit': extract('sit.png'),
               'wake': extract('wake.png', indices=(0, 1, 3)),
               'perch_arrive': extract('perch.png'), 'arrive': extract('arrive.png'),
               'held': extract('held.png'), 'dance': extract('dance.png')}
    base = CHARACTER / 'motion-full'
    manifest = json.loads((base / 'manifest.json').read_text(encoding='utf-8'))
    variant = next(v for v in manifest['variants'] if v['frameWidth'] == 640)
    layer = variant['layers'][0]
    pages = [Image.open(base / p['file']).convert('RGBA') for p in variant['pages']]
    bust = [pages[f['page']].crop((f['x'], f['y'], f['x'] + 640, f['y'] + 840)) for f in layer['frames']]
    bust_tracks = dict(layer['tracks'])
    for name, images in actions.items():
        tracks[name] = list(range(len(frames), len(frames) + len(images)))
        bust_tracks[name] = list(range(len(bust), len(bust) + len(images)))
        frames.extend(images)
        crop = manifest['crop']
        x, y = round(crop['x'] * 2), round(crop['y'] * 2)
        w, h = round(crop['width'] * 2), round(crop['height'] * 2)
        for image in images:
            portion = image.crop((200, 260, 440, 575)).convert('RGBa').resize((w, h), Image.Resampling.LANCZOS).convert('RGBA')
            frame = Image.new('RGBA', (640, 840))
            frame.alpha_composite(portion, (x, y))
            bust.append(frame)
    for mapping in (tracks, bust_tracks):
        mapping['perch_leave'] = list(reversed(mapping['perch_arrive']))
        mapping['leave'] = list(reversed(mapping['arrive']))
    save('full', frames, tracks, {'x': 0, 'y': 0, 'width': 320, 'height': 420})
    save('bust', bust, bust_tracks, manifest['crop'])


if __name__ == '__main__':
    build()
