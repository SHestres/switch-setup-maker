# Design the MVP editing UX

Type: grilling
Status: resolved

## Question

Pin down the editing flows for the MVP so the build tickets are unambiguous:

- Adding a switch: entry point, dialog vs. panel, fields (name, layout rows: count/type/speed), where presets appear.
- Editing and deleting a switch: selection, editing surface, confirmation.
- JSON import/export placement.
- Empty state / first-run hint.
- Validation and error states worth having in v1.

Deliverable: a short flow spec in the answer (or a linked doc) covering the above. Canvas interactions (drag, pan/zoom, connect) are settled separately by ticket 04's prototype and the canvas tickets.

## Answer

Resolved by grilling (2026-09-30). Flow spec for the MVP editing UX; tickets 09, 10, 11 and 12 build against it. Canvas gestures (drag, pan/zoom, wiring) stay as validated by 04's prototype.

### App shape

- App bar across the top: title left; `+ Add switch`, `New setup`, `Import`, `Export` on the right.
- The editor is a **right-side overlay inspector** (~400px) floating above the canvas — the canvas keeps its full size and geometry; never modal; closes with ✕ or Esc. New switches centre on the uncovered area (visible centre + a small diagonal cascade).
- First run (empty canvas): a centred card — “No switches yet”, one line on the model (“Add a switch, then click any two ports to wire them”) and **Add your first switch**, opening the same add flow. It vanishes at the first switch.

### Adding a switch

- `+ Add switch` opens the panel in **new-switch mode**: the **layout preset gallery** (see GLOSSARY — distinct from the port numbering preset). Presets are data, a seam for real device models later. Exactly one 48-port entry:

  | Chip (model if set) | Layout | Numbering | Uplink row |
  |---|---|---|---|
  | 24×1G + 2×SFP | 2×12 RJ45 1G; 2 SFP 1G | odd-top/even-bottom | start over (SFP 1–2) |
  | **Unifi 48 Port** | 2×24 RJ45 1G; 4 SFP+ 10G | odd-top/even-bottom | continue (49–52) |
  | 24×1G + 4×SFP+ | 2×12 RJ45 1G; 2×2 SFP+ 10G | odd-top/even-bottom | continue (25–28) |
  | 12×1G + 2×SFP | 2×6 RJ45 1G; 2 SFP 1G | even-top, zero-based (Juniper) | start over (0–1) |
  | Start blank | draft flow below | — | — |

- A preset chip **creates the switch immediately** — visible centre + cascade, selected on the canvas — and the panel flips to its editor. The preset's model name (when set) prefills `model`; `name` stays blank. Chips show the model name if set, else the layout description; hover shows full details (rows, kinds, speeds, numbering).
- **Start blank → draft switch**: a ghosted, non-interactable bare faceplate (zero ports) at the canvas centre. It is **not in the setup** until committed. The panel's rows builder live-previews it; `Add switch` (disabled until the layout has ≥1 non-empty row) commits it — real, selected, panel stays as its editor.
- Dismissing the panel while a draft is pending (empty-canvas click, body-clicking another switch, ✕/Esc, another `+ Add switch`) discards the draft: silently when untouched, after a **“Discard this switch?”** confirm once edited.

### Editing a switch

- Clicking a switch body (any non-port area) selects it and opens the panel; empty-canvas click closes it. Port clicks stay reserved for wiring.
- Panel fields, all live-edit + autosave, previewed on the canvas:
  - `name` and `model` — optional free text (the 48-port preset prefills its model name).
  - **Rows**: append / remove; per row: count (1–48), kind (RJ45 / SFP / SFP+), speed (100M / 1G / 2.5G / 5G / 10G).
  - **Numbering preset**: the three generated conventions; custom/hand-edited labels stay post-MVP.
  - **Per-row numbering** on rows after the first: *continue* / *start over*. Presets set the conventional value; hand-added SFP-family rows default to *start over*.
  - No row reorder in v1.
- **Delete switch** at the panel's foot: confirm dialog naming the switch and — when ≥1 — how many connections go with it; afterwards the panel closes, nothing selected.
- Builder edits that would delete connected ports (row removed, count lowered) get the same confirm dialog.

### Persistence

- `New setup`: confirm (“Discard the current setup?”); clears switches, connections and the viewport; keeps theme + cable-layer preferences.
- `Import`: validates first (ticket 05's invariants); failures open a dialog naming the first problem; a valid import confirms before replacing a non-empty setup, then applies `setup` + `ui`.
- `Export`: pretty-printed JSON download (e.g. `switch-setup-YYYY-MM-DD.json`). A failed export is surfaced, never swallowed silently.
- v1 error surfaces: import error dialog; builder inline validation (Add disabled, message on the offending field); transient connection-rejection hint near the port (e.g. “Port 24 is already connected”); export-failure message. Everything else may fail quietly to the console.
