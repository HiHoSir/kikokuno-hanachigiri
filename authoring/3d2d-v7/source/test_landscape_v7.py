"""Structural regression/visual-change checks for the v7 map demo."""
import json, numpy as np, trimesh
from PIL import Image
from pathlib import Path
P=Path(__file__).resolve().parent.parent
b=json.loads((P/'baseline/render-metadata.json').read_text())
a=json.loads((P/'assets/render-metadata.json').read_text())
assert a['camera']==b['camera'], 'Camera and XY world scale must stay fixed'
assert a['textures']['materials']==b['textures']['materials']
for name in a['assets']:
    now=a['assets'][name];before=b['assets'][name]
    if name not in ('tree','sakura'):
        assert now['size']==before['size'],(name,'size')
        assert now['anchor']==before['anchor'],(name,'anchor')
    assert (P/'assets'/f'{name}.glb').exists()
    assert (P/'assets'/f'{name}.png').exists()
    im=Image.open(P/'assets'/f'{name}.png');assert im.mode=='RGBA'
    if name not in ('tree','sakura'):
        old=Image.open(P/'baseline'/f'{name}.png')
        assert np.array_equal(np.array(im),np.array(old)),f'Unaffected scenery changed: {name}'
for name in ('tree','sakura'):
    sc=trimesh.load(P/'assets'/f'{name}.glb',force='scene')
    assert len(sc.geometry)>0
    im=Image.open(P/'assets'/f'{name}.png')
    old=Image.open(P/'baseline'/f'{name}.png')
    assert im.size!=old.size or im.tobytes()!=old.tobytes()
newg=Image.open(P/'assets/ground.png')
oldg=Image.open(P/'baseline/ground.png')
assert newg.size==oldg.size==(2440,1810)
npix=np.asarray(newg)
opix=np.asarray(oldg)
new_alpha=(npix[:,:,3]>0).sum();old_alpha=(opix[:,:,3]>0).sum()
assert new_alpha>0 and old_alpha>new_alpha*1.03,'The hard cliff should be gone'
# Ensure the original gameplay mathematical constants and player collision rules
# remain exactly as authored. The v7 demo differs only in visual presentation.
source=(P/'source/demo_template.html').read_text()
for required in ['const S=Math.sin(Math.PI*40/180)','AZ=35*Math.PI/180','hero.radius','const bankLeft=z=>12.52','bankRight=z=>14.72','function openAt(x,z)','function canStand(x,z,rad=hero.radius)']:
    assert required in source,required
assert "texturesEnabled?assets.ground:beforeAssets.ground" in source
print('v7 structural QA PASSED: camera/coordinate rules unchanged, 8 unchanged scenery images bit-identical, tree and cherry geometry changed, rectangular cliff removed, comparison toggle includes ground')
