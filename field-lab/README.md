# v0.10.0-lab — stance/swing and depth inspection

Based on main 8576a9356ef88fb0badcd51709f8586524ff107e. Stable src/, index.html, original motion-demo/ and all 8 candidate PNG files remain unchanged. This is still an experimental character, not final art approval.

## Changes
- Actual collision-resolved distance drives a 0.64-unit gait cycle. Each foot has 60% support and 40% swing, half a cycle apart. At least one support foot remains down. Walking defaults to 1.0 unit/sec (inspection slider 0.7–2.0); production speed remains unchanged.
- Per-direction source-pixel leg landmarks, separate left/right mesh topology and rigid shoe regions prevent stretched shoe textures. Upper body proportions are not scaled. Blend-out avoids a sudden reset to the idle pose.
- Side-view hidden leg is a provisional extra mesh reusing the visible leg's pixels behind the body, opposite in phase. It is not newly authored hidden-leg artwork. Source alpha and PNG bytes are unchanged; no color key or alpha removal.
- Camera-facing XY keeps the source artwork's aspect ratio. Shader depth corresponds to an upright plane through the foot, with separate ground-displacement depth for moving feet. This avoids changing the character into a tilted physical card while preserving correct pillar occlusion.
- Contact shadow triangles crossing a height discontinuity are omitted, avoiding diagonal shadows floating between cushion and floor.
- Collapsible inspector: production tea-house positions (front/back of pillar, cushion, cushion edge, floor), speed, facing and frozen gait phase. D-pad input exits frozen pose mode. Telemetry updates at most ~8 Hz.

## Inspection and tests
`npm test`: 45 logic tests. `tools/field-lab-smoke.mjs`: Chromium and WebKit mobile viewport, all eight movement directions, stopped cycle/blend, actual D-pad left, six height/occlusion scenarios, walking down from cushion, eight frozen walking poses, original-art switch, JS errors and isolated save. Screenshots are GitHub Actions artifacts. Local Chromium works with Playwright 1.51.1; the official installer succeeded via its Microsoft download fallback. Local runs can route Three.js 0.180.0 to the exact downloaded module bytes to avoid CDN variability.

Visual review: eight headings × four cycle positions, actual Three.js tea-house. Initial continuous mesh distorted shoes at oblique headings; split topology and per-direction dividers corrected this before committing. Front/back pillar and cushion screenshots are linked from audit.html.

## Remaining limits
Candidate anatomy/head ratio, lateral yaw, and pouch placement are not formally approved. Side hidden-leg contours are reused, not independently drawn; oblique leg overlaps can still look like flat cutouts. This is a constrained puppet deformation, not a fully anatomical bone rig with independently layered knees, skirt, hair, ribbon and sleeves. Full iPhone Safari hardware/performance verification remains outstanding. The ground must remain level/stepped: continuous sloped terrain is not provided by the current production area model.
