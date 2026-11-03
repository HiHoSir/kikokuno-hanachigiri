"""v6 controlled painterly materials for the existing 3D -> 2D demo.

The model, camera, world coordinates, UV axes, footprints, and movement are not modified.
Material palettes are changed on the GLB and on the corresponding RGBA sprites.
The ground is a textured 3D plane and gets an identical deterministic paint pass.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import build_textured as tex
import build_assets as core

PALETTES={
 'roof_blue': ((133,138,144),.32),
 'roof_ochre': ((155,139,119),.30),
 'plaster': ((239,226,201),.33),
 'wood': ((201,167,131),.22),
 'stone': ((168,167,147),.28),
 'bark': ((128,106,89),.24),
 'wood_deck': ((220,189,152),.26),
}

def low_frequency_field(width,height,seed=1741):
    rng=np.random.default_rng(seed)
    parts=[]
    for tw,th,amp in [(max(2,width//68),max(2,height//68),1.7),
                      (max(2,width//210),max(2,height//210),3.0)]:
        a=rng.normal(0,1,(th,tw)).astype('float32')
        mini=Image.fromarray(np.uint8(np.clip(127+a*37,0,255)),'L')
        big=mini.resize((width,height),Image.Resampling.BICUBIC)
        parts.append((np.asarray(big,np.float32)-127)/37*amp)
    return parts[0]+parts[1]

_orig_texture=tex._seeded_texture

def watercolor_texture(kind):
    """Use the exact same UVs as v5 but reduce hard computer-pattern contrast."""
    image=_orig_texture(kind).convert('RGB')
    target,mix=PALETTES[kind]
    image=Image.blend(image,image.filter(ImageFilter.GaussianBlur(1.02)),.40)
    a=np.asarray(image,dtype=np.float32).copy()
    target=np.asarray(target,dtype=np.float32)
    a=a*(1-mix)+target*mix
    wave=low_frequency_field(a.shape[1],a.shape[0],817+tex.ID[kind])
    # Pigment pools are broad, subtle, and reproducible (not random per frame).
    a+=wave[:,:,None]*np.asarray([.85,1.0,.88],dtype=np.float32)
    return Image.fromarray(np.uint8(np.clip(a,0,255)),'RGB')

tex._seeded_texture=watercolor_texture

_orig_tree=core.make_tree_v3

def softer_canopy(sakura=False):
    model=_orig_tree(sakura)
    updated=[]
    target=np.asarray((237,195,199) if sakura else (140,166,130),dtype=np.float32)
    for vertices,c,outline in model.faces:
        arr=np.asarray(vertices,float)
        y=float(np.mean(arr[:,1]))
        r,g,b=c
        if y>2.05 and ((sakura and r>145 and g>110 and g>=b*.83) or
                        (not sakura and g>r*1.025 and g>b*.89)):
            # Rebalance the tonal values while retaining actual leaf geometry.
            t=.32 if sakura else .36
            vec=np.asarray(c,np.float32)*(1-t)+target*t
            c=tuple(int(np.clip(v,0,255)) for v in vec)
        updated.append((vertices,c,outline))
    model.faces=updated
    return model

core.make_tree_v3=softer_canopy

_orig_ground=core.oblique_ground

def watercolor_ground():
    im=_orig_ground().convert('RGBA')
    a=np.asarray(im,dtype=np.uint8)
    alpha=a[:,:,3]
    # Warm, muted palette without changing river/path borders or world projection.
    rgb=a[:,:,:3].astype(np.float32)
    neutral=np.mean(rgb,axis=2,keepdims=True)
    rgb=.83*rgb+.17*neutral
    rgb=rgb*.982+np.asarray([10.5,8.8,6.0],dtype=np.float32)
    wash=low_frequency_field(im.width,im.height,9134)
    rgb+=wash[:,:,None]*np.asarray([1.00,1.12,.90],dtype=np.float32)
    # No pixels outside the original ground projection are introduced.
    out=np.empty_like(a);out[:,:,:3]=np.clip(rgb,0,255).astype(np.uint8);out[:,:,3]=alpha
    return Image.fromarray(out,'RGBA')

core.oblique_ground=watercolor_ground

_orig_render=tex.render

def painterly_render(self,scale=2,extra=10):
    image,anchor=_orig_render(self,scale=scale,extra=extra)
    # Small optical diffusion on screen-space pigment; never changes the
    # exported 3D geometry, shadow/collision/anchor or sprite dimensions.
    if self.name in ('tree','sakura','shrub','house','teahouse','rock'):
        soft=image.filter(ImageFilter.GaussianBlur(0.78))
        mix={'tree':.25,'sakura':.31,'shrub':.20,'house':.10,'teahouse':.10,'rock':.11}[self.name]
        image=Image.blend(image,soft,mix)
        rgba=np.array(image,dtype=np.uint8)
        alpha=rgba[:,:,3]
        if self.name in ('tree','sakura','shrub'):
            # Slight lifting of dark faceted patches, preserve dark trunk.
            rgb=rgba[:,:,:3].astype(np.float32)
            green=(rgb[:,:,1]>rgb[:,:,0]*1.03)&(rgb[:,:,1]>rgb[:,:,2]*.92)
            pink=(rgb[:,:,0]>155)&(rgb[:,:,1]>115)&(rgb[:,:,2]>110)
            mask=(pink if self.name=='sakura' else green)&(alpha>0)
            rgb[mask]=np.clip(rgb[mask]*.965 + np.asarray([7.,8.,5.]),0,255)
            rgba[:,:,:3]=rgb.astype(np.uint8)
        image=Image.fromarray(rgba,'RGBA')
    return image,anchor

tex.render=painterly_render

def main():
    tex.main()
    # Ensure the actual ground PNG is used, not a stale v5 cached copy.
    # The GLB materials are from the same updated UV atlas via tex.main().
    ground=core.ASSETS/'ground.png'
    g=watercolor_ground()
    g.save(ground,optimize=True)
    # WebP only compresses the *2D ground output*, not a new source of art.
    g.save(core.ASSETS/'ground-q90.webp',format='WEBP',quality=90,method=5)
    print('Watercolor ground:',g.size)

if __name__=='__main__':
    main()
