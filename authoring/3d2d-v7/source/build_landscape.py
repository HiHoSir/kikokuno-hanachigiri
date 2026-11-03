"""v7: visible, geometry-backed landscaping revision for Hanachigiri.

Preserves the camera (40deg/35deg), UV wood grain, village footprints and input.
Rebuilds trees using many small airy branch tips instead of nine faceted balloons,
and replaces the solid box/island sidewall with an organic softened painted plane.
The map is still rendered from 3D models into 2D PNGs, NOT generated concept art.
"""
from __future__ import annotations
from pathlib import Path
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import build_watercolor as wc

core=wc.core
tex=wc.tex

# Preserve the actual v6 geometry and raster material system, change only tree
# crown geometry and terrain presentation. Texture patches/UV are untouched.

def taper_branch(m, a, b, thickness, color, bend=0.13):
    aa=np.asarray(a,float);bb=np.asarray(b,float)
    mid=(aa+bb)/2+np.array([bend,-.02,-bend*.45])
    m.beam(tuple(aa), tuple(mid), thickness, color, segments=7)
    m.beam(tuple(mid), tuple(bb), thickness*.71, color, segments=7)


def airy_tree(sakura=False):
    """Physical branches plus many small 3D lobes and 3D leaf-cards.

    Foliage is modeled as individually layered areas, never a 2D replacement
    image or one large filled ellipse; changing world/camera position remains valid.
    """
    m=core.Model('sakura' if sakura else 'tree')
    r=random.Random(20261104 + (29 if sakura else 0))
    bark='#795f54' if sakura else '#6c614c'
    twig='#785a52' if sakura else '#776d53'
    greens=['#4e7359','#628969','#749879','#8fae83','#a9ba8d','#c1c699','#ddcc94']
    pinks=['#b7758a','#ce8d9f','#dda5b1','#e7b6be','#f1c9cd','#f5dadd','#fff0e4']
    palette=pinks if sakura else greens
    m.beam((0,-.07,0),(.03,2.34,-.06),.19,bark,segments=10)
    for k in range(6):
        a=k*math.tau/6+.12
        m.beam((0,.25,0),(.30*math.cos(a),-.04,.30*math.sin(a)),.066,bark,7)
    # Major asymmetric limbs; gaps deliberately left between four dominant crowns.
    tips=[(-1.50,3.00,-.40),(-1.18,3.66,.63),(-.63,3.95,-.90),
          (.82,3.22,-.70),(1.48,3.32,.52),(.67,4.04,.74),
          (-.02,4.56,.10)]
    springs=[(0,1.45,0),(.02,1.89,-.04),(.02,2.1,.02)]
    for i,b in enumerate(tips):
        a=springs[i%len(springs)]
        taper_branch(m,a,b,.098 if i<5 else .078,twig,bend=r.uniform(-.16,.19))
        # A few wood twigs visibly project beyond foliage to give silhouette structure.
        for k in range(2):
            p=np.array(a)*.25+np.array(b)*.75
            off=np.array([r.uniform(-.45,.45),r.uniform(.20,.52),r.uniform(-.38,.38)])
            m.beam(tuple(p),tuple(np.array(b)+off),.028,twig,6)
    # 29 small, disconnected foliage tips instead of a monolithic 9-lobe broccoli head.
    lobes=[]
    for ti,(tx,ty,tz) in enumerate(tips):
        spread=.56 if ti<6 else .46
        for k in range(4 if ti<6 else 5):
            # x/z placement is asymmetric but bounded inside existing approx 2.2m crown.
            cx=tx+r.uniform(-spread,spread)
            cy=ty+r.uniform(-.33,.43)
            cz=tz+r.uniform(-.42,.43)
            rx=r.uniform(.20,.40) if not sakura else r.uniform(.23,.42)
            ry=r.uniform(.18,.35)
            rz=r.uniform(.21,.40)
            lobes.append((cx,cy,cz,rx,ry,rz))
    # Add a few overlapping inner sprays so the crown reads as leafy rather
    # than a set of disconnected sparkling triangles at game zoom.
    lobes.extend([
      (-.47,3.32,.08,.53,.36,.50),(.42,3.47,-.04,.51,.37,.48),
      (-.26,3.70,-.15,.55,.35,.43),(.30,3.76,.22,.48,.34,.45),
      (.02,4.08,-.06,.47,.32,.39),
    ])
    # The 3D core patches are small, rounded shells rather than giant spheres.
    up=np.array([-core.SA*core.S, core.C, -core.CA*core.S],dtype=float)
    right=np.array([core.CA,0,-core.SA],dtype=float)
    for li,(x,y,z,rx,ry,rz) in enumerate(lobes):
        # Each small 3D ellipsoid is softly shaded; adjacent lobes remain separate.
        base=r.choice(palette[1:5])
        m.canopy(x,y,z,rx,ry,rz,base,nlat=8,nlon=15)
        for j in range(43 if sakura else 51):
            theta=r.uniform(-.8,1.4)
            phi=r.uniform(-math.pi,math.pi)
            nx=math.cos(theta)*math.cos(phi)
            ny=math.sin(theta)
            nz=math.cos(theta)*math.sin(phi)
            if (nx*core.SA*core.C+ny*core.S+nz*core.CA*core.C)<-.28 and r.random()<.8:
                continue
            x0=x+nx*rx*r.uniform(.90,1.35)
            y0=y+ny*ry*r.uniform(.92,1.31)
            z0=z+nz*rz*r.uniform(.90,1.36)
            # several small leaves form a jagged, screen-aligned cloud silhouette
            size=r.uniform(.037,.085) if not sakura else r.uniform(.042,.086)
            tilt=r.uniform(-math.pi,math.pi)
            vec=(right*math.cos(tilt)+up*math.sin(tilt))*size
            across=(-right*math.sin(tilt)+up*math.cos(tilt))*size*.55
            center=np.array([x0,y0,z0])
            verts=[tuple(center-vec*.78),tuple(center-vec*.26-across*.70),
                   tuple(center+across*.86),tuple(center+vec*.82),
                   tuple(center+vec*.21-across*.78)]
            col=r.choice(palette[1:]) if j%8!=0 else r.choice(palette[:3])
            m.face(verts,col,False)
            if sakura and j%9==0:
                p=center+np.array([0,.015,0])
                m.face([tuple(p-vec*.30),tuple(p+across*.30),tuple(p+vec*.35),tuple(p-across*.30)],'#fbe6dd',False)
    return m

# V6 color balancing was designed around old lobe geometry; the v7 colors here
# are authored for smaller leaves and need no automatic rebalancing.
core.make_tree_v3=airy_tree


def natural_ground():
    """The same world X/Z surface and river, with readable grass/stone banks.

    The former solid rectangular 0.84m wall is removed from the visual sprite:
    the game never had a way to descend it, so showing it was misleading.
    Soft feather at the map edge implies further scenery outside this small demo;
    the walkable world bounds remain unchanged.
    """
    src=core.make_ground().convert('RGBA')
    w,h=src.size
    a=np.array(src,dtype=np.float32)
    rgb=a[:,:,:3]
    # Soft afternoon sun over high-frequency procedural marks, with more
    # saturated grasses than v6 so the change survives iPhone-size rendering.
    neutral=np.mean(rgb,axis=2,keepdims=True)
    rgb[:]=np.clip(rgb*.90+neutral*.10+np.array([6.0,5.5,1.5]),0,255)
    src=Image.fromarray(a.astype('uint8'),'RGBA')
    marks=Image.new('RGBA',src.size,(0,0,0,0))
    d=ImageDraw.Draw(marks,'RGBA')
    r=random.Random(7328)
    def f(x,z):return int(core.PPM*x),int(core.PPM*core.S*z)
    # Large soft grassy and floral areas make the route visually legible at 1x.
    # Ground-plane ornaments are non-blocking paint, unlike large obstacles.
    clusters=[(2.5,4.9,1.13,.90),(3.1,12.8,1.13,.87),
              (7.9,12.9,.99,.92),(8.25,5.4,.78,.6),
              (10.7,3.5,.86,.73),(10.5,14.0,.96,.69),
              (2.2,9.7,.70,.61)]
    for x,z,rx,rz in clusters:
        for j in range(38):
            cx,cz=x+r.gauss(0,rx*.45),z+r.gauss(0,rz*.44)
            if not (.4<cx<11.9 and .3<cz<15.5):continue
            px,py=f(cx,cz)
            sz=r.uniform(8,30)
            d.ellipse((px-sz,py-sz*.65,px+sz,py+sz*.64),fill=r.choice([
                (53,115,79,27),(79,128,78,31),(116,148,87,27),(206,174,100,14)]))
        for j in range(150):
            cx,cz=x+r.gauss(0,rx*.5),z+r.gauss(0,rz*.5)
            if not (.4<cx<11.9 and .3<cz<15.5):continue
            px,py=f(cx,cz)
            if r.random()<.25:
                rad=r.uniform(2,4)
                c=r.choice([(245,231,223,217),(247,237,204,218),
                            (221,163,175,175),(243,197,205,190)])
                for j2 in range(r.randint(3,5)):
                    ang=r.random()*math.tau
                    qx,qy=px+math.cos(ang)*rad,py+math.sin(ang)*rad*.7
                    d.ellipse((qx-2,qy-2,qx+2,qy+2),fill=c)
            else:
                length=r.uniform(5,13)
                d.line((px,py,px-r.uniform(-3,3),py-length),fill=r.choice([
                    (61,116,69,162),(112,149,86,148),(164,173,102,142)]),width=r.choice([1,2]))
    # Riverbanks: short reed plants and irregular stone groups are painted on
    # the 3D floor texture, not free-standing hard colliders.
    for z in np.arange(.40,15.75,.21):
        left=12.52+math.sin(z*.58)*.40
        right=14.72+math.sin(z*.58+.20)*.35
        for side in (0,1):
            edge=(left-.24) if side==0 else (right+.25)
            for _ in range(2):
                x=edge+r.uniform(-.14,.14)
                px,py=f(x,z+r.uniform(-.13,.13))
                length=r.uniform(7,15)
                d.line((px,py,px+r.uniform(-4,4),py-length),fill=(79,111,72,155),width=2)
            if r.random()<.38:
                x=edge+r.uniform(-.17,.16);px,py=f(x,z)
                rw=r.uniform(7,18);rh=r.uniform(4,11)
                d.ellipse((px-rw,py-rh,px+rw,py+rh),fill=r.choice([
                    (112,128,106,201),(155,158,122,217),(123,143,122,206)]))
                d.arc((px-rw,py-rh,px+rw,py+rh),190,325,fill=(212,209,172,128),width=2)
    src=Image.alpha_composite(src,marks.filter(ImageFilter.GaussianBlur(.38)))
    # Same mathematical 3D ground projection used by the engine, no angle hacks.
    coeff=(core.CA,core.SA/core.S,-core.CA*core.OX-core.SA/core.S*core.OY,
           -core.S*core.SA,core.CA,core.S*core.SA*core.OX-core.CA*core.OY)
    # Fade only the last 0.45m inwards to mask a hard rectangular diorama edge;
    # map bounds, collisions and the river path are unmodified.
    px=np.arange(w,dtype=np.float32)
    py=np.arange(h,dtype=np.float32)
    edgeX=np.minimum(px,w-1-px)
    edgeY=np.minimum(py,h-1-py)
    fx=np.clip(edgeX/57,0,1)**.73
    fy=np.clip(edgeY/37,0,1)**.73
    mask=np.minimum(fy[:,None],fx[None,:]);mask=mask*mask*(3-2*mask)
    arr=np.asarray(src).copy();arr[:,:,3]=(arr[:,:,3].astype('float32')*mask).astype('uint8')
    src=Image.fromarray(arr,'RGBA')
    dest=src.transform((core.OW,core.OH),Image.Transform.AFFINE,coeff,
                       resample=Image.Resampling.BICUBIC,fillcolor=(0,0,0,0))
    return dest

core.oblique_ground=natural_ground


def main():
    tex.main()
    ground=core.ASSETS/'ground.png'
    im=natural_ground()
    im.save(ground,optimize=True)
    im.save(core.ASSETS/'ground-q90.webp',format='WEBP',quality=90,method=5)
    print('v7 organic grass & 3D vegetation:',im.size)

if __name__=='__main__':main()
