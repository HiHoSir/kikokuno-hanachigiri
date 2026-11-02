"""Inspect compatible local ground/assets/instances JSON; never edit art."""
import argparse
import json
import math
from pathlib import Path
import sys
from PIL import Image

def finite(v):
    return type(v) in (int, float) and math.isfinite(v)

def polygon(points):
    return isinstance(points, list) and len(points) >= 3 and all(
        isinstance(p, list) and len(p) == 2 and all(finite(v) for v in p) for p in points)

def inspect(path):
    path = Path(path).resolve()
    data = json.loads(path.read_text())
    issues, images = [], []
    assets = data.get('assets', {})
    if not isinstance(assets, dict):
        return {'pass': False, 'issues': ['assets must be an object'], 'images': []}
    for name, asset in [('ground', data.get('ground', {})), *assets.items()]:
        try:
            im = Image.open((path.parent / asset['image']).resolve())
            if list(im.size) != asset['size']:
                issues.append(f'{name}: dimensions differ from metadata')
            alpha = im.convert('RGBA').getchannel('A')
            lo, hi = alpha.getextrema()
            if name != 'ground':
                if lo != 0 or hi < 250:
                    issues.append(f'{name}: cutout needs transparent pixels and a near-opaque core')
                anchor = asset.get('anchor', [])
                if len(anchor) != 2 or not all(finite(v) and 0 <= v <= im.size[i] for i, v in enumerate(anchor)):
                    issues.append(f'{name}: anchor outside source image')
                if not finite(asset.get('scale')) or asset['scale'] <= 0:
                    issues.append(f'{name}: invalid source-pixel display scale')
                for field in ('footprint', 'surface'):
                    if field in asset and not polygon(asset[field]):
                        issues.append(f'{name}: malformed {field}')
            images.append({'id': name, 'size': list(im.size), 'alpha_extrema': [lo, hi], 'alpha_bbox': alpha.getbbox()})
        except (OSError, KeyError, TypeError, ValueError) as error:
            issues.append(f'{name}: {error}')
    ids = set()
    for instance in data.get('instances', []):
        if instance.get('id') in ids or instance.get('asset') not in assets:
            issues.append('duplicate instance or missing asset')
        ids.add(instance.get('id'))
        if not all(finite(instance.get(axis)) for axis in ('x', 'z')):
            issues.append('non-finite instance coordinates')
    if not data.get('surfaces') or any(not polygon(s.get('polygon')) for s in data['surfaces']):
        issues.append('missing or malformed positive walk surfaces')
    return {'pass': not issues, 'issues': issues, 'images': images,
            'not_checked': ['reachability', 'visual occlusion', 'camera calibration', 'touch', 'device performance']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('map_json')
    result = inspect(parser.parse_args().map_json)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result['pass'] else 2)
