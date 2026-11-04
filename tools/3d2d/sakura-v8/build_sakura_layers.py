"""Build one hybrid cherry tree for Hanachigiri v8.

The trunk, roots and large branches are real 3D geometry, exported as GLB
and rasterized via the unchanged 40deg elevation / 35deg azimuth renderer.
The blossoms are three independent, deterministic, transparent 2D painted
layers using the same world origin. This is not AI image generation.
"""
from __future__ import annotations
from pathlib import Path
import json, random, math, hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import build_landscape as land

core = land.core
tex = land.tex
DIR = core.DIR
OUT = DIR / 'assets'
OUT.mkdir(exist_ok=True)
BASE_META = json.loads((DIR/'baseline/render-metadata.json').read_text())
SCALE = .89
SIZE = (520, 495)
ANCHOR = (260, 455)
BACK = ('#966b7e', '#af7e90', '#c28e9e', '#d69cad', '#e2adba')
MID = ('#c78fa6', '#d9a1b3', '#e6b3c1', '#f2cbd0', '#f8d8db')
FRONT = ('#dcacb9', '#edbdc9', '#f6d5d9', '#f9e4e5', '#fff0e8')


def project_local(point):
    p=[float(v)*SCALE for v in point]
    x,y=core.project(p)
    return np.array([x-core.OX+ANCHOR[0],y-core.OY+ANCHOR[1]],dtype=float)


def build_trunk():
    # Rebuild the same exact bark and large-branch skeleton as v7 airy_tree,
    # stopping BEFORE any 3D foliage generation.
    m=core.Model('sakura')
    r=random.Random(20261104+29)
    bark,twig='#795f54','#785a52'
    m.beam((0,-.07,0),(.03,2.34,-.06),.19,bark,segments=10)
    for k in range(6):
        a=k*math.tau/6+.12
        m.beam((0,.25,0),(.30*math.cos(a),-.04,.30*math.sin(a)),.066,bark,7)
    tips=[(-1.50,3.00,-.40),(-1.18,3.66,.63),(-.63,3.95,-.90),
          (.82,3.22,-.70),(1.48,3.32,.52),(.67,4.04,.74),
          (-.02,4.56,.10)]
    springs=[(0,1.45,0),(.02,1.89,-.04),(.02,2.1,.02)]
    for i,b in enumerate(tips):
        a=springs[i%len(springs)]
        land.taper_branch(m,a,b,.098 if i<5 else .078,twig,bend=r.uniform(-.16,.19))
        for k in range(2):
            p=np.array(a)*.25+np.array(b)*.75
            off=np.array([r.uniform(-.45,.45),r.uniform(.20,.52),r.uniform(-.38,.38)])
            m.beam(tuple(p),tuple(np.array(b)+off),.028,twig,6)
    # Root flare to make the 3D world contact legible in the 2D render.
    for k in range(7):
        a=k*math.tau/7+.27
        m.beam((0,.36,0),(.39*math.cos(a),-.025,.35*math.sin(a)),.045,bark,6)
    m.faces=[([tuple(float(v)*SCALE for v in vert) for vert in face],col,outline)
             for face,col,outline in m.faces]
    atlas=np.asarray(Image.open(OUT/'texture-atlas.png').convert('RGB'))
    tex.ATLAS_RGB=atlas
    core.Model.rasterize=tex.render
    core.Model.export_glb=tex.export_glb
    stats=m.export_glb(OUT/'sakura_trunk.glb')
    img,anchor=m.rasterize()
    # Preserve the same projected root for all layers, no alpha-bound recentering.
    aligned=Image.new('RGBA',SIZE,(0,0,0,0))
    aligned.alpha_composite(img,(round(ANCHOR[0]-anchor[0]),round(ANCHOR[1]-anchor[1])))
    aligned.save(OUT/'sakura_trunk.png')
    return tips,stats


def draw_blossom_cloud(layer, centers, seed, palette, coverage=1., openness=.1):
    """Create watercolor-like bouquets from 2D alpha dabs (not 3D leaves)."""
    rng=random.Random(seed)
    SS=2
    canvas=Image.new('RGBA',(SIZE[0]*SS,SIZE[1]*SS),(0,0,0,0))
    main=Image.new('RGBA',canvas.size,(0,0,0,0))
    d=ImageDraw.Draw(main,'RGBA')
    colors=[tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in palette]
    # Many irregular blossom sprays, with an organic contour and openings
    # instead of faceted 3D lobes or one big opaque ellipse.
    for cx,cy,rx,ry in centers:
        cx,cy,rx,ry=map(lambda v:float(v)*SS,(cx,cy,rx,ry))
        density=int(145*coverage*max(.55,(rx*ry)/(65*60)))
        # Loose outer petals
        for _ in range(density):
            ang=rng.uniform(-math.pi,math.pi)
            rr=min(1.19,abs(rng.gauss(.59,.29)))
            x=cx+math.cos(ang)*rx*rr
            y=cy+math.sin(ang)*ry*rr + rng.uniform(-3,3)
            if rng.random()<openness and rr<.80:
                continue
            w=rng.uniform(3.2,10.1)*SS
            h=w*rng.uniform(.52,.95)
            color=rng.choice(colors)
            alp=rng.randint(92,171) if rr<.8 else rng.randint(84,148)
            d.ellipse((x-w,y-h,x+w,y+h),fill=(*color,alp))
        # Tiny clustered buds turn watercolor haze into legible flowers
        # at the original 1x game scale.
        for _ in range(int(90*coverage)):
            x=cx+rng.gauss(0,rx*.54)
            y=cy+rng.gauss(0,ry*.52)
            if (x-cx)**2/(rx*1.08)**2+(y-cy)**2/(ry*1.08)**2>1:continue
            w=rng.uniform(1.1,3.2)*SS
            r,g,b=rng.choice(colors[1:])
            d.ellipse((x-w,y-w*.63,x+w,y+w*.63),fill=(r,g,b,rng.randint(120,220)))
    main=main.filter(ImageFilter.GaussianBlur(.75*SS))
    canvas=Image.alpha_composite(canvas,main)
    details=Image.new('RGBA',canvas.size,(0,0,0,0))
    dd=ImageDraw.Draw(details,'RGBA')
    for cx,cy,rx,ry in centers:
        cx,cy,rx,ry=[v*SS for v in (cx,cy,rx,ry)]
        for i in range(int(205*coverage)):
            x=cx+rng.gauss(0,rx*.50);y=cy+rng.gauss(0,ry*.52)
            if ((x-cx)/(rx+.01))**2+((y-cy)/(ry+.01))**2>.94:continue
            size=rng.uniform(1.2,3.8)*SS
            col=rng.choice(colors[1:])
            if i%5==0:
                col=(255,237,229)
            dd.ellipse((x-size,y-size*.74,x+size,y+size*.74),fill=(*col,rng.randint(128,219)))
    canvas=Image.alpha_composite(canvas,details)
    return canvas.resize(SIZE,Image.Resampling.LANCZOS)


def make_canopy(tips):
    pt=[project_local(t) for t in tips]
    # Index positions are intentionally split across three painterly planes.
    back_centers=[(pt[i][0]+dx,pt[i][1]+dy,rx,ry) for i,dx,dy,rx,ry in
      [(1,-8,-8,65,50),(2,-12,-7,68,49),(5,-13,-9,63,49),
       (6,-5,12,66,43),(0,-8,-13,56,47)]]
    mid_centers=[(pt[i][0]+dx,pt[i][1]+dy,rx,ry) for i,dx,dy,rx,ry in
      [(0,-8,-5,70,53),(1,-1,-10,62,45),(2,0,-12,56,44),
       (3,10,-15,61,45),(4,11,-10,69,54),(5,5,-8,60,46),
       (6,5,-12,58,46)]]
    front_centers=[(pt[i][0]+dx,pt[i][1]+dy,rx,ry) for i,dx,dy,rx,ry in
      [(0,15,12,49,35),(3,8,12,45,34),(4,-3,5,49,39),
       (5,1,12,46,33)]]
    output={
      'sakura_canopy_back':draw_blossom_cloud('back',back_centers,23014,BACK,1.02,.12),
      'sakura_canopy_mid':draw_blossom_cloud('mid',mid_centers,23015,MID,1.12,.085),
      'sakura_canopy_front':draw_blossom_cloud('front',front_centers,23016,FRONT,.58,.23),
    }
    for name,im in output.items():im.save(OUT/(name+'.png'),optimize=True)
    return output


def main():
    tips,stats=build_trunk()
    layers=make_canopy(tips)
    stack=Image.new('RGBA',SIZE,(0,0,0,0))
    for name in ['sakura_canopy_back','sakura_trunk','sakura_canopy_mid','sakura_canopy_front']:
        stack.alpha_composite(Image.open(OUT/(name+'.png')).convert('RGBA'))
    stack.save(OUT/'sakura_hybrid.png',optimize=True)
    meta=json.loads((OUT/'render-metadata.json').read_text())
    for name in ('sakura_trunk','sakura_canopy_back','sakura_canopy_mid','sakura_canopy_front','sakura_hybrid'):
        a={'image':'assets/'+name+'.png','size':list(SIZE),'anchor':list(ANCHOR),'scale':1,'status':'trial'}
        if name=='sakura_trunk':a.update(source3d='assets/sakura_trunk.glb',**stats)
        else:a['source2d']='source/build_sakura_layers.py'
        meta['assets'][name]=a
    meta['hybrid_tree']={'id':'sakura','source_trunk':'assets/sakura_trunk.glb','parts':['sakura_canopy_back','sakura_trunk','sakura_canopy_mid','sakura_canopy_front'],'collision':'existing trunk radius .26 m','camera':'ortho40 az35','rootAnchorPx':list(ANCHOR),'version':8}
    (OUT/'render-metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
    print('built 3D trunk + 3 separate painted 2D blossom PNGs',SIZE,'anchor',ANCHOR,stats)

if __name__=='__main__':main()