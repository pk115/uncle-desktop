"""Build Fatty Girl's action atlas from artwork in ../character-sources."""
import importlib.util
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'character-sources/fatty-girl-motion-v1'
CHARACTER = ROOT / 'assets/characters/fatty-girl'
spec = importlib.util.spec_from_file_location('mochi_packer', ROOT / 'tools/package-mochi-motion.py')
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)


def extract(filename, *, mirror=False, height=350, indices=range(4)):
    sheet = Image.open(SOURCE / filename).convert('RGBA')
    frames = []
    for i in indices:
        left, right = round(i * sheet.width / 4), round((i + 1) * sheet.width / 4)
        pose = common.clean(sheet.crop((left, 0, right, sheet.height)))
        if mirror:
            pose = pose.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        frames.append(common.register(pose, height=height))
    return frames


def build(actions):
    base = CHARACTER / 'motion-full'
    out = CHARACTER / 'action-v1-full'
    manifest = json.loads((base / 'manifest.json').read_text(encoding='utf-8'))
    variant = next(v for v in manifest['variants'] if v['frameWidth'] == 640)
    layer = variant['layers'][0]
    pages = [Image.open(base / p['file']).convert('RGBA') for p in variant['pages']]
    frames = [pages[f['page']].crop((f['x'], f['y'], f['x'] + 640, f['y'] + 840)) for f in layer['frames']]
    tracks = dict(layer['tracks'])
    for name, source in actions.items():
        start = len(frames)
        frames.extend(source)
        tracks[name] = list(range(start, len(frames)))
    if 'perch_arrive' in tracks:
        tracks['perch_leave'] = list(reversed(tracks['perch_arrive']))
    if 'arrive' in tracks:
        tracks['leave'] = list(reversed(tracks['arrive']))
    result = common.packer.pack({'sourceDetail': 'Existing Fatty Girl frames and new action artwork'},
        [({'id': 'body', 'role': 'composite', 'tracks': tracks}, frames)], out, (320, 640), 2048)
    result['crop'] = manifest['crop']
    (out / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('Motion pack:', out)


if __name__ == '__main__':
    actions = {'walk': extract('walk.png', mirror=True),
               'sit': extract('sit.png'),
               'wake': extract('wake.png'),
               'perch_arrive': extract('sit.png'),
               'arrive': extract('arrive.png'),
               'held': extract('held.png'),
               'dance': extract('dance.png')}
    build(actions)
