#!/usr/bin/env python3
"""Audit a candidate GLB; never promote an unapproved sculpt automatically."""
import argparse, json, math, struct, pathlib
from PIL import Image, ImageDraw
import numpy as np
import trimesh

DIRECTIONS = list(range(8))
def glb_structure(path):
    b=path.read_bytes()
    if len(b)<20 or b[:4]!=b'glTF': raise ValueError('Not a binary glTF/GLB')
    ver,total=struct.unpack_from('<II',b,4)
    if ver!=2 or total!=len(b): raise ValueError('Bad GLB header/length')
    offset=12
    while offset<len(b):
        n,kind=struct.unpack_from('<I4s',b,offset);offset+=8
        if kind==b'JSON': return json.loads(b[offset:offset+n])
        offset+=n
    raise ValueError('No JSON chunk')

def render_views(scene, output):
    output.mkdir(parents=True,exist_ok=True)
    meshes=[x for x in scene.dump(concatenate=False) if isinstance(x,trimesh.Trimesh) and len(x.faces)]
    if not meshes: raise ValueError('No visible 3D triangles')
    merged=trimesh.util.concatenate(meshes)
    verts=np.asarray(merged.vertices,dtype=float)
    faces=np.asarray(merged.faces,dtype=int)
    if not np.isfinite(verts).all(): raise ValueError('Nonfinite vertex coordinates')
    lo,hi=verts.min(0),verts.max(0)
    center=(lo+hi)/2
    scale=300/max(1e-7,float(np.max(hi-lo)))
    scores=[]
    for d in DIRECTIONS:
        a=2*math.pi*d/8
        xx=(verts[:,0]-center[0])*math.cos(a)+(verts[:,2]-center[2])*math.sin(a)
        depth=-(verts[:,0]-center[0])*math.sin(a)+(verts[:,2]-center[2])*math.cos(a)
        yy=verts[:,1]-center[1]
        xy=np.column_stack((180+xx*scale,270-yy*scale))
        im=Image.new('RGB',(360,540),'#e8e7e0')
        painter=ImageDraw.Draw(im)
        cent_z=depth[faces].mean(axis=1)
        for i in np.argsort(cent_z):
            face=faces[i]
            p=[tuple(map(float,xy[v])) for v in face]
            shade=int(120+60*(cent_z[i]-depth.min())/max(1e-8,float(np.ptp(depth))))
            painter.polygon(p,fill=(shade,shade-42,shade-52))
        im.save(output/f'angle_{d}.png')
        scores.append({'direction':d,'triangles':int(len(faces))})
    return {'meshes':len(meshes),'triangles':int(len(faces)),'bounds':list(map(float,hi-lo)),'views':scores}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--model',required=True)
    p.add_argument('--out',default='model-qa-output')
    p.add_argument('--baseline',default='')
    a=p.parse_args()
    model=pathlib.Path(a.model)
    out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
    report={'model':str(model),'accepted':False,'limitations':['Render preview is simplified and does not validate artistic likeness','Requires human comparison against eight original paintings']}
    try:
        if not model.is_file(): raise FileNotFoundError(f'Missing candidate GLB: {model}')
        j=glb_structure(model)
        report['structure']={'scenes':len(j.get('scenes',[])),'nodes':len(j.get('nodes',[])),'meshes':len(j.get('meshes',[])),'skins':len(j.get('skins',[])),'animations':len(j.get('animations',[])),'materials':len(j.get('materials',[]))}
        scene=trimesh.load(str(model),force='scene',process=False)
        report['geometry']=render_views(scene,out)
        report['checks']={
            'actual_geometry':report['geometry']['triangles']>100,
            'skinned_model':bool(j.get('skins')) and any(len(s.get('joints',[]))>=15 for s in j.get('skins',[])),
            'pose_animations':len(j.get('animations',[]))>=4,
            'eight_rendered_views':all((out/f'angle_{i}.png').is_file() for i in DIRECTIONS),
        }
        report['technical_pass']=all(report['checks'].values())
        if a.baseline:
            bp=pathlib.Path(a.baseline)
            if bp.exists():
                prior=json.loads(bp.read_text())
                report['baseline_comparison']={'previous_triangles':prior.get('geometry',{}).get('triangles'),
                                              'current_triangles':report['geometry']['triangles'],
                                              'note':'Triangle count alone is NOT a quality metric; no automatic promotion'}
        report['status']='TECHNICAL_PASS_AWAITING_ART_REVIEW' if report['technical_pass'] else 'TECHNICAL_FAILURE'
    except Exception as exc:
        report['status']='ERROR';report['error']=str(exc)
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if report['status'] in ('ERROR','TECHNICAL_FAILURE'): raise SystemExit(1)
if __name__=='__main__': main()
