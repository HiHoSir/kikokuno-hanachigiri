#!/usr/bin/env python3
"""Watercolor finish for the existing interactive scene, preserving all alpha, anchors and collisions.

This processes already-adopted in-game assets. It does not invent buildings, trees,
or expand the map; it is reproducible with Pillow and NumPy only.
"""
from pathlib import Path
import base64,io,json,re,hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'baseline'/'v13-demo.html'
if not SRC.exists():SRC=Path('/mnt/data/hanachigiri_v13_tree_replacement/demo-3d2d-watercolor-trees-v13.html')
if not SRC.exists():SRC=ROOT/'demo-3d2d-watercolor-trees-v13.html'
assert SRC.exists(), 'v13 demo is required: baseline/v13-demo.html or demo-3d2d-watercolor-trees-v13.html'
BASE=SRC.read_text(encoding='utf-8')
MATCH=re.search(r'const DATA=(\{.*?\});\nconst BEFORE=',BASE,re.S)
assert MATCH, 'Data initializer not found'
DATA=json.loads(MATCH.group(1)); ORIGINAL={k:DATA['images'][k] for k in ('ground','house','teahouse','bridge')}


def field(w,h,base,seed=42):
    rng=np.random.default_rng(seed)
    total=np.zeros((h,w),np.float32)
    weight=0
    for px,amp in [(180,1.0),(67,.65),(24,.4),(8,.25)]:
        xx=max(3,round(w/px));yy=max(3,round(h/px))
        raw=rng.uniform(-1,1,size=(yy,xx)).astype(np.float32)
        raw=np.uint8((raw+1)*127.5)
        img=Image.fromarray(raw,mode='L').resize((w,h),Image.Resampling.BICUBIC)
        vals=(np.asarray(img,dtype=np.float32)/127.5-1)
        total+=vals*amp; weight+=amp
    return total/weight*base


def save_asset(name):
    png=base64.b64decode(DATA['images'][name].split(',',1)[1]); im=Image.open(io.BytesIO(png)).convert('RGBA')
    arr=np.array(im)
    h,w=arr.shape[:2]; seed={'ground':626,'house':427,'teahouse':655,'bridge':482}[name]
    rng=np.random.default_rng(seed)
    n=field(w,h,18 if name=='ground' else 15,seed)
    tiny=field(w,h,4.6 if name=='ground' else 3.8,seed+100)
    rgb=arr[:,:,:3].astype(np.float32)
    a=arr[:,:,3]
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]

    if name=='ground':
        # Material-aware color layers: retain road, river and bank silhouettes.
        water=(b>r+12)&(b>g-4)&(r<165)&(a>45)
        road=(r>=g-9)&(g<205)&(r>146)&(b<196)&~water&(a>60)
        turf=(~water)&(~road)&(a>40)
        # The broad tea/moss wash suppresses the technical 3D-hatching look.
        rgb[:,:,0]+= 2.8 + n*.48+tiny*.40
        rgb[:,:,1]+= -2.0 + n*.65+tiny*.44
        rgb[:,:,2]+= 0.3 + n*.16+tiny*.25
        rgb[:,:,0][water]+= -17.0+n[water]*.55
        rgb[:,:,1][water]+= -5.0+n[water]*.57
        rgb[:,:,2][water]+= 8.5+n[water]*.80
        rgb[:,:,0][road]+= 9.0+n[road]*.63
        rgb[:,:,1][road]+= 5.5+n[road]*.48
        rgb[:,:,2][road]+= -3.1+n[road]*.27
        rgb[:,:,0][turf]+= -1.0
        rgb[:,:,2][turf]+= -5.1
    else:
        # Establish common traditional paint pigments without deleting source UV or lines.
        # Warm woody material, soft paper wall and roof glazing are treated differently.
        wood=(r>g+8)&(g>b+8)&(r<215)&(a>20)
        paper=(r>195)&(g>175)&(b>125)&(a>30)
        roof=(~wood)&(~paper)&(a>30)
        rgb[:,:,0]+=n*.50+tiny*.36+1.0
        rgb[:,:,1]+=n*.39+tiny*.30+.9
        rgb[:,:,2]+=n*.48+tiny*.39+.6
        rgb[:,:,0][wood]+=5.9
        rgb[:,:,1][wood]+=-5.3
        rgb[:,:,2][wood]+=-5.0
        rgb[:,:,0][paper]+=2.3
        rgb[:,:,1][paper]+=2.1
        rgb[:,:,2][paper]+=3.6
        rgb[:,:,0][roof]+=1.0
        rgb[:,:,2][roof]+=3.0 if name=='house' else 1.1
        # More distinct house roof, ochre teahouse roof and aged bridge decking;
        # preserve the UV-generated tile and wood grain while reducing gray slabs.
        yy,xx=np.mgrid[0:h,0:w]
        if name=='house':
            roof_mask=(yy<226)&(g>r-3)&(b>r+2)&(a>55)
            rgb[:,:,0][roof_mask]+= -5.5+n[roof_mask]*.43
            rgb[:,:,1][roof_mask]+= 1.5
            rgb[:,:,2][roof_mask]+= -7.5
        elif name=='teahouse':
            roof_mask=(yy<195)&(g>85)&(r<177)&(a>55)
            rgb[:,:,0][roof_mask]+= 4.3+n[roof_mask]*.41
            rgb[:,:,1][roof_mask]+= 1.0
            rgb[:,:,2][roof_mask]+= -4.5
        else:
            wood_mask=(r>100)&(g>76)&(g<210)&(a>60)
            rgb[:,:,0][wood_mask]+=4.5
            rgb[:,:,1][wood_mask]+=-5.5
            rgb[:,:,2][wood_mask]+=-2.6

    # Very light watercolor mottling remains visible at real in-game size.
    rgb=np.clip(rgb,0,255).astype('uint8')
    result=np.dstack([rgb,a])
    # alpha EXACTLY unchanged; pixel footprint cannot silently grow/change.
    assert np.array_equal(result[:,:,3],arr[:,:,3])
    img=Image.fromarray(result,mode='RGBA')
    if name=='ground':
        # Slight larger color pools restricted to material masks. The source lines remain.
        masks={'water':water,'road':road,'turf':turf}
        vals={'water':((30,79,108),14),'road':((234,205,157),10),'turf':((117,148,95),11)}
        for idx,key in enumerate(('turf','road','water')):
            wash=Image.new('L',(w,h),0);d=ImageDraw.Draw(wash)
            # Sampling positions only from actual corresponding source material.
            ys,xs=np.nonzero(masks[key]); count={'turf':215,'road':80,'water':85}[key]
            for _ in range(count):
                ii=rng.integers(0,len(xs));x=int(xs[ii]);y=int(ys[ii]);rad=rng.integers(19,70 if key!='water' else 85)
                d.ellipse((x-rad,y-rad*.42,x+rad,y+rad*.42),fill=int(rng.integers(12,31)))
            wash=wash.filter(ImageFilter.GaussianBlur(20))
            wa=np.array(wash)
            wa[~masks[key]]=0
            # A pale glaze, with materials separated at their original exact boundaries.
            overlay=Image.new('RGBA',(w,h),(*vals[key][0],0));overlay.putalpha(Image.fromarray(wa,'L'))
            img=Image.alpha_composite(img,overlay)
        # Soft paint should not change opacity or domain.
        img.putalpha(Image.fromarray(a,'L'))

    output=ROOT/'assets'/f'{name}-wash-v14.png';img.save(output,optimize=True)
    assert Image.open(output).size==im.size
    assert np.array_equal(np.array(Image.open(output))[:,:,3],a)
    return img


def to_data(im):
    buf=io.BytesIO();im.save(buf,format='WEBP',lossless=False,quality=89,method=5)
    return 'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode('ascii')

out={k:save_asset(k) for k in ORIGINAL}
# Retain the old pixel data as separate images for A/B comparison: for a fair
# comparison the sprites, transform, camera, and collision masks stay the same.
oldjson=json.dumps({'images':ORIGINAL},ensure_ascii=False,separators=(',',':'))
for k,im in out.items():DATA['images'][k]=to_data(im)
DATA['metadata']['environment_polish']={
 'version':14,'base':'v13 user watercolor trees',
 'assets':['ground','house','teahouse','bridge'],
 'kind':'material-aware pigmented washes on original 3D->2D raster assets',
 'referenceTreeSpritesUnchanged':True,'placementUnchanged':True,
 'cameraUnchanged':True,'collisionUnchanged':True,
 'sourceAlphaPreserved':True,
}
scene=json.dumps(DATA,ensure_ascii=False,separators=(',',':'))
s=BASE[:MATCH.start(1)]+scene+BASE[MATCH.end(1):]
s=s.replace('const BEFORE={"images":{},"metadata":{"assets":{}}};',f'const BEFORE={oldjson};',1)
assert s.count('const BEFORE=')==1
# The official trees now remain always on. Only the ENVIRONMENT shifts between
# original v13 and current v14, and this compares multiple scene elements at once.
s=s.replace('let assets={},beforeAssets={},texturesEnabled=true,','let assets={},beforeAssets={},texturesEnabled=true,polishEnabled=true,',1)
s=s.replace("<title>鬼哭の花契り｜水彩樹木を既存マップに設置 v13</title>","<title>鬼哭の花契り｜淡彩景観統一 v14</title>",1)
s=s.replace('鬼哭の花契り｜水彩樹木を既存マップに設置 v13','鬼哭の花契り｜淡彩景観 v14',1)
s=s.replace('提供された桜・広葉樹2枚を既存の3本と差し替え','木は採用済み2D素材を維持／家・橋・地面を淡彩統一',1)
s=s.replace('<button id="texture" aria-pressed="true">参考木 ON</button>','<button id="texture" aria-pressed="true">淡彩 ON</button>',1)
# Legacy L-system debug buttons are not valuable in a village polish iteration.
s=s.replace('#help.open{display:block}', '#help.open{display:block}#layers,#branchOnly{display:none}',1)
s=s.replace('<div id="help"><div class="panel"><h2>水彩樹木の実マップ差し替え v13</h2>', '<div id="help"><div class="panel"><h2>既存マップの淡彩景観統一 v14</h2>',1)
start=s.index('<p>提供された2枚')
end=s.index('<button id="closeHelp">',start)
helpmsg=('''<p>v13で採用した桜・広葉樹の2D画像を維持し、地面・家2軒・橋を同じ淡彩調へ寄せました。配置と通行範囲は変更していません。</p>
<p><strong>淡彩 ON / 旧景観</strong>で4素材をまとめて切替。木は常にユーザー提供の2D樹木を使用します。空間を広げたり、家・橋の形を新しく作り直したりしていません。</p>
<p>地面は草・石畳・水を元画素の色で判別して、適度な水彩顔料の濃淡を付けました。建物と橋は材質に合わせた彩色を加えています。全素材の透過率・画素サイズ・アンカー不変。</p>
<p>本編の緋月共通モーションは引き続き外部の現行ファイルを読込みます。最終美術採用にはiPhone Safari上の実V35の確認が必要です。</p>
''')
s=s[:start]+helpmsg+s[end:]
# Different assets need a single accessor so ground and object style changes together.
needle='const groundDepth=p=>p.x*SA+p.z*CA;'
s=s.replace(needle,needle+'\nfunction environmentImage(name){return !polishEnabled&&beforeAssets[name]?beforeAssets[name]:assets[name];}',1)
s=s.replace('ctx.drawImage(assets[e.asset],p.x-meta.anchor[0],p.y-meta.anchor[1]);','ctx.drawImage(environmentImage(e.asset),p.x-meta.anchor[0],p.y-meta.anchor[1]);',1)
s=s.replace('ctx.imageSmoothingEnabled=true;ctx.drawImage(assets.ground,0,0);waterLight(now);','ctx.imageSmoothingEnabled=true;ctx.drawImage(environmentImage(\'ground\'),0,0);waterLight(now);',1)
# Hard-disable the legacy tree toggle. The button now switches scenery palette only.
button0=s.index("document.getElementById('texture').onclick=()=>{")
button1=s.index("document.getElementById('branchOnly').onclick=()=>{",button0)
s=s[:button0]+'''document.getElementById('texture').onclick=()=>{
  polishEnabled=!polishEnabled;
  document.getElementById('texture').textContent=polishEnabled?'淡彩 ON':'旧景観';
  document.getElementById('texture').setAttribute('aria-pressed',String(polishEnabled));
  say(polishEnabled?'v14：地面・家・橋を水彩仕上げへ切替':'v13：地面・家・橋の従来素材へ切替（樹木は同一）');
};
'''+s[button1:]
s=s.replace("say('v13：提供画像から作った水彩の桜・広葉樹を3本配置しました。');","say('v14：2D水彩の木を維持し、家・地面・橋を淡彩仕上げにしました。');",1)
s=s.replace('referenceTrees:texturesEnabled,','referenceTrees:texturesEnabled,environmentPolish:polishEnabled,',1)
s=s.replace('envPolishVersion:14,','',1)
# Ensure visuals from the user's adopted trees did not change; data from v13 copied exactly.
assert DATA['images']['watercolor_green']==json.loads(MATCH.group(1))['images']['watercolor_green']
assert DATA['images']['watercolor_sakura']==json.loads(MATCH.group(1))['images']['watercolor_sakura']
assert 'environmentImage(\'ground\')' in s
for k in ORIGINAL:assert k in oldjson
FILE=ROOT/'demo-3d2d-village-watercolor-v14.html';FILE.write_text(s,encoding='utf-8')
print('built',FILE,len(s),'assets',[(k,im.size) for k,im in out.items()]);print('legacy/main size',len(BASE),len(s))