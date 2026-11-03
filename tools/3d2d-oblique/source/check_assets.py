from pathlib import Path
from PIL import Image
import json,struct,math
ROOT=Path(__file__).resolve().parent.parent
m=json.loads((ROOT/'assets/render-metadata.json').read_text(encoding='utf-8'))
assert m['camera']=={'ortho':True,'elevation':40,'azimuth':35,'pixelsPerMetre':100,'offset':[1064,300],'imageSize':[2440,1810]}
assert Image.open(ROOT/'assets/ground.png').size==(2440,1810)
assert len(m['assets'])==10,len(m['assets'])
for key,a in m['assets'].items():
 im=Image.open(ROOT/a['image']);assert im.mode=='RGBA'
 assert list(im.size)==a['size']
 assert im.getextrema()[-1][0]==0 and im.getextrema()[-1][1]==255
 x,y=a['anchor'];assert math.isfinite(x) and math.isfinite(y)
 glb=(ROOT/a['source3d']).read_bytes();assert glb[:4]==b'glTF' and struct.unpack_from('<I',glb,4)[0]==2
 assert len(glb)>1000
 print('PASS',key,im.size,'GLB',len(glb))
print('PASS ground + ten independent 3D source GLBs / RGBA renders')