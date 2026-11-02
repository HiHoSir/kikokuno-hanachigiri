# Playable layered village implementation plan

Goal: build an iPhone-first walkable painted village from independent ground, house, tree and bridge assets, with replaceable character art.

Architecture: buildless Canvas2D; continuous X/Z world metres project through an explicit 40° orthographic-style profile. Geometry, navigation, character configuration and rendering remain separate. Old runtime and experiments are quarantined, not imported.

Scope: one outdoor map, touch/keyboard movement, tap routing, collisions, tree/house occlusion, bridge crossing, camera, placement inspection and JSON round trip. Interiors, story and finished walking sprites are outside this milestone.

1. Archive previous implementation and experiments byte-for-byte under `old/pre-layered-map-2026-11-02`, keep skills, current rules and approved Hizuki art. Record every original blob and quarantine deployment workflows.
2. Write failing geometry/navigation tests for land and water, a bridge, trunk/building footprints, diagonal clearance, frame stalls, routing and invalid placement saves. Implement pure modules in `src/map/` until tests pass.
3. Create independent art assets matching the prior village. Define anchors, physical footprints, surfaces, scale and stable depth order in map JSON. Keep source dimensions and source provenance.
4. Implement Canvas renderer, touch joystick, tap path, resize-safe camera, pause cancellation, replaceable character manifest and an inspection/placement drawer. Export/import validated map JSON; do not save an invalid character position.
5. Test actual browser portrait/landscape, collisions, tree front/back, bridge in both directions, placement round trip and input cancellation. Add a reusable browser smoke script. Publish current files only, excluding `old/`.
6. Save a reusable repo skill with the executable schema/checks and a concrete handoff guide; update the existing personal map skill with the lessons verified here. Verify reproduction independently.

Review focus: feet versus image bottom; radius clearance at bridge banks; no whole-map collision bypass on bridge; no stale touch after blur/cancel; archived pages/code/workflows excluded from current delivery. iPhone hardware verification remains separate from cloud browser checks.
