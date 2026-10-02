# 46: Speed highlight mode & legend

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

An app-bar control beside Cable layer toggles Speed highlight, off by default, persisted as `ui.speedHighlight` through autosave/restore ([post-MVP spec](../spec.md)).

- While on, jack fills tint by tier: 100M/1G calm, 2.5G/5G warm, 10G accent — theme tokens in every theme.
- Connected Ports (wired or Device-attached) blend their tier tint toward the connected gray; LED, border, hover and selection states layer exactly as today.
- The mode is additive: Cables keep their colors, labels and chrome are untouched, nothing dims.
- A small non-interactive legend mapping swatch to tier floats in a Canvas corner only while the mode is on. The draft ghost never takes the tint.

## Acceptance criteria

- [ ] The toggle is off by default, persists through autosave/restore, and sits beside Cable layer.
- [ ] Tier tints render in all themes; connected Ports blend toward the connected gray.
- [ ] Additive-only: Cables, labels and chrome unaffected; no dimming.
- [ ] The legend appears only while the mode is on and is non-interactive.
- [ ] App-level tests cover the control and persistence; visual acceptance against a production build; `npm test` is green.
