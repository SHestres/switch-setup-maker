# 16: Canvas, faceplate & navigation

Type: task
Status: claimed
Blocked by: None (can start immediately)

## What to build

Replace the summary stand-in with the Canvas. Every Switch in the Setup renders as a Faceplate positioned from its model coordinates: rows of Ports at the prototype's validated density (27px pitch), all switches at one consistent rack width. Renderer constants (body width, port pitch, row heights) live in the canvas layer, never in the model, and all geometry is derived from the model's port grid, never from DOM measurement.

Reading the model is the whole demo path for this ticket — restore and import must render faithful faceplates. Ports are plain DOM controls so they stay accessible and testable; chrome (status LEDs, console/USB tiles, brand mark) must be real or clearly de-emphasised.

The canvas navigates: drag a Switch body to reposition it; pan and zoom the Canvas; switch positions and the viewport persist through autosave and restore. The add-placement rule is built here — new switches land at the visible centre with a small diagonal cascade — and is exercised by the add flow in [17](17-add-flow-and-selection.md). The first-run card carries its final copy (add a switch, then click any two ports to wire them) until the first switch exists.

## Acceptance criteria

- [ ] Restoring or importing a Setup renders each Switch as a Faceplate with its Rows, printed labels, Port kinds and Port speeds, all at one rack width.
- [ ] Ports are plain DOM controls and no rendering path measures the DOM.
- [ ] Dragging a Switch updates its position and survives a refresh; a drag does not select or open anything by itself.
- [ ] Pan and zoom work, and the viewport survives a refresh.
- [ ] The add-placement rule lands a new switch at the visible centre with a small diagonal cascade, computed from the current viewport.
- [ ] The empty canvas shows the first-run card with its final copy until the first switch exists.
- [ ] App-level tests cover faceplate rendering from the model, the empty state, drag persistence and viewport persistence.
