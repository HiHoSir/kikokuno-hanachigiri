#!/usr/bin/env python3
"""Standalone deterministic v2.1 positive and negative tests; no external assets."""
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_pipeline import sha, make_patch, patch_apply
from semantic_quality import check_change, multiview_audit, _region_mask


def must_reject(fn, name):
    try: fn()
    except ValueError: return
    raise AssertionError('invalid edit not rejected: '+name)


def run():
    with TemporaryDirectory() as td:
        root = Path(td)
        # non-hizuki 40x52 synthetic figure, with two material regions
        size=(40,52)
        a=np.zeros((size[1],size[0],4),dtype=np.uint8)
        a[3:25,8:32]=[112,188,228,255]  # cyan material / head
        a[26:44,10:30]=[215,60,89,255]  # red material / garment
        a[44:49,12:17]=[42,59,98,255]
        a[44:49,23:28]=[42,59,98,255]
        original=Image.fromarray(a,'RGBA'); original.save(root/'front.png')
        b=a.copy()
        b[8,14]=[75,151,210,255]; b[9,15]=[75,151,210,255]
        Image.fromarray(b,'RGBA').save(root/'front-edited.png')
        # protect pixel (20,8): named eye, editable head [8,3..25)
        # 40x52; additional file alpha mask protects only pixel (16,10)
        masked=Image.new('RGBA',size,(0,0,0,0));masked.putpixel((16,10),(255,255,255,255));masked.save(root/'protect.png')
        guard={'schema':'generic-pixel-guard-v1','width':size[0],'height':size[1],
               'views':{'front':{'editable_parts':{'hair':[{'rect':[8,3,32,25]}],
                                                  'clothes':[{'polygon':[[10,26],[30,26],[30,43],[10,43]]}]},
                                  'protected':[{'rect':[18,6,24,12]},{'mask':'protect.png'}]},
                        'back':{'editable_parts':{'hair':[{'rect':[8,3,32,25]}]},'protected':[]}}}
        gp=root/'guard.json';gp.write_text(json.dumps(guard))
        patch=root/'good.json'
        make_patch(root/'front.png',root/'front-edited.png',patch,'front','hair')
        out=root/'replayed.png'
        patch_apply(root/'front.png',patch,out,guard_profile=gp,view_id='front',part_id='hair')
        assert sha(Image.open(out)) == sha(Image.open(root/'front-edited.png'))
        good_check=check_change(a,b,gp,'front','hair')
        assert good_check['pass'] and good_check['counts']['changed_pixels']==2
        assert not (root/'wrong-output.png').exists()
        must_reject(lambda:patch_apply(root/'front.png',patch,root/'wrong-output.png',guard_profile=gp,
                                       view_id='back',part_id='hair'),'cross-view patch')
        must_reject(lambda:patch_apply(root/'front.png',patch,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id='clothes'),'cross-part patch')
        must_reject(lambda:patch_apply(root/'front.png',patch,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id=None),'missing part')
        # Protected face pixel inside editable hair
        bad=b.copy();bad[8,20]=[12,18,44,255]
        Image.fromarray(bad,'RGBA').save(root/'bad-face.png')
        bf=root/'bad-face.json';make_patch(root/'front.png',root/'bad-face.png',bf,'front','hair')
        must_reject(lambda:patch_apply(root/'front.png',bf,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id='hair'),'protected face')
        bad_report=check_change(a,bad,gp,'front','hair')
        assert bad_report['counts']['protected_changed']==1 and not bad_report['pass']
        # Mask-file block inside hair
        bad=b.copy();bad[10,16]=[12,18,44,255]
        Image.fromarray(bad,'RGBA').save(root/'bad-mask.png')
        mp=root/'bad-mask.json';make_patch(root/'front.png',root/'bad-mask.png',mp,'front','hair')
        must_reject(lambda:patch_apply(root/'front.png',mp,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id='hair'),'mask-file protection')
        # Partial edits on clothes with hair as the selected part
        bad=a.copy();bad[31,17]=[216,120,125,255]
        Image.fromarray(bad,'RGBA').save(root/'bad-part.png')
        cp=root/'bad-part.json';make_patch(root/'front.png',root/'bad-part.png',cp,'front','hair')
        must_reject(lambda:patch_apply(root/'front.png',cp,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id='hair'),'outside semantic part')
        # Same coordinate edit is accepted if user chooses right part
        cp2=root/'clothes.json';make_patch(root/'front.png',root/'bad-part.png',cp2,'front','clothes')
        patch_apply(root/'front.png',cp2,root/'clothes-out.png',guard_profile=gp,view_id='front',part_id='clothes')
        assert sha(Image.open(root/'clothes-out.png'))==sha(Image.open(root/'bad-part.png'))
        # Malformed polygons should be rejected
        must_reject(lambda:_region_mask({'polygon':[[0,0],[40,12],[0,10]]},size,root),'polygon out of bounds')
        # Changed alpha locked even for allowed semantic area
        bad=a.copy();bad[8,14]=[75,151,210,0]
        Image.fromarray(bad,'RGBA').save(root/'bad-alpha.png')
        ap=root/'bad-alpha.json';make_patch(root/'front.png',root/'bad-alpha.png',ap,'front','hair')
        must_reject(lambda:patch_apply(root/'front.png',ap,root/'wrong-output.png',guard_profile=gp,
                                       view_id='front',part_id='hair'),'alpha lock')
        assert not (root/'wrong-output.png').exists(), 'failed edits must not write output'
        # A second view with different shading; both share valid core materials
        other=a.copy();other[3:25,8:32]=[90,159,210,255]
        Image.fromarray(other,'RGBA').save(root/'rear.png')
        manifest={'schema':'generic-pixel-multiview-v1',
                  'materials':{'hair':{'palette':['#70BCE4','#5A9FD2','#4B97D2'], 'enforce_palette':False},
                               'clothes':{'palette':['#D73C59']}},
                  'views':[
                      {'id':'front','file':'front.png','parts':{
                          'hair':{'regions':[{'rect':[8,3,32,25]}]},
                          'clothes':{'regions':[{'polygon':[[10,26],[29,26],[29,43],[10,43]]}]}},
                       'landmarks':{'floor':[20,48]},'features':{'ornament':{'visibility':'visible','count':2}}},
                      {'id':'rear','file':'rear.png','parts':{
                          'hair':{'regions':[{'rect':[8,3,32,25]}]}},
                       'landmarks':{'floor':[20,48]},'features':{'ornament':{'visibility':'occluded','count':0}}}],
                  'checks':[{'kind':'landmark_y','name':'floor','views':['front','rear'],'tolerance':0},
                            {'kind':'feature_visibility','name':'ornament','views':['front'],'expected':'visible'},
                            {'kind':'feature_visibility','name':'ornament','views':['rear'],'expected':'occluded'},
                            {'kind':'feature_count','name':'ornament','views':['front'],'expected':2}]}
        path=root/'multiview.json';path.write_text(json.dumps(manifest))
        report=multiview_audit(path)
        assert report['pass'], report['issues']
        assert report['palette']['union_colors']>report['palette']['intersection_colors']
        assert report['palette']['material_comparison']['hair']['views_with_annotations']==['front','rear']
        # Checks fail only where explicit annotations contradict declared constraints.
        manifest['views'][1]['landmarks']['floor']=[20,45]
        path.write_text(json.dumps(manifest))
        report=multiview_audit(path)
        assert not report['pass'] and any(x['kind']=='misaligned_landmark' for x in report['issues'])
        manifest['views'][1]['landmarks']['floor']=[20,48]
        manifest['views'][1]['features']['ornament']['visibility']='visible'
        path.write_text(json.dumps(manifest))
        report=multiview_audit(path)
        assert any(x['kind']=='visibility_annotation_mismatch' for x in report['issues'])
        # Undeclared feature should explicitly fail the corresponding check, never be guessed.
        del manifest['views'][1]['features']['ornament']
        path.write_text(json.dumps(manifest))
        report=multiview_audit(path)
        assert any(x['kind']=='unannotated_feature' for x in report['issues'])
        # Strict palette is available, but NOT forced by default.
        manifest['checks']=[]
        manifest['views'][1]['features']={}
        manifest['materials']['hair']['enforce_palette']=True
        manifest['materials']['hair']['palette']=['#70BCE4']
        path.write_text(json.dumps(manifest))
        report=multiview_audit(path)
        assert any(x['kind']=='palette_violation' for x in report['issues'])
        print('PASS v2.1: guarded edit/replay; wrong view/part/face/mask/out-of-area/alpha rejection; rectangle/polygon/image regions; multi-view material palette; floor alignment; visibility annotations; strict palette opt-in')

if __name__ == '__main__':run()
