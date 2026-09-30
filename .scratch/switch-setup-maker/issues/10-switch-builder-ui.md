# Build the switch builder UI

Type: task
Status: open
Blocked by: 06, 09

## Question

Implement the add/edit switch flow from ticket 06's spec: entry point, name, rows builder (count, type, speed), the common presets, edit and delete for existing switches, and the validation states.

Done when a user can create a 24×1G + 4×SFP+ switch from a preset, hand-configure another, edit both, and delete one.

## Answer

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Direction from [06](06-mvp-ux-flows.md)** (full flow spec in its answer):
  - Surface: right-side **overlay inspector** (~400px, non-modal), opened from the app bar's `+ Add switch` or by selecting a switch. New-switch mode shows the **layout preset gallery**; chips create immediately (visible centre + cascade, selected, panel flips to the editor) — only the 48×1G + 4×SFP+ preset carries a model name (“Unifi 48 Port”), which prefills `model`; hover shows full details.
  - `Start blank` → ghost **draft switch**: zero ports, non-interactable, not in the setup; `Add switch` commits it (disabled until ≥1 non-empty row); dismissal discards it — silent when untouched, “Discard this switch?” once edited.
  - Builder fields: name/model (optional), rows (append/remove; count 1–48; kind RJ45/SFP/SFP+; speed 100M–10G), numbering preset (three generated conventions), per-row continue/start-over on rows after the first (SFP-family rows default to start over). No row reorder, no label editing in v1.
  - Delete switch and port-severing structural edits use a confirm dialog naming affected connections; inline validation keeps `Add switch` disabled.
- 2026-09-30 — **Model layer landed** ([09](09-model-persistence.md)). Build against `src/model/`: `materialiseRows(preset, RowSpec[])` turns the draft's rows into ports with `p1…` ids and generated labels; `relabelRows(layout)` regenerates labels after structural edits; `removePortsFromSwitch` / `removePorts(setup, switchId, ids)` sever connections as required; `nextPortId` / `nextSwitchId` mint ids. Rows after the first carry the per-row `numbering: 'continue' | 'start-over'` from 06 (absent = continue) — set it when materialising. `useDocument()` already restores + autosaves. The preset gallery data from 06's table and the whole draft-switch flow are still this ticket's to build.
