# Hizuki — 8-direction turnaround

Eight transparent PNG character illustrations, 1024 × 1536 pixels each. Character-facing directions are named from the character's point of view on screen.

1. `01_front.png`
2. `02_front_right.png`
3. `03_right.png`
4. `04_back_right.png`
5. `05_back.png`
6. `06_back_left.png`
7. `07_left.png`
8. `08_front_left.png`

These are standalone source illustrations, not wired into the runtime. Preserve individual originals when assembling spritesheets.

## Canonical accessory placement — 2026-10-14

This directory is the canonical reference for the new walking art.
Anatomical sides are the CHARACTER'S own sides, never the viewer's:
- Brown pouch and its suspension hardware: right hip.
- Cream flower, ivory tassel and red braided cord: left hip.
- Occlusion by a sleeve is allowed; moving an accessory to the opposite hip is not.

Corrected 06_back_left.png and 08_front_left.png against front/back references.
06: flower/tassel is on the near left hip; pouch is on the far right hip.
08: pouch moved to the far right hip; near left flower/tassel retained.
The other six originals were not modified. Older copies in 8direction/ and
turnaround/ have not been synchronized; do not use them for this remake.
Previous source revisions remain in Git history before this correction.

Scope: static design-reference correction, not approved walking animation.
Dimensions remain 1024 x 1536. Visual pose and head silhouette were compared;
this is not a claim of pixel-identical preservation outside the edited area.
Alpha composites were inspected. The sources and regenerated images have
maximum alpha 254 and can retain tiny low-alpha background pixels, so final
runtime transparency/edge QA is still required before sprite integration.
