# 28: MVP pre-merge edits

Type: task
Status: resolved
Blocked by: None (can start immediately)

## What to build

The agreed edit batch on `integration/mvp` before the branch merges to `main`. The disabled "Custom (not editable in v1)" numbering option is removed by the Section redesign, so its removal is absorbed by [27](27-section-faceplate-and-editor.md) — do not duplicate it here.

**Placement**

- Fix the add-placement cascade so a new switch can never land stacked on a survivor after deletions. The cascade offset currently keys to the switch count (`placeNewSwitch(…, document.setup.switches.length)` in `src/App.tsx`), so a deletion hands a later switch an occupied slot. Make placement collision-free and cover it with a test.

**Live cable tracking**

- Cables follow a dragged switch live, frame-by-frame: the wire geometry takes the live drag delta so every frame redraws the cables and the selected cable's delete affordance, while the model is still only written on gesture end.

**Tests**

- Trim the gesture-physics tests and the exact-CSS-transform / internal-selector assertions down to behaviour-level checks; keep the pure geometry unit tests. Behaviour-level drag/viewport *persistence* checks are fine.
- The Node static-server suite (`scripts/serve.test.mjs`) counts as a third seam — update the "two app seams" wording where it appears.

**Standards cleanups**

- Dedupe the ThemeControl/CableLayerControl segmented control.
- Dedupe the three near-identical `ui` setters in `src/model/document.ts` (`setViewport`, `setTheme`, `setCableLayer`).
- Dedupe the duplicated content-height formula in `src/canvas/geometry.ts`.
- Rename the `wiring.PendingWire` type versus the `PendingWire` component so state and renderer are distinguishable.
- (The App.tsx / SwitchFields.tsx dedupes are absorbed by the [27](27-section-faceplate-and-editor.md) redesign.)

**Keep**

- `docker-compose.yml` and its README section, Delete/Backspace cable deletion, and `scripts/serve.test.mjs`.

**Docker**

- Docker `build`/`run` verification stays owed on a Docker-capable machine — [24](24-self-host-path.md)'s context records why (no container runtime in the dev environment).

## Acceptance criteria

- [ ] A new switch never lands stacked on an existing switch after deletions.
- [ ] Dragging a switch redraws its cables and the selected cable's delete affordance every frame; the document is written only on gesture end.
- [ ] Gesture/physics and exact-rendering assertions are trimmed to behaviour-level checks; the pure geometry unit tests stay; the static-server test is documented as the third seam.
- [ ] `docker-compose.yml` + its README section, Delete/Backspace cable deletion and `scripts/serve.test.mjs` are retained.
- [ ] The ThemeControl/CableLayerControl, `ui` setter, content-height and `PendingWire` naming duplications are removed.
- [ ] Docker `build`/`run` verification remains outstanding and is called out as such (not silently skipped).
- [ ] `npm test`, `npm run build` and `npm run lint` are green.

## Answer

Implemented (work commit `882073a`, merged `0f99306`). Placement: `placeNewSwitch(viewport, container, occupied)` scans mirrored cascade candidates and never reuses an occupied top-left, so a deletion cannot hand a later switch an occupied slot. Live tracking: geometry takes the in-flight drag position (`MovedSwitch`) and `WireLayer` and the selected-cable affordance redraw every frame, while the document is written only on gesture end. Tests were trimmed to behavior level (persistence/drag outcomes) with the pure geometry/placement unit tests kept, and `scripts/serve.test.mjs` counts as the third seam. Dedupes: shared `SegmentedControl`, generic `setUi`, `faceContentHeight`, `PendingWireState`. Kept: `docker-compose.yml` + its README section, Delete/Backspace cable deletion, `scripts/serve.test.mjs`.

**Docker verification (previously owed) is complete**, on rootless Docker: the multi-stage image builds; `docker run` with no configuration serves 200 (HTML and hashed JS asset) with correct 404s; `-e PORT=3000 -p 3000:3000` serves 200; `docker compose up` with `PORT=8081` serves 200 and `down` cleans up; the same `dist/` served from a sub-path (`/app/`) gives zero 404s. Full acceptance: story 134/134, visual 27/27, zero console/page errors; evidence in `/tmp/opencode/ssm-accept2/evidence.md`.
