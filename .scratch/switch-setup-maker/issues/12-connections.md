# Draw & edit port-to-port connections

Type: task
Status: open
Blocked by: 09, 11

## Question

Implement connections: click a port to start, click another to land, and the connection renders as a line/curve between the two ports; select a connection to delete it; deleting a switch removes its connections; guard against invalid links (self-link, duplicate, port already in use).

Done when two switches can be wired port-to-port, the pair survives a refresh, and connections can be deleted cleanly.

## Answer

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Direction from [04](04-faceplate-prototype.md)**:
  - Cables exit ports **vertically by default** (up/down), not horizontally — covers less of the faceplate and reads like real cables.
  - Add a **toggle for cables drawn above vs behind** the switches; the blueprint theme always draws above.
  - Connected-port styling includes the jack-fill change (see [11](11-canvas-rendering.md)).
  - v1 stays link-state only; *needs adapter / speed mismatch / aggregated / loop* colours are future work (map fog), not this ticket.
- 2026-09-30 — **Direction from [06](06-mvp-ux-flows.md)**:
  - Rejected links (port already in use, self-link, duplicate pair) show a **transient hint near the port** — e.g. “Port 24 is already connected” — never silence.
  - Ports are wiring gestures only; switch selection comes from body clicks, so connection clicks never open the inspector.
  - Draft switches are non-interactable, so ports on a pending draft can't be wired or selected.
