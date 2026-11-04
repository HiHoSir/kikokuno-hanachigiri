from pathlib import Path
import struct,json
import numpy as np
from scipy.spatial.transform import Rotation as Rot,Slerp

DT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
SHAPES={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
class Model:
 def __init__(self,filename):
  self.path=Path(filename);buf=self.path.read_bytes();self.glbhead=buf[:12]
  p=12;self.jraw=None;self.blob=None
  while p<len(buf):
   n,t=struct.unpack_from('<II',buf,p);p+=8
   if t==0x4e4f534a:self.jraw=buf[p:p+n];self.j=json.loads(self.jraw)
   if t==0x004e4942:self.blob=buf[p:p+n]
   p+=n
  self.nodes=self.j['nodes'];self.parents={}
  for i,n in enumerate(self.nodes):
   for ch in n.get('children',[]):self.parents[ch]=i
  self.local=[]
  for n in self.nodes:
   self.local.append([np.asarray(n.get('translation',[0,0,0]),dtype=float),np.asarray(n.get('rotation',[0,0,0,1]),dtype=float),np.asarray(n.get('scale',[1,1,1]),dtype=float)])
  self.joints=self.j['skins'][0]['joints'];self.bbind=self.array(self.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
  self.channels={}
  self.samplers={}
  self.durations={}
  for ani in self.j['animations']:
   name=ani['name'];self.samplers[name]=ani
   chmap={};du=0
   for ch in ani['channels']:
    sam=ani['samplers'][ch['sampler']];t=self.array(sam['input']).astype(float).reshape(-1);v=self.array(sam['output']).astype(float).reshape(len(t),-1)
    key=(ch['target']['node'],ch['target']['path']);chmap[key]=(t,v,sam['interpolation'])
    du=max(du,t.max())
   self.channels[name]=chmap;self.durations[name]=du
  # Distinct array bindings; all 5 body primitives share vertex data
  p=self.j['meshes'][0]['primitives'][0];attr=p['attributes'];self.pos=self.array(attr['POSITION']);self.nrm=self.array(attr['NORMAL']);self.uv=self.array(attr['TEXCOORD_0']);self.j0=self.array(attr['JOINTS_0']).astype(int);self.w0=self.array(attr['WEIGHTS_0']);
  if self.w0.max()>1:self.w0=self.w0/65535.
  self.body_prims=[(self.array(p['indices']).astype(np.int32).reshape(-1,3),p.get('material',0)) for p in self.j['meshes'][0]['primitives']]
 def array(self,idx):
  a=self.j['accessors'][idx];b=self.j['bufferViews'][a['bufferView']];dtype=np.dtype(DT[a['componentType']]).newbyteorder('<');n=SHAPES[a['type']];base=b.get('byteOffset',0)+a.get('byteOffset',0);count=a['count']; stride=b.get('byteStride',dtype.itemsize*n)
  if stride==dtype.itemsize*n:res=np.frombuffer(self.blob,dtype=dtype,count=count*n,offset=base).reshape(count,n)
  else:res=np.ndarray((count,n),dtype=dtype,buffer=self.blob,offset=base,strides=(stride,dtype.itemsize))
  res=np.array(res)
  if a.get('normalized'):
   if dtype.kind=='u':res=res.astype(float)/np.iinfo(dtype).max
   elif dtype.kind=='i':res=np.maximum(res.astype(float)/np.iinfo(dtype).max,-1)
  return res
 def img(self,idx):
  from PIL import Image
  import io
  rec=self.j['images'][idx];v=self.j['bufferViews'][rec['bufferView']];base=v.get('byteOffset',0);return Image.open(io.BytesIO(self.blob[base:base+v['byteLength']])).convert('RGB')
 def locs(self,name,t):
  locals_=[[v.copy() for v in node] for node in self.local]
  if name:
   for (node,path),(times,vals,mode) in self.channels[name].items():
    if path not in ('translation','rotation','scale'):continue
    t0=np.clip(t,times[0],times[-1]);
    if mode=='STEP':q=vals[max(0,np.searchsorted(times,t0,side='right')-1)]
    elif path=='rotation':
     if t0==times[0]:q=vals[0]
     elif t0==times[-1]:q=vals[-1]
     else:
      i=max(0,min(len(times)-2,np.searchsorted(times,t0,side='right')-1));q=Slerp(times[i:i+2],Rot.from_quat(vals[i:i+2]))([t0]).as_quat()[0]
    else:q=np.array([np.interp(t0,times,vals[:,i]) for i in range(vals.shape[1])])
    locals_[node][{'translation':0,'rotation':1,'scale':2}[path]]=q
  return locals_
 def transforms(self,name,t):
  locals_=self.locs(name,t);transforms={}
  def cal(i):
   if i in transforms:return transforms[i]
   tr,q,sc=locals_[i];M=np.eye(4);M[:3,:3]=Rot.from_quat(q).as_matrix()@np.diag(sc);M[:3,3]=tr
   if i in self.parents:M=cal(self.parents[i])@M
   transforms[i]=M;return M
  for i in range(len(self.nodes)):cal(i)
  return transforms
 def skin(self,transforms):
  mats=np.array([transforms[i]@self.bbind[k] for k,i in enumerate(self.joints)])
  v=np.column_stack([self.pos,np.ones(len(self.pos))])
  # count x 4 joints, 3-dimensional output
  out=np.zeros_like(self.pos)
  for k in range(4):out+=self.w0[:,k,None]*np.einsum('nij,nj->ni',mats[self.j0[:,k],:3,:],v)
  return out
 def body(self,name,t):
  trans=self.transforms(name,t);return self.skin(trans),trans
 def meshverts(self,meshidx):
  pp=[]
  for prim in self.j['meshes'][meshidx]['primitives']:
   points=self.array(prim['attributes']['POSITION']);inds=self.array(prim['indices']).reshape(-1,3).astype(np.int32)
   pp.append((points,inds,prim.get('material',0)))
  return pp
 def persist_bin(self,blob,out):
  data=struct.pack('<III',0x46546c67,2,12+8+len(self.jraw)+8+len(blob))+struct.pack('<II',len(self.jraw),0x4e4f534a)+self.jraw+struct.pack('<II',len(blob),0x004e4942)+bytes(blob)
  Path(out).write_bytes(data)
 def overwrite_channels(self,updates,filename):
  # {(ani,node,path): (timelike, samples)}
  blob=bytearray(self.blob)
  for (ani,node,path),vals in updates.items():
   a=self.samplers[ani]
   ch=next(ch for ch in a['channels'] if ch['target']['node']==node and ch['target']['path']==path)
   samp=a['samplers'][ch['sampler']];ac=self.j['accessors'][samp['output']];view=self.j['bufferViews'][ac['bufferView']]
   assert ac['componentType']==5126
   arr=np.asarray(vals,dtype='<f4');raw=arr.tobytes()
   assert len(raw)==ac['count']*SHAPES[ac['type']]*4
   off=view.get('byteOffset',0)+ac.get('byteOffset',0);blob[off:off+len(raw)]=raw
  self.persist_bin(blob,filename)