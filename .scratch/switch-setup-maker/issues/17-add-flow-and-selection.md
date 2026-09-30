# 17: Add flow & selection

Type: task
Status: ready-for-agent
Blocked by: 16

## What to build

The app bar gains `+ Add switch`, opening the right-side overlay inspector (about 400px, never modal) in new-switch mode: the layout-preset gallery. Chips create the switch immediately in one click and select it; the 48-port entry prefills its model name ("Unifi 48 Port") and hover shows full preset details. Selecting a Switch by clicking its body opens the same panel on that switch, starting as a minimal editor for name and model that updates the Faceplate live; the panel closes with ✕, Esc or an empty-canvas click, which also deselects. Port clicks are reserved for wiring and never select.

The inspector overlays the Canvas without resizing or re-fitting it, and every new switch lands at the visible centre with the small diagonal cascade from the add-placement rule.

## Acceptance criteria

- [ ] `+ Add switch` opens the gallery; each chip creates its preset's exact layout — Rows, counts, kinds, speeds, labels, numbering convention — and selects it.
- [ ] Only the 48-port entry prefills the model name; hover shows full preset details.
- [ ] Body-click selects and opens the panel; ✕, Esc and empty-canvas click close and deselect; Port clicks never select or open the panel.
- [ ] Name and model edits update the Faceplate immediately and persist through refresh.
- [ ] New switches land at the visible centre with the diagonal cascade even after pan/zoom; opening or closing the panel never resizes or re-fits the Canvas.
- [ ] App-level tests add from every preset and drive selection open/close through rendered user interactions.
