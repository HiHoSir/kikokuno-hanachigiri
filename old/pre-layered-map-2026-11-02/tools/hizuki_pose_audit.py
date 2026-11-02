#!/usr/bin/env python3
"""Validate a named body-local pose. No generated-image anatomy claims."""
import argparse
import json
import math
from pathlib import Path

REQUIRED = (
    "rightShoulder", "rightElbow", "rightWrist",
    "leftShoulder", "leftElbow", "leftWrist",
    "rightHip", "rightKnee", "rightAnkle",
    "leftHip", "leftKnee", "leftAnkle",
)

def audit(data, phase):
    p = data.get("joints", data)
    errors = []
    coords = {}
    if not isinstance(p, dict):
        return ["joints must be an object"]
    for key in REQUIRED:
        value = p.get(key)
        if not isinstance(value, (list, tuple)) or len(value) != 3 or any(
            isinstance(v, bool) or not isinstance(v, (float, int)) or not math.isfinite(v) for v in value
        ):
            errors.append(f"{key}: missing or invalid 3D coordinate")
        else:
            coords[key] = value
    if errors:
        return errors
    for a, b, side in [
        ("rightHip", "leftHip", "hips"),
        ("rightShoulder", "leftShoulder", "shoulders"),
    ]:
        if not coords[a][0] > coords[b][0]:
            errors.append(f"{side}: body-local right (+X) is not right of left")
    margin = 1e-6
    if phase == "right_forward":
        relations = [("rightAnkle", "leftAnkle", "right foot not forward"), ("leftWrist", "rightWrist", "left arm not forward")]
    else:
        relations = [("leftAnkle", "rightAnkle", "left foot not forward"), ("rightWrist", "leftWrist", "right arm not forward")]
    for a, b, err in relations:
        if not coords[a][2] > coords[b][2] + margin:
            errors.append(err)
    return errors

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pose", type=Path)
    parser.add_argument("--phase", required=True, choices=("right_forward", "left_forward"))
    args = parser.parse_args()
    try:
        payload = json.loads(args.pose.read_text(encoding="utf-8"))
        errors = audit(payload, args.phase)
    except (OSError, ValueError, TypeError) as exc:
        errors = [str(exc)]
    result = {"pose": str(args.pose), "phase": args.phase,
              "coordinate_status": "FAIL" if errors else "PASS",
              "image_anatomy_status": "NOT_EVALUATED",
              "errors": errors}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(bool(errors))

if __name__ == "__main__":
    raise SystemExit(main())
