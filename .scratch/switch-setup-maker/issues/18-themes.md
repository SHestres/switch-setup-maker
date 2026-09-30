# 18: Themes & skinning

Type: task
Status: claimed
Blocked by: 16

## What to build

The Faceplate and Canvas become themed through CSS variables with the three styles from the prototype: light (diagrammatic), dark (photoreal, keeping the light theme's dot-grid canvas) and blueprint. An app-bar control switches themes; the choice lives in the document's `ui.theme`, persists and restores. Chrome (status LEDs, console/USB tiles, brand mark) stays honest and legible in every theme. The blueprint theme's cable-layer override lands with the connection work ([23](23-manage-connections-and-cable-layer.md)), not here.

## Acceptance criteria

- [ ] All three themes render the Canvas and Faceplates; switching is immediate and persists through refresh.
- [ ] Dark keeps the light theme's dot-grid canvas; blueprint stays legible at the validated density.
- [ ] Chrome stays honest and de-emphasised in every theme.
- [ ] App-level tests cover switching and restore.
