"""Replay the recorded experiment without a renderer, AI call or network access."""
import argparse
import json
from pathlib import Path
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'skills/silhouette-first-pixel-art/scripts'))
from pixel_pipeline import patch_apply, sha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    out = args.output or Path(tempfile.mkdtemp(prefix='hizuki-zigzag-'))
    if out.resolve() == ROOT:
        raise ValueError('Choose an output folder separate from the reference files')
    out.mkdir(parents=True, exist_ok=True)
    recipe = json.loads((ROOT / 'recipe.json').read_text())
    source = ROOT / recipe['input']
    original = Image.open(source).convert('RGBA')
    if sha(original) != recipe['input_rgba_sha256']:
        raise ValueError('Baseline RGBA hash does not match; do not use a different pose')
    results = []
    current = source
    for step in recipe['steps']:
        target = out / step['output']
        results.append(patch_apply(current, ROOT / step['patch'], target,
                                  guard_profile=ROOT / recipe['guard'],
                                  view_id=recipe['view'], part_id=step['part']))
        current = target
    result = Image.open(current).convert('RGBA')
    reference = Image.open(ROOT / recipe['reference']).convert('RGBA')
    a, b = np.asarray(original), np.asarray(result)
    if result.size != tuple(recipe['canvas']):
        raise ValueError('Canvas changed')
    if sha(result) != recipe['result_rgba_sha256'] or result.tobytes() != reference.tobytes():
        raise ValueError('Replayed pixels do not match the recorded reference')
    if not np.array_equal(a[:, :, 3], b[:, :, 3]):
        raise ValueError('Silhouette changed')
    colors = lambda data: {tuple(p[:3]) for p in data.reshape(-1, 4) if p[3]}
    if colors(a) != colors(b) or len(colors(b)) != recipe['colors']:
        raise ValueError('Palette changed')
    result.save(out / 'Hizuki_zigzag_80x112.png')
    report = {'pass': True, 'rgba_exact': True, 'alpha_unchanged': True,
              'palette_unchanged': True, 'changed_pixels': int(np.any(a != b, axis=2).sum()),
              'result_rgba_sha256': sha(result), 'steps': results,
              'output': str((out / 'Hizuki_zigzag_80x112.png').resolve()),
              'art_adoption': 'not implied by replay verification'}
    (out / 'replay_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
