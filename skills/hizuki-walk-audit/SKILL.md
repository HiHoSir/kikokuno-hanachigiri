# Hizuki Walk Asset Audit Skill

## Purpose
Audit the eight-direction walk assets for Hizuki (緋月), the protagonist of 新生 鬼哭の花契り. Prevent the recurring failure of swapping anatomical left and right limbs and of silently accepting visually inconsistent generated frames.

## References and priorities
1. The approved original character-design and eight static direction images in `assets/characters/hizuki/8directions/` are the **appearance source of truth**. Do not take a generated walk frame or GLB render as a replacement source of truth.
2. A GLB (if present) or independently defined pose JSON is **pose evidence only**, not an appearance reference.
3. Never claim a generated image passes anatomy solely because pose coordinates pass. Image-based anatomy and costume approval require separate visual review.
4. Do not use a fixed sprite size, pixel-art resolution, or automatic up/down scaling without explicit project approval.

## Coordinate conventions
Body-local coordinates: +X = character's OWN right, +Y = up, +Z = character's forward. Screen right is **not** body right. Front / front-right / right / back-right / back / back-left / left / front-left describe camera-facing direction. A change of camera yaw must not swap joint identity.

Use unique joint names:
`rightShoulder,rightElbow,rightWrist,leftShoulder,leftElbow,leftWrist,rightHip,rightKnee,rightAnkle,leftHip,leftKnee,leftAnkle`.
When a rig uses alternate naming, create a checked explicit mapping; **never** infer from an unlabeled 2D silhouette.

## Required process
1. Inventory approved eight static references, current walk assets, image dimensions, alpha format and hashes. Preserve originals.
2. Prepare a machine-readable pose contract with named joints (see `tools/hizuki_pose_audit.py`).
3. First gate: verify right-foot-forward / left-arm-forward in body-local Z; verify opposite phase separately. Reject missing or ambiguous joint labels.
4. Render the bone pose from the exact coordinates with transparent background; optionally use colour-coded *reference overlays* (blue right / green left). No coloured ribbons or labels in final sprites.
5. Use one approved direction's still as appearance input and the pose as pose-only input. Change a single phase/direction at a time. Never silently introduce new accessories.
6. Second gate: inspect actual output for correct connections, occlusion, silhouette, proportions, face, hair, horn, ribbons, costume details, transparency and foot contact. If anything is unclear, label it `REVIEW`, not `PASS`.
7. Repeat for other directions only after one difficult three-quarter direction has been reviewed.
8. Produce a contact sheet at identical scale, individual transparent PNGs, a JSON manifest containing hashes and an audit report. Never publish or replace runtime files unless each asset is approved.

## One-step pilot
Test `front-left`, phase `right_forward`: **character's right ankle ahead of left ankle** and **character's left wrist ahead of right wrist**. Test both relations using local Z, not projected pixel X. Reverse inequalities for the `left_forward` phase.

## Use from Python
```bash
python tools/hizuki_pose_audit.py path/to/pose.json --phase right_forward
python tools/hizuki_pose_audit.py path/to/pose.json --phase left_forward
```
Accepts either top-level `joints` or a JSON object consisting of joints; each joint coordinate is [x,y,z]. Exit status 0 means the coordinate checks passed; exit status 1 indicates failed/invalid input. Neither status attests a completed picture's visual accuracy.

## Approach borrowed selectively
Agent Sprite Forge: https://github.com/0x0funky/agent-sprite-forge
Its frame and identity QC is useful after generation; it does not solve anatomical left/right certainty. This Skill intentionally does not vendor its pipeline or require external API keys. No OpenArt credits or generation are needed to use the audit tool.

## Safety
Do not overwrite GitHub's approved static direction images. Keep review outputs separate from runtime sprites and version any cache-busted paths if approved assets are eventually deployed. For binary uploads, use the established github-image-atlas SKILL.md Git data flow (create_blob → create_tree → create_commit → update_ref → verify).
