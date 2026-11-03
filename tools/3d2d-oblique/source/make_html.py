import json,base64
from pathlib import Path
D=Path(__file__).resolve().parent.parent
s=(D/'source/demo_template.html').read_text(encoding='utf-8')
images={f.stem:'data:image/png;base64,'+base64.b64encode(f.read_bytes()).decode('ascii') for f in sorted((D/'assets').glob('*.png')) if f.stem != 'ground'}
images['ground']='data:image/webp;base64,'+base64.b64encode((D/'assets/ground-q90.webp').read_bytes()).decode('ascii')
meta=json.loads((D/'assets/render-metadata.json').read_text(encoding='utf-8'))
s=s.replace('__HERO_IMAGES__','{}')
s=s.replace('__DATA__',json.dumps({'images':images,'metadata':meta},ensure_ascii=False,separators=(',',':')))
(D/'hanachigiri_3d2d_demo.html').write_text(s,encoding='utf-8')
print('html bytes', (D/'hanachigiri_3d2d_demo.html').stat().st_size)