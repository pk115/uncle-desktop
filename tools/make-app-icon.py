# The app icon: UncleDev's face on a dark rounded tile with a neon edge.
#   python tools/make-app-icon.py   -> assets/icons/uncle.ico, uncle-512.png, uncle.png, tray.png
from PIL import Image, ImageDraw

face = Image.open('assets/characters/angry-boy/portrait.png').convert('RGBA')
face = face.crop(face.getbbox())

def tile(size, edge=True):
    s = 4 * size  # drawn large, scaled down smooth
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = s // 5
    d.rounded_rectangle([0, 0, s - 1, s - 1], r, fill=(22, 15, 31, 255))
    if edge:
        w = max(4, s // 40)
        d.rounded_rectangle([w // 2, w // 2, s - 1 - w // 2, s - 1 - w // 2], r, outline=(139, 92, 246, 255), width=w)
    f = face.copy()
    k = 0.86 * s / max(f.size)
    f = f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS)
    im.alpha_composite(f, ((s - f.width) // 2, s - f.height - s // 40))
    return im.resize((size, size), Image.LANCZOS)

tile(512).save('assets/icons/uncle-512.png')
tile(256).save('assets/icons/uncle.png')
tile(256).save('assets/icons/uncle.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
tile(32, edge=False).save('assets/icons/tray.png')
