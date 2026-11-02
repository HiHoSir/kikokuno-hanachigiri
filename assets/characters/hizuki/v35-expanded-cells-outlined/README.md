# Hizuki V35 — rear palette V9 + outlined spritesheets

8 motions x 8 directions x 8 frames = 512 frames. Each sheet is 8 columns (frames) by 8 rows (front, front_right, right, back_right, back, back_left, left, front_left).

Rear palette correction applies to back_left, back, back_right using the accepted V9 walking palette replacement rules; the same color mappings are extended to all 8 motions. The upper-hair y cutoff is scaled from 62/118 of each motion cell height. Other directions retain original colors.

All 512 frames receive a 1-pixel inner silhouette outline, color #253048, using 4-neighbor alpha boundaries. This does not alter alpha, frame size or transparent pixels. Existing v35-expanded-cells assets remain untouched as a fallback.

Corner trimming is deliberately excluded. This is an asset-only change; game runtime references are not switched automatically.
