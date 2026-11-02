---
name: build-layered-rpg-maps
description: Use when turning painted RPG concepts or independent scenery into playable maps, especially for walkability, feet anchors, collision, foreground occlusion, bridges, touch controls, map data and reproducible handoffs. Also use for 歩けるマップ, レイヤーマップ, 通行判定 and マップ制作手順 requests.
---

# Build playable layered RPG maps

Separate scenery pixels, physical occupancy, ground positions and occlusion. Deliver a playable small area and its reproducible data, not just a finished illustration.

## Establish the current source

Read project instructions, current renderer/input/movement/save formats and adopted assets. Exclude archived material from normal source selection and deployment. Follow the user's authorized scope without a separate approval gate. Preserve useful conventions; do not impose this example's engine, dimensions or camera on another game.

If characters are in production, use an identified approved still or a labelled geometry marker for movement tests. Store source version, common frame dimensions and shared feet anchor in a separate manifest. Do not invent walking frames, mirror asymmetric art, or crop/recentre each frame.

## Production sequence

1. **Record a contract:** map ID/revision, world units, projection, image dimensions, anchors, scales, walk planes, physical footprints, entrances and acceptance stage. Separate source pixels from metres and viewport zoom. Read [the contract](references/map-contract.md).
2. **Prove a route first:** spawn → obstacle front/back → entrance → bridge both ways → exit. Check foot-radius clearance and diagonal movement before decorating. Collision must not depend on art dimensions.
3. **Create independent scenery:** ground includes terrain hidden under objects. Houses, trees and props are separate RGBA images with matching view, scale and light. Use image generation for new raster art. Inspect real alpha and composites on light/dark ground; nonzero RGB under alpha=0 is invisible and is not a halo.
4. **Compose in the real renderer:** ground → ground props/bridge floor → contact shadows → depth-sorted scenery/characters → explicit foreground → UI. A tree may use feet depth; long walls, buildings, bridges and elevation may need split parts or explicit occlusion. Never derive collision from alpha or image bottom.
5. **Constrain movement:** positive walk surfaces plus obstacle footprints. A bridge contributes its deck only; it does not disable river collision globally. Document unsupported underpasses. Normalize diagonal speed, bound frame time/substeps, and clear input/routes on pointer cancel, focus loss and hidden tabs.
6. **Make placement reproducible:** derive art origin, footprint and walk surface from the same instance transform. Provide a feet/collision overlay. Validate map JSON and replacement animation arrays before installation. A failed import/image load keeps the working map. Export/import must restore placement without conversation-only coordinates.
7. **Verify before adoption:** real-renderer route, portrait/landscape, resize, front/back occlusion, bridge endpoints, stalled frames, malformed replacements and save/reload. Distinguish art, pure logic, cloud browser and target-device checks. Cloud screenshots do not prove iPhone hardware performance.
8. **Save the handoff:** source assets/provenance, schema, map JSON, character manifest, renderer, executable checks, generation conditions, inspection evidence and limits. Publish active runtime files only; exclude archived implementations and production tools.

## Inspect compatible map assets

For the documented `ground / assets / instances` JSON layout:

```bash
python scripts/check_map_assets.py /absolute/project/maps/village/map.json
```

Requires Pillow. It checks files, dimensions, alpha, anchors and shape metadata; it does not certify artistic quality, reachability or dynamic occlusion. Adapt field mapping explicitly for another project's schema.

## Fixed illustrated scenes

If the project chooses a single fixed background, retain it and register matching foreground masks at exact coordinates. Reconstruct hidden ground when it must be walked on. An opaque crop with included ground is not an independent movable prop. Do not rely on automatic illustration decomposition for production.

## Verified implementation example

`HiHoSir/kikokuno-hanachigiri`: `docs/PLAYABLE_MAP_WORKFLOW.md`, `maps/village/map.json`, `src/map/`, `tools/map-browser-smoke.mjs`. The example uses a 40° painted outdoor map, an approved still placeholder, separate house/tree/bridge images, JSON placement round trips and an `old/` quarantine. These are example settings, not universal constraints.
