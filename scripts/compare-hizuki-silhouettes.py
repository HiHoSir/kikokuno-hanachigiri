#!/usr/bin/env python3
"""Compare rendered 8-direction alpha silhouettes with official sprite alpha.
Visual QA tool. Numbers are advisory: camera perspective may distort shapes."""
import argparse,json,pathlib
import numpy as np
from PIL import Image,ImageDraw

def mask(path):
    im=Image.open(path).convert('RGBA')
    a=np.asarray(im.getchannel('A'))
    return a>30

def normalize(m, w=180,h=240,pad=10):
    yy,xx=np.where(m)
    if not len(xx): raise ValueError('empty silhouette')
    crop=Image.fromarray(np.uint8(m[yy.min():yy.max()+1,xx.min():xx.max()+1])*255,'L')
    cw,ch=crop.size
    factor=min((w-2*pad)/cw,(h-2*pad)/ch)
    nw,nh=max(1,round(cw*factor)),max(1,round(ch*factor))
    thumb=crop.resize((nw,nh),Image.Resampling.NEAREST)
    arr=Image.new('L',(w,h),0)
    arr.paste(thumb,((w-nw)//2,h-pad-nh))
    return np.asarray(arr)>127

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--reference-dir',default='field-lab/art')
    p.add_argument('--render-dir',required=True)
    p.add_argument('--out',default='model-qa-output')
    args=p.parse_args()
    out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
    results=[]
    canvas=Image.new('RGB',(180*8,240*2),'#f1f0ea')
    for d in range(8):
        ref=normalize(mask(pathlib.Path(args.reference_dir)/f'{d}.png'))
        rendered=normalize(mask(pathlib.Path(args.render_dir)/f'angle_{d}_mask.png'))
        intersection=np.logical_and(ref,rendered).sum()
        union=np.logical_or(ref,rendered).sum()
        iou=float(intersection/max(1,union))
        rows={'direction':d,'silhouette_iou':round(iou,4),'reference_area':int(ref.sum()),'model_area':int(rendered.sum())}
        results.append(rows)
        for idx,arr in enumerate((ref,rendered)):
            tile=Image.fromarray(np.uint8(arr)*255,'L').convert('RGB')
            canvas.paste(tile,(d*180,idx*240))
    canvas.save(out/'silhouette-comparison.png')
    report={'status':'REVIEW_REQUIRED','metric':'normalized_alpha_silhouette_iou','directions':results,'mean_iou':round(float(np.mean([r['silhouette_iou'] for r in results])),4),
      'notes':['Diagnostic only; not an automated quality approval','Images normalized to same bounding box; shape not scale is compared',
      'Reference paintings use direction-specific perspective; human review required']}
    (out/'silhouette-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__': main()
