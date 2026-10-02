# 43: Cable color & length on the wire

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

Bring Cable metadata to the Canvas and its editor ([post-MVP spec](../spec.md)).

- **Rendering**: in light and dark, a wire's stroke is its Cable color; unset renders the theme's default wire. Hover brightens and slightly thickens the wire; selection adds thickness plus an accent halo with the color still visible. Blueprint keeps its monochrome tint and highlight behavior, showing true color only in swatches.
- **Selection**: clicking a wire selects it and shows a midpoint popover with Edit cable and Delete cable, replacing the standalone Delete affordance. The Delete/Backspace shortcut keeps its guard against text fields.
- **Cable mode**: Edit cable opens the bottom panel in a cable mode — nine swatches plus Default (clears), and a length field with 1/2/3/4/5/6/10 ft chips plus free entry (positive, one decimal, blank clears).
- Everything routes through normal document writes, so autosave and export carry it; documents without metadata load unchanged.

Done when a Cable can be recolored and given a length from the wire, and both clear again.

## Acceptance criteria

- [ ] Wired Connections render their true color in light/dark; unset uses the theme wire; blueprint stays tinted.
- [ ] Hover/selection keep the color visible and layer correctly in all three themes.
- [ ] Wire click selects and opens the midpoint Edit/Delete popover; no standalone Delete button remains.
- [ ] The cable mode sets and clears color and length per the rules; chips and free entry both work.
- [ ] Autosave/export carry the metadata.
- [ ] App-level tests cover selection, editing and clearing; `npm test` is green.
