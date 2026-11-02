"""Pose-specific, guarded pixel painting; no global dither or silhouette change."""
from pathlib import Path
import sys,json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent;O=R/'painting_output';O.mkdir(exist_ok=True)
sys.path.insert(0,str(R.parents[1]/'skills/silhouette-first-pixel-art/scripts'))
from pixel_pipeline import sha,make_patch,patch_apply,inspect
from semantic_quality import check_change
S=R/'normal.png'
base=Image.open(S).convert('RGBA');a=np.asarray(base).copy()
assert sha(base)=='7a9305eaf771c7e0fa2e6824e796971a4bbd30af5c624a2c092b65359580aa14'
record=json.loads((R/'normal_production_record.json').read_text())
P=record['palette'];C={k:tuple(bytes.fromhex(v[1:]))+(255,) for k,v in P.items()}
def poly(points):
 im=Image.new('L',(80,112));ImageDraw.Draw(im).polygon(points,fill=255);return np.asarray(im)>0
def color_mask(prefix):
 return np.logical_or.reduce([np.all(a==v,axis=2) for k,v in C.items() if k.startswith(prefix)])
active=a[:,:,3]>0
edge=active.copy();inside=active.copy()
inside[1:,:]&=active[:-1,:];inside[:-1,:]&=active[1:,:]
inside[:,1:]&=active[:,:-1];inside[:,:-1]&=active[:,1:]
edge=active&~inside
# Semantic areas are manually specified for this source pose. Palette membership
# further limits painting; it is not a claim of automatic anatomy recognition.
hair_shape=poly([(21,23),(26,13),(39,5),(48,10),(53,10),(58,13),(59,20),
                 (57,25),(54,29),(48,31),(43,25),(38,26),(33,39),(26,35),(21,32)])
cloth_shape=poly([(32,52),(43,53),(45,58),(44,68),(34,67),(30,64)])
hair_allowed=hair_shape&color_mask('hair_')&~edge
cloth_allowed=cloth_shape&color_mask('red_')&~edge
protected=edge.copy()
for rect in [(37,25,45,33),(50,21,56,29),(60,15,65,29),(24,40,34,59),
             (38,60,45,69),(0,69,80,112),(44,31,54,40)]:
 x0,y0,x1,y1=rect;protected[y0:y1,x0:x1]=True
hair_allowed&=~protected;cloth_allowed&=~protected
for name,m in [('hair',hair_allowed),('cloth',cloth_allowed),('protected',protected)]:
 Image.fromarray(m.astype('uint8')*255).save(O/f'{name}_mask.png')
guard={'schema':'generic-pixel-guard-v1','width':80,'height':112,'views':{
 'front_right':{'editable_parts':{'hair_shadow':[{'mask':'hair_mask.png'}],
                                'cloth_shadow':[{'mask':'cloth_mask.png'}]},
                'protected':[{'mask':'protected_mask.png'}]}}}
gp=O/'edit_guard.json';gp.write_text(json.dumps(guard,indent=2))
b=a.copy()
def put(x,y,name,allowed):
 if allowed[y,x]:b[y,x]=C[name]
# Main swept bang. The upper edge alternates small teeth while the lower edge
# follows the bundle; this is a shadow plane, rather than a hatch overlay.
bang_top={24:26,25:25,26:26,27:25,28:23,29:24,30:23,31:22,32:23,
          33:21,34:21,35:22,36:20,37:20,38:19,39:20,40:18,41:18,
          42:17,43:18,44:16,45:16,46:15}
for x,y0 in bang_top.items():
 lower=min(39,round(56-.5*x))
 for y in range(y0,lower+1):
  if tuple(a[y,x]) in (C['hair_mid'],C['hair_light'],C['hair_glint']):
   put(x,y,'hair_shadow',hair_allowed)
# A short lit edge above the serrated boundary keeps each tooth legible at 1x.
for x in [25,28,31,34,37,40,43]:put(x,bang_top[x]-1,'hair_light',hair_allowed)
# Two quieter interior strand highlights break up the shadow mass.
for x,y in [(25,30),(26,30),(27,29),(28,29),(29,28),(30,28),(31,27),(32,27),
            (29,34),(30,33),(31,33),(32,32),(33,32),(34,31),(35,31)]:
 put(x,y,'hair_mid',hair_allowed)
# Right-side mass: two-pixel grouping along its boundary, following head volume.
for y in range(12,29):
 start={12:54,13:54,14:52,15:53,16:51,17:52,18:50,19:51,
        20:50,21:51,22:49,23:50,24:49,25:50,26:49,27:50,28:49}[y]
 for x in range(start,59):put(x,y,'hair_shadow',hair_allowed)
 for x in range(56+(y%3==0),59):put(x,y,'hair_deep',hair_allowed)
# Lift a small crown highlight with grouped steps, retaining existing strands.
for x,y,n in [(34,7,3),(33,8,3),(31,9,4),(30,10,4),(28,11,4),(28,12,3)]:
 for dx in range(n):put(x+dx,y,'hair_light',hair_allowed)
hair=O/'01_hair_candidate.png';Image.fromarray(b).save(hair)
reports=[]
def audit(before,after,part,prefix):
 pp=O/f'{prefix}_patch.json';out=O/f'{prefix}_replayed.png'
 make_patch(before,after,pp,'front_right',part)
 result=patch_apply(before,pp,out,guard_profile=gp,view_id='front_right',part_id=part)
 assert Image.open(after).convert('RGBA').tobytes()==Image.open(out).convert('RGBA').tobytes()
 check=check_change(np.asarray(Image.open(before).convert('RGBA')),
                    np.asarray(Image.open(after).convert('RGBA')),gp,'front_right',part)
 assert check['pass'];reports.append({'part':part,'replay_exact':True,'guard':check,**result})
audit(S,hair,'hair_shadow','01_hair')
# Red skirt: a single bent fold, not repeated zigzag stripes across the garment.
folds={53:(36,39),54:(35,39),55:(36,38),56:(34,38),57:(35,37),
       58:(33,37),59:(34,36),60:(32,36),61:(33,35),62:(32,35),63:(32,34)}
for y,(left,right) in folds.items():
 for x in range(left,right+1):put(x,y,'red_shadow',cloth_allowed)
 put(left,y,'red_deep',cloth_allowed)
for x,y in [(40,54),(41,54),(40,55),(39,56),(40,56),(39,57),(38,58)]:
 put(x,y,'red_light',cloth_allowed)
final=O/'Hizuki_V35_80x112_zigzag_v1.png';Image.fromarray(b).save(final)
audit(hair,final,'cloth_shadow','02_cloth')
assert np.array_equal(a[:,:,3],b[:,:,3])
assert np.array_equal(a[protected],b[protected])
colors=lambda ar:{tuple(p[:3]) for p in ar.reshape(-1,4) if p[3]}
assert colors(b)<=colors(a)
report={'status':'experimental-review-candidate','source_library_file_id':'libfile_a651ae5af2d8819182b2f0287f0dc5be',
 'source_pose':record['source_pose'],'canvas':[80,112],'palette':P,
 'colors_used':len(colors(b)),'new_colors_added':0,
 'art_direction':'Serrated 1–2px light/shadow boundaries along hair bundles and one fabric fold; no uniform checkerboard dithering.',
 'reference':'User-provided Eternia screenshot; image is inspiration, not an exact sprite reconstruction.',
 'annotation_method':'Manually declared polygons for this pose, intersected with existing named palette materials; no automatic semantic recognition.',
 'steps':reports,'overall':inspect(S,final,protect_bottom=43),
 'same_alpha':True,'protected_rgba_unchanged':True,'same_anchor':record['scene']['pixelPivot'],
 'same_pose':True,'same_palette':True,'scope':'One still pose; animation not evaluated.'}
(O/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Integer previews, plus a small 1x view in the comparison footer.
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try:
 font=ImageFont.truetype(font_path,22);small=ImageFont.truetype(font_path,14)
except OSError:
 font=ImageFont.load_default();small=ImageFont.load_default()
compare=Image.new('RGB',(848,642),'#e5e1d7');d=ImageDraw.Draw(compare)
for i,(im,label) in enumerate([(base,'NORMAL'),(Image.open(final),'ZIGZAG SHADING')]):
 d.text((24+i*424,15),label,font=font,fill='#344052')
 z=im.resize((400,560),Image.Resampling.NEAREST)
 compare.paste(z,(12+i*424,54),z)
 d.text((24+i*424,620),'80 x 112 px  /  same palette + silhouette',font=small,fill='#344052')
compare.save(O/'Hizuki_normal_vs_zigzag.png')
z=Image.open(final).resize((480,672),Image.Resampling.NEAREST)
preview=Image.new('RGBA',z.size,'#e5e1d7');preview.alpha_composite(z)
preview.convert('RGB').save(O/'Hizuki_zigzag_6x.png')
print(json.dumps({'changes':report['overall'],'parts':[{r['part']:r['changed_records']}for r in reports],
                  'colors_used':report['colors_used']},indent=2))
