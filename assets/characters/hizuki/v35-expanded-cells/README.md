# Hizuki V35 runtime sprite atlases

2026-11-04: walking v11 and running v20, directly rendered from textured GLB at orthographic elevation 40°. Each has 8 directions × 8 frames.

- walking_8dir.png: 640×944 pixels; 80×118 cells; 8 columns × 8 rows.
- running_8dir.png: 640×968 pixels; 80×121 cells; 8 columns × 8 rows.
- Row order: front / front_right / right / back_right / back / back_left / left / front_left.
- Keep exactly the original runtime filenames, dimensions, cell anchors, map distance-driven animation, and rendering code.
- Previous current sheets are archived under old/pre-v20-20261104/; earlier original sheets under old/ remain untouched.
- Other motions (fall, attack, cast, hit, victory) unchanged.
- runtime-audit.json includes exact PNG hashes and provenance.
- iPhone Safari live runtime approval remains a separate test.
