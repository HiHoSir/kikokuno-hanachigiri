#!/usr/bin/env python3
"""Right-facing authored wave prototype, using ONLY the existing source pixels.
No generative redrawing and no removal of pixels from the original body.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import math
from PIL import ImageOps
R=Path(__file__).resolve().parents[1]
src=Image.open(R/'field-lab/art/2.png').convert('RGBA')
W,H=src.size
# Work on a larger transparent atlas with extra space for the raised hand.
pad=105
canvas=Image.new('RGBA',(W+pad*2,H+pad*2))
canvas.alpha_composite(src,(pad,pad))
# Source right-facing character: forward-facing sleeve is on screen right
# of shoulder, at x roughly 220, y 290-430. Extract source sleeve and hand.
mask=Image.new('L',(W,H))
d=ImageDraw.Draw(mask)
d.polygon([(214,291),(252,306),(287,340),(287,420),(234,435),(187,384),(183,332)],fill=255)
# Feather 1px only; these are original pixels.
mask=mask.filter(ImageFilter.GaussianBlur(.8))
cut=Image.new('RGBA',(W,H));cut.paste(src,(0,0),mask)
# Turn detached sleeve upward, pivot near shoulder.
# Crucially keep original character underneath: no punched-out holes.
turn=cut.rotate(148,resample=Image.Resampling.BICUBIC,center=(211,299),expand=False)
# Alpha composite: original silhouette retained, arm now visibly lifted.
canvas.alpha_composite(turn,(pad,pad))
out=R/'field-lab/art/actions8/prototypes'
out.mkdir(parents=True,exist_ok=True)
canvas.save(out/'wave_right_v1.png')
# Provide side-by-side original and prototype for visual QA.
from PIL import ImageFont
review=Image.new('RGBA',((W+pad*2)*2,H+pad*2+40),(34,45,53,255))
review.alpha_composite(src,(pad,40+pad))
review.alpha_composite(canvas,(W+pad*2,40))
ImageDraw.Draw(review).text((12,12),'ORIGINAL 2.png     |     WAVE RIGHT / PROTOTYPE 1',fill='white')
review.save(out/'wave_right_review.png')
print('Created prototype and review images')
