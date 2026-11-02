#!/usr/bin/env python3
"""Strict, non-destructive QA gate for NEW 8-direction reaction artwork.

Uses the repository's actual 8-direction hero PNGs as the reference, never
screenshots or guessed head-to-body ratios. Run from repository root:
  python -m pip install Pillow
  python scripts/verify-reaction-art.py

This is an automated geometry/alpha gate, NOT artistic-identity approval.
"""
from pathlib import Path
from PIL import Image
import json, sys

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'field-lab/art'
CANDIDATES=ROOT/'field-lab/art/directional-actions'
ACTIONS=('surprise','wave','bow','cheer')
DIRECTIONS=('front','front_right','right','back_right','back','back_left','left','front_left')
ERRORS=[]

def fail(message):
    ERRORS.append(message)
    print('FAIL:',message)

def bounds(image):
    alpha=image.getchannel('A')
    # Deliberately detect faint glow/halo as well as opaque color.
    return alpha.getbbox()

def size_of_subject(image):
    b=bounds(image)
    return (b[2]-b[0],b[3]-b[1]) if b else (0,0)

def load(path):
    if not path.exists():
        fail(f'missing: {path.relative_to(ROOT)}')
        return None
    try:
        im=Image.open(path)
        if im.format!='PNG' or im.mode!='RGBA':
            fail(f'expected RGBA PNG: {path.relative_to(ROOT)}, got {im.format}/{im.mode}')
        return im.convert('RGBA')
    except Exception as e:
        fail(f'cannot decode {path.relative_to(ROOT)}: {e}')
        return None

def check():
    meta=json.loads((SOURCE/'manifest.json').read_text(encoding='utf8'))
    if len(meta['frames'])!=8:
        fail('8-direction baseline manifest is missing/incomplete')
        return
    original=[load(SOURCE/frame['file']) for frame in meta['frames']]
    if any(f is None for f in original):
        return
    references=[size_of_subject(im) for im in original]
    if not CANDIDATES.is_dir():
        fail('no directional-actions assets yet; NOT approved for game integration')
        return
    for action in ACTIONS:
        for direction,base in enumerate(original):
            p=CANDIDATES/f'{action}__{DIRECTIONS[direction]}.png'
            im=load(p)
            if im is None:continue
            b=bounds(im)
            if b is None:
                fail(f'empty image {p.name}')
                continue
            w,h=size_of_subject(im)
            refw,refh=references[direction]
            # No automatic head/leg lengthening or arbitrary rescaling.
            # Candidate must preserve reference pixel scale at source resolution.
            if abs(h-refh)>max(8,refh*.04):
                fail(f'{p.name} silhouette height {h} vs original {refh} (tolerance 4%)')
            if w<refw*.72 or w>refw*1.6:
                fail(f'{p.name} silhouette width {w} unexpected vs original {refw}')
            if im.width<base.width or im.height<base.height:
                fail(f'{p.name} canvas smaller than original {base.size}; unsuitable for zoom QA')
            if b[0]<4 or b[1]<4 or b[2]>im.width-4 or b[3]>im.height-4:
                fail(f'{p.name} art touches frame edges; overlap/crop risk')
            if im.width<362 or im.height<543:
                fail(f'{p.name} resolution less than existing source')
    if not ERRORS:
        print('PASS automated alpha, dimensions, silhouette scale and isolation gates.')
        print('HUMAN REVIEW STILL REQUIRED: precise design identity, head/torso/leg anatomy, direction and gesture.')
        print('Do not set status to approved based on this script alone.')

if __name__=='__main__':
    check()
    if ERRORS:
        print(f'{len(ERRORS)} failure(s); existing game artwork must stay unchanged.')
        sys.exit(1)
