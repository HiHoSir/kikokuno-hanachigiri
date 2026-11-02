from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parents[1]
src=[root/'field-lab/art/2.png',root/'field-lab/art/actions/wave.png']
out=root/'hozuki-walk/reference-wave-right.png'
images=[]
for file in src:
 im=Image.open(file).convert('RGBA')
 im.thumbnail((390,480),Image.Resampling.LANCZOS)
 layer=Image.new('RGBA',(430,540),(29,42,50,255))
 layer.alpha_composite(im,((430-im.width)//2,30))
 d=ImageDraw.Draw(layer)
 d.text((10,515),file.name,fill='white')
 images.append(layer)
sheet=Image.new('RGBA',(860,540),(29,42,50,255))
for i,im in enumerate(images): sheet.alpha_composite(im,(i*430,0))
sheet.convert('RGB').save(out,optimize=True)
print(f'Created {out} from original assets, size {sheet.size}')
