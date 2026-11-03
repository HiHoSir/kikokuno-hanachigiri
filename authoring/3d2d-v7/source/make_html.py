"""Build a self-contained UV texture ON/OFF demo from actual GLB-derived sprites."""
import json,base64
from pathlib import Path
P=Path(__file__).resolve().parent.parent
OLD=P/'baseline'
s=(P/'source/demo_template.html').read_text(encoding='utf-8')
pack=lambda p,kind='png': 'data:image/'+kind+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
images={f.stem:pack(f) for f in sorted((P/'assets').glob('*.png')) if f.stem not in ('ground','texture-atlas')}
images['ground']=pack(P/'assets/ground-q90.webp','webp')
meta=json.loads((P/'assets/render-metadata.json').read_text(encoding='utf-8'))
# old UV renderer v4, same static camera and independent PNG anchors
before={x:pack(OLD/f'{x}.png') for x in ('house','teahouse','bridge','fence','tree','sakura','rock','shrub','lantern','flowerpatch')}
before['ground']=pack(OLD/'ground-q90.webp','webp')
for k,v in images.items():
 if k not in before:before[k]=v
oldmeta=json.loads((OLD/'render-metadata.json').read_text(encoding='utf-8'))
s=s.replace('__HERO_IMAGES__','{}')
s=s.replace('__DATA__',json.dumps({'images':images,'metadata':meta},ensure_ascii=False,separators=(',',':')))
s=s.replace('__BEFORE_DATA__',json.dumps({'images':before,'metadata':oldmeta},ensure_ascii=False,separators=(',',':')))
assert '__BEFORE_DATA__' not in s and '__DATA__' not in s
(P/'hanachigiri_3d2d_textured.html').write_text(s,encoding='utf-8')
print('HTML written:',(P/'hanachigiri_3d2d_textured.html').stat().st_size)
