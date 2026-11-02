# Reaction artwork — visual QA (2026-10-12)

## Immutable constraints
- **Visual identity:** only `field-lab/art/{0..7}.png` and their manifest; never rebuild the heroine from text or screenshots.
- **Animation mechanics:** motion-demo-style timing and the existing field-lab mesh renderer.
- The existing playable heroine and walking demo must not be replaced by candidates that have not passed visual QA.

## Cycle A: pixel-preserving elastic warp
GitHub Action run 38198521078, artifact 11723947928.
Mechanical checks: passed. Visual review: **FAILED** — four actions are nearly indistinguishable; waving has no raised hand, bowing barely reads as a bow.

## Cycle B: extracted-sleeve rotation
GitHub Action run 38198936216, artifact 11724936642.
Mechanical checks: passed. Visual review: **FAILED** — transparent wedge-shaped holes under sleeves, detached/displaced cloth and hands, and poor gesture readability.

## Required next implementation
**Do not use either artifact in game.** Do not repeat 32-cell text-to-image generation.
Keep the full original sprite drawn without erasing pixel regions. Use the existing per-vertex mesh deformation in `field-lab/character.js` as the motion layer, and develop a non-destructive sleeve/hand rig or redraw a *single* original-referenced reaction at original resolution. Review the frontal pose before expanding to other angles.
In particular, non-destructive silhouette coverage and articulation must be checked visually, not inferred from passing alpha/size checks. Mechanical QA is never artistic approval.
