#!/usr/bin/env python3
"""Auditable material/feature consistency checks and guarded pixel-region edits.

Annotations are user-provided facts, never inferred from colors or a screenshot.
No pixel editing or generation occurs here. Python 3.10+, Pillow, NumPy.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw


def _positive_int(value):
    return type(value) is int and value > 0


def _image_rgba(path):
    return np.asarray(Image.open(path).convert('RGBA'))


def _region_mask(spec, size, root):
    """Rasterize a rectangle [x0,y0,x1,y1), polygon, or external alpha mask.

    Pixel ownership is restricted to a declared shape; no guessed body part labels.
    """
    width, height = size
    if type(spec) is not dict:
        raise ValueError('region must be an object')
    kinds = [k for k in ('rect', 'polygon', 'mask') if k in spec]
    if len(kinds) != 1:
        raise ValueError('region needs exactly one of rect, polygon, mask')
    kind = kinds[0]
    if kind == 'rect':
        box = spec['rect']
        if (not isinstance(box, list) or len(box) != 4 or any(type(n) is not int for n in box)):
            raise ValueError('rect requires 4 integer coordinates')
        x0, y0, x1, y1 = box
        if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
            raise ValueError('rectangle out of bounds')
        mask = np.zeros((height, width), dtype=bool)
        mask[y0:y1, x0:x1] = True
        return mask
    if kind == 'polygon':
        vertices = spec['polygon']
        if not isinstance(vertices, list) or len(vertices) < 3:
            raise ValueError('polygon requires at least 3 vertices')
        for pt in vertices:
            if not isinstance(pt, list) or len(pt) != 2 or any(type(n) is not int for n in pt):
                raise ValueError('polygon vertex is not [int,int]')
            if not (0 <= pt[0] < width and 0 <= pt[1] < height):
                raise ValueError('polygon vertex out of bounds')
        im = Image.new('1', size, 0)
        ImageDraw.Draw(im).polygon([tuple(pt) for pt in vertices], fill=1)
        return np.asarray(im, dtype=bool)
    path = root / spec['mask']
    im = Image.open(path)
    if im.size != size:
        raise ValueError('region mask dimensions differ')
    if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
        return np.asarray(im.convert('RGBA'))[:, :, 3] > 0
    return np.asarray(im.convert('L')) > 0


def _mask_union(regions, size, root):
    if not isinstance(regions, list) or not regions:
        raise ValueError('region set must be a non-empty list')
    result = np.zeros((size[1], size[0]), dtype=bool)
    for spec in regions:
        result |= _region_mask(spec, size, root)
    return result


def validate_guard(guard, size, view_id, part_id, root):
    if guard.get('schema') != 'generic-pixel-guard-v1':
        raise ValueError('unknown guard schema')
    if guard.get('width') != size[0] or guard.get('height') != size[1]:
        raise ValueError('guard dimensions mismatch')
    views = guard.get('views')
    if not isinstance(views, dict) or view_id not in views:
        raise ValueError(f'view {view_id!r} not declared in guard')
    cfg = views[view_id]
    parts = cfg.get('editable_parts')
    if not isinstance(parts, dict) or part_id not in parts:
        raise ValueError(f'part {part_id!r} not declared in guard')
    eligible = _mask_union(parts[part_id], size, root)
    blocked = np.zeros((size[1], size[0]), dtype=bool)
    for reg in cfg.get('protected', []):
        blocked |= _region_mask(reg, size, root)
    # Deny by default: must be in selected semantic part AND outside protection.
    allowed = eligible & ~blocked
    return allowed, blocked


def check_change(before, after, guard_path, view_id, part_id, *, enforce_alpha=True):
    """Return an actionable report, and NEVER silently bypass protected pixels."""
    if before.shape != after.shape or before.ndim != 3 or before.shape[2] != 4:
        raise ValueError('images differ in size or are not RGBA')
    root = Path(guard_path).resolve().parent
    cfg = json.loads(Path(guard_path).read_text(encoding='utf-8'))
    h, w, _ = before.shape
    allowed, blocked = validate_guard(cfg, (w, h), view_id, part_id, root)
    dif = np.any(before != after, axis=2)
    alpha_delta = before[:, :, 3] != after[:, :, 3]
    region_violations = dif & ~allowed
    protected_violations = dif & blocked
    transparent_rgb = dif & (before[:, :, 3] == 0)
    counts = {
        'changed_pixels': int(dif.sum()),
        'outside_editable_part': int(region_violations.sum()),
        'protected_changed': int(protected_violations.sum()),
        'alpha_changed': int(alpha_delta.sum()),
        'transparent_pixel_changed': int(transparent_rgb.sum()),
    }
    passed = not counts['outside_editable_part'] and not counts['protected_changed'] and not counts['transparent_pixel_changed']
    if enforce_alpha:
        passed = passed and not counts['alpha_changed']
    return {'view':view_id, 'part':part_id, 'pass':bool(passed), 'counts':counts,
            'note':'geometric/pixel rules only; aesthetic and anatomical quality require visual review'}


def _parse_color(c):
    if isinstance(c, str) and c.startswith('#') and len(c) == 7:
        try:
            return tuple(bytes.fromhex(c[1:]))
        except ValueError:
            pass
    if isinstance(c, list) and len(c) == 3 and all(type(x) is int and 0 <= x <= 255 for x in c):
        return tuple(c)
    raise ValueError('material palette color must be #RRGGBB or [r,g,b]')


def _colors(region_rgb, region_mask):
    if not region_mask.any():
        return Counter()
    values = region_rgb[region_mask]
    return Counter(tuple(map(int, v)) for v in values)


def multiview_audit(manifest_path):
    """Cross-view audit of shared materials, annotations, and ground alignment.

    Failures only arise from declared, machine-checkable constraints.
    Feature orientation/anatomy is *not* inferred or certified from images.
    """
    path = Path(manifest_path)
    cfg = json.loads(path.read_text(encoding='utf-8'))
    if cfg.get('schema') != 'generic-pixel-multiview-v1':
        raise ValueError('wrong multiview schema')
    views = cfg.get('views')
    if not isinstance(views, list) or not views:
        raise ValueError('at least one view is required')
    ids = [v['id'] for v in views]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate view ID')
    materials = cfg.get('materials', {})
    if not isinstance(materials, dict):
        raise ValueError('materials must be a mapping')
    reports = {}
    all_color_sets = {}
    material_colors = {}
    issues = []
    root = path.resolve().parent
    dims = None
    for view in views:
        view_id = view['id']
        arr = _image_rgba(root / view['file'])
        h, w, _ = arr.shape
        if dims is None:
            dims = [w, h]
        if [w, h] != dims:
            raise ValueError('all view images must use the same cell dimensions')
        active = arr[:, :, 3] > 0
        alpha_colors = _colors(arr[:, :, :3], active)
        all_color_sets[view_id] = set(alpha_colors)
        part_reports = {}
        view_parts = view.get('parts', {})
        for part_id, part in view_parts.items():
            material_id = part.get('material', part_id)
            if material_id not in materials:
                raise ValueError('undeclared material: '+material_id)
            part_mask = _mask_union(part['regions'], (w, h), root) & active
            colors = _colors(arr[:, :, :3], part_mask)
            sample_set = set(colors)
            allowed = materials[material_id].get('palette')
            allowed_set = None if allowed is None else {_parse_color(c) for c in allowed}
            unlisted = [] if allowed_set is None else sorted(sample_set - allowed_set)
            if unlisted and materials[material_id].get('enforce_palette', False):
                issues.append({'kind':'palette_violation', 'view':view_id, 'part':part_id,
                               'off_palette_colors': len(unlisted)})
            part_reports[part_id] = {
                'material':material_id, 'pixels':int(part_mask.sum()),
                'color_count':len(colors), 'off_palette_count':len(unlisted),
                'off_palette_hex':['#%02X%02X%02X'%c for c in unlisted[:20]],
                'top_colors':[{'hex':'#%02X%02X%02X'%rgb,'pixels':n} for rgb,n in colors.most_common(8)],
            }
            material_colors.setdefault(material_id, {})[view_id] = sample_set
        reports[view_id] = {'size':[w,h], 'nontransparent_pixels':int(active.sum()),
                            'color_count':len(alpha_colors), 'parts':part_reports,
                            'landmarks':view.get('landmarks', {}),
                            'features':view.get('features', {})}
    # Evaluate ONLY explicit checks, never invent missing feature coordinates/counts.
    by_id = {v['id']:v for v in views}
    for rule in cfg.get('checks', []):
        kind = rule['kind']
        selected = rule.get('views', ids)
        if not isinstance(selected,list) or not selected or any(vid not in by_id for vid in selected):
            raise ValueError('invalid views in check')
        if kind == 'landmark_y':
            name = rule['name']; tol=rule.get('tolerance',0)
            if type(tol) is not int or tol < 0: raise ValueError('bad tolerance')
            ys=[]
            for vid in selected:
                pt=by_id[vid].get('landmarks',{}).get(name)
                if not isinstance(pt,list) or len(pt)!=2 or any(type(x) is not int for x in pt):
                    issues.append({'kind':'missing_landmark','view':vid,'name':name})
                else:
                    if not (0<=pt[0]<dims[0] and 0<=pt[1]<dims[1]):
                        issues.append({'kind':'invalid_landmark','view':vid,'name':name})
                    else:
                        ys.append(pt[1])
            if len(ys)==len(selected) and max(ys)-min(ys)>tol:
                issues.append({'kind':'misaligned_landmark','name':name, 'y_values':ys,'tolerance':tol})
        elif kind in ('feature_visibility','feature_count'):
            name=rule['name']
            for vid in selected:
                feature=by_id[vid].get('features',{}).get(name)
                if not isinstance(feature,dict):
                    issues.append({'kind':'unannotated_feature','view':vid,'name':name})
                    continue
                if kind=='feature_visibility':
                    expected=rule['expected']
                    if expected not in ('visible','occluded','absent'):
                        raise ValueError('invalid expected visibility')
                    if feature.get('visibility')!=expected:
                        issues.append({'kind':'visibility_annotation_mismatch','view':vid,'name':name,
                                       'expected':expected,'actual':feature.get('visibility')})
                else:
                    expected=rule['expected']
                    if type(expected) is not int or expected < 0:raise ValueError('invalid expected count')
                    if feature.get('count')!=expected:
                        issues.append({'kind':'count_annotation_mismatch','view':vid,'name':name,
                                       'expected':expected,'actual':feature.get('count')})
        else:
            raise ValueError('unsupported check kind: '+str(kind))
    shared = set.intersection(*all_color_sets.values()) if all_color_sets else set()
    union = set.union(*all_color_sets.values()) if all_color_sets else set()
    material_comparison = {}
    for mid, per_view in sorted(material_colors.items()):
        sets = list(per_view.values())
        material_comparison[mid] = {
            'views_with_annotations':list(per_view),
            'shared_colors_in_annotated_regions':len(set.intersection(*sets)) if sets else 0,
            'total_colors_in_annotated_regions':len(set.union(*sets)) if sets else 0,
            'important':'not a target to maximize; orientation-dependent shading is valid'
        }
    return {'schema':'generic-pixel-audit-report-v1', 'pass':not issues,
            'view_count':len(ids), 'cell':dims,'views':reports,
            'palette':{'union_colors':len(union),'intersection_colors':len(shared),
                       'material_comparison':material_comparison},
            'issues':issues, 'review_required':[
                'semantic part masks and feature labels are human-supplied; they are not visually verified',
                'front/back/side limb ordering, hand orientation, decorations, face and pose require visual review',
                'do not maximize shared color count; inspect per-material consistency',
            ]}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest='action', required=True)
    c=sub.add_parser('guard-check',help='Check real RGBA change against semantic edit guard')
    c.add_argument('before');c.add_argument('after');c.add_argument('guard')
    c.add_argument('--view',required=True);c.add_argument('--part',required=True)
    c.add_argument('--allow-alpha-change',action='store_true')
    c=sub.add_parser('audit',help='Audit shared palette and declared view constraints')
    c.add_argument('manifest')
    for sp in sub.choices.values():sp.add_argument('--output')
    args=p.parse_args()
    if args.action=='audit':report=multiview_audit(args.manifest)
    else:report=check_change(_image_rgba(args.before),_image_rgba(args.after),args.guard,
                             args.view,args.part,enforce_alpha=not args.allow_alpha_change)
    content=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output:
        target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(content,encoding='utf-8')
    print(content,end='')
    if not report['pass']:sys.exit(2)


if __name__=='__main__':main()
