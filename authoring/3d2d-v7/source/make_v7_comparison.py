from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P=Path(__file__).resolve().parent.parent
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
F=ImageFont.truetype(font,22)
img1=Image.open(P/'comparison-before-desktop.png').convert('RGB')
img2=Image.open(P/'comparison-after-desktop.png').convert('RGB')
w,h=img1.size
out=Image.new('RGB',(w*2,h+48),'#eef2e9')
d=ImageDraw.Draw(out)
d.rectangle((0,0,w*2,48),fill='#263b32')
d.text((26,8),'v6：旧デモ（箱型の崖・球状の樹冠）',font=F,fill='#fff7e5')
d.text((w+26,8),'v7：改良版（自然な枝・岸辺・軟らかい地面の境界）',font=F,fill='#fff7e5')
out.paste(img1,(0,48));out.paste(img2,(w,48))
d.line((w,0,w,h+48),fill='#f3f3df',width=3)
out.save(P/'v6-v7-side-by-side.png',optimize=True)
print(out.size)
