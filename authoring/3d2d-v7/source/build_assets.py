"""Hanachigiri 3D-to-2D demonstration. All scene objects are real procedural 3D polygons.
Render with orthographic 40-degree camera to independent RGBA PNG layers; export matching GLB.
Standard-library Pillow/numpy/trimesh only. Demo scene is intentionally distinct from approved art.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import numpy as np, math, random, json, trimesh

DIR=Path(__file__).resolve().parent.parent
ASSETS=DIR/'assets'
ASSETS.mkdir(exist_ok=True)
RNG=random.Random(7823)
PPM=100
T=math.radians(40)
S=math.sin(T)
C=math.cos(T)
W,H=1536,1024  # legacy unrotated source texture pixel dimensions
AZ=math.radians(35)
SA,CA=math.sin(AZ),math.cos(AZ)
OX,OY=1064,300
OW,OH=2440,1810  # projected oblique scene envelope

def flat_project(pt):
 x,y,z=pt
 return (PPM*x,PPM*(z*S-y*C))

def rgb(h):
 h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))

def tint(color,factor):
 return tuple(max(0,min(255,int(v*factor))) for v in color)

def blend(a,b,t):
 return tuple(round(x*(1-t)+y*t) for x,y in zip(a,b))

def project(pt):
 x,y,z=pt
 return (OX+PPM*(x*CA-z*SA), OY+PPM*((x*SA+z*CA)*S-y*C))

class Model:
 def __init__(self,name):
  self.name=name;self.faces=[]
 def face(self,verts,hexcolor,outline=True):
  self.faces.append((list(map(tuple,verts)),rgb(hexcolor) if isinstance(hexcolor,str) else tuple(hexcolor),outline))
 def box(self,x1,y1,z1,x2,y2,z2,color,top=None,edge=None):
  b=rgb(color) if isinstance(color,str) else color;t=rgb(top) if isinstance(top,str) else (top or blend(b,(255,252,237),.12))
  v=[(x1,y1,z1),(x2,y1,z1),(x2,y1,z2),(x1,y1,z2),(x1,y2,z1),(x2,y2,z1),(x2,y2,z2),(x1,y2,z2)]
  for indices,c in [([0,1,5,4],tint(b,.75)),([1,2,6,5],tint(b,.89)),([2,3,7,6],b),([3,0,4,7],tint(b,.95)),([4,5,6,7],t)]:self.face([v[i] for i in indices],c)
 def beam(self,a,b,r,color,segments=5):
  # horizontal/vertical tubular wood polygon; vector in xyz
  ax,ay,az=a;bx,by,bz=b
  dx,dy,dz=bx-ax,by-ay,bz-az
  leng=math.sqrt(dx*dx+dy*dy+dz*dz)
  if leng<1e-5:return
  direction=np.array([dx,dy,dz])/leng
  test=np.array([0,1,0]) if abs(direction[1])<.9 else np.array([1,0,0])
  u=np.cross(direction,test);u/=np.linalg.norm(u);v=np.cross(direction,u)
  ring1=[];ring2=[]
  for i in range(segments):
   ang=i*math.tau/segments
   offset=(u*math.cos(ang)+v*math.sin(ang))*r
   ring1.append(tuple(np.array(a)+offset));ring2.append(tuple(np.array(b)+offset))
  for i in range(segments):
   light=.76+.07*(i%3)
   self.face([ring1[i],ring1[(i+1)%segments],ring2[(i+1)%segments],ring2[i]],tint(rgb(color),light),False)
  self.face(ring2,rgb(color),False)
 def stone(self,x,y,z,rx,ry,rz,col):
  v0=(x,y+ry,z)
  points=[(x+rx*math.cos(t),y,z+rz*math.sin(t)) for t in [i*math.tau/7 for i in range(7)]]
  for i in range(7):
   self.face([points[i],points[(i+1)%7],v0],blend(rgb(col),(244,238,210),(.07*i%4)/10),False)
 def canopy(self,x,y,z,rx,ry,rz,col,nlat=4,nlon=8):
  # A faceted, real 3D ellipsoid (triangulated with irregular but deterministic outline)
  for j in range(nlat):
   a0=-math.pi/2+j*math.pi/nlat;a1=-math.pi/2+(j+1)*math.pi/nlat
   for i in range(nlon):
    b0=i*2*math.pi/nlon;b1=(i+1)*2*math.pi/nlon
    def p(a,b):return (x+math.cos(a)*math.cos(b)*rx,y+math.sin(a)*ry,z+math.cos(a)*math.sin(b)*rz)
    base=rgb(col);fac=.89+.05*((i*3+j)%4)
    self.face([p(a0,b0),p(a0,b1),p(a1,b1),p(a1,b0)],tint(base,fac),False)
 def export_glb(self,out):
  vertices=[];faces=[];colors=[]
  for points,color,_ in self.faces:
   start=len(vertices);vertices.extend(points)
   for k in range(1,len(points)-1):
    faces.append([start,start+k,start+k+1]);colors.append([*color,255])
  mesh=trimesh.Trimesh(vertices=np.array(vertices,float),faces=faces,process=False)
  mesh.visual.face_colors=np.array(colors,dtype=np.uint8)
  mesh.export(out)
 def rasterize(self,scale=2,extra=10):
  coords=[project(p) for face,_,_ in self.faces for p in face]
  minx=min(x for x,y in coords)-extra;maxx=max(x for x,y in coords)+extra
  miny=min(y for x,y in coords)-extra;maxy=max(y for x,y in coords)+extra
  # draw at 2x and return native pixels with anti-aliased silhouettes.
  w=int(math.ceil(maxx-minx));h=int(math.ceil(maxy-miny))
  im=Image.new('RGBA',(w*scale,h*scale),(0,0,0,0));d=ImageDraw.Draw(im,'RGBA')
  for face,col,outline in sorted(self.faces,key=lambda v:sum((p[0]*SA+p[2]*CA)*C+p[1]*S for p in v[0])/len(v[0])):
   pts=[(int((project(p)[0]-minx)*scale),int((project(p)[1]-miny)*scale)) for p in face]
   d.polygon(pts,fill=(*col,255))
   if outline:d.line(pts+[pts[0]],fill=(*tint(col,.67),130),width=scale)
  im=im.resize((w,h),Image.Resampling.LANCZOS)
  return im,[OX-minx,OY-miny]

def make_house():
 m=Model('house')
 # world origins: building center ground, front +z
 m.box(-1.92,0,-1.21,1.92,.28,1.25,'#747963','#aeb39a')
 m.box(-1.78,.24,-1.14,1.78,1.78,1.14,'#d6c59d','#e0d2a9')
 # base beams and corners
 for x in [-1.82,1.72]:
  for z in [-1.18,1.14]:m.box(x,.23,z-.055,x+.10,2.05,z+.055,'#594a3b')
 for yy in [.33,1.72,1.90]:
  m.box(-1.85,yy,1.145,1.85,yy+.10,1.19,'#6d5644')
 # front entry dark recess, sliding door with warm wood frame
 m.box(-.53,.28,1.18,.53,1.72,1.23,'#574e42')
 m.box(-.40,.32,1.24,.40,1.59,1.27,'#a28a62')
 m.box(-.075,.34,1.28,.00,1.57,1.30,'#654f39')
 for xx in [-.49,.43]:m.box(xx,.26,1.24,xx+.06,1.68,1.30,'#5e4c38')
 # noren/banner above door
 m.box(-.51,1.54,1.25,.48,1.79,1.28,'#8d4a4a')
 # shoji windows on front
 for x1 in [-1.43,.8]:
  m.box(x1,.95,1.2,x1+.61,1.55,1.245,'#efdebb')
  for k in range(1,3):m.box(x1+.61*k/3-.018,.95,1.245,x1+.61*k/3+.018,1.55,1.27,'#795d46')
  m.box(x1,1.23,1.24,x1+.61,1.26,1.27,'#795d46')
  m.box(x1-.04,.90,1.26,x1+.66,.96,1.28,'#6b5541')
 # exposed verandah, stepping stone
 m.box(-1.76,.17,1.20,1.68,.32,1.56,'#b19a72')
 for x in np.arange(-1.65,1.7,.30):m.box(float(x),.318,1.26,float(x+.015),.327,1.55,'#75664b')
 m.box(-.64,.02,1.59,.63,.16,1.88,'#968e76')
 # roof gable: ridge along x, ridgeline z=0
 ridgeY=2.58;eaveY=1.91
 for a,b in [(-1.58,.05),(.05,1.58)]:
  # tiles: both pitch planes repeated
  pass
 for zsign in [-1,1]:
  zedge=zsign*1.63
  m.face([(-2.05,eaveY,zedge),(2.05,eaveY,zedge),(2.05,ridgeY,0),(-2.05,ridgeY,0)],'#525968' if zsign==1 else '#606a74')
  # irregular banding tile rows in perspective on slope
  for row in range(1,8):
   t=row/8;z=zedge*(1-t);yy=eaveY+(ridgeY-eaveY)*t
   m.face([(-2.045,yy-.013,z+.018*zsign),(2.045,yy-.013,z+.018*zsign),(2.045,yy+.013,z-.018*zsign),(-2.045,yy+.013,z-.018*zsign)],'#343e4d',False)
  for col in range(0,15):
   x=-1.99+col*.28
   m.face([(x-.01,eaveY,zedge),(x+.01,eaveY,zedge),(x+.01,ridgeY,0),(x-.01,ridgeY,0)],'#6d7280',False)
 # ridge beam and end caps
 m.box(-2.12,ridgeY-.045,-.09,2.12,ridgeY+.11,.09,'#414653')
 for x in [-2.14,2.10]:m.box(x,ridgeY-.06,-.13,x+.06,ridgeY+.14,.13,'#303947')
 # front beams under eaves
 m.box(-2.02,1.78,1.57,2.02,1.90,1.70,'#5a4939')
 # hanging lantern outside
 m.box(1.41,1.17,1.69,1.65,1.53,1.83,'#c9914b','#d7ae61')
 m.box(1.40,1.48,1.67,1.67,1.54,1.85,'#584533')
 m.box(1.40,1.16,1.67,1.67,1.22,1.85,'#584533')
 return m

def make_tree():
 m=Model('tree')
 m.beam((0,0,0),(.04,2.28,-.06),.21,'#665948',segments=7)
 for a,b in [((0,1.5,0),(-.94,2.85,-.26)),((.02,1.67,0),(.85,3.1,.12)),((0,2.05,0),(.2,3.35,-.24))]:m.beam(a,b,.12,'#625648',5)
 blobs=[(-.87,2.94,-.25,.97,.90,.84,'#849c73'),(.85,3.02,-.18,1.04,.88,.82,'#8cab83'),(.16,3.57,-.57,1.27,.90,.97,'#91a681'),(-.54,3.68,.44,1.04,.81,.89,'#95ac81'),(.66,3.83,.40,.94,.73,.75,'#a0b188'),(-.15,4.28,.02,.90,.63,.73,'#97b083'),(-1.24,3.55,.33,.65,.57,.64,'#819a74')]
 for x,y,z,rx,ry,rz,col in blobs:m.canopy(x,y,z,rx,ry,rz,col)
 return m

def make_sakura():
 m=Model('sakura')
 m.beam((0,0,0),(.03,2.4,0),.19,'#725e57',7)
 for a,b in [((0,1.55,0),(-1.02,2.85,-.25)),((0,1.75,0),(.99,3.03,.18))]:m.beam(a,b,.10,'#71594f',5)
 for x,y,z,rx,ry,rz,col in [(-1.0,3.20,0,.95,.8,.85,'#e2b4bd'),(.80,3.36,.13,1.01,.88,.81,'#e5bcc2'),(.04,3.74,-.46,1.23,.85,.87,'#efcbd0'),(.21,3.98,.51,1.00,.74,.85,'#efc8cf'),(-.85,3.84,.37,.86,.78,.68,'#e4b4c1'),(.56,4.38,-.09,.87,.67,.78,'#e7c4c8')]:m.canopy(x,y,z,rx,ry,rz,col)
 return m

def make_bridge():
 m=Model('bridge')
 # Center bridge along x-axis, 3.5m across river, 1.35m deep
 for i in range(17):
  x=-1.85+i*.215
  m.box(x,0,-.72,x+.18,.18,.72,'#a68c68',top='#c2a47b')
  m.box(x+.18,.02,-.72,x+.192,.19,.72,'#665949',top='#74624e')
 for zz in [-.68,.64]:
  for xx in [-1.75,-.70,.50,1.63]:
   m.box(xx,.10,zz-.042,xx+.11,.89,zz+.042,'#796147',top='#927456')
  m.box(-1.78,.66,zz-.05,1.74,.75,zz+.05,'#735842',top='#95744e')
 return m

def make_lantern():
 m=Model('lantern')
 m.box(-.24,0,-.24,.24,.18,.24,'#817c6c')
 m.box(-.11,.15,-.11,.11,.85,.11,'#938e7d')
 m.box(-.30,.82,-.30,.30,1.12,.30,'#978f7b')
 m.box(-.22,.88,.30,.22,1.02,.33,'#d8ad68')
 m.box(-.36,1.13,-.36,.36,1.23,.36,'#696c62')
 m.box(-.22,1.23,-.22,.22,1.30,.22,'#7e8178')
 return m

def make_rock():
 m=Model('rock');m.stone(0,.04,0,.55,.54,.37,'#92998f');m.stone(-.36,.01,.15,.35,.27,.28,'#7e8d83');return m

def make_ground():
 # Procedural ground textures aligned with orthographic scene (the plane y=0).
 rng=np.random.default_rng(413)
 n1=rng.normal(0,1,(H//16+2,W//16+2)).astype(np.float32)
 n2=rng.normal(0,1,(H//64+2,W//64+2)).astype(np.float32)
 def resized(arr,scale):
  a=((arr-arr.min())/(arr.max()-arr.min())*255).astype('uint8')
  return np.asarray(Image.fromarray(a).resize((W,H),Image.Resampling.BICUBIC),dtype=np.float32)/255-.5
 fine=resized(n1,16);broad=resized(n2,64)
 yy,xx=np.mgrid[0:H,0:W]
 val=(fine*12+broad*25+np.sin(xx*.006+yy*.008)*2)[:,:,None]
 base=np.array([193,203,167],np.float32)[None,None,:]+val*np.array([1.05,1.0,.82])[None,None,:]
 base[:,:,0]+=(xx/W)*6
 base[:,:,1]+=(1-yy/H)*4
 arr=np.clip(base,0,255).astype('uint8')
 im=Image.fromarray(arr,'RGB').convert('RGBA');d=ImageDraw.Draw(im,'RGBA')
 def flat(x,z):return tuple(map(int,flat_project((x,0,z))))
 # river meander near right side
 left=[(12.52+math.sin(z*.58)*.40,z) for z in np.linspace(0,15.94,65)]
 right=[(14.72+math.sin(z*.58+.20)*.35,z) for z in np.linspace(0,15.94,65)]
 rp=[flat(x,z) for x,z in left+list(reversed(right))]
 d.polygon(rp,fill=(83,141,152,255))
 # shoreline warm band and water edge
 for edge in [left,right]:
  pts=[flat(x,z) for x,z in edge]
  d.line(pts,fill=(108,124,100,170),width=18,joint='curve')
  d.line(pts,fill=(161,164,125,200),width=8,joint='curve')
  d.line(pts,fill=(217,212,174,190),width=3,joint='curve')
 # water ripples
 for i in range(120):
  z=RNG.uniform(.0,15.7);x=13.6+math.sin(z*.58)*.37+RNG.uniform(-.68,.7)
  px,py=flat(x,z)
  r=RNG.randint(6,22);col=(181,218,208, RNG.randint(70,170))
  d.arc((px-r,py-4,px+r,py+5),190,330,fill=col,width=2)
 # gentle earth path branching to door and bridge
 coords=[(7.7,15.8),(7.7,14.2),(8.0,12.1),(8.45,10.15),(8.25,8.75),(7.5,7.6),(6.4,7.2),(5.25,7.9),(4.6,8.65)]
 d.line([flat(*c) for c in coords],fill=(135,125,92,85),width=135,joint='curve')
 d.line([flat(*c) for c in coords],fill=(199,182,142,250),width=112,joint='curve')
 d.line([flat(*c) for c in coords],fill=(206,192,160,180),width=85,joint='curve')
 bridgePath=[(8.25,10.1),(9.3,10.0),(10.6,9.8),(11.6,9.78)]
 d.line([flat(*c) for c in bridgePath],fill=(199,181,141,230),width=105,joint='curve')
 d.line([flat(*c) for c in bridgePath],fill=(220,204,166,220),width=68,joint='curve')
 # irregular stones along bank
 for i in range(260):
  z=RNG.uniform(.4,15.6);side=RNG.choice([0,1]);xx=(12.52+math.sin(z*.58)*.4) if side==0 else (14.72+math.sin(z*.58+.2)*.35)
  x=xx+RNG.uniform(-.30,.15) if side==0 else xx+RNG.uniform(-.15,.28)
  px,py=flat(x,z);rw=RNG.randint(3,14);rh=RNG.randint(2,6)
  c=RNG.choice([(140,147,123,210),(163,164,137,220),(109,130,122,195),(192,182,146,205)])
  d.ellipse((px-rw,py-rh,px+rw,py+rh),fill=c)
 # random grass tufts, flowers and soil freckles
 for i in range(3500):
  x=RNG.uniform(.2,15.1);z=RNG.uniform(.1,15.7);px,py=flat(x,z)
  if not (0<=px<W and 0<=py<H):continue
  if x>12.2+math.sin(z*.58)*.4:continue
  if (abs(x-7.7)<.9 and z>10.5) or (abs(z-9.8)<.55 and x>8.0):continue
  k=RNG.random()
  if k<.18:
   col=(88,121,89,160)
   d.line([(px,py),(px-RNG.randint(1,4),py-RNG.randint(3,8))],fill=col,width=1)
   d.line([(px,py),(px+RNG.randint(1,4),py-RNG.randint(2,8))],fill=(117,145,94,165),width=1)
  elif k<.28:
   c=RNG.choice([(235,221,194,155),(248,236,205,160),(196,180,144,125)])
   d.ellipse((px,py,px+2,py+1),fill=c)
  elif k<.33:
   col=RNG.choice([(233,215,181,230),(238,230,217,200),(215,180,184,220)])
   d.ellipse((px-2,py-2,px+2,py+2),fill=col)
 # subtle decorative soft overlays at sides
 return im

def oblique_ground():
 """Mount the original painted ground on a 3D horizontal quad, render through yaw 35/elevation 40.

 The base texture is a deterministic 2D atlas. World XY->screen mapping is the same
 affine projection used by the mesh rasterizer and the HTML game runtime.
 """
 src=make_ground()
 dest=Image.new('RGBA',(OW,OH),(0,0,0,0))
 d=ImageDraw.Draw(dest,'RGBA')
 # Faceted earth/stone cliff on south and east sides, deliberately avoiding
 # repetitive horizontal hatch marks which read like a metal fence.
 edges=[[(0,15.930612),(15.36,15.930612)],[(15.36,0),(15.36,15.930612)]]
 stone_colors=[(116,117,99,255),(130,129,106,255),(100,112,100,255),
               (143,140,117,255),(159,153,123,255),(89,103,91,255)]
 for j,(a,b) in enumerate(edges):
  topA=project((a[0],0,a[1]));topB=project((b[0],0,b[1]));
  botA=project((a[0],-.84,a[1]));botB=project((b[0],-.84,b[1]));
  d.polygon([topA,topB,botB,botA],fill=(102,111,96,255) if j else (120,117,98,255))
  r=random.Random(412+j)
  length=math.hypot(b[0]-a[0],b[1]-a[1]);count=int(length/.34)
  # staggered mineral strata: varied rock polygons, interrupted seams, moss pockets
  for k in range(count):
   t0=k/count;t1=(k+1)/count
   v0=(a[0]*(1-t0)+b[0]*t0,a[1]*(1-t0)+b[1]*t0)
   v1=(a[0]*(1-t1)+b[0]*t1,a[1]*(1-t1)+b[1]*t1)
   middle=((v0[0]+v1[0])/2,(v0[1]+v1[1])/2)
   points=[project((v0[0],-.01,v0[1])),project((v1[0],-.015,v1[1])),
           project((v1[0],-r.uniform(.28,.44),v1[1])),
           project((middle[0],-r.uniform(.40,.64),middle[1])),
           project((v0[0],-r.uniform(.3,.53),v0[1]))]
   col=r.choice(stone_colors)
   d.polygon(points,fill=col)
   if k%2==0:
    d.line([points[3],points[2]],fill=(64,87,77,95),width=2)
   if r.random()<.45:
    moss=project((middle[0],-r.uniform(.05,.24),middle[1]));
    d.ellipse((moss[0]-r.randint(3,9),moss[1]-2,moss[0]+r.randint(4,12),moss[1]+4),fill=(81,119,80,165))
  # broken moss fringe at the top of the cliff
  for k in range(count*3):
   t=r.random();q=(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t)
   at=project((q[0],-.018,q[1]));
   d.ellipse((at[0]-r.uniform(1,5),at[1]-r.uniform(1,2),at[0]+r.uniform(2,7),at[1]+r.uniform(2,5)),fill=r.choice([(76,111,72,175),(119,144,93,175),(157,158,113,150)]))
 # Blue water falling from the south edge in a handful of world-space rivulets.
 for i in range(25):
  x=12.52+math.sin(15.93*.58)*.4+.23+i*.075
  if x > 14.72+math.sin(15.93*.58+.2)*.35:continue
  a=project((x,0,15.930612)); b=project((x,-.83,15.930612))
  d.line([a,b],fill=RNG.choice([(82,154,171,245),(191,224,222,220),(107,181,198,245)]),width=RNG.choice([3,5,7]))
 # inverse affine: output projected image -> source flat texture image
 coeff=(CA, SA/S, -CA*OX-SA/S*OY,
         -S*SA, CA, S*SA*OX-CA*OY)
 top=src.transform((OW,OH),Image.Transform.AFFINE,coeff,resample=Image.Resampling.BICUBIC,fillcolor=(0,0,0,0))
 dest.alpha_composite(top)
 return dest

# --- Hand-authored procedural art pass v2: still true 3D geometry, not image generation. ---
def camera_leaf(m, x,y,z, width, height, color, angle=0):
 u=np.array([CA,0,-SA],float);v=np.array([-SA*S,C,-CA*S],float)
 u2=u*math.cos(angle)+v*math.sin(angle)
 v2=v*math.cos(angle)-u*math.sin(angle)
 base=np.array([x,y,z],float)
 def p(a,b):return tuple(base+u2*a+v2*b)
 m.face([p(-width/2,0),p(0,height/2),p(width/2,0),p(0,-height/2)],color,False)

def detailed_canopy(m,x,y,z,rx,ry,rz,colors,seed=1,flowers=False):
 r=random.Random(seed)
 # clusters are closed meshes, with painted leaves/petals projected from the surface
 for lat in range(7):
  a0=-math.pi/2+lat*math.pi/7;a1=-math.pi/2+(lat+1)*math.pi/7
  for lon in range(13):
   b0=lon*math.tau/13;b1=(lon+1)*math.tau/13
   def p(a,b):
    f=1+.035*math.sin(lon*7+lat*5)+.05*math.cos(lon*3-lat*4)
    return (x+rx*math.cos(a)*math.cos(b)*f,y+ry*math.sin(a)*f,z+rz*math.cos(a)*math.sin(b)*f)
   col=rgb(colors[seed%len(colors)])
   m.face([p(a0,b0),p(a0,b1),p(a1,b1),p(a1,b0)],tint(col,.96+.015*((lat*3+lon*5+seed)%5)),False)
 # many camera-facing patches are themselves flat 3D polygons, placed on ellipsoid surface
 for i in range(880 if flowers else 740):
  theta=r.uniform(.03,math.pi*.94)
  phi=r.random()*math.tau
  nx=math.sin(theta)*math.cos(phi);ny=math.cos(theta);nz=math.sin(theta)*math.sin(phi)
  # slightly bias toward camera-facing half, with back patches visible at canopy edges
  if nx*SA*C+ny*S+nz*CA*C < -.18 and r.random()<.83:continue
  q=r.uniform(.92,1.042)
  px=x+rx*nx*q;py=y+ry*ny*q;pz=z+rz*nz*q
  if flowers:
   col=rgb(r.choice(colors)+'' if False else r.choice(colors))
   size=r.uniform(.029,.080)
  else:
   col=rgb(r.choice(colors))
   size=r.uniform(.033,.110)
  camera_leaf(m,px,py,pz,size*r.uniform(.64,1.4),size*r.uniform(.48,1.12),tint(col,r.uniform(.88,1.13)),r.uniform(-1.3,1.3))

def make_house_v2():
 m=Model('house')
 # foundation and continuous plaster / timber structure, footprint 4.0 x 3.0 m
 m.box(-1.93,-.03,-1.29,1.92,.26,1.34,'#817d6f',top='#a6a494')
 for x in [-1.73,-.98,-.19,.59,1.4]:m.box(x,.21,1.33,x+.74,.26,1.43,'#8b866e')
 m.box(-1.80,.26,-1.18,1.80,1.95,1.22,'#d4c2a3','#e1d2b0')
 # large exposed wooden pillars and repetitive plaster bays
 for x in [-1.82,-.9,.0,.9,1.72]:
  m.box(x,.21,1.17,x+.105,2.04,1.3,'#66503d',top='#83614a')
  m.box(x,.21,-1.24,x+.092,2.02,-1.13,'#6b5644')
 for z in [-1.23,-.40,.44,1.14]:
  m.box(1.73,.24,z,1.88,2.03,z+.10,'#594633')
  m.box(-1.85,.24,z,-1.74,2.03,z+.10,'#6a5543')
 for yy,w in [(.31,.125),(1.17,.060),(1.89,.16)]:
  m.box(-1.85,yy,1.21,1.84,yy+w,1.34,'#6e543c')
  m.box(1.78,yy,-1.24,1.91,yy+w,1.31,'#725a42')
 # shoji windows front, glass panels and fine wooden lattices
 for x1 in [-1.51,.79]:
  m.box(x1,.89,1.304,x1+.58,1.69,1.347,'#f2dfa9')
  m.box(x1+.035,.92,1.347,x1+.545,1.65,1.354,'#e8dbb6')
  for k in range(5):
   xx=x1+k*.145;m.box(xx,.90,1.35,xx+.023,1.67,1.365,'#785a44')
  for k in range(4):
   yy=.89+k*.255;m.box(x1,yy,1.36,x1+.58,yy+.022,1.378,'#72533f')
 # recessed two-leaf entry: aligned with front +Z on world ground
 m.box(-.52,.23,1.325,.56,1.81,1.39,'#4b4437')
 m.box(-.45,.26,1.39,-.045,1.74,1.425,'#987d56')
 m.box(.05,.26,1.39,.47,1.74,1.425,'#af936d')
 for xx in [-.44,-.31,-.18,-.045,.058,.19,.32,.45]:m.box(xx,.36,1.428,xx+.018,1.62,1.438,'#735943')
 for yy in [.53,.89,1.30,1.59]:m.box(-.45,yy,1.44,.47,yy+.019,1.447,'#755d48')
 m.box(-.57,1.75,1.39,.60,1.84,1.45,'#594837')
 # red noren hanging banner: split cloth panels
 for k in range(4):
  xx=-.53+k*.28;m.face([(xx,1.72,1.49),(xx+.27,1.72,1.49),(xx+.27,1.93,1.49),(xx,1.93,1.49)],'#a35d58',False)
  camera_leaf(m,xx+.13,1.83,1.51,.065,.070,'#edcfb1')
 # verandah planks, narrow side veranda, three stone steps
 m.box(-1.88,.17,1.32,1.9,.30,1.87,'#96774e',top='#b99969')
 for x in np.arange(-1.8,1.94,.18):m.box(float(x),.306,1.34,float(x+.013),.315,1.85,'#6f5039')
 m.box(-.72,.015,1.88,.72,.13,2.22,'#9d9a87',top='#c3bea7')
 m.box(-.65,-.01,2.20,.65,.07,2.48,'#aba99a',top='#bdbab0')
 m.box(1.83,.15,-1.04,2.06,.29,1.34,'#8d6f50',top='#b59a73')
 # visible side shoji windows on east (+X) wall
 for z1 in [-.87,.19]:
  m.box(1.89,.94,z1,1.926,1.66,z1+.73,'#dfd2af')
  for k in range(5):
   zz=z1+k*.18;m.box(1.926,.94,zz,1.945,1.65,zz+.019,'#66513f')
  for yy in [1.16,1.4]:m.box(1.927,yy,z1,1.95,yy+.018,z1+.73,'#6b5744')
 # exposed framing at gable end, cedar rafters
 for x in [-1.98,1.91]:
  m.face([(x,1.92,-1.52),(x,1.92,1.55),(x,2.66,0)],'#d2bc9b')
  for zsign in [-1,1]:m.beam((x,1.90,zsign*1.60),(x,2.66,0),.045,'#6c5440',6)
  m.box(x,1.88,-1.59,x+.08,2.01,1.59,'#634d3e')
 # roof: double pitched tiles with dimensional overlapping curved surfaces
 ridge=2.68; eave=1.89;Z=1.71
 for sign in [-1,1]:
  m.face([(-2.12,eave,sign*Z),(2.12,eave,sign*Z),(2.12,ridge,0),(-2.12,ridge,0)],'#343f4b')
  # v4: individual tile meshes removed. Shared roof surfaces receive baked UV shingle textures.
  # This preserves eaves, silhouette, gable, ridgeline, posts and collision footprint.
 # tile ridge and ornamental endcaps
 m.beam((-2.20,ridge+.015,0),(2.20,ridge+.015,0),.095,'#323d49',9)
 for x in np.arange(-2.17,2.19,.275):m.box(float(x),ridge+.065,-.112,float(x+.16),ridge+.12,.115,'#64707b')
 for x in [-2.20,2.12]:m.box(x,ridge-.07,-.13,x+.085,ridge+.20,.13,'#36404c')
 # lattice under overhanging front eave
 m.box(-2.18,1.83,1.63,2.18,1.95,1.75,'#765b44')
 for x in np.arange(-1.95,2.10,.44):m.box(float(x),1.81,1.57,float(x+.10),1.89,1.82,'#68503a')
 # painted sign, dry roof-end accents, two ceramic vessels by entrance
 m.box(1.24,1.00,1.46,1.52,1.48,1.54,'#7e563b')
 m.box(1.29,1.06,1.55,1.47,1.41,1.57,'#c7aa6e')
 for x,z,s in [(-1.17,1.76,.21),(1.38,1.79,.28)]:
  m.canopy(x,.18,z,s,.27,s,'#8b91a0',4,9)
 return m


def make_teahouse_v2():
 m=make_house_v2();m.name='teahouse'
 # A different, compact building (not a flipped copy): darker cedar, softer brown tiled roof.
 colors=[]
 for face,col,outline in m.faces:
  r,g,b=col
  if b>r*1.10 and b>g*.99 and r<145:
   col=blend(col,(121,100,84),.60)
  elif r>g*1.14 and g<160:
   col=blend(col,(137,91,67),.28)
  elif r>148 and g>140 and b<205:
   col=blend(col,(213,192,154),.30)
  colors.append((face,col,outline))
 m.faces=colors
 # shop sign projects from the gable and an additional light banner
 m.box(1.50,1.15,1.73,1.91,1.73,1.81,'#8b634a')
 m.box(1.55,1.19,1.82,1.85,1.66,1.84,'#d8c292')
 for t in [.26,.53,.80]:m.box(1.60,1.19+t*.40,1.848,1.80,1.205+t*.40,1.852,'#846c54')
 for i in range(len(m.faces)):
  pts,col,out=m.faces[i];m.faces[i]=([((v[0]*.76),(v[1]*.84),(v[2]*.83)) for v in pts],col,out)
 return m

def make_tree_v2(sakura=False):
 m=Model('sakura' if sakura else 'tree')
 seed=151 if sakura else 191;r=random.Random(seed)
 m.beam((0,0,0),(.085,2.32,-.07),.19,'#6b5949',9)
 # bark ridges and exposed roots
 for i in range(8):
  a=i*math.tau/8;x=math.cos(a)*.17;z=math.sin(a)*.17
  m.beam((x*.6,.09,z*.6),(x+.04,1.58,z),.014,'#83705b',4)
 for a,b in [((.06,.32,0),(.36,.03,.25)),((-.05,.35,0),(-.33,.04,.13)),((0,1.46,0),(-.86,2.83,-.32)),((0,1.58,0),(.90,2.82,.27)),((.08,1.99,-.02),(.15,3.24,-.36)),((-.1,2.18,.09),(-.31,3.20,.73))]:m.beam(a,b,.073 if b[1]>1 else .095,'#655346',7)
 colors=['#d89dad','#e4adb9','#edc7d0','#f4d4d4','#e5b8c5','#f7ded9'] if sakura else ['#557d65','#739978','#86a487','#a6b893','#668c72','#94ae8b']
 clusters=[(-.86,3.01,-.25,1.01,.82,.77),(.85,3.10,.12,.95,.82,.79),(-.15,3.47,-.73,1.05,.82,.78),(.20,3.66,.53,1.17,.91,.93),(-1.13,3.65,.35,.78,.74,.69),(.91,3.72,-.25,.85,.76,.74),(.0,4.19,.01,.90,.70,.80)]
 for i,(x,y,z,rx,ry,rz) in enumerate(clusters):detailed_canopy(m,x,y,z,rx,ry,rz,colors,seed+i*29,flowers=sakura)
 if sakura:
  # small drifting blossoms, present in 3D scene, not a painted screenshot
  for k in range(125):
   x=r.uniform(-1.9,1.9);z=r.uniform(-1.7,1.7);y=r.uniform(.7,3.6)
   if r.random()<.40:y=r.uniform(.35,1.7)
   camera_leaf(m,x,y,z,r.uniform(.025,.068),r.uniform(.024,.055),r.choice(colors),r.uniform(-1.5,1.5))
 return m

def make_bridge_v2():
 m=Model('bridge')
 # Deck aligned X across river. Rounded beam underside and plank ends.
 for xx in [-1.79,1.71]:m.box(xx,-.25,-.81,xx+.14,.03,.81,'#69533e','#857054')
 for i in range(22):
  x=-1.86+i*.17
  shade=.93+((i*7)%6)*.018
  m.box(x,-.015,-.80,x+.147,.185,.80,tint(rgb('#b39262'),shade),top=tint(rgb('#d6b684'),shade))
  for z in [-.77,.74]:m.box(x,.175,z,x+.145,.192,z+.02,'#786047')
 # visible railing posts including a raised wooden bridge silhouette
 for z in [-.79,.74]:
  for xx in [-1.85,-1.00,-.05,.90,1.68]:
   m.box(xx,.12,z-.07,xx+.105,.98,z+.07,'#816443','#ac8960')
   m.box(xx-.035,.93,z-.10,xx+.145,1.045,z+.10,'#806146','#ba9971')
  m.box(-1.83,.79,z-.065,1.85,.88,z+.065,'#826447','#a88b65')
  m.box(-1.76,.44,z-.045,1.75,.50,z+.045,'#7b654a')
  # diagonal braces
  for x0 in [-1.73,-.85,.04,1.02]:m.beam((x0,.22,z),(x0+.65,.78,z),.034,'#6b543e',5)
 return m

def make_lantern_v2():
 m=Model('lantern')
 m.box(-.30,-.03,-.31,.30,.12,.31,'#777669','#a4a090')
 m.box(-.14,.12,-.14,.14,.88,.14,'#88867a')
 m.box(-.32,.84,-.32,.32,1.25,.32,'#766b58','#8b8473')
 for zz in [-.33,.31]:
  m.box(-.25,.91,zz,.25,1.16,zz+.025,'#d5b77d')
  for x in [-.23,.02,.23]:m.box(x,.90,zz+.025,x+.017,1.18,zz+.042,'#604d39')
 for xx in [-.33,.31]:m.box(xx,.91,-.25,xx+.03,1.16,.25,'#e6c78a')
 m.box(-.40,1.20,-.40,.40,1.32,.40,'#666760','#949184')
 m.box(-.25,1.32,-.25,.25,1.38,.25,'#797c70')
 return m

def make_shrub():
 m=Model('shrub')
 for x,z,sz in [(-.25,-.17,.42),(.23,.06,.48),(-.05,.24,.45),(.12,-.23,.36)]:
  detailed_canopy(m,x,sz*.75,z,sz,sz*.78,sz,['#517f62','#779d70','#95af79','#b5bf90'],seed=abs(int((x+z)*10000)),flowers=False)
 return m

def make_fence():
 m=Model('fence')
 for x in [-1.07,-.36,.35,1.06]:
  m.box(x,0,-.065,x+.09,.85,.065,'#786044','#a17f5a')
  m.box(x-.028,.78,-.095,x+.118,.89,.095,'#64513e','#ad8e64')
 for h in [.26,.61]:m.box(-1.04,h,-.050,1.14,h+.075,.065,'#886947','#b59767')
 return m

def make_flowerpatch():
 m=Model('flowerpatch');r=random.Random(8733)
 for i in range(88):
  x=r.uniform(-.65,.65);z=r.uniform(-.42,.42)
  y=r.uniform(.08,.34)
  m.beam((x,0,z),(x,y,z),.005,'#5b8660',4)
  camera_leaf(m,x,y,z,.075,.077,r.choice(['#f6d6ca','#ecebd5','#efc1c6','#d9d6e7','#f1dec3']),r.random()*math.tau)
 return m

# A second-pass painting on the terrain atlas is applied to the same 3D planar surface.
original_make_ground=make_ground
def make_ground():
 im=original_make_ground(); d=ImageDraw.Draw(im,'RGBA')
 r=random.Random(50889)
 def flat(x,z):return tuple(int(q) for q in flat_project((x,0,z)))
 # save only the base path as a clipping mask for irregular interlocking flagstones
 mask=Image.new('L',(W,H),0);md=ImageDraw.Draw(mask)
 route=[(7.7,15.8),(7.7,14.2),(8.0,12.1),(8.45,10.15),(8.25,8.75),(7.5,7.6),(6.4,7.2),(5.25,7.9),(4.6,8.65)]
 branch=[(8.25,10.1),(9.3,10.0),(10.6,9.8),(11.6,9.78)]
 northRoute=[(7.55,7.5),(7.15,6.3),(6.95,5.58)]
 for chain,width in [(route,108),(branch,104),(northRoute,96)]:md.line([flat(*c) for c in chain],fill=235,width=width,joint='curve')
 # map path coordinates into stable irregular 2D tessellated stepping stones
 stone=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(stone,'RGBA')
 for y in range(22,H-15,30):
  stagger=((y//30)%2)*19
  for x in range(-20+stagger,W+15,40):
   if not 0<=x<W or not 0<=y<H or mask.getpixel((x,y))<100:continue
   px=x+r.randint(-7,7);py=y+r.randint(-5,5)
   rx=r.uniform(13,24);ry=r.uniform(7,13)
   points=[]
   for k in range(7):
    a=k*math.tau/7;f=r.uniform(.80,1.13)
    points.append((int(px+rx*math.cos(a)*f),int(py+ry*math.sin(a)*f)))
   shade=r.choice([(200,193,162,225),(215,205,173,230),(186,185,160,217),(222,215,186,227),(195,200,174,230)])
   sd.polygon(points,fill=shade)
   sd.line(points+[points[0]],fill=(128,132,112,75),width=2)
   sd.line([(px-rx*.64,py-ry*.28),(px+rx*.43,py-ry*.44)],fill=(249,239,210,73),width=2)
 # mask stones within proper paths only
 a=stone.getchannel('A');a=Image.fromarray(np.minimum(np.asarray(a),np.asarray(mask)).astype('uint8'));stone.putalpha(a);im.alpha_composite(stone)
 # pale sand and moss in joints, fallen sakura petals, plant tussocks near the edges
 for i in range(3600):
  x=r.uniform(.15,15.1);z=r.uniform(.2,15.65)
  if x>bankLeft_at(z):continue
  px,py=flat(x,z)
  if px>=W or py>=H or px<0 or py<0:continue
  k=r.random();nearPath=mask.getpixel((px,py))>50
  if k<.24 and not nearPath:
   gr=r.choice([(60,112,75,120),(91,140,83,170),(148,163,104,145)])
   d.line((px,py,px+r.randint(-8,8),py-r.randint(4,11)),fill=gr,width=1)
   d.line((px,py,px+r.randint(-9,9),py-r.randint(5,12)),fill=gr,width=1)
  elif k<.31:
   cl=r.choice([(248,221,230,190),(250,236,218,190),(222,183,203,160)])
   d.ellipse((px-2,py-1,px+4,py+2),fill=cl)
  elif k<.40 and not nearPath:
   d.ellipse((px-2,py-1,px+3,py+3),fill=(240,228,171,115))
 # Grouped hand-painted grass blades and meadow flowers at a visible scale.
 for patch in range(420):
  x=r.uniform(.2,12.2);z=r.uniform(.2,15.6)
  px,py=flat(x,z)
  if px<0 or py<0 or px>=W or py>=H or mask.getpixel((px,py))>40:continue
  rr=r.uniform(3.5,9)
  for blade in range(r.randint(2,5)):
   dx=r.uniform(-rr,rr)
   d.line((px,py,px+dx,py-r.uniform(4,9)),fill=r.choice([(90,135,80,140),(125,156,104,120),(161,175,121,130)]),width=r.choice([1,2]))
  if r.random()<.18:
   d.ellipse((px-3,py-8,px+2,py-3),fill=r.choice([(255,229,228,190),(250,235,187,190),(224,220,239,170)]))
 # cherry petals beneath tree placement (same 3D ground -> 2D transform)
 for i in range(270):
  x=r.gauss(10.9,1.26);z=r.gauss(7.2,1.1)
  if not (.1<x<15.2 and .1<z<15.7) or x>bankLeft_at(z):continue
  px,py=flat(x,z)
  d.ellipse((px-2,py-1,px+3,py+2),fill=r.choice([(246,219,227,215),(237,197,210,230),(244,233,223,185)]))
 # cold light and water reflection streaks on shallow river
 for i in range(200):
  z=r.uniform(.1,15.77);x=13.57+math.sin(z*.58)*.36+r.uniform(-.74,.68)
  px,py=flat(x,z)
  wd=r.randint(3,18)
  d.arc((px-wd,py-4,px+wd,py+3),205,330,fill=r.choice([(212,233,219,150),(224,230,214,145),(165,213,210,138)]),width=r.choice([1,2]))
 return im

def bankLeft_at(z):return 12.52+math.sin(z*.58)*.40


from numba import njit
@njit(cache=True)
def _triangle_zbuffer(tris,cols,width,height):
 image=np.zeros((height,width,4),dtype=np.uint8)
 zbuffer=np.full((height,width),-1e14,dtype=np.float32)
 for i in range(len(tris)):
  ax,ay,az,bx,by,bz,cx,cy,cz=tris[i]
  den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
  if abs(den)<1e-7:continue
  invden=1.0/den
  left=max(0,int(math.floor(min(ax,bx,cx))))
  right=min(width-1,int(math.ceil(max(ax,bx,cx))))
  top=max(0,int(math.floor(min(ay,by,cy))))
  bottom=min(height-1,int(math.ceil(max(ay,by,cy))))
  for yy in range(top,bottom+1):
   py=yy+.5
   for xx in range(left,right+1):
    px=xx+.5
    w1=((by-cy)*(px-cx)+(cx-bx)*(py-cy))*invden
    if w1 < -1e-6 or w1 > 1.000001:continue
    w2=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))*invden
    if w2 < -1e-6 or w2>1.000001:continue
    w3=1-w1-w2
    if w3 < -1e-6 or w3>1.000001:continue
    zz=az*w1+bz*w2+cz*w3
    if zz>=zbuffer[yy,xx]:
     zbuffer[yy,xx]=zz
     image[yy,xx,0]=cols[i,0]
     image[yy,xx,1]=cols[i,1]
     image[yy,xx,2]=cols[i,2]
     image[yy,xx,3]=255
 return image

def _rasterize_z(self,scale=2,extra=10):
 coords=[project(p) for face,_,_ in self.faces for p in face]
 minx=min(x for x,y in coords)-extra;maxx=max(x for x,y in coords)+extra
 miny=min(y for x,y in coords)-extra;maxy=max(y for x,y in coords)+extra
 w=int(math.ceil(maxx-minx));h=int(math.ceil(maxy-miny))
 triangles=[];colors=[]
 for points,col,_ in self.faces:
  # preserve polygons as triangular fans; no flat-surface painter's errors
  a=points[0]
  for k in range(1,len(points)-1):
   tri=[]
   for v in [a,points[k],points[k+1]]:
    x,y=project(v);depth=(v[0]*SA+v[2]*CA)*C+v[1]*S
    tri += [(x-minx)*scale,(y-miny)*scale,depth]
   triangles.append(tri);colors.append(list(col))
 image=_triangle_zbuffer(np.asarray(triangles,dtype=np.float32),np.asarray(colors,dtype=np.uint8),w*scale,h*scale)
 im=Image.fromarray(image,'RGBA').resize((w,h),Image.Resampling.LANCZOS)
 return im,[OX-minx,OY-miny]
Model.rasterize=_rasterize_z



# --- v3: native 3D surface details and genuinely irregular foliage silhouettes ---
def leaf_burst(m, x, y, z, width, petals, palette, r):
    """A blossom or leaf star, authored on the 3D mesh instead of being painted on the PNG."""
    u=np.array([CA, 0, -SA],float)
    v=np.array([-SA*S,C,-CA*S],float)
    center=np.array([x,y,z],float)
    base=r.uniform(0,math.tau)
    for k in range(petals):
        a=base+math.tau*k/petals
        d=u*math.cos(a)+v*math.sin(a)
        perp=u*-math.sin(a)+v*math.cos(a)
        outer=center+d*width
        v1=tuple(center+d*width*.18+perp*width*.24)
        v2=tuple(outer+perp*width*.24)
        v3=tuple(outer-perp*width*.24)
        v4=tuple(center+d*width*.18-perp*width*.24)
        m.face([v1,v2,v3,v4],r.choice(palette),False)
    if petals==5:
        camera_leaf(m,x,y+.002,z,width*.30,width*.28,'#e2bb76',r.random()*math.tau)

def canopy_spray_v3(m,x,y,z,rx,ry,rz,colors,seed,flowers=False):
    """Lobed irregular clumps; detailed and broken silhouettes, no smooth balloon canopy."""
    r=random.Random(seed)
    nlat,nlon=11,23
    # Share vertex displacement between faces so shading doesn't create broken seams.
    verts=[]
    for j in range(nlat+1):
        lat=-math.pi/2+j*math.pi/nlat
        row=[]
        for i in range(nlon):
            lon=i*math.tau/nlon
            wav=(.91+.072*math.sin(5*lon+2*lat+seed*.02)
                    +.052*math.cos(9*lon-4*lat+seed*.11)
                    +.025*math.sin(17*lon+11*lat))
            row.append((x+rx*math.cos(lat)*math.cos(lon)*wav,
                        y+ry*math.sin(lat)*wav,
                        z+rz*math.cos(lat)*math.sin(lon)*wav))
        verts.append(row)
    dark=rgb(colors[0]);light=rgb(colors[-1])
    for j in range(nlat):
        for i in range(nlon):
            col=rgb(colors[(i*5+j*3+seed)%len(colors)])
            fac=(.78+.19*j/nlat + .08*math.cos(i*math.tau/nlon-1.0))
            shade=tint(col,fac)
            m.face([verts[j][i],verts[j][(i+1)%nlon],verts[j+1][(i+1)%nlon],verts[j+1][i]],shade,False)
    # Leaf clusters follow the actual 3D shell, using the same model coordinates.
    for i in range(440 if flowers else 475):
        lat=r.uniform(-1.20,1.34);lon=r.random()*math.tau
        nx=math.cos(lat)*math.cos(lon);ny=math.sin(lat);nz=math.cos(lat)*math.sin(lon)
        facing=nx*SA*C+ny*S+nz*CA*C
        if facing < -.22 and r.random()<.91:continue
        wave=(.94+.070*math.sin(5*lon+2*lat+seed*.02)
                +.050*math.cos(9*lon-4*lat+seed*.11)
                +.022*math.sin(17*lon+11*lat))
        dist=wave*r.uniform(1.015,1.110)
        px=x+rx*nx*dist;py=y+ry*ny*dist;pz=z+rz*nz*dist
        palette=colors
        if flowers:
            size=r.uniform(.038,.074)
            if r.random()<.45:
                leaf_burst(m,px,py,pz,size,5,palette,r)
            else:
                camera_leaf(m,px,py,pz,size*1.40,size*.70,r.choice(palette),r.uniform(-1.1,1.1))
        else:
            size=r.uniform(.055,.125)
            if r.random()<.16:leaf_burst(m,px,py,pz,size,3,palette,r)
            else:camera_leaf(m,px,py,pz,size*1.35,size*.78,r.choice(palette),r.uniform(-1.5,1.5))

def make_tree_v3(sakura=False):
    m=Model('sakura' if sakura else 'tree')
    r=random.Random(802 if sakura else 803)
    bark='#6e5550' if sakura else '#685744'
    m.beam((0,-.05,0),(.02,2.40,.02),.215,bark,segments=10)
    # Separate roots and a curved branch hierarchy are visible through foliage gaps.
    for k in range(7):
        a=math.tau*k/7
        m.beam((.03,.35,0),(.36*math.cos(a),.02,.35*math.sin(a)),.064,bark,6)
    majors=[((.02,1.55,.02),(-1.13,2.90,-.38)),((.04,1.90,.03),(1.02,3.03,.46)),
            ((.02,2.02,0),(-.44,3.49,-.65)),((.03,2.18,0),(.58,3.70,-.55)),
            ((.02,2.33,.03),(.08,4.04,.15)),((.02,1.93,.02),(-.53,3.39,.70))]
    for a,b in majors:
        m.beam(a,b,.087,'#745e4c' if sakura else '#62533f',8)
        for k in range(2):
            q=.63+.21*k
            at=tuple(a[j]*(1-q)+b[j]*q for j in range(3))
            tip=(at[0]+r.uniform(-.42,.42),at[1]+r.uniform(.36,.68),at[2]+r.uniform(-.38,.38))
            m.beam(at,tip,.029,bark,6)
    # Distinct airy branches instead of interpenetrating uniformly smooth spheres.
    clusters=[(-1.16,3.00,-.34,.71,.51,.59),(-.43,3.30,-.82,.66,.56,.57),
              (.97,3.19,.35,.72,.58,.63),(.42,3.77,-.43,.65,.56,.60),
              (-.79,3.68,.42,.68,.52,.67),(.46,3.75,.77,.72,.53,.66),
              (-.08,4.32,.07,.67,.55,.67),(-1.47,3.55,.22,.51,.45,.49),
              (1.36,3.49,-.13,.50,.43,.49)]
    colors=(['#b46d80','#d08a9d','#dba0af','#e8b7c2','#f3d3d6','#f8dedb'] if sakura else
            ['#476956','#5b7b5f','#698a69','#82a079','#9bb28a','#bdc49d'])
    for k,(x,y,z,rx,ry,rz) in enumerate(clusters):
        canopy_spray_v3(m,x,y,z,rx,ry,rz,colors,seed=851+k*97+(100 if sakura else 0),flowers=sakura)
    if sakura:
        for k in range(135):
            px=r.uniform(-2.15,2.06);pz=r.uniform(-1.65,1.52)
            py=r.uniform(.16,2.9)
            if r.random()<.2:py=r.uniform(.12,.50)
            leaf_burst(m,px,py,pz,r.uniform(.018,.034),5,colors[2:],r)
    return m

def embellish_house_v3(m,teahouse=False):
    """Small architectural features modelled in 3D without altering footprints."""
    if teahouse:
        # Small benches and wooden tea-tray under the awning.
        m.box(-1.46,.13,1.51,-.82,.20,1.89,'#77583d',top='#b39266')
        m.box(-1.38,.0,1.60,-1.29,.15,1.68,'#70513a')
        m.box(-.95,.0,1.60,-.86,.15,1.68,'#70513a')
    else:
        # Framed ornamental shutters and brickwork at the stair foot.
        for x in (-1.59,1.30):
            m.box(x,.16,1.70,x+.20,.34,1.91,'#9b8a71',top='#c9b79a')
    # Thin fascia and weathered gable detail, same world coordinates as original.
    for x in (-1.98,1.93):
        for y,z in [(2.02,1.42),(2.25,.96),(2.48,.49)]:
            m.beam((x,y,z),(x,y+.10,z-.27),.014,'#6d5647',5)
    return m


# Last art pass: all marks are UV-space ground texture on the real 3D ground plane.
_v2_ground_image=make_ground
def make_ground():
    base=_v2_ground_image()
    r=random.Random(542119)
    shade=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(shade,'RGBA')
    mark=Image.new('RGBA',(W,H),(0,0,0,0)); dr=ImageDraw.Draw(mark,'RGBA')
    def f(x,z):return (int(PPM*x),int(PPM*z*S))
    # Irregular islands of meadow growth, not an opaque synthetic camouflage grid.
    sites=[(1.75,4.0,1.5,.85),(1.2,11.8,1.3,1.15),
           (4.55,3.45,1.4,.9),(5.1,13.9,1.05,.92),
           (10.0,2.2,1.5,.90),(10.6,13.7,1.38,.70),
           (11.4,5.1,.56,.7)]
    for sx,sz,rx,rz in sites:
        for j in range(76):
            x=sx+r.gauss(0,rx*.53);z=sz+r.gauss(0,rz*.48)
            if not(.22<x<12.14 and .22<z<15.62):continue
            cx,cy=f(x,z)
            radius=r.uniform(4,28)
            c=r.choice([(78,111,74,19),(104,143,91,23),(137,154,98,17),(67,108,81,15)])
            d.ellipse((cx-radius,cy-radius*.58,cx+radius,cy+radius*.58),fill=c)
        for j in range(140):
            x=sx+r.gauss(0,rx*.52);z=sz+r.gauss(0,rz*.46)
            if not (.22<x<12.14 and .22<z<15.62):continue
            cx,cy=f(x,z)
            # Every grass blade stays rooted to 3D ground world coordinates.
            len_=r.uniform(3,11);width=r.choice([1,1,1,2]);ang=r.uniform(-.85,.85)
            dr.line((cx,cy,cx+math.sin(ang)*len_,cy-math.cos(ang)*len_),fill=r.choice([
                (67,112,68,175),(109,143,85,160),(151,164,95,155),(184,180,113,100)]),width=width)
            if r.random()<.12:
                dr.ellipse((cx-2,cy-len_-2,cx+3,cy-len_+2),fill=r.choice([
                    (231,224,196,195),(239,210,218,190),(230,197,188,170)]))
    # Near-water stones and tiny foam broken into larger natural forms.
    for side in [0,1]:
        for k in range(220):
            z=r.uniform(.15,15.72)
            left=12.52+math.sin(z*.58)*.40;right=14.72+math.sin(z*.58+.2)*.35
            x=(left-r.uniform(.06,.35)) if side==0 else (right+r.uniform(.06,.3))
            cx,cy=f(x,z)
            radius=r.uniform(4,13)
            col=r.choice([(112,132,108,126),(141,153,126,135),(164,166,134,120),
                          (89,118,107,100),(198,190,151,125)])
            dr.ellipse((cx-radius,cy-radius*.34,cx+radius,cy+radius*.36),fill=col)
            dr.arc((cx-radius,cy-radius*.36,cx+radius,cy+radius*.36),210,330,fill=(231,221,182,95),width=1)
    # Small reflected watercolor marks on top of the river; shore coordinates remain fixed.
    for k in range(800):
        z=r.uniform(.16,15.76)
        left=12.52+math.sin(z*.58)*.40;right=14.72+math.sin(z*.58+.2)*.35
        x=r.uniform(left+.18,right-.18)
        cx,cy=f(x,z);ww=r.uniform(2,17)
        if r.random()<.7:
            dr.arc((cx-ww,cy-2,cx+ww,cy+3),192,346,fill=r.choice([
                (213,233,215,113),(189,224,221,147),(250,242,210,90)]),width=1)
    shade=shade.filter(ImageFilter.GaussianBlur(19))
    base=Image.alpha_composite(base,shade)
    return Image.alpha_composite(base,mark)

# A reusable 3D source determines every exported object PNG and footprint.

def run():
 specs={'house':embellish_house_v3(make_house_v2()),'teahouse':embellish_house_v3(make_teahouse_v2(),True),'tree':make_tree_v3(),'sakura':make_tree_v3(sakura=True),'bridge':make_bridge_v2(),'lantern':make_lantern_v2(),'rock':make_rock(),'shrub':make_shrub(),'fence':make_fence(),'flowerpatch':make_flowerpatch()}
 # Set the world-scale of architecture relative to the adopted V35 sprite.
 # All source geometry, GLB, anchors and PNGs are scaled *together* before export.
 for name,model in specs.items():
  scale={'house':.80,'teahouse':.82,'tree':.91,'sakura':.89,'shrub':.85,'fence':.90,'lantern':.88,'rock':.92,'flowerpatch':.95}.get(name,1)
  if scale!=1:
   model.faces=[([tuple(float(v)*scale for v in pt) for pt in face],col,outline) for face,col,outline in model.faces]
 meta={}
 for name,model in specs.items():
  model.export_glb(ASSETS/f'{name}.glb')
  image,anchor=model.rasterize()
  image.save(ASSETS/f'{name}.png',optimize=True)
  meta[name]={'image':f'assets/{name}.png','size':[image.width,image.height],'anchor':[round(x,3) for x in anchor],'scale':1,'source3d':f'assets/{name}.glb','faces':len(model.faces)}
  print(name,image.size,anchor,len(model.faces))
 oblique_ground().save(ASSETS/'ground.png',optimize=True)
 print('ground',Image.open(ASSETS/'ground.png').size)
 (ASSETS/'render-metadata.json').write_text(json.dumps({'camera':{'ortho':True,'elevation':40,'azimuth':35,'pixelsPerMetre':100,'offset':[OX,OY], 'imageSize':[OW,OH]},'assets':meta},ensure_ascii=False,indent=2),encoding='utf-8')
 return meta
if __name__=='__main__':run()
