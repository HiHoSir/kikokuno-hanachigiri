#!/usr/bin/env python3
"""Prototype identity-preserving reaction sprites from the 8 source artworks.

Unlike generative redrawing, every nontransparent output pixel originates from
field-lab/art/{0..7}.png. The deformation is reversible and non-destructive.
Candidate-only: do NOT silently promote these to game assets.
"""
import json, math
from pathlib import Path
from PIL import Image

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
    # Gentle leaning: source pixels retained, no invented synthetic hand.
    sx-=9*upper
    sy-=3*head
   elif action=='bow':
    sy-=26*head
    sx-=(9 if direction in (1,2,3) else -9 if direction in (5,6,7) else 0)*head
   elif action=='cheer':
    sy+=12*upper
    sx-=(x-fx)*.025*upper
   # Nearest-source alpha with small transparent dilation avoidance.
   ix,iy=round(sx),round(sy)
   if 0<=ix<w and 0<=iy<h:
    dst[x,y]=src[ix,iy]
 return out

for i,frame in enumerate(META['frames']):
 src=Image.open(ART/frame['file']).convert('RGBA')
 for action in ACTIONS:
  name=f'{action}__{DIRECTIONS[i]}.png'
  deform(src,frame,i,action).save(DEST/name,optimize=True)
print('Created 32 non-destructive PNG candidates; art/design must still be reviewed.')
