#!/usr/bin/env python3
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import hashlib
import sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parent))
from pixel_pipeline import draft, sha, make_patch, patch_apply, inspect, atlas

def run():
    with TemporaryDirectory() as temp:
        root=Path(temp)
        src=Image.new('RGBA',(180,260),(0,0,0,0))
        d=ImageDraw.Draw(src)
        d.ellipse((45,9,135,99),fill='#7ad1f6')
        d.polygon([(55,94),(125,94),(146,189),(30,189)],fill='#d93755')
        d.rounded_rectangle((50,183,81,248),radius=9,fill='#2a3c6c')
        d.rounded_rectangle((98,183,130,248),radius=9,fill='#2a3c6c')
        d.rectangle((55,70,75,92),fill='#f3c3a2')
        src.save(root/'approved.png')
        # Multiple aspect ratios to detect baked-in dimensions.
        for w,h in [(64,96),(32,32),(48,80)]:
            target=root/f'draft-{w}x{h}.png'
            meta=draft(root/'approved.png',target,w,h,outline='#253048',margin_bottom=2)
            out=Image.open(target).convert('RGBA')
            assert out.size==(w,h)
            arr=np.asarray(out)
            assert set(np.unique(arr[:,:,3]))<={0,255}, 'alpha must remain binary'
            assert meta['palette_kind']=='auto_unreviewed'
            assert arr[-2:,:,3].sum()==0, 'foot margin should be transparent'
            assert Image.open(target.with_name(target.stem+'-mask.png')).size==(w,h)
        base=root/'draft-64x96.png'; changed=root/'changed.png'
        a=Image.open(base).convert('RGBA');b=a.copy();data=np.array(b)
        ys,xs=np.where(data[:,:,3]==255);x,y=int(xs[len(xs)//2]),int(ys[len(ys)//2]);data[y,x,:3]=[240,20,60]
        b=Image.fromarray(data,'RGBA');b.save(changed)
        patch=root/'patch.json'; make_patch(base,changed,patch)
        out=root/'replayed.png'; patch_apply(base,patch,out)
        assert sha(Image.open(out))==sha(b)
        assert inspect(base,out,16)['rgba_changed_pixels']==1
        assert inspect(base,out,16)['alpha_changed_pixels']==0
        # Invalid or stale patch rejection.
        for variant in ['stale','wrong-before','outside','alpha-change','duplicate']:
            j=json.loads(patch.read_text())
            if variant=='stale':j['baseSha256']='0'*64
            if variant=='wrong-before':j['pixels'][0]['before']=[0,0,0,0]
            if variant=='outside':j['pixels'][0]['x']=99999
            if variant=='alpha-change':j['pixels'][0]['rgba'][3]=0
            if variant=='duplicate':j['pixels']*=2
            bad=root/f'{variant}.json';bad.write_text(json.dumps(j))
            try:patch_apply(base,bad,root/'should-not-exist.png')
            except ValueError:pass
            else:raise AssertionError('invalid patch accepted: '+variant)
        # Try cropping a non-transparent background and confirm rejection.
        opaque=Image.new('RGBA',(60,60),'white');opaque.save(root/'bad-background.png')
        try:draft(root/'bad-background.png',root/'bad-draft.png',32,32)
        except ValueError:pass
        else:raise AssertionError('opaque background accepted')
        # Manifest is arbitrary set of views; not hardwired to eight directions.
        manifest={'columns':2,'views':[{'id':'side','file':'draft-32x32.png'},{'id':'rear','file':'draft-32x32.png'}]}
        mp=root/'views.json';mp.write_text(json.dumps(manifest))
        assert atlas(mp,root/'atlas.png')['size']==[64,32]
        print('PASS: 3 canvas sizes; alpha-geometry + color-guide; edit/replay; 5 negative tests; background rejection; generic 2-view atlas')
if __name__=='__main__':run()
