# 19: Switch layout editor

Type: task
Status: ready-for-agent
Blocked by: 17

## What to build

The inspector's edit mode grows into the full Switch editor for a selected Switch: name and model, Rows (append and remove), per-Row port count (1–48), Port kind (RJ45, SFP, SFP+) and Port speed (100M–10G), the Port numbering preset, and a continue/start-over choice on each Row after the first (SFP-family rows default to start over). Edits apply to the Faceplate live, labels regenerate per the chosen convention, and inline validation keeps invalid input out while marking the offending field.

Structural edits that would remove connected Ports (row removal, count lowered) and deleting the Switch go through one confirm dialog naming the Switch and how many Connections will be severed; confirming severs them. All edits autosave. No row reorder, no label editing, no custom numbering in v1.

## Acceptance criteria

- [ ] A selected Switch's Rows can be appended and removed; each Row's count, kind, speed and the Port numbering preset are editable.
- [ ] Rows after the first offer continue/start-over, with SFP-family rows defaulting to start over; labels regenerate to match the convention.
- [ ] Invalid input is marked inline and cannot be committed; the Faceplate updates live as edits are made.
- [ ] Structural edits that would remove connected Ports, and deleting a Switch, confirm with the Switch name and the number of Connections to be severed; confirming severs them.
- [ ] App-level tests cover the edit paths, validation, both confirms and autosave.
