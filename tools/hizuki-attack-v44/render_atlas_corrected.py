#!/usr/bin/env python3
"""Render V44 into fixed-origin RGBA sprite atlas, using unchanged GLB texture, camera-relative 40 deg lighting.

Rows are front,front_right,right,back_right,back,back_left,left,front_left; columns are 8 phase samples.
This is 3D rasterization (not pixel-art conversion). Anchors derive from common 3D origin, never per-frame crops.
"""
from pathlib import Path
import sys,math,json,hashlib,os,gc
import numpy as np
from PIL import Image,ImageDraw
from vtkmodules.vtkRenderingCore import vtkWindowToImageFilter
from vtkmodules.util.numpy_support import vtk_to_numpy
from model import Model
from render_vtk import Renderer
ROOT=Path(__file__).resolve().parent
SRC=Path(os.environ.get('HIZUKI_V44_GLB',str(ROOT/'Hizuki_V44_ThighShinRollBalanced_v43c_Footplanted_Trial.glb')))
OUT=Path(os.environ.get('HIZUKI_V44_OUTPUT',str(ROOT/'attack_katana_v44_corrected_8dir.png')));QA=ROOT/'atlas_qa_corrected.json'
NAME='V35_Attack_Katana';R=768; WORLD_PPM=60; CAM_SCALE=2.1
CELL=(224,256); ANCHOR=(110,206) # constant 2px x / 4px y registration correction relative to floor projection; runtime anchor stays unchanged
YAW_LIST=[0,-45,-90,-135,180,135,90,45]
DIRECTIONS=['front','front_right','right','back_right','back','back_left','left','front_left']
ELEV=40; MODEL_GROUND=-.965
# GLB front is +Z; right-facing on screen needs camera from -X. Camera at +X produces LEFT-facing sprite.
# Vector camera from target points from model outward to viewer.
model=Model(SRC); duration=float(model.durations[NAME]);frames=[];bboxes=[];cm=math.cos(math.radians(ELEV));sm=math.sin(math.radians(ELEV));
assert 0.9<duration<1.3
atlas=Image.new('RGBA',(CELL[0]*8,CELL[1]*8),(0,0,0,0))
for ridx,(dirn,yaw) in enumerate(zip(DIRECTIONS,YAW_LIST)):
  a=math.radians(yaw);cam=(5*math.sin(a)*cm,5*sm,5*math.cos(a)*cm)
  r=Renderer(model,width=R,height=R,camera=cam,ortho=True)
  r.win.SetAlphaBitPlanes(1);r.win.SetMultiSamples(0);r.renderer.SetBackground(0,0,0);r.renderer.SetBackgroundAlpha(0.0)
  r.setCamera(cam,(0,0,0),ortho=True,scale=CAM_SCALE)
  for light in r.renderer.GetLights():
    pass
  lights=r.renderer.GetLights();lights.InitTraversal();key=lights.GetNextItem();fill=lights.GetNextItem()
  def rotate(p):x,y,z=p;return (math.cos(a)*x+math.sin(a)*z,y,-math.sin(a)*x+math.cos(a)*z)
  for light,pos,inten in [(key,(-3,4,5),.8),(fill,(3,1,-2),.42)]:
    if light is not None:light.SetPosition(*rotate(pos));light.SetFocalPoint(0,0,0);light.SetIntensity(inten)
  for actor,poly in r.bodyActors:
    actor.GetProperty().SetAmbient(.52);actor.GetProperty().SetDiffuse(.48);actor.GetProperty().SetSpecular(.05)
  for actor,poly,node in r.swordActors:
    actor.GetProperty().SetAmbient(.52);actor.GetProperty().SetDiffuse(.48)
  capture=vtkWindowToImageFilter();capture.SetInput(r.win);capture.SetInputBufferTypeToRGBA();capture.ReadFrontBufferOff()
  for f in range(8):
    t=duration*f/8
    r.update(NAME,t);r.win.Render();capture.Modified();capture.Update()
    img=vtk_to_numpy(capture.GetOutput().GetPointData().GetScalars()).reshape(R,R,4)[::-1].copy()
    im=Image.fromarray(img,'RGBA')
    orig=im.getchannel('A').getbbox()
    if orig is None or orig[0]<=1 or orig[1]<=1 or orig[2]>=R-1 or orig[3]>=R-1:raise RuntimeError(f'Source render clip {dirn}/{f} {orig}')
    # anchor world point is always model root projected to the common floor, not moving feet.
    r.renderer.SetWorldPoint(0,MODEL_GROUND,0,1);r.renderer.WorldToDisplay();ox,oy,_=r.renderer.GetDisplayPoint();oy=R-1-oy
    # High-res crop centered on root anchor; calibrate 60 px/m against approved normal front_right visible height 108 px
    down_factor=WORLD_PPM/(R/(2*CAM_SCALE)); srcW=CELL[0]/down_factor; srcH=CELL[1]/down_factor
    left=ox-ANCHOR[0]/down_factor;top=oy-ANCHOR[1]/down_factor
    # PIL transform with fractional offsets: bilinear at source + Lanczos downsample
    # keep padding transparent outside source bounds
    box=(int(round(left)),int(round(top)),int(round(left+srcW)),int(round(top+srcH)))
    crop=im.crop(box).resize(CELL,Image.Resampling.LANCZOS)
    bbox=crop.getchannel('A').getbbox()
    if bbox is None:raise RuntimeError(f'Blank {dirn}/{f}')
    if bbox[0]<=2 or bbox[1]<=2 or bbox[2]>=CELL[0]-2 or bbox[3]>=CELL[1]-2:
      raise RuntimeError(f'Clipped {dirn}/{f} {bbox}, camera={cam} samplebox={box}')
    x=f*CELL[0];y=ridx*CELL[1];atlas.alpha_composite(crop,(x,y))
    bboxes.append({'dir':dirn,'frame':f,'t':round(t,3),'bbox':list(bbox),'alpha':int(np.count_nonzero(np.asarray(crop.getchannel('A'))))})
  print('completed',dirn,flush=True)
  del capture,r;gc.collect()
atlas.save(OUT,optimize=True,compress_level=9)
qa={'sourceFile':SRC.name,'sourceSHA256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'sheetFile':OUT.name,'sheetSHA256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'cell':CELL,'rasterPlacement':ANCHOR,'runtimeAnchor':[111.6993006993007,209.5212972972973], 'registrationCorrectionPx':[-2,-4],'sheetDimensions':atlas.size,'camera':{'projection':'parallel','elevationDeg':ELEV,'sourceModelHeightToPixels':WORLD_PPM,'originalFrontKeyFillCameraRelative':True,'scaleFactorComparedWithModel':WORLD_PPM},'format':'Full-color GLB textured RGBA, no palette reduction, no per-frame crop','directions':DIRECTIONS,'cameraYawDeg':YAW_LIST,'baseline':'Approved normal front_right silhouette 46x108 px; model V35_Idle at 60px/m is 49x108px. Shared per-atlas registration (-2,-4) aligns original ground anchor. No per-frame trimming.','frameCount':8,'durationMs':round(duration*1000),'nonempty':len(bboxes),'clipped':0,'bboxes':bboxes}
QA.write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
# QA contact first-frame all directions in top row, two additional key moments below.
ct=Image.new('RGBA',(CELL[0]*8,CELL[1]*3),(235,240,237,255))
for ri,frame in enumerate((0,3,5)):
 for d in range(8):
  ct.alpha_composite(atlas.crop((frame*CELL[0],d*CELL[1],(frame+1)*CELL[0],(d+1)*CELL[1])),(d*CELL[0],ri*CELL[1]))
ct.convert('RGB').save(ROOT/'atlas_preview_three_phases_corrected.jpg',quality=90)
print('RESULT',OUT,OUT.stat().st_size,'dimensions',atlas.size,flush=True)