# 41: Port hover card & far-end trace

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

Hovering a Port opens a small read-only bubble anchored above its jack — the refusal hint's dark-bubble styling and placement, `pointer-events: none`, no actions ([post-MVP spec](../spec.md)).

- **Rows**: the Port's label · kind · speed always; `Connected to: <switch label> · <port label>` for a wired Port (a same-Switch link repeats the Switch's own label); `Connected to: <name>` or `Connected to: Device` for a Device Connection; `PoE: yes` only when the Port's Section supplies PoE; `Cable: <n> ft` only when a length is set. No color row or swatch.
- **Timing**: ~250 ms on connected Ports, ~500 ms on free ones, immediate hide on mouse-out.
- **Trace**: existing cues only — the accent border on the hovered Port, the same border on the far Port, the Cable's hover highlight; a Device Connection has no far-end geometry, so the card is the whole reveal. No auto-pan.
- **Quietness**: while a pending wire is drawing, the source Port stays fully quiet and a refusal hint takes precedence; any other gesture start hides the card. Ghost draft Ports stay inert.
- **Accessibility**: each connected Port's accessible name carries the far end (and PoE), e.g. `RJ45 port 1 (1G) on Unifi 48 Port, connected to Core Switch port 24`; the WCAG 1.4.13 hoverable gap is the accepted trade-off.

## Acceptance criteria

- [ ] All five row kinds render under the right conditions, with no color row/swatch.
- [ ] Delays, immediate hide and the connected/free split behave; fake-timer tests cover them.
- [ ] The far Port and Cable trace render with existing cues only; no auto-pan.
- [ ] Pending-wire quietness, refusal precedence and draft inertness hold.
- [ ] Accessible names include the far end and PoE.
- [ ] App-level tests cover the card and trace; `npm test` is green.
