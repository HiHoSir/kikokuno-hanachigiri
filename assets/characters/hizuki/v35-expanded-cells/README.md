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

## Katana attack v44 (adopted 2026-11-05)

- Runtime atlas: `attack_katana_v44_corrected_8dir.png`, 1792×2048, cells 224×256, 8 directions×8 phases, period 1100ms, one-shot.
- Full-color original GLB UV-texture RGBA; 40° orthographic and camera-relative front lighting. No palette reduction, mirroring, frame cropping or pixel-art processing.
- Anchor `[111.6993006993007,209.5212972972973]`, runtime scale remains 0.85. Old `attack_katana_8dir.png` is preserved as rollback but no longer referenced in the motion registry.
- Source GLB SHA256: `f50236f3f065b38e8ce776b8494f6922cce17f2040b904766047c7b878f8ccb6`. PNG SHA256: `a83bd5a574877733c9e4fac5c8ce4f69b36e79be913107b2186179538a259c93`. Source and atlas QA are in `tools/hizuki-attack-v44/`.
- The Canvas2D map loads this sprite, not a GLB. Other eight motions remain unchanged; browser/iPhone real-device inspection is separate.

## 2026-11-05 v44スプライト方向・倍率修正

新しい運用画像は `attack_katana_v44_corrected_8dir.png`。初回公開版は、カメラyawが逆で左右向きが逆、70px/mで通常姿勢より約17%大きい欠陥があったため不採用とした。修正版は60px/m・yaw `[0,-45,-90,-135,180,135,90,45]`、登録オフセット[-2,-4]、8×8全セル・足元共通。元のv44ボーンアニメーション・他8動作は変更なし。詳細は `docs/HIZUKI_ATTACK_V44_SPRITE_CORRECTION.md` と `tests/attack-atlas-v44.test.js`。
