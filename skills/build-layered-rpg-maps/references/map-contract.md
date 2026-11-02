# Minimal playable-map contract

| Data | Meaning |
| --- | --- |
| Identity/revision | Current source and save-compatibility boundary |
| Projection | World axes/units, elevation definition, azimuth, pixels per metre, origin |
| Ground | Complete terrain under scenery, source dimensions and world coverage |
| Asset | Source/version/hash, RGBA, source dimensions, ground anchor, display scale |
| Footprint | Physical obstacle relative to anchor, independent of canopy/roof |
| Walk surface | Traversable land/deck polygon and walk-plane ID |
| Instance | One transform shared by drawing, collision and walk data |
| Render parts | Ground/depth/foreground role and explicit occlusion exceptions |
| Character | Source, common cell, pivot, scale, radius, direction/frame durations |
| Entrances | Approach/trigger, destination/spawn, return rule and no immediate re-trigger |
| Checks | Route, river block, bridge both ways, overlap, cancel, JSON round trip |

Front-facing orthographic example: `screenX = originX + scale * X`; `screenY = originY + scale * (Z * sin(elevation) - Y)`. A scenery bitmap is already projected: do not foreshorten its height again. Other azimuths need a matching basis transform. Generated art is not proof of exact camera calibration.

Bridge endpoints overlap both banks by enough for the foot radius. Moving/deleting the bridge moves/removes its crossing. A character's head extending beyond the deck does not permit its feet to leave the deck.

Test a house behind the roof, at both sides, wall corners and entrance. If one depth origin fails, split parts or define occlusion; do not silently enlarge every collider to hide the problem.

Check conservative bank polygons against rendered waterlines and retain a visible geometry overlay for refinement. Geometry clearance and plausible visual footing are separate gates.
