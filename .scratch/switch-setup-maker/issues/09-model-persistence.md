# Implement the domain model, autosave & JSON I/O

Type: task
Status: resolved
Blocked by: 05, 08

## Question

Implement the model from ticket 05 as code, with:

- Types for setup, switch, port, and connection.
- Autosave to browser storage; restore on load.
- JSON export/import with validation, wired to the UI entry points from ticket 06's spec.
- Unit tests for the domain logic — layout handling, connections, round-trip serialization.

Done when tests pass and a browser refresh restores the current setup.

## Answer

Resolved 2026-09-30. The model from ticket 05 is code, and autosave, restore and JSON import/export are wired into the app. 67 tests green; `npm run build`, `npm run lint` and `npm run format:check` clean.

**Modules (`src/model/`)**

- `types.ts` — `SetupDocument`, `Setup`, `Switch`, `Port`, `Connection`, the enums plus runtime lists; `DOCUMENT_VERSION = 1`.
- `layout.ts` — layout handling: `generateLabels` (the three generated conventions), `materialiseRows` (draft → rows of ports with stable `p1…` ids), `relabelRows` (regenerate labels, keep ids; `custom` untouched), `removePortsFromSwitch`, `nextPortId`.
- `connections.ts` — `connect` (returns `{ ok }` or `{ ok: false, problem }`), `connectionProblem`, `disconnect`, `isPortConnected`, `connectionsTouchingSwitch`, `removeSwitch`, `removePorts`. Problem messages use ticket 06's copy ("Port 24 is already connected.") and carry the offending `port` for the canvas hint.
- `document.ts` — `createEmptyDocument`, `findSwitch`/`findPort`, `nextSwitchId`, `resetSetup` (New setup: keeps theme + cable layer, resets viewport).
- `serialize.ts` — `serializeDocument` (pretty JSON); `parseDocument`/`parseDocumentText` enforce every invariant in ticket 05, default missing `name`/`model`/`numbering`/`ui`, ignore unknown fields, and name the first problem in plain language.
- `storage.ts` — `loadDocument`/`saveDocument` against an injectable `Storage`; corrupt or unreadable saves are warned about and ignored.
- `files.ts` — `exportDocumentFile` (downloads `switch-setup-YYYY-MM-DD.json`), `importDocumentFile` (reads + validates a chosen file).
- `useDocument.ts` — React binding: lazy restore on load, autosave on every change (synchronous, so closing the tab right after an edit cannot lose it).

**Additive model note (from 05).** 05 left "uplink rows number independently or continue, as chosen in the builder" without a field to store it. Rows after the first may now carry `numbering: 'continue' | 'start-over'`; absent means `continue`, and the field is written to JSON only when set. Ticket 10 sets it from the builder's per-row control.

**Numbering behaviour** is tested against ticket 06's preset table as worked examples: odd-top/even-bottom, sequential and even-top-zero-based share one column-pair algorithm with base 1 vs base 0 — Unifi 48 continues its SFP+ row 49–52; 24×1G + 2×SFP restarts it 1–2; the 24×1G + 4×SFP+ 2×2 block continues 25/27 top, 26/28 bottom (matching research 02's sketch A); the Juniper 12×1G + 2×SFP restarts at 0–1.

**UI wiring (`src/ui/`, `src/App.tsx`).** The app bar carries `Import`, `Export` and `New setup` per ticket 06: import validates → error dialog naming the first problem → confirm before replacing a non-empty setup → applies `setup` + `ui`; export downloads pretty JSON with failures surfaced; New setup confirms, then clears switches, connections and the viewport. Dialogs are a small `Dialog` component on Base UI's AlertDialog. `SetupSummary` shows the live model (switch names + counts) as a throwaway stand-in for ticket 11's canvas; the scaffold's `Placeholder` is gone.

**Tests** (67): layout 16, connections 11, serialization/validation 18, storage 6, file I/O 3, `useDocument` 4, App-level 9 — the App suite covers "restores the autosaved setup on load", the import error/confirm flows, the export filename and New setup. The dev server was left running at `http://localhost:5173` for a manual click-through; the desktop browser wasn't connected to this session, so restore-on-load is proven at the App level (`localStorage` → full render) rather than in a live tab.

**Handoff to 10/11/12**: build on `useDocument()` and the pure modules above; the preset gallery data from 06 and the draft-switch flow are still ticket 10's, and `SetupSummary` is replaced by the canvas in 11.

## Comments

- 2026-09-30 — **Direction from [06](06-mvp-ux-flows.md)** (flow spec in its answer):
  - JSON actions live in the app bar: `New setup` (confirm; clears setup + viewport, keeps theme/cable-layer prefs), `Import` (validate → error dialog naming the first problem → confirm before replacing a non-empty setup → apply `setup` + `ui`), `Export` (pretty JSON download, e.g. `switch-setup-YYYY-MM-DD.json`; failures surfaced).
  - v1 error surfaces include the import dialog, the export-failure message and builder inline validation — failures are never swallowed silently.
  - The blank-mode **draft switch** is UI-only: it never enters the model or storage; only commit materialises it.
