# v0.9.2-lab: audited integration checkpoint, not final character approval

Stable source: 3bedb11ed94ad5316a473046ac908e9e759bf6ef. No files in src/, index.html, original motion demos, or original artwork changed.

Route: /field-lab/?v=0.9.2. Audit: /field-lab/audit.html?v=0.9.2.
Reuses production world, movement, surfaces, camera, events, portals, save codec and D-pad. Separate save key kikoku-field-lab-v1. v0.7 artwork is not used. Original v0.6 set is available for direct field comparison.

New candidate: generated using imagegen from the v0.6 20-frame contact sheet, then exact 362x543 cell extraction. No resampling, chroma key, alpha erosion, or body stretching. All candidate directions use 270 pixels/unit; all original frames use 150 pixels/unit. Anchor metadata derives from alpha >128 in bottom 16 (candidate) / 10 (legacy) pixel rows. This is an initial geometric foot estimate, not anatomically approved per-foot rigging.

Generation prompt: preserve v0.6 identity; slim approximately 2.8 heads, one gold horn, purple ponytail and large red ribbon, original red/white/purple clothing and travel pouch; eight distinct idle headings, 30-degree elevated viewing angle, transparent background, same body scale and baseline, no pixelation, no shadows. Original generated atlas 1448x1086. Candidate not formally approved: lateral yaw, pouch placement, exact anatomy, low-alpha edge noise need further review.

Animation: continuous mesh deformation, foot-anchored breathing, low-amplitude sleeve/hair follow-through; cycle driven by actual post-collision displacement. Not a finished independent-leg walk rig. Talk and surprise are short upper-body gestures. Depth-tested camera-facing billboards, terrain-conforming soft contact mesh. Camera quaternion preserves the on-screen artwork aspect ratio without stretching the source art.

Validation: npm test (38 passed locally). Browser script tools/field-lab-smoke.mjs checks Chromium/WebKit mobile viewport, eight headings, stopped gait, D-pad left direction, comparison switch, isolated save and JS errors. Local browser binaries unavailable: installation download returned invalid archives; workflow executes browser check in GitHub Actions. iPhone Safari hardware verification outstanding. Do not report this checkpoint as final completion.
