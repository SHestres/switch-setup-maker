# 16: Canvas, faceplate & navigation

Type: task
Status: resolved
Blocked by: None (can start immediately)

## What to build

Replace the summary stand-in with the Canvas. Every Switch in the Setup renders as a Faceplate positioned from its model coordinates: rows of Ports at the prototype's validated density (27px pitch), all switches at one consistent rack width. Renderer constants (body width, port pitch, row heights) live in the canvas layer, never in the model, and all geometry is derived from the model's port grid, never from DOM measurement.

Reading the model is the whole demo path for this ticket — restore and import must render faithful faceplates. Ports are plain DOM controls so they stay accessible and testable; chrome (status LEDs, console/USB tiles, brand mark) must be real or clearly de-emphasised.

The canvas navigates: drag a Switch body to reposition it; pan and zoom the Canvas; switch positions and the viewport persist through autosave and restore. The add-placement rule is built here — new switches land at the visible centre with a small diagonal cascade — and is exercised by the add flow in [17](17-add-flow-and-selection.md). The first-run card carries its final copy (add a switch, then click any two ports to wire them) until the first switch exists.

## Acceptance criteria

- [ ] Restoring or importing a Setup renders each Switch as a Faceplate with its Rows, printed labels, Port kinds and Port speeds, all at one rack width.
- [ ] Ports are plain DOM controls and no rendering path measures the DOM.
- [ ] Dragging a Switch updates its position and survives a refresh; a drag does not select or open anything by itself.
- [ ] Pan and zoom work, and the viewport survives a refresh.
- [ ] The add-placement rule lands a new switch at the visible centre with a small diagonal cascade, computed from the current viewport.
- [ ] The empty canvas shows the first-run card with its final copy until the first switch exists.
- [ ] App-level tests cover faceplate rendering from the model, the empty state, drag persistence and viewport persistence.

## Answer

The `SetupSummary` stand-in is gone; `<App />` now renders a real Canvas.

**What landed**

- `src/canvas/Canvas.tsx` — react-zoom-pan-pinch viewport (wheel/pinch zoom 0.3–4, free pan), absolute switches at model x/y, switch drag with a 4px threshold, port mousedowns reserved for wiring, post-drag click suppression (a drag never selects or clears), centred first-run card, `data-theme` from `ui.theme`. Viewport is reported on `onPanningStop`/`onWheelStop`/`onZoomStop` (equality-deduped, so no per-frame autosave); external viewport changes (import, New setup) are applied via `setTransform`.
- `src/canvas/Faceplate.tsx` + `faceplate.css` — one rack width for every switch, rows paired with printed label rows above/below, non-RJ45 rows rendered as left/right uplink banks with a range label (`SFP+ 49–52`), ports as plain DOM buttons whose accessible name is `"RJ45 port 1 (1G) on Core"`. Chrome (status LEDs, console/USB tiles, brand mark) is static, `aria-hidden` and de-emphasised; no titles or fake activity.
- `src/canvas/constants.ts` — renderer geometry (rack width 880, port pitch 27, row/label heights); the model stays geometry-free. Port anchors are derived from the model's rows only; no canvas path measures the DOM.
- `src/canvas/faceplateLayout.ts` — pure `splitBanks`/`bankLabel`/`portAriaLabel` consumed by the Faceplate.
- `src/canvas/placement.ts` — `visibleCentre` + `placeNewSwitch` (visible centre, 24px diagonal cascade wrapping every 6 placements; `DEFAULT_CANVAS_SIZE` fallback when the host has no size, e.g. jsdom). Ticket 17 consumes this.
- `src/model/document.ts` — additive `moveSwitch` and `setViewport` helpers.
- Canvas props expose the seam the next tickets need: `selectedSwitchId`/`onSelectSwitch`/`onClearSelection` (17), `onPortClick` (22). App passes only `document`, `onMoveSwitch`, `onViewportChange`.
- Deleted `src/ui/SetupSummary.tsx`. `.gitignore` widened to `node_modules` (a symlinked install is not matched by the trailing-slash pattern).

**Decisions recorded**

- One rack width = **880px**, chosen so 2×24 RJ45 + 4 uplinks at 27px pitch + chrome (34/74) + face padding (3px + 1px border) fit exactly at prototype density.
- `panning.excluded` uses bare names `['button', 'switch']`: RZPP 4.2 prefixes each entry with a dot when building its selector, so `.port`/attribute selectors throw in jsdom and abort panning.
- Drag/release-over-empty-canvas consumes the trailing click so 17's selection/deselection never fires after a drag.

**Evidence**

- `npm test` — 10 files, **90 tests passing** (baseline 67; +23).
- `npm run build` (tsc + vite), `npm run lint`, `npx prettier --check` — all green.
- App-level tests through `<App />`: restore + import faceplate rendering (rows, printed labels, kinds, speeds), empty-state copy, drag persistence across a remount, click-does-not-move, pan persistence across a remount, wheel-zoom persistence. Canvas-level tests: port clicks never select/clear, body click selects, empty click clears, drag moves by delta/zoom without selecting, port mousedown does not drag, drag over empty canvas does not clear. Unit tests: `placement.test.ts` (5), `faceplateLayout.test.ts` (6).
- Real-browser visual/pitch validation is deferred to ticket 25's acceptance run: no desktop browser was connected to this session, so density and theme fidelity were not eyeballed here.
