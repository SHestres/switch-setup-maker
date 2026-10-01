# 17: Add flow & selection

Type: task
Status: resolved
Blocked by: 16

## What to build

The app bar gains `+ Add switch`, opening the right-side overlay inspector (about 400px, never modal) in new-switch mode: the layout-preset gallery. Chips create the switch immediately in one click and select it; the 48-port entry prefills its model name ("Unifi 48 Port") and hover shows full preset details. Selecting a Switch by clicking its body opens the same panel on that switch, starting as a minimal editor for name and model that updates the Faceplate live; the panel closes with ✕, Esc or an empty-canvas click, which also deselects. Port clicks are reserved for wiring and never select.

The inspector overlays the Canvas without resizing or re-fitting it, and every new switch lands at the visible centre with the small diagonal cascade from the add-placement rule.

## Acceptance criteria

- [x] `+ Add switch` opens the gallery; each chip creates its preset's exact layout — Rows, counts, kinds, speeds, labels, numbering convention — and selects it.
- [x] Only the 48-port entry prefills the model name; hover shows full preset details.
- [x] Body-click selects and opens the panel; ✕, Esc and empty-canvas click close and deselect; Port clicks never select or open the panel.
- [x] Name and model edits update the Faceplate immediately and persist through refresh.
- [x] New switches land at the visible centre with the diagonal cascade even after pan/zoom; opening or closing the panel never resizes or re-fits the Canvas.
- [x] App-level tests add from every preset and drive selection open/close through rendered user interactions.

## Answer

Built the add flow and selection surface, all exercised through `<App />`.

**New files**
- `src/model/presets.ts` — the layout-preset gallery as data (`LayoutPreset`, `LAYOUT_PRESETS`, `switchFromPreset`). Rows go through `materialiseRows`; `Unifi 48 Port` is the only entry with a `model`.
- `src/ui/Inspector.tsx` — the non-modal right-side overlay (`<aside>` 400px, ✕, Esc). It renders as a sibling of `<Canvas>` inside `<main className="relative">`, so it overlays without resizing or re-fitting.
- `src/ui/PresetGallery.tsx` — one-click chips; hover or focus renders the full preset details; takes `onStartBlank` as the clean ticket-20 seam (`Start blank` renders disabled until wired).
- `src/ui/SwitchEditor.tsx` — minimal name/model editor that ticket 19 can grow.

**Edited**
- `src/App.tsx` — inspector state (`gallery | editor | null`), add-from-preset via `nextSwitchId` + `placeNewSwitch(viewport, canvasSize, switches.length)`, autosaving name/model edits, selection wiring, and closing on Import/New setup.
- `src/ui/AppBar.tsx` — `+ Add switch` plus the `onAddSwitch` prop.
- `src/canvas/Canvas.tsx` — additive `onCanvasSizeChange` (ResizeObserver when the host provides one; ignored when the host reports 0×0) so placement uses the real visible centre; selection seam untouched.
- Tests: `src/App.test.tsx` (+18), `src/canvas/Canvas.test.tsx` (+1).

**Evidence**
- `npm test`: 116 tests / 11 files green (was 97). Coverage includes one exact-layout assertion per preset (numbers, labels, kinds, speeds, per-row numbering, port ids), model prefill and hover details, body-click select/open, ✕/Esc/empty-canvas close + deselect, port clicks never opening or disturbing the panel, visible-centre placement with the 24px cascade (default and panned/zoomed viewports), and the canvas transform staying put while the panel opens and closes.
- `npm run build`, `npm run lint`, `npm run format:check` all green. A production build was served locally for a visual pass, but no desktop browser was connected in this environment, so that pass fell back to the app-level tests.
- The hover-details test was mutation-checked (removing `onMouseEnter` fails it), so it is not vacuous.

**Decisions / caveats**
- Cascade index is the current switch count, so the seventh add wraps back to the visible centre (`CASCADE_WRAP`).
- `Start blank` is rendered disabled; ticket 20 only needs to pass `PresetGallery.onStartBlank` to start the draft flow.
- The 2×2 SFP+ uplink block is modelled as two 2-port rows (labels 25/27 top, 26/28 bottom), matching the layout tests and the ticket-16 faceplate banks.
