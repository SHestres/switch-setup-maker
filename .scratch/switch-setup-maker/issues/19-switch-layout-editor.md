# 19: Switch layout editor

Type: task
Status: resolved
Blocked by: 17

## What to build

The inspector's edit mode grows into the full Switch editor for a selected Switch: name and model, Rows (append and remove), per-Row port count (1–48), Port kind (RJ45, SFP, SFP+) and Port speed (100M–10G), the Port numbering preset, and a continue/start-over choice on each Row after the first (SFP-family rows default to start over). Edits apply to the Faceplate live, labels regenerate per the chosen convention, and inline validation keeps invalid input out while marking the offending field.

Structural edits that would remove connected Ports (row removal, count lowered) and deleting the Switch go through one confirm dialog naming the Switch and how many Connections will be severed; confirming severs them. All edits autosave. No row reorder, no label editing, no custom numbering in v1.

## Acceptance criteria

- [x] A selected Switch's Rows can be appended and removed; each Row's count, kind, speed and the Port numbering preset are editable.
- [x] Rows after the first offer continue/start-over, with SFP-family rows defaulting to start over; labels regenerate to match the convention.
- [x] Invalid input is marked inline and cannot be committed; the Faceplate updates live as edits are made.
- [x] Structural edits that would remove connected Ports, and deleting a Switch, confirm with the Switch name and the number of Connections to be severed; confirming severs them.
- [x] App-level tests cover the edit paths, validation, both confirms and autosave.

## Answer

Built the full layout editor, all exercised through `<App />`.

**New model module — `src/model/layoutEdit.ts`** (additive; no schema change)
- `RowEdit { source: number | null, spec: RowSpec }`, `LayoutEdit { numbering, rows }`; `source` is the row's index in the switch being edited, `null` for a row appended by the edit. Rows are matched by `source`, never by order, so removing a middle row cannot hand its ports' identities to the row below.
- `planLayoutEdit(switch_, edit)` rebuilds a switch's layout from row specs. **Port identity rules:** a row survives if its `source` row survives; within a surviving row, ports keep their existing ids column by column (left to right), columns past the new count are removed, and columns beyond the old count mint fresh `p<n>` ids starting after the switch's current highest id (`nextPortId`). Removed rows remove all their ports. Kind, speed and labels always follow the edit; labels regenerate through the same `generateLabels` routine `relabelRows` wraps. Rows after the first always carry an explicit `numbering` (`continue` when the spec leaves it out).
- `countSeveredConnections(setup, switchId, portIds)` counts each connection touching a removed port once.
- `applyLayoutEdit(document, switchId, edit)` purges severed connections via the existing `removePorts` cascade and installs the rebuilt switch.

**UI**
- `src/ui/SwitchEditor.tsx` grows from the name/model editor into the full editor: Name, Model, Port numbering preset (three generated conventions; a `custom` layout shows a disabled "Custom (not editable in v1)" option and read-only rows until a generated convention is chosen), Rows list (append/remove; per-row Ports 1–48, Kind, Speed, and Continue/Start over on rows after the first), and a destructive `Delete switch` button.
- Counts are controlled by a draft string; they commit on blur or Enter, not per keystroke (a valid "2" on the way to "24" is a different layout and could pop a severing confirm mid-typing). Selects commit on change. Invalid counts (empty, non-integer, <1, >48) set `aria-invalid`, show "Enter a whole number from 1 to 48." inline and never reach the document.
- SFP-family default: a new row starts as 12×RJ45 1G; a row after the first whose numbering is still the previous kind's default moves to the new kind's default when the kind changes (RJ45→SFP/SFP+ flips continue→start-over, SFP→RJ45 flips back), while an explicit user choice is left alone.
- `Remove row` is disabled for the last remaining row (a Switch must keep a non-empty row), and structural edits that would sever nothing apply immediately without a dialog.
- `src/App.tsx` owns the one `PendingConfirm` surface (Base UI AlertDialog via `src/ui/Dialog.tsx`) and the edits: layout edits are planned first, confirmed when they would sever connections, then applied; delete always confirms and closes the inspector after removing the switch via `removeSwitch`. All edits go through `setDocument`, so `useDocument` autosaves them.

**Confirm copy** (name + sever count, always visible)
- Structural: title `Change layout?`, description `Applying this change to <name> severs <n> connection(s).`, buttons `Cancel` / `Apply`.
- Delete: title `Delete switch?`, description `Deleting <name> severs <n> connection(s).` (`severs no connections.` at zero), buttons `Cancel` / `Delete`.
- `<name>` is `name || model || id`, the same label the Faceplate prints.

**Tests**
- `src/model/layoutEdit.test.ts` (new, 9 tests): id preservation on lowered/raised counts, middle-row removal using source indices, kind/speed/numbering changes keeping ids, appended rows minting after the highest id, `countSeveredConnections`, and the document-level cascade.
- `src/App.test.tsx` (+12 tests, appended in one `switch layout editor` describe): row controls render the selected switch's layout; a count change updates the Faceplate and storage; invalid counts are marked and never commit; kind default-follow with an explicit override; speed and preset changes relabel live; appending and unconnected removal apply without a dialog; the count-severing confirm (cancel and apply); the row-removal severing confirm; delete with connections (cancel and delete, inspector closes, connections purged) and delete with none.

**Evidence**
- `npm test`: 140 tests / 12 files green (was 119 / 11). `npm run build`, `npm run lint`, `npm run format:check` all green.
- The validation and kind-default tests were mutation-checked (relaxing the range check and removing the default-follow both make them fail).
- No desktop browser was connected in this environment, so the visual pass fell back to the app-level tests.

**Decisions / caveats**
- Ports that survive keep their ids and therefore their connections; only genuinely new ports are reminted, and every connection touching a removed port is purged (user stories 45–46).
- The last row cannot be removed and counts cannot be lowered below 1; `custom` numbering stays read-only in v1 as specified.
- `new row` defaults to 12×RJ45 1G (half of the common 2×12 arrangement) — not pinned by the spec; ticket 20 can adjust the draft's default row.
- The number preset select maps to human labels ("Odd top / even bottom", "Sequential", "Even top / zero-based").

Superseded by [27](27-section-faceplate-and-editor.md) — the row editor is replaced by the section editor.
