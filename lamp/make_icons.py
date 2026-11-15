# 등불 암송 아이콘 — 먹색 바탕에 겹친 암송 카드 세 장(사이트 진열대 그림과 같은 모양).
# 가장자리는 비워 둔다(maskable 안전 영역). 사용: python3 lamp/make_icons.py  (앱 폴더에서)
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')


def icon(size):
    S = 1024
    ink = (18, 18, 17)
    paper = (244, 243, 239)
    im = Image.new('RGB', (S, S), ink)
    d = ImageDraw.Draw(im)
    w, h, lw = int(S * 0.44), int(S * 0.30), S // 60
    x0, y0, off = int(S * 0.24), int(S * 0.40), int(S * 0.055)
    for k in (2, 1):
        d.rectangle([x0 + k * off, y0 - k * off, x0 + k * off + w, y0 - k * off + h], outline=paper, width=lw)
    d.rectangle([x0, y0, x0 + w, y0 + h], fill=paper)
    d.rectangle([x0 + int(w * 0.16), y0 + int(h * 0.42), x0 + int(w * 0.62), y0 + int(h * 0.42) + lw], fill=ink)
    d.rectangle([x0 + int(w * 0.16), y0 + int(h * 0.62), x0 + int(w * 0.46), y0 + int(h * 0.62) + lw], fill=ink)
    return im.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
icon(512).save(f'{OUT}/logo512.png')
icon(192).save(f'{OUT}/logo192.png')
icon(180).save(f'{OUT}/apple-touch-icon.png')
icon(64).save(f'{OUT}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('icons ->', OUT)
