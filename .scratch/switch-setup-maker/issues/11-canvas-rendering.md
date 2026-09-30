# Render the canvas: faceplates, drag, pan/zoom

Type: task
Status: open
Blocked by: 04, 09

## Question

Implement the canvas: switches render as faceplates following ticket 04's chosen direction, positioned from the model; drag to reposition; canvas pan and zoom; selection and hover states.

Done when several switches render at readable density and can be dragged and found again after pan/zoom.

## Answer

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Direction from [04](04-faceplate-prototype.md)** (validated faceplate prototype + user reaction):
  - Build the faceplate as a **themed** component with the three directions from 04: light (diagrammatic), dark (photoreal **+ the light theme's dot-grid canvas**), blueprint. CSS-variable skinning, as prototyped.
  - All switches render at the **same rack width** (see also [05](05-domain-model.md)).
  - **Connected ports** change their jack fill (a distinct grey in v1) in addition to the green LED.
  - **Chrome honesty**: status LEDs, console/USB tiles and brand mark currently read as functional — make them real or de-emphasise them.
  - Density is validated; 48 ports stay readable at 27px pitch.
- 2026-09-30 — **Direction from [06](06-mvp-ux-flows.md)**:
  - Selection model: a switch body click selects it **and opens the inspector panel**; empty-canvas click deselects and closes it. Port clicks stay reserved for wiring.
  - New switches land at the visible centre with a slight diagonal cascade; the first-run empty canvas shows the centred CTA card until the first switch exists.
  - The canvas hosts the overlay inspector without resizing or re-fitting, and renders the blank-mode **draft switch** — transparent, non-interactable, live-updated by the builder's edits.
- 2026-09-30 — **Model layer landed** ([09](09-model-persistence.md)). Read switches from `useDocument()`'s `document.setup.switches` (already restored + autosaved); `findSwitch`/`findPort`/`isPortConnected` are exported from `src/model`. `document.ui` carries `theme` (light/dark/blueprint), `cableLayer` (behind/above) and `viewport`. `SetupSummary` in `src/ui` is the throwaway stand-in this ticket replaces.
