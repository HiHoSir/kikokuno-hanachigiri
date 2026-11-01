#!/usr/bin/env python3
"""Generic silhouette-first sprite drafting and lossless RGBA patching.

Only geometry is resized using NEAREST. Color guidance comes from BOX-area
averaging of the approved source and is explicitly a *draft*, not finished art.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from semantic_quality import check_change

PNG = Image.Resampling


def sha(im):
    return hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()


def parse_color(col):
    if isinstance(col, str) and col.startswith('#') and len(col) in (7, 9):
        return tuple(bytes.fromhex(col[1:7]))
    if isinstance(col, list) and len(col) >= 3 and all(isinstance(v, int) and 0 <= v <= 255 for v in col[:3]):
        return tuple(col[:3])
    raise ValueError(f'Bad RGB color: {col!r}')


def palette_colors(path, guide, count):
    if path:
        j = json.loads(Path(path).read_text(encoding='utf-8'))
        entries = j['colors'] if isinstance(j, dict) and 'colors' in j else j
        if isinstance(entries, dict):
            entries = list(entries.values())
        colors = [parse_color(x) for x in entries]
        if not (2 <= len(colors) <= 256):
            raise ValueError('palette must contain 2 to 256 entries')
        return np.asarray(colors, dtype=np.uint8), 'provided'
    # Source-derived palette is for initial approximation, NOT approved artwork.
    pal_img = guide.convert('RGB').quantize(colors=count, method=Image.Quantize.MEDIANCUT)
    raw = pal_img.getpalette()
    colors = [tuple(raw[i:i+3]) for i in range(0, count*3, 3)]
    return np.asarray(colors, dtype=np.uint8), 'auto_unreviewed'


def draft(source, output, width, height, threshold=128, margin_x=2, margin_top=1, margin_bottom=1,
          palette=None, colors=24, guide_blur=0, outline=None, background_limit=0.85):
    if width < 4 or height < 4 or width > 2048 or height > 2048:
        raise ValueError('target dimensions must be from 4 to 2048')
    if min(margin_x, margin_top, margin_bottom) < 0 or width <= 2*margin_x or height <= margin_top+margin_bottom:
        raise ValueError('margins leave no canvas area')
    if not (0 <= threshold <= 255): raise ValueError('alpha threshold must be 0..255')
    src = Image.open(source).convert('RGBA')
    original = np.asarray(src)
    mask = original[:, :, 3] >= threshold
    coverage = float(mask.mean())
    if not mask.any(): raise ValueError('source has no visible pixels at alpha threshold')
    if coverage > background_limit:
        raise ValueError(f'opaque coverage {coverage:.1%}; check transparent background / crop / glow')
    yy, xx = np.where(mask)
    bbox = (int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1))
    crop = src.crop(bbox)
    bw, bh = crop.size
    fitw, fith = width-2*margin_x, height-margin_top-margin_bottom
    scale = min(fitw / bw, fith / bh)
    sw, sh = max(1, round(bw * scale)), max(1, round(bh*scale))
    # Clamp against rounding anomaly.
    sw, sh = min(sw, fitw), min(sh, fith)
    dx, dy = (width-sw)//2, height-margin_bottom-sh
    mask_local = Image.fromarray((mask[bbox[1]:bbox[3], bbox[0]:bbox[2]].astype('uint8') * 255), mode='L')
    target_mask = Image.new('L', (width, height), 0)
    target_mask.paste(mask_local.resize((sw,sh), PNG.NEAREST), (dx,dy))
    alpha = np.asarray(target_mask) >= 128

    # True alpha-composited, low-frequency RGBA guide; no final-color NEAREST.
    crop_arr = np.asarray(crop).astype(np.float32)
    rgba_a = crop_arr[:, :, 3:4] / 255.0
    rgb_prem = np.clip(crop_arr[:, :, :3] * rgba_a, 0, 255).astype('uint8')
    guidance_src = Image.fromarray(rgb_prem, 'RGB')
    weight_src = Image.fromarray(np.clip(rgba_a[:,:,0]*255,0,255).astype('uint8'), 'L')
    if guide_blur > 0:
        guidance_src = guidance_src.filter(ImageFilter.GaussianBlur(radius=guide_blur))
        weight_src = weight_src.filter(ImageFilter.GaussianBlur(radius=guide_blur))
    guide_arr = np.asarray(guidance_src.resize((sw, sh), PNG.BOX)).astype(np.float32)
    weight_arr = np.asarray(weight_src.resize((sw, sh), PNG.BOX)).astype(np.float32)[:,:,None] / 255.0
    guide_rgb = np.asarray(np.clip(guide_arr / np.maximum(weight_arr, 0.05), 0, 255),dtype='uint8')
    guide_im = Image.fromarray(guide_rgb,'RGB')
    pal, pal_kind = palette_colors(palette, guide_im, colors)
    color_dist = np.sum((guide_rgb.astype('float32')[:,:,None,:]-pal.astype('float32')[None,None,:,:])**2 *
                        np.asarray([0.92, 1.05, 1.01],dtype='float32')[None,None,None,:],axis=3)
    idx = color_dist.argmin(axis=2)
    target = np.zeros((height,width,4), dtype='uint8')
    block = target[dy:dy+sh,dx:dx+sw]
    block[:,:,:3] = pal[idx]
    block[:,:,3] = 255
    target[~alpha] = [0,0,0,0]
    if outline:
        ink = np.asarray(parse_color(outline),dtype='uint8')
        # Protect only *internal* 4-neighbor edge, not entire border box.
        edge = alpha.copy()
        edge[1:,:] &= alpha[:-1,:]
        edge[:-1,:] &= alpha[1:,:]
        edge[:,1:] &= alpha[:,:-1]
        edge[:,:-1] &= alpha[:,1:]
        target[alpha & ~edge,:3] = ink
    out = Image.fromarray(target, 'RGBA')
    output = Path(output);output.parent.mkdir(parents=True, exist_ok=True)
    out.save(output)
    target_mask.save(output.with_name(output.stem + '-mask.png'))
    report={"type":"unapproved_draft", "source":str(source), "target":[width,height],"alpha_threshold":threshold,
            "source_coverage":round(coverage,4),"source_bbox":list(bbox),"placement":[dx,dy,sw,sh],
            "palette_kind":pal_kind,"palette_rgb":pal.tolist(),"rgba_sha256":sha(out),
            "warning":"Color guide uses area averaging; this is not hand-finished pixel art"}
    output.with_name(output.stem+'-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return report


def patch_apply(input_path, patch_path, output_path, allow_alpha_change=False,
                guard_profile=None, view_id=None, part_id=None):
    src = Image.open(input_path).convert('RGBA')
    data = json.loads(Path(patch_path).read_text(encoding='utf-8'))
    if data.get('format')!='generic-pixel-patch-v1': raise ValueError('wrong patch format')
    if (data.get('width'),data.get('height')) != src.size: raise ValueError('wrong dimensions')
    if data.get('baseSha256') != sha(src): raise ValueError('base SHA mismatch (stale or already applied)')
    changes=data.get('pixels')
    if not isinstance(changes,list) or not changes or len(changes)>100000: raise ValueError('empty/oversized patch')
    arr=np.asarray(src).copy()
    w,h=src.size
    used=set()
    for item in changes:
        x,y=item['x'],item['y']
        if type(x) is not int or type(y) is not int or x<0 or x>=w or y<0 or y>=h: raise ValueError('coordinate out of bounds')
        if (x,y) in used: raise ValueError('duplicate coordinate')
        used.add((x,y))
        before,after=item['before'],item['rgba']
        for a in (before,after):
            if not isinstance(a,list) or len(a)!=4 or any(type(v) is not int or not 0<=v<=255 for v in a): raise ValueError('bad RGBA')
        if arr[y,x].tolist()!=before: raise ValueError(f'before RGBA does not match at ({x},{y})')
        if not allow_alpha_change and before[3]!=after[3]: raise ValueError('alpha is locked: cannot change silhouette')
        if not allow_alpha_change and before[3]==0 and any(after[:3]): raise ValueError('transparent RGB must remain zero')
        arr[y,x]=after
    out=Image.fromarray(arr,'RGBA')
    if guard_profile:
        # Require BOTH patch metadata and caller-supplied IDs to avoid applying a
        # valid patch to the wrong view/part that happens to share an RGBA SHA.
        if not view_id or not part_id:
            raise ValueError('guard requires --view and --part')
        if data.get('viewId') != view_id or data.get('partId') != part_id:
            raise ValueError('patch view/part mismatch or missing metadata')
        guard_report = check_change(np.asarray(src), arr, guard_profile, view_id, part_id,
                                    enforce_alpha=not allow_alpha_change)
        if not guard_report['pass']:
            raise ValueError(f'edit guard violation: {guard_report["counts"]}')
    if 'resultSha256' in data and data['resultSha256']!=sha(out): raise ValueError('result SHA mismatch')
    op=Path(output_path);op.parent.mkdir(parents=True,exist_ok=True)
    out.save(op)
    return {'changed_records':len(changes), 'source_sha256':sha(src), 'result_sha256':sha(out), 'alpha_changed':not np.array_equal(np.asarray(src)[:,:,3],arr[:,:,3])}


def inspect(a,b,protect_bottom=0):
    im1,im2=Image.open(a).convert('RGBA'),Image.open(b).convert('RGBA')
    if im1.size!=im2.size:raise ValueError('image dimensions differ')
    x,y=np.asarray(im1),np.asarray(im2)
    dif=np.any(x!=y,axis=2)
    bottom=int(protect_bottom)
    if not 0<=bottom<=im1.height:raise ValueError('invalid bottom rows')
    return {'size':list(im1.size),'rgba_changed_pixels':int(dif.sum()),
            'alpha_changed_pixels':int(np.count_nonzero(x[:,:,3]!=y[:,:,3])),
            'bottom_changed_pixels':int(dif[-bottom:,:].sum()) if bottom else 0,
            'before_sha256':sha(im1),'after_sha256':sha(im2)}


def make_patch(before_path, after_path, output, view_id=None, part_id=None):
    before=Image.open(before_path).convert('RGBA'); after=Image.open(after_path).convert('RGBA')
    if before.size!=after.size:raise ValueError('dimensions differ')
    a,b=np.asarray(before),np.asarray(after)
    ys,xs=np.where(np.any(a!=b,axis=2))
    pixels=[{'x':int(x),'y':int(y),'before':a[y,x].tolist(),'rgba':b[y,x].tolist()} for y,x in zip(ys,xs)]
    patch={'format':'generic-pixel-patch-v1','width':before.width,'height':before.height,
           'baseSha256':sha(before),'resultSha256':sha(after),'pixels':pixels}
    if view_id is not None: patch['viewId'] = view_id
    if part_id is not None: patch['partId'] = part_id
    Path(output).write_text(json.dumps(patch,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return {'changed_pixels':len(pixels),'patch':str(output)}


def atlas(manifest_path, output):
    manifest=json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    views=manifest['views']
    if not isinstance(views,list) or not views:raise ValueError('manifest views must be nonempty')
    if len({v['id'] for v in views})!=len(views):raise ValueError('duplicate view ID')
    images=[]
    for v in views:
        im=Image.open(manifest_path.parent/v['file']).convert('RGBA')
        images.append(im)
    w,h=images[0].size
    if any(im.size!=(w,h) for im in images):raise ValueError('all views need the same cell size')
    cols=manifest.get('columns',len(images))
    if type(cols) is not int or not 1<=cols<=len(images):raise ValueError('invalid columns')
    rows=(len(images)+cols-1)//cols
    sheet=Image.new('RGBA',(cols*w,rows*h),(0,0,0,0))
    for i,im in enumerate(images):sheet.alpha_composite(im,((i%cols)*w,(i//cols)*h))
    op=Path(output);op.parent.mkdir(parents=True,exist_ok=True);sheet.save(op)
    return {'size':list(sheet.size),'cell':[w,h],'views':[v['id'] for v in views]}


def main():
    p=argparse.ArgumentParser(description=__doc__); sub=p.add_subparsers(dest='cmd',required=True)
    d=sub.add_parser('draft',help='Create alpha geometry with NEAREST and a separate initial color-area guide')
    d.add_argument('source');d.add_argument('output');d.add_argument('--width',type=int,required=True);d.add_argument('--height',type=int,required=True)
    d.add_argument('--threshold',type=int,default=128);d.add_argument('--margin-x',type=int,default=2)
    d.add_argument('--margin-top',type=int,default=1);d.add_argument('--margin-bottom',type=int,default=1)
    d.add_argument('--palette');d.add_argument('--colors',type=int,default=24);d.add_argument('--guide-blur',type=float,default=0);d.add_argument('--outline')
    d.add_argument('--background-limit',type=float,default=0.85)
    ap=sub.add_parser('apply');ap.add_argument('before');ap.add_argument('patch');ap.add_argument('output');ap.add_argument('--allow-alpha-change',action='store_true')
    ap.add_argument('--guard');ap.add_argument('--view');ap.add_argument('--part')
    ins=sub.add_parser('inspect');ins.add_argument('before');ins.add_argument('after');ins.add_argument('--protect-bottom',type=int,default=0)
    m=sub.add_parser('make-patch');m.add_argument('before');m.add_argument('after');m.add_argument('patch')
    m.add_argument('--view');m.add_argument('--part')
    a=sub.add_parser('atlas');a.add_argument('manifest');a.add_argument('output')
    args=p.parse_args()
    if args.cmd=='draft': result=draft(args.source,args.output,args.width,args.height,args.threshold,args.margin_x,args.margin_top,args.margin_bottom,args.palette,args.colors,args.guide_blur,args.outline,args.background_limit)
    elif args.cmd=='apply': result=patch_apply(args.before,args.patch,args.output,args.allow_alpha_change,args.guard,args.view,args.part)
    elif args.cmd=='inspect': result=inspect(args.before,args.after,args.protect_bottom)
    elif args.cmd=='make-patch': result=make_patch(args.before,args.after,args.patch,args.view,args.part)
    else:result=atlas(Path(args.manifest),args.output)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
