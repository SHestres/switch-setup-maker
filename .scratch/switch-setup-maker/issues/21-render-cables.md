# 21: Render cables from the model

Type: task
Status: ready-for-agent
Blocked by: 16

## What to build

A pure geometry module computes Port anchors and wire endpoints from the model's port grid and the renderer constants; it is unit-tested directly — dense inputs in, coordinates out — so jsdom never measures layout (per ADR 0001). One SVG overlay draws every Connection in the Setup as a line or curve between its two Ports; cables leave Ports vertically by default. Connected Ports change their jack fill (distinct grey in v1) in addition to the LED.

Removing Switches or Ports already cascades through the Connections in the model; the rendering follows. Wires persist with the rest of the document. Wiring interaction arrives in [22](22-wire-ports.md) — for now an imported or restored wired Setup must render true.

## Acceptance criteria

- [ ] An imported or restored Setup renders every Connection as a line/curve between its two Ports, including same-switch links, at readable density.
- [ ] Cables leave Ports vertically by default.
- [ ] Connected Ports change their jack fill (distinct grey in v1) in addition to the LED.
- [ ] The geometry module is unit-tested directly with dense inputs; app-level tests cover rendering and persistence.
- [ ] No wiring interaction is introduced in this ticket.
