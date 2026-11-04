# Hizuki V35 runtime sprite atlases

## Camera-light-matched locomotion 2026-11-04 (v23)

Walking v11 and running v20 were re-rendered with the *same* 3D source-to-sprite scale (0.295) and the same camera-relative original front lights as idle v21, orthographic 40° above horizontal. Full-color RGBA is preserved (no forced 30-color palette or pixel-art operation).

| Motion | PNG dimensions | Cell | Runtime anchor | Source duration |
| --- | --- | --- | --- | --- |
| idle v21 | 640×1056 | 80×132 | [43.6993, 106.5213] | 3.6 s |
| walking v23 (from animation v11) | 640×1280 | 80×160 | [43.6993, 129.5213] | 1.12 s |
| running v23 (from animation v20) | 768×1280 | 96×160 | [51.6993, 129.5213] | 0.66 s |

- Sheet rows: front / front_right / right / back_right / back / back_left / left / front_left.
- Columns: eight animation phases. No per-frame trimming, mirroring, or pose edits.
- Walking and running use the source texture and smooth image scaling; other motions stay unchanged.
- The larger **transparent** cells prevent silhouette clipping, without enlarging actual world sprites beyond the common 0.295 source scale. Runtime scale 0.85, map camera scale, movement speed, and distance-linked gait phase remain as before.
- Archive snapshots: `old/pre-v23-20261104/` stores the immediately previous (v20-runtime) walking and running PNGs; earlier histories remain intact.
- `runtime-audit.json` contains image hashes and metadata. The approved `normal.png` is unchanged.
- 64/64 cells have non-empty alpha, high-color texture content, and no clipped edges (both motions).
- The apparent difference between front-facing running and rear-facing running at 40° is a projection effect of the **approved run pose**, not a per-direction image scaling operation. Visual final approval and iPhone Safari verification remain separate.
