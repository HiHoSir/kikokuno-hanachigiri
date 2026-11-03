"""Texture-backed 3D -> independent RGBA 2D sprites.

Source geometry is from build_assets.py. This pass assigns deterministic Pillow
textures to UVs on real GLB polygons, and renders the same UVs to Canvas2D sprites.
No neural image generation or 2D screenshot repainting occurs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math, random, json, time
import trimesh
from numba import njit
import build_assets as core

SIZE=256
MATS=('roof_blue','roof_ochre','plaster','wood','stone','bark','wood_deck')
ID={v:i for i,v in enumerate(MATS)}
ATLAS_PATH=core.ASSETS/'texture-atlas.png'


def _seeded_texture(kind):
    if kind=='wood_deck':
        # Bright bridge deck: same U-oriented fibers, lighter sunlit cedar.
        t=np.array(_seeded_texture('wood'),dtype=np.int16)
        t=np.clip(t+np.array([25,30,24],dtype=np.int16),0,255).astype(np.uint8)
        return Image.fromarray(t,'RGB')
    r=random.Random({'roof_blue':151,'roof_ochre':153,'plaster':217,'wood':409,'stone':572,'bark':811}[kind])
    im=Image.new('RGB',(SIZE,SIZE))
    d=ImageDraw.Draw(im)
    if kind.startswith('roof_'):
        blue=kind=='roof_blue'
        base=(79,94,111) if blue else (112,94,77)
        d.rectangle((0,0,255,255),fill=base)
        cols,rows=14,10
        cw,ch=SIZE/cols,SIZE/rows
        for j in range(rows):
            for i in range(-1,cols+1):
                x=int(i*cw+((j%2)*cw/2));y=int(j*ch)
                col=tuple(max(0,min(255,round(v+r.randint(-9,10)))) for v in base)
                d.rounded_rectangle((x+1,y+1,x+int(cw)-1,y+int(ch)-2),radius=4,fill=col)
                d.arc((x+1,y+ch*.56,x+cw-1,y+ch+.18*ch),0,180,fill=(41,53,64) if blue else (73,61,52),width=2)
                d.line((x+4,y+4,x+cw-4,y+4),fill=(141,151,162) if blue else (163,143,115),width=1)
                if r.random()<.4:
                    px=x+r.randint(5,13); py=y+r.randint(8,18)
                    d.line((px,py,px+r.randint(-3,3),py+3),fill=(60,76,84) if blue else (82,83,67),width=1)
    elif kind=='plaster':
        d.rectangle((0,0,255,255),fill=(218,207,177))
        for j in range(1800):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            v=r.randint(-22,22)
            color=(max(0,218+v),max(0,207+v),max(0,177+v))
            d.ellipse((x,y,x+r.randint(1,7),y+r.randint(1,4)),fill=color)
        im=im.filter(ImageFilter.GaussianBlur(1.3))
        d=ImageDraw.Draw(im)
        for j in range(65):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            d.line((x,y,x+r.randint(3,15),y+r.randint(-3,3)),fill=r.choice([(191,179,152),(235,225,194),(206,191,161)]),width=1)
    elif kind=='wood':
        d.rectangle((0,0,255,255),fill=(188,150,108))
        # Wood fibers run strictly left-right in texture space (U direction).
        # Dark perpendicular bands from v4 resembled artificial end-grain joints;
        # real board seams are represented by the geometry, not painted here.
        for j in range(920):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            v=r.randint(-19,19)
            c=(max(0,188+v),max(0,150+v),max(0,108+v))
            length=r.randint(18,100)
            bend=r.choice([-2,-1,0,0,0,1,2])
            d.line((x,y,x+length//2,y+bend,x+length,y+bend+r.choice([-1,0,1])),
                   fill=c,width=r.choice([1,1,1,2]))
        for i in range(10):
            x=r.randrange(16,235);y=r.randrange(12,244)
            radius=r.randrange(4,11)
            d.arc((x-radius*2,y-radius/2,x+radius*2,y+radius/2),0,175,
                  fill=(155,119,82),width=1)
            d.arc((x-radius*2,y-radius/2,x+radius*2,y+radius/2),180,355,
                  fill=(212,179,140),width=1)
    elif kind=='stone':
        d.rectangle((0,0,255,255),fill=(141,148,133))
        for j in range(1600):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            v=r.randint(-36,25);col=tuple(max(0,min(255,t+v)) for t in (141,148,133))
            d.ellipse((x,y,x+r.randrange(2,18),y+r.randrange(2,9)),fill=col)
        im=im.filter(ImageFilter.GaussianBlur(.6));d=ImageDraw.Draw(im)
        for j in range(65):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            d.line((x,y,x+r.randint(5,32),y+r.randint(-8,6)),fill=r.choice([(91,114,103),(96,103,95),(179,177,147)]),width=r.choice([1,2]))
        for j in range(95):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            d.ellipse((x,y,x+r.randint(2,7),y+r.randint(1,4)),fill=(102,131,99))
    else: # bark
        d.rectangle((0,0,255,255),fill=(103,83,68))
        for i in range(300):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            c=r.choice([(67,59,52),(81,68,57),(124,104,83),(148,125,97),(94,72,61)])
            d.line((x,y,x+r.randrange(-4,5),y+r.randrange(10,55)),fill=c,width=r.choice([1,1,2,3]))
        for i in range(68):
            x=r.randrange(SIZE);y=r.randrange(SIZE)
            d.arc((x,y,x+r.randrange(5,18),y+r.randrange(12,38)),75,270,fill=(67,60,53),width=1)
    return im


def create_atlas():
    atlas=Image.new('RGB',(SIZE*len(MATS),SIZE))
    for i,kind in enumerate(MATS):atlas.paste(_seeded_texture(kind),(i*SIZE,0))
    atlas.save(ATLAS_PATH,optimize=True)
    return np.asarray(atlas,dtype=np.uint8)


def classify(model,points,col):
    p=np.asarray(points,float)
    width=p.max(axis=0)-p.min(axis=0)
    mx=width[0];my=width[1];mz=width[2]
    ylo=p[:,1].min();yhi=p[:,1].max()
    if model.name in ('house','teahouse'):
        # Major roof planes and walls have their own dedicated materials.
        if mx>2.5 and my>.40 and mz>1.0 and ylo>(1.0 if model.name=='teahouse' else 1.35):
            return 'roof_ochre' if model.name=='teahouse' else 'roof_blue'
        if my>.96 and (mx>2.0 or mz>1.5) and .12<ylo<.42 and yhi<2.1:
            return 'plaster'
        # Only boards that actually need lengthwise grain. Preserve the colors
        # of posts, framing, white walls and board joints from the v4 rendering.
        if my<.025 and yhi<.50 and col[0]>col[1]*1.095 and col[1]>col[2]*1.14 and ((mx>1.7 and mz>.15) or (mz>1.2 and mx>.17)):
            return 'wood'
    if model.name=='bridge':
        # Individual deck plank *tops* (not side faces, rails or posts).
        # The individual 0.147 x 1.6 m boards remain separate 3D shapes.
        if my<.015 and .15<ylo<.21 and .11<mx<.17 and mz>1.50:
            return 'wood_deck'
    if model.name=='rock':return 'stone'
    if model.name in ('tree','sakura'):
        r,g,b=col
        if r>g*.99 and r>b*1.10 and r<165 and g<140:
            if my>.035:return 'bark'
    return None


def board_grain_axis(model, points):
    """Choose the *physical fiber axis* for each wood member, never screen X.

    The wide veranda is assembled from Z-facing planks separated by thin
    X-constant wooden lines. The X-spanning bridge has Z-facing deck boards;
    rail beams are X-facing and vertical posts Y-facing. All remain stable
    when the world-space camera azimuth changes.
    """
    p=np.asarray(points,float)
    d=np.ptp(p,axis=0)
    if model.name in ('house','teahouse'):
        # Flat broad veranda: explicit board run direction is Z, despite its
        # *overall footprint* being much wider along X.
        if d[1]<.03 and d[0]>1.35 and d[2]>.12 and p[:,1].max()<.5:
            return 2
        # Side porch and the floorboards edge: direction is Z.
        if d[1]<.03 and d[2]>.15 and d[0]<.5 and p[:,1].max()<.5:
            return 2
    if model.name=='bridge':
        # Deck planks: tiny X board width, long Z fibers.
        if d[1]<.04 and d[2]>1.2 and d[0]<.23:
            return 2
    # For individual posts/rails/braces, grain follows the longest extent.
    return int(np.argmax(d))


def uv_wood(model,points):
    """Put the texture's U grain along an identified physical board axis.

    UV coordinates remain inside one patch: no modulo seam inside a long
    board, no arbitrary switching when a face is rotated toward camera.
    """
    p=np.asarray(points,float)
    d=np.ptp(p,axis=0)
    axis=board_grain_axis(model,points)
    remaining=[k for k in range(3) if k!=axis]
    across=max(remaining,key=lambda k: d[k])
    # Coordinate is normalized per whole polygon (before triangulation).
    # A fixed low edge margin avoids texture leakage into adjacent atlas cells.
    v_axis=(p[:,across]-p[:,across].min())/max(float(d[across]),.0001)
    u_axis=(p[:,axis]-p[:,axis].min())/max(float(d[axis]),.0001)
    return np.stack([.012+.976*u_axis,.012+.976*v_axis],axis=1)


def coords_for(mat,points,model=None):
    p=np.asarray(points,float)
    dx=np.ptp(p[:,0]);dy=np.ptp(p[:,1]);dz=np.ptp(p[:,2]);
    if mat.startswith('roof'):
        # Each roof surface fills one texture patch: no seams at individual tiles.
        # Coordinates already scaled with source mesh, preserving independent GLBs.
        # World x/z are used so adjoining triangles agree on the same UVs.
        spanx=4.45*(.76*.82 if getattr(coords_for,'teahouse',False) else .80)
        spanz=1.80*(.83*.82 if getattr(coords_for,'teahouse',False) else .80)
        return np.stack([np.clip(.5+p[:,0]/spanx,0,1),np.clip(np.abs(p[:,2])/spanz,0,1)],axis=1)
    if mat=='plaster':
        along=p[:,0] if dx>dz else p[:,2]
        u=(along-along.min())/max(1e-5,np.ptp(along))
        v=(p[:,1]-p[:,1].min())/max(1e-5,dy)
        return np.stack([u,v],axis=1)
    if mat.startswith('wood'):
        return uv_wood(model,points)
    if mat=='stone':
        # Each irregular stone face is drawn with the shared mineral image.
        ux=p[:,0] if dx>dz else p[:,2]
        u=(ux-ux.min())/max(.02,np.ptp(ux));v=(p[:,1]-p[:,1].min())/max(.02,dy)
        return np.stack([u,v],axis=1)
    # Bark grain runs along the height of the cylinder.
    return np.stack([np.mod((p[:,0]+p[:,2])*1.8+.5,1),np.mod(p[:,1]*.37,1)],axis=1)


def iter_triangles(model):
    for points,col,_ in model.faces:
        m=classify(model,points,col)
        coords_for.teahouse=(model.name=='teahouse')
        uv=coords_for(m,points,model) if m else None
        for k in range(1,len(points)-1):
            ids=[0,k,k+1]
            yield [points[i] for i in ids],col,m,([uv[i] for i in ids] if uv is not None else None)

@njit(cache=True)
def raster_uv(tris,colors,mat_ids,uvs,atlas,outwidth,outheight):
    pixels=np.zeros((outheight,outwidth,4),dtype=np.uint8)
    zs=np.full((outheight,outwidth),-1e14,dtype=np.float32)
    for n in range(tris.shape[0]):
        ax,ay,az,bx,by,bz,cx,cy,cz=tris[n]
        den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(den)<1e-8:continue
        inv=1.0/den
        xmin=max(0,int(math.floor(min(ax,bx,cx))));xmax=min(outwidth-1,int(math.ceil(max(ax,bx,cx))))
        ymin=max(0,int(math.floor(min(ay,by,cy))));ymax=min(outheight-1,int(math.ceil(max(ay,by,cy))))
        for yy in range(ymin,ymax+1):
            py=yy+.5
            for xx in range(xmin,xmax+1):
                px=xx+.5
                a=((by-cy)*(px-cx)+(cx-bx)*(py-cy))*inv
                if a < -1e-6 or a > 1.000001:continue
                b=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))*inv
                if b < -1e-6 or b > 1.000001:continue
                c=1-a-b
                if c < -1e-6 or c>1.000001:continue
                z=az*a+bz*b+cz*c
                if z<zs[yy,xx]:continue
                zs[yy,xx]=z
                mi=mat_ids[n]
                if mi>=0:
                    tu=uvs[n,0]*a+uvs[n,2]*b+uvs[n,4]*c
                    tv=uvs[n,1]*a+uvs[n,3]*b+uvs[n,5]*c
                    u=min(255,max(0,int(tu*255)))+mi*256
                    v=min(255,max(0,int(tv*255)))
                    pixels[yy,xx,0]=atlas[v,u,0]
                    pixels[yy,xx,1]=atlas[v,u,1]
                    pixels[yy,xx,2]=atlas[v,u,2]
                else:
                    pixels[yy,xx,0]=colors[n,0]
                    pixels[yy,xx,1]=colors[n,1]
                    pixels[yy,xx,2]=colors[n,2]
                pixels[yy,xx,3]=255
    return pixels


def render(self,scale=2,extra=10):
    pts=[core.project(p) for face,_,_ in self.faces for p in face]
    minx=min(x for x,y in pts)-extra;maxx=max(x for x,y in pts)+extra
    miny=min(y for x,y in pts)-extra;maxy=max(y for x,y in pts)+extra
    w=int(math.ceil(maxx-minx));h=int(math.ceil(maxy-miny))
    tris=[];uvs=[];ids=[];colors=[]
    for face,col,mat,uv in iter_triangles(self):
        t=[]
        for p in face:
            x,y=core.project(p)
            z=(p[0]*core.SA+p[2]*core.CA)*core.C+p[1]*core.S
            t.extend(((x-minx)*scale,(y-miny)*scale,z))
        tris.append(t);colors.append(list(col));ids.append(ID.get(mat,-1))
        uvs.append([a for pair in uv for a in pair] if uv is not None else [0.0]*6)
    out=raster_uv(np.array(tris,np.float32),np.array(colors,np.uint8),np.array(ids,np.int32),np.array(uvs,np.float32),ATLAS_RGB,w*scale,h*scale)
    return Image.fromarray(out,'RGBA').resize((w,h),Image.Resampling.LANCZOS),[core.OX-minx,core.OY-miny]


def export_glb(self,path):
    pverts=[];pfaces=[];pcolors=[]
    tverts=[];tfaces=[];tuv=[]
    for face,col,mat,uv in iter_triangles(self):
        if mat is None:
            i=len(pverts);pverts.extend(face);pfaces.append((i,i+1,i+2));pcolors.append([*col,255])
        else:
            i=len(tverts);tverts.extend(face);tfaces.append((i,i+1,i+2))
            id_=ID[mat]
            for u,v in uv:tuv.append(((id_+float(u))/len(MATS),1-float(v)))
    scene=trimesh.Scene()
    if pverts:
        mesh=trimesh.Trimesh(vertices=np.array(pverts),faces=np.array(pfaces),process=False)
        mesh.visual.face_colors=np.asarray(pcolors,dtype=np.uint8)
        scene.add_geometry(mesh,geom_name='geometry_colors')
    if tverts:
        material=trimesh.visual.material.PBRMaterial(name='Watercolor_Texture_Atlas',baseColorTexture=Image.open(ATLAS_PATH).convert('RGBA'),metallicFactor=0,roughnessFactor=1.0,doubleSided=True)
        mesh=trimesh.Trimesh(vertices=np.array(tverts),faces=np.array(tfaces),process=False)
        mesh.visual=trimesh.visual.TextureVisuals(uv=np.asarray(tuv),material=material)
        scene.add_geometry(mesh,geom_name='geometry_uv_textured')
    scene.export(path)
    return {'triangles_textured':len(tfaces),'triangles_plain':len(pfaces)}


def main():
    global ATLAS_RGB
    ATLAS_RGB=create_atlas()
    core.Model.export_glb=export_glb
    core.Model.rasterize=render
    bridge=core.make_bridge_v2()
    for i in range(21):
        # Very thin actual joints in the 0.023m gaps between 22 deck boards.
        # Keep the top surfaces UV-textured and the board boundaries readable.
        x=-1.86+i*.17+.148
        bridge.box(x,.184,-.790,x+.016,.194,.790,'#815c42',top='#88654a')
    specs={'house':core.embellish_house_v3(core.make_house_v2()),'teahouse':core.embellish_house_v3(core.make_teahouse_v2(),True),'tree':core.make_tree_v3(),'sakura':core.make_tree_v3(sakura=True),'bridge':bridge,'lantern':core.make_lantern_v2(),'rock':core.make_rock(),'shrub':core.make_shrub(),'fence':core.make_fence(),'flowerpatch':core.make_flowerpatch()}
    factors={'house':.80,'teahouse':.82,'tree':.91,'sakura':.89,'shrub':.85,'fence':.90,'lantern':.88,'rock':.92,'flowerpatch':.95}
    meta={}
    for name,model in specs.items():
        s=factors.get(name,1)
        if s!=1: model.faces=[([tuple(float(v)*s for v in p) for p in f],col,o) for f,col,o in model.faces]
        stats=model.export_glb(core.ASSETS/f'{name}.glb')
        image,anchor=model.rasterize()
        image.save(core.ASSETS/f'{name}.png',optimize=True)
        meta[name]={'image':f'assets/{name}.png','size':[image.width,image.height],'anchor':[round(x,3) for x in anchor],'scale':1,'source3d':f'assets/{name}.glb','faces':len(model.faces),**stats}
        print(name,image.size,stats)
    # existing water and ground 3D-plane texture remains unchanged for fair comparison.
    src=core.ASSETS/'ground.png'
    if not src.exists():core.oblique_ground().save(src,optimize=True)
    (core.ASSETS/'render-metadata.json').write_text(json.dumps({'camera':{'ortho':True,'elevation':40,'azimuth':35,'pixelsPerMetre':100,'offset':[core.OX,core.OY],'imageSize':[core.OW,core.OH]},'textures':{'atlas':'assets/texture-atlas.png','materials':list(MATS),'projection':'UV-mapped GLB and software-rasterized RGBA'},'assets':meta},ensure_ascii=False,indent=2),encoding='utf-8')
    report={'files':len(specs),'textured_triangles':sum(x['triangles_textured'] for x in meta.values()),'plain_triangles':sum(x['triangles_plain'] for x in meta.values()),'texture_atlas_size':list(Image.open(ATLAS_PATH).size)}
    (core.DIR/'texture-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('DONE',report)

if __name__=='__main__':main()
