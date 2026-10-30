"""Package the original Pudding photo unchanged; no generated face or wardrobe.

Usage: python tools/package-pudding-portrait.py SOURCE_PNG
The six states share the same photograph with subtle breathing offsets.
"""
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
out = root / 'assets/characters/pudding'
photo = source.copy()
photo.thumbnail((300, 396), Image.Resampling.LANCZOS)
base = Image.new('RGBA', (320, 420))
base.alpha_composite(photo, ((320 - photo.width) // 2, 417 - photo.height))
atlas = Image.new('RGBA', (1280, 2520))
for row in range(6):
    for column, rise in enumerate([0, 1, 2, 1]):
        atlas.alpha_composite(base, (320 * column, 420 * row - rise))
atlas.save(out / 'atlas.webp', lossless=True, method=6)
# Use the original full portrait in the gallery too: no newly invented face.
portrait = source.copy()
portrait.thumbnail((256, 256), Image.Resampling.LANCZOS)
card = Image.new('RGBA', (256, 256))
card.alpha_composite(portrait, ((256 - portrait.width) // 2, 0))
for name in ['portrait', 'thinking', 'attention', 'success', 'error', 'sleep']:
    card.save(out / (name + '.png'))
preview = Image.new('RGB', (640, 1260), '#211c30')
thumb = atlas.resize(preview.size, Image.Resampling.LANCZOS)
preview.paste(thumb, (0, 0), thumb)
preview.save(out / 'preview.jpg', quality=90)
print('Pudding: original portrait, six shared states, 24 breathing frames')
