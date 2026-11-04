from pathlib import Path
import numpy as np
from PIL import Image
from vtkmodules.vtkCommonCore import vtkUnsignedCharArray
from vtkmodules.vtkCommonDataModel import vtkPolyData,vtkCellArray,vtkImageData
from vtkmodules.vtkRenderingCore import vtkActor,vtkPolyDataMapper,vtkRenderer,vtkRenderWindow,vtkWindowToImageFilter,vtkTexture,vtkLight
from vtkmodules.vtkFiltersSources import vtkSphereSource,vtkArrowSource
from vtkmodules.vtkCommonTransforms import vtkTransform
from vtkmodules.vtkRenderingOpenGL2 import vtkOpenGLRenderer,vtkOpenGLRenderWindow,vtkOpenGLPolyDataMapper
from vtkmodules.util.numpy_support import numpy_to_vtk,vtk_to_numpy,numpy_to_vtkIdTypeArray
import vtkmodules.vtkInteractionStyle
from scipy.spatial.transform import Rotation as Rot

class Renderer:
 def __init__(self,model,width=700,height=740,camera=(1.8,1.6,3.7),target=(0,0,0),ortho=True,lighting='front'):
  self.m=model;self.w=width;self.h=height;self.renderer=vtkRenderer();self.renderer.SetBackground(.92,.94,.92)
  self.win=vtkRenderWindow();self.win.SetOffScreenRendering(True);self.win.SetSize(width,height);self.win.AddRenderer(self.renderer)
  self.props=[];self.bodyActors=[];self.swordActors=[];self.actors=[]
  self._images={}
  self._drawMesh()
  self.setCamera(camera,target,ortho=ortho)
  light=vtkLight();light.SetLightTypeToSceneLight();light.SetPosition(2,3,7);light.SetFocalPoint(0,0,0);light.SetIntensity(1.2);self.renderer.AddLight(light)
  light2=vtkLight();light2.SetLightTypeToSceneLight();light2.SetPosition(-3,4,-3);light2.SetFocalPoint(0,0,0);light2.SetIntensity(.7);self.renderer.AddLight(light2)
 def setCamera(self,pos,target=(0,0,0),ortho=True,scale=1.36):
  cam=self.renderer.GetActiveCamera();cam.SetPosition(*pos);cam.SetFocalPoint(*target);cam.SetViewUp(0,1,0);cam.SetParallelProjection(ortho);cam.SetParallelScale(scale)
 def _poly(self,points,inds,uv=None):
  pol=vtkPolyData();pol.SetPoints(__import__('vtkmodules.vtkCommonCore',fromlist=['vtkPoints']).vtkPoints());pol.GetPoints().SetData(numpy_to_vtk(np.asarray(points,dtype=np.float32),deep=True))
  cell=vtkCellArray(); cell.SetCells(len(inds),numpy_to_vtkIdTypeArray(np.column_stack((np.full(len(inds),3),inds)).astype(np.int64).ravel(),deep=True));pol.SetPolys(cell)
  if uv is not None:pol.GetPointData().SetTCoords(numpy_to_vtk(np.array(uv,dtype=np.float32),deep=True))
  return pol
 def texture(self,imgid):
  if imgid in self._images:return self._images[imgid]
  img=np.asarray(self.m.img(imgid));h,w,c=img.shape
  d=vtkImageData();d.SetDimensions(w,h,1);d.AllocateScalars(3,3)
  vtk_to_numpy(d.GetPointData().GetScalars())[:]=(img.reshape(-1,3))
  text=vtkTexture();text.SetInputData(d);text.InterpolateOn();text.RepeatOff();self._images[imgid]=text;return text
 def _matColor(self,mid):
  mat=self.m.j['materials'][mid];color=mat.get('pbrMetallicRoughness',{}).get('baseColorFactor',[.75,.78,.8,1]);return color[:3]
 def _matTexId(self,mid):
  mat=self.m.j['materials'][mid];pr=mat.get('pbrMetallicRoughness',{})
  tex=pr.get('baseColorTexture');return self.m.j['textures'][tex['index']]['source'] if tex else None
 def _drawMesh(self):
  for pidx,(inds,matid) in enumerate(self.m.body_prims):
   poly=self._poly(self.m.pos,inds,self.m.uv);mapper=vtkPolyDataMapper();mapper.SetInputData(poly)
   act=vtkActor();act.SetMapper(mapper);act.GetProperty().SetColor(*self._matColor(matid));act.GetProperty().SetAmbient(.30);act.GetProperty().SetDiffuse(.70);act.GetProperty().SetSpecular(.08)
   tex=self._matTexId(matid)
   if tex is not None:act.SetTexture(self.texture(tex))
   self.renderer.AddActor(act);self.bodyActors.append((act,poly));self.props.append(act)
  for mesh,node in ((1,19),):
   for xyz,inds,matid in self.m.meshverts(mesh):
    poly=self._poly(xyz,inds);mapper=vtkPolyDataMapper();mapper.SetInputData(poly);actor=vtkActor();actor.SetMapper(mapper);actor.GetProperty().SetColor(*self._matColor(matid));actor.GetProperty().SetAmbient(.32);actor.GetProperty().SetSpecular(.2)
    self.renderer.AddActor(actor);self.swordActors.append((actor,poly,node));self.props.append(actor)
 def update(self,name,t):
  pos,world=self.m.body(name,t)
  for actor,poly in self.bodyActors:
   poly.GetPoints().SetData(numpy_to_vtk(np.asarray(pos,dtype=np.float32),deep=True));poly.GetPoints().Modified();poly.Modified()
  for actor,poly,node in self.swordActors:
   M=world[node];mat=np.eye(4);mat[:3,:3]=M[:3,:3];mat[:3,3]=M[:3,3]
   from vtkmodules.vtkCommonMath import vtkMatrix4x4
   mm=vtkMatrix4x4()
   for i in range(4):
    for j in range(4):mm.SetElement(i,j,float(mat[i,j]))
   actor.SetUserMatrix(mm)
  return pos,world
 def render(self):
  self.win.Render()
  filt=vtkWindowToImageFilter();filt.SetInput(self.win);filt.SetInputBufferTypeToRGB();filt.ReadFrontBufferOff();filt.Update()
  arr=vtk_to_numpy(filt.GetOutput().GetPointData().GetScalars());h,w=self.h,self.w
  return Image.fromarray(np.flipud(arr.reshape(h,w,3)),'RGB')
 def arrow(self,origin,vec,color=(1,0,0),scale=.1):
  src=vtkArrowSource();src.SetTipLength(.24);src.SetTipRadius(.14);src.SetShaftRadius(.045);src.Update()
  actor=vtkActor();mapper=vtkPolyDataMapper();mapper.SetInputConnection(src.GetOutputPort());actor.SetMapper(mapper);actor.GetProperty().SetColor(*color);actor.GetProperty().LightingOff()
  origin=np.asarray(origin);v=np.asarray(vec);v=v/np.linalg.norm(v);u=np.array([1.,0,0]);rot=Rot.align_vectors([v],[u])[0].as_matrix()
  from vtkmodules.vtkCommonMath import vtkMatrix4x4
  mm=vtkMatrix4x4()
  for i in range(3):
   for j in range(3):mm.SetElement(i,j,float(scale*rot[i,j]))
   mm.SetElement(i,3,float(origin[i]))
  actor.SetUserMatrix(mm);self.renderer.AddActor(actor);return actor