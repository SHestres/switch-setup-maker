# 21: Render cables from the model

Type: task
Status: resolved
Blocked by: 16

## What to build

A pure geometry module computes Port anchors and wire endpoints from the model's port grid and the renderer constants; it is unit-tested directly — dense inputs in, coordinates out — so jsdom never measures layout (per ADR 0001). One SVG overlay draws every Connection in the Setup as a line or curve between its two Ports; cables leave Ports vertically by default. Connected Ports change their jack fill (distinct grey in v1) in addition to the LED.

Removing Switches or Ports already cascades through the Connections in the model; the rendering follows. Wires persist with the rest of the document. Wiring interaction arrives in [22](22-wire-ports.md) — for now an imported or restored wired Setup must render true.

## Acceptance criteria

- [x] An imported or restored Setup renders every Connection as a line/curve between its two Ports, including same-switch links, at readable density.
- [x] Cables leave Ports vertically by default.
- [x] Connected Ports change their jack fill (distinct grey in v1) in addition to the LED.
- [x] The geometry module is unit-tested directly with dense inputs; app-level tests cover rendering and persistence.
- [x] No wiring interaction is introduced in this ticket.

## Answer

Built the cable layer on the existing canvas as three pieces: a pure geometry module, one SVG overlay, and connected-jack fills.

**New files**
- `src/canvas/geometry.ts` — `portAnchor(switch, portId)` returns a Port's tile centre in canvas units; `wireCurve(a, b)` returns a cubic SVG path with vertical tangents; `connectionCurve(setup, connection)` resolves both ends via `findSwitch` and returns `undefined` for stale refs. It mirrors the faceplate's flex layout (banks from `splitBanks`, portfield centring, label/row/cage heights, face growth) from `constants.ts`, never the DOM.
- `src/canvas/WireLayer.tsx` — one absolutely positioned SVG inside `.canvas-stage`, one `<path data-connection="…">` per Connection, `aria-hidden`, `pointer-events: none`.
- `src/canvas/geometry.test.ts` — 16 direct unit tests, dense coordinates in / coordinates out.
- `src/canvas/WireLayer.test.tsx` — 3 tests (per-connection path, same-switch links, no dangling wires after `removeSwitch`).

**Edited**
- `src/canvas/Canvas.tsx` — collects connected ports in one pass (`switch:port` keys, memoised), passes them to `Faceplate`, and renders `WireLayer` after the switches inside the canvas transform.
- `src/canvas/Faceplate.tsx` — additive `connectedPorts?: ReadonlySet<string>`; wired ports gain the `connected` class.
- `src/canvas/faceplate.css` — `.wire-layer` styling from the themed `--wire`/`--wire-width` tokens, `--jack-connected-bg`/`--sfp-connected-bg` for all three themes, and `.port.connected` rules (grey jack fill + lit LED).
- `src/canvas/constants.ts` — the faceplate internals the CSS and geometry must share: `FACE_BORDER`, `FACE_PADDING_X/Y`, `CHROME_LEFT/RIGHT_WIDTH`, `BANK_GAP`, `CAGE_ROW_HEIGHT`, `CAGE_GAP`.
- `src/App.test.tsx` (+4) and `src/canvas/Canvas.test.tsx` (+2) — app/component tests for rendering, jack class, persistence and inert port clicks.

**Geometry unit-test inputs (exact expectations)**
- Dense 48-port faceplate (24+24 RJ45, 4 SFP+ right) at (100, 50): p1 (151.5, 82.5), p24 (772.5, 82.5), p25 (151.5, 106.5), p48 (772.5, 106.5), p49 (807.5, 94.5), p52 (888.5, 94.5).
- Left uplink bank (2+2 SFP then 2 RJ45): p1 (375.5, 31.5), p3 (375.5, 57.5), p5 (437.5, 49), p6 (464.5, 49).
- Face growth beyond the 89px chassis (four 1-port rows): p1 (430, 47), p2 (430, 71), p3 (430, 113), p4 (430, 137).
- All-uplink layout (rendered on the main field): p1 (420, 32.5), p2 (420, 56.5).
- Curves: `(0,0)→(100,100)` = `M 0 0 C 0 50, 100 50, 100 100`; level `(0,0)→(200,0)` sags = `M 0 0 C 0 100, 200 100, 200 0`; adjacent `(0,0)→(27,0)` = `M 0 0 C 0 24, 27 24, 27 0`; capped `(0,0)→(1000,1000)` = `M 0 0 C 0 120, 1000 880, 1000 1000`.
- Restored sample connection sw1.p1→sw2.p2 = `M 509 409 C 509 429, 1073.5 429, 1073.5 449`; same-switch sw1.p1→sw1.p2 = `M 509 409 C 509 433, 536 433, 536 409`.
- Two arithmetic slips in the first test draft (bank count, cage pitch) were caught when the implementation disagreed and were corrected by hand — the tests are not tautological.

**Evidence**
- `npm test`: 144 tests / 13 files green (was 119 / 11). App-level tests cover a restored wired setup incl. a same-switch link, an imported wired setup, connected-port class across a refresh, and that port clicks change nothing.
- `npm run build`, `npm run lint`, `npm run format:check` all green.
- A real-browser visual pass was not possible (no desktop browser or headless browser in this environment); per the spec, density/fidelity is validated in ticket 25's acceptance pass.

**Decisions / caveats**
- The overlay paints **over** the faceplates for now (the prototype's arrangement), because "behind" would hide same-switch links behind the chassis. The cable-above/behind toggle and the blueprint override stay with [23](23-manage-connections-and-cable-layer.md), which can reorder this single element.
- Vertical exits: ports more than 24px apart vertically get a symmetrical S-curve (`bow = min(|dy| / 2, 120)`); level-ish ports hang in a sag (`bow = max(|dx| * 0.5, 24)`, capped at 120). Ticket 22 can reuse `portAnchor` + `wireCurve` for the pending wire.
- No wiring interaction was added: ports still just call `onPortClick` (unwired in `App`), and an app test asserts a port click leaves storage and the wire count untouched.
- Cascade safety: the overlay renders from the model and skips refs whose switch/port is gone; deletion cascades remain the model's job (already tested there).
- The geometry↔CSS mirror is the residual drift risk; the new constants and both modules cross-reference `faceplate.css`, and ticket 25's browser pass should confirm visually.
