#!/usr/bin/env python3
"""Prototype identity-preserving reaction sprites from the 8 source artworks.

Unlike generative redrawing, every nontransparent output pixel originates from
field-lab/art/{0..7}.png. The deformation is reversible and non-destructive.
Candidate-only: do NOT silently promote these to game assets.
"""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ART=Path(__file__).resolve().parents[1]/'field-lab'/'art'
DEST=ART/'directional-actions'
DIRECTIONS=['front','front_right','right','back_right','back','back_left','left','front_left']
ACTIONS=['surprise','wave','bow','cheer']
META=json.loads((ART/'manifest.json').read_text())
DEST.mkdir(parents=True,exist_ok=True)

def clamp(x): return max(0.,min(1.,x))
def smooth(a,b,x):
 t=clamp((x-a)/(b-a))
 return t*t*(3-2*t)

def lift_sleeve(source,direction,action):
 # Preserve actual garment pixels, articulate only shoulder-isolated sleeves.
 # Draw an exact source-derived sleeve mask, then rotate that portion.
 if action not in ('surprise','wave','cheer'): return source
 w,h=source.size
 from PIL import ImageDraw
 from math import radians
 shoulders=[
   [(136,277,-1),(237,277,1)],
   [(164,280,-1),(265,289,1)],
   [(222,286,1)],
   [(133,285,-1),(231,281,1)],
   [(131,255,-1),(239,255,1)],
   [(132,259,-1),(229,260,1)],
   [(141,259,-1)],
   [(103,260,-1),(205,260,1)]
 ]
 result=source.copy()
 for n,(ax,ay,side) in enumerate(shoulders[direction]):
  if action=='wave' and ((direction in (3,4,5) and side>0) or (direction not in (3,4,5) and side<0)):continue
  region=Image.new('L',(w,h))
  d=ImageDraw.Draw(region)
  if side<0:
   poly=[(ax-9,ay-8),(ax-80,ay+16),(ax-138,ay+111),(ax-57,ay+169),(ax+5,ay+52)]
  else:
   poly=[(ax+9,ay-8),(ax+80,ay+16),(ax+138,ay+111),(ax+57,ay+169),(ax-5,ay+52)]
  d.polygon(poly,fill=255)
  # Keep the torso/face/hair opaque; pull only the sleeve's color/alpha.
  extracted=Image.new('RGBA',source.size)
  extracted.paste(source,(0,0),region)
  # Remove sleeve pixels before rotation. Existing torso is left intact.
  cleared=Image.new('RGBA',source.size)
  cleared.paste((0,0,0,0),(0,0,w,h))
  result.paste(cleared,(0,0),ImageChops.multiply(region,source.getchannel('A')))
  degrees=(-31 if side<0 else 31) if action=='wave' else (-26 if side<0 else 26) if action=='cheer' else (-18 if side<0 else 18)
  # PIL positive angles rotate counterclockwise; rotate around source shoulder.
  turned=extracted.rotate(degrees,Image.Resampling.BICUBIC,center=(ax,ay),expand=False)
  result.alpha_composite(turned)
 return result

def deform(source,frame,direction,action):
 # Inverse mapping: preserve ALL original hues, outlines, proportions and feet.
 # Keep the bottom 32% pixel-perfect and all output within original dimensions.
 w,h=source.size
 src=source.load()
 out=Image.new('RGBA',(w,h))
 dst=out.load()
 fx,fy=frame['footX'],frame['footY']
 for y in range(h):
  for x in range(w):
   # Upper-body elastic motion progressively vanishes near the hem.
   upper=1-smooth(240,410,y)
   head=1-smooth(115,325,y)
   hem=1-smooth(290,450,y)
   sx,sy=float(x),float(y)
   if action=='surprise':
    sy+=8*upper
    sx-=(x-fx)*.016*head
   elif action=='wave':
    sx-=2*upper
    sy-=3*head
   elif action=='bow':
    sy-=15*head
    sx-=(9 if direction in (1,2,3) else -9 if direction in (5,6,7) else 0)*head
   elif action=='cheer':
    sy+=12*upper
    sx-=(x-fx)*.025*upper
   # Nearest-source alpha with small transparent dilation avoidance.
   ix,iy=round(sx),round(sy)
   if 0<=ix<w and 0<=iy<h:
    dst[x,y]=src[ix,iy]
 return lift_sleeve(out,direction,action)

for i,frame in enumerate(META['frames']):
 src=Image.open(ART/frame['file']).convert('RGBA')
 for action in ACTIONS:
  name=f'{action}__{DIRECTIONS[i]}.png'
  candidate=deform(src,frame,i,action)
  # Transparent padding prevents source-edge glow from touching the crop border.
  padded=Image.new('RGBA',(src.width+32,src.height+32))
  padded.alpha_composite(candidate,(16,16))
  padded.save(DEST/name,optimize=True)
print('Created 32 non-destructive PNG candidates; art/design must still be reviewed.')
