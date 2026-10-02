# 44: Bulk edit cables

Type: task
Status: ready-for-agent
Blocked by: 43

## What to build

An app-bar Bulk edit cables toggle opens the bottom panel in a bulk mode ([post-MVP spec](../spec.md)).

- Two fields, each defaulting to Leave unchanged: the color field offers the nine tokens plus Default (clear color); the length field offers the chips plus Clear (clear length). Color-only, length-only and both-field sweeps all work.
- While the mode is on, press-drag across wires paints the set fields onto every wire crossed; a plain click paints one. Wires do not select while bulk mode is on.
- Done or Esc exits. Writes route through normal document writes so autosave and export carry them.

## Acceptance criteria

- [ ] The toggle opens and closes bulk mode; Done and Esc both exit.
- [ ] Leave unchanged, Default and Clear behave; color-only, length-only and both-field sweeps work.
- [ ] Press-drag paints each crossed wire; a click paints one; no wire selects while on.
- [ ] Autosave/export carry the edits.
- [ ] App-level tests cover the sweep and both exits; `npm test` is green.
