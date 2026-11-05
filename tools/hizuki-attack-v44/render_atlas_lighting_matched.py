#!/usr/bin/env python3
"""Re-render approved v44 motion unchanged with calibrated camera-relative lighting.

Calibration targets: hair and red costume luminance from the approved idle/walk/run
front/front-right/right/back atlases, not hand-drawn colourization or alpha edits.
Camera direction mapping, 60 px/m, 224x256 cell, floor origin and 1.10s timing stay
identical to the previously corrected v44 sprite. Note this is *a lighting-match
trial*, not a guarantee of identical per-pixel material/shading.
"""
from pathlib import Path
import os, sys, math, json, hashlib, gc
import numpy as np
from PIL import Image
from vtkmodules.vtkRenderingCore import vtkWindowToImageFilter
from vtkmodules.util.numpy_support import vtk_to_numpy
from model import Model
from render_vtk import Renderer

ROOT=Path(__file__).resolve().parent
SRC=Path(os.environ.get('HIZUKI_V44_GLB',str(ROOT/'Hizuki_V44_Review/Hizuki_V44_ThighShinRollBalanced_v43c_Footplanted_Trial.glb')))
OUT=Path(os.environ.get('HIZUKI_V44_OUTPUT',str(ROOT/'attack_katana_v44_lightmatched_8dir.png')))
QA=OUT.with_suffix('.json')
R=768;CAM_SCALE=2.1;WORLD_PPM=60;CELL=(224,256);ANCHOR=(110,206);MODEL_GROUND=-.965;ELEV=40
DIRECTIONS=['front','front_right','right','back_right','back','back_left','left','front_left']
YAW_LIST=[0,-45,-90,-135,180,135,90,45]
# calibrated using 4 views × 2 colour regions of v35 Idle (same rig), against
# approved idle/walk/run atlases. No post-processing, no gamma/palette edits.
LIGHT={'ambient':.65,'diffuse':.42,'specular':.05,'key':.97,'fill':.50}
NAME='V35_Attack_Katana'; model=Model(SRC);duration=float(model.durations[NAME]);assert 0.9<duration<1.3
atlas=Image.new('RGBA',(CELL[0]*8,CELL[1]*8),(0,0,0,0)); bboxes=[]
cm=math.cos(math.radians(ELEV));sm=math.sin(math.radians(ELEV))
for ri,(direction,yaw) in enumerate(zip(DIRECTIONS,YAW_LIST)):
 a=math.radians(yaw);cs=math.cos(a);sn=math.sin(a);cam=(5*sn*cm,5*sm,5*cs*cm)
 renderer=Renderer(model,width=R,height=R,camera=cam,ortho=True)
 renderer.win.SetAlphaBitPlanes(1);renderer.win.SetMultiSamples(0)
 renderer.renderer.SetBackground(0,0,0);renderer.renderer.SetBackgroundAlpha(0.0)
 renderer.setCamera(cam,(0,0,0),ortho=True,scale=CAM_SCALE)
 lights=renderer.renderer.GetLights();lights.InitTraversal();key=lights.GetNextItem();fill=lights.GetNextItem()
 def rot(p):x,y,z=p;return (cs*x+sn*z,y,-sn*x+cs*z)
 for light,pos,intens in [(key,(-3,4,5),LIGHT['key']),(fill,(3,1,-2),LIGHT['fill'])]:
  if light is not None:
   light.SetPosition(*rot(pos));light.SetFocalPoint(0,0,0);light.SetIntensity(intens)
 for actor,poly in renderer.bodyActors:
  actor.GetProperty().SetAmbient(LIGHT['ambient']);actor.GetProperty().SetDiffuse(LIGHT['diffuse']);actor.GetProperty().SetSpecular(LIGHT['specular'])
 for actor,poly,node in renderer.swordActors:
  actor.GetProperty().SetAmbient(LIGHT['ambient']);actor.GetProperty().SetDiffuse(LIGHT['diffuse'])
 c=vtkWindowToImageFilter();c.SetInput(renderer.win);c.SetInputBufferTypeToRGBA();c.ReadFrontBufferOff()
 for fi in range(8):
  t=duration*fi/8
  renderer.update(NAME,t);renderer.win.Render();c.Modified();c.Update()
  rgba=vtk_to_numpy(c.GetOutput().GetPointData().GetScalars()).reshape(R,R,4)[::-1].copy()
  im=Image.fromarray(rgba,'RGBA')
  orig=im.getchannel('A').getbbox()
  if orig is None or orig[0]<=1 or orig[1]<=1 or orig[2]>=R-1 or orig[3]>=R-1:raise RuntimeError(f'Source view clipping {direction}/{fi}: {orig}')
  renderer.renderer.SetWorldPoint(0,MODEL_GROUND,0,1);renderer.renderer.WorldToDisplay();ox,oy,_=renderer.renderer.GetDisplayPoint();oy=R-1-oy
  down_factor=WORLD_PPM/(R/(2*CAM_SCALE));w=CELL[0]/down_factor;h=CELL[1]/down_factor
  left=ox-ANCHOR[0]/down_factor;top=oy-ANCHOR[1]/down_factor
  rect=(round(left),round(top),round(left+w),round(top+h))
  cropped=im.crop(rect).resize(CELL,Image.Resampling.LANCZOS)
  bbox=cropped.getchannel('A').getbbox()
  if bbox is None or bbox[0]<=2 or bbox[1]<=2 or bbox[2]>=CELL[0]-2 or bbox[3]>=CELL[1]-2:raise RuntimeError(f'Cell clipped: {direction}/{fi}: {bbox}')
  atlas.alpha_composite(cropped,(fi*CELL[0],ri*CELL[1]));bboxes.append({'dir':direction,'frame':fi,'bbox':list(bbox),'t':round(t,4)})
 print('completed',direction,flush=True)
 del c,renderer;gc.collect()
OUT.parent.mkdir(parents=True,exist_ok=True);atlas.save(OUT,optimize=True,compress_level=9)
qa={'status':'lighting_match_candidate','source':SRC.name,'sourceSHA256':hashlib.sha256(SRC.read_bytes()).hexdigest(),
 'file':OUT.name,'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'cell':CELL,'dimensions':list(atlas.size),
 'cameraYawDeg':YAW_LIST,'elevationDeg':ELEV,'orthographic':True,'sourcePxPerMetre':WORLD_PPM,'originRaster':ANCHOR,
 'runtimeAnchor':[111.6993006993007,209.5212972972973],'lighting':LIGHT,'sourceDuration':duration,'framesPerDirection':8,
 'clipped':0,'nonempty':len(bboxes),'bboxes':bboxes,'originalPoseAndTexturePreserved':True,
 'reference':'Approved v35 idle/walking/running atlas (hair/red mean Y in front/front_right/right/back); source 2026-11-05 CI lighting audit',
 'limitations':['Camera-relative lighting can approximate colour and shadow but pose-dependent pixels cannot match exactly','iPhone Safari real-device screenshot still required','Pixel masks should be inspected for anti-aliasing differences']}
QA.write_text(json.dumps(qa,indent=2,ensure_ascii=False)+'\n')
print('RESULT',OUT,OUT.stat().st_size,qa['sha256'],flush=True)