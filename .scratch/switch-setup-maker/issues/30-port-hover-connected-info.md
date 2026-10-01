# 30: Port hover — show what a port is connected to

Type: grilling
Status: resolved
Blocked by: 29

## Question

Decide what hovering a Port reveals and how.

- When the Port is attached to a device, a tooltip shows the device's name (or simply "device" when generic); when wired to another switch Port, what is shown (switch name + port label?) is to be decided.
- The hover must not interfere with click-to-wire gestures; consider a touch/accessibility fallback.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.

## Answer

Resolved 2026-10-01. Hovering a Port opens an anchored port info card and traces its Connection.

### The card

- A small read-only bubble anchored above the hovered Port's jack — the refusal hint's (ticket 22) dark-bubble styling and `portAnchor` placement, with `pointer-events: none`. One visual language for port-anchored bubbles.
- Content is a stack of data-driven info rows; future tickets append rows. No actions live in the card — right-click device attach (ticket 29) and click-to-wire (ticket 22) keep their jobs.
- Rows:
  - The Port's own identity, always: label · kind · speed (e.g. `12 · RJ45 · 1G`).
  - A connection row when one exists: `Connected to: <switch label> · <port label>` for a wired Port — same-switch links repeat the Switch's own label, no "this switch" special case; for a Device Connection, `Connected to: <name>`, or `Connected to: Device` when generic (ticket 29).
  - PoE joins as a row once ticket 33 models a Port's PoE capability; cable metadata rows (colour/length/type) remain ticket 31's decision.
- Shows on every Port: ~250 ms hover delay for connected Ports, ~500 ms (double) for free ones so sweeping a field stays quiet. Hide is immediate on mouse-out.
- No touch gesture in v1 (desktop-first per the spec). The far-end information also rides each connected Port's accessible name, so keyboard and screen-reader users are not dependent on hover (e.g. `RJ45 port 1 (1G) on Unifi 48 Port, connected to Core Switch port 24`; device equivalent).
- Ghost draft Ports stay inert — no card.

### The trace

- Hovering a Port highlights the chain with existing cues only, no new UI element:
  - the hovered Port keeps its existing accent jack border;
  - the far Port gets the same accent jack-border treatment as if hovered;
  - the Cable between them gets its existing hover highlight.
- A Device Connection has no far-end geometry — the card is the whole reveal.
- The far end may be on another Switch or off-screen; no auto-pan — the trace is a cue, not navigation.

### Interaction rules

- While a pending wire is drawing: candidate Ports behave normally; the source Port stays fully quiet (no card, no trace) — its dashed wire is the cue. A refusal hint takes precedence over the card at the same Port.
- Any gesture start (switch drag, Port press) hides the card.
- WCAG 1.4.13's "hoverable" condition is consciously accepted as a gap for the visual card; the accessible-name enrichment covers the information.

### Composition

- Ticket 31: cable metadata rows are future card rows; cable hover/selection info remains 31's decision.
- Ticket 33: a Port's PoE capability joins the card as a row once modelled.
- Tickets 34/35: the device row reads from 34's model and rides 35's jack work.
- Build ticketing deferred by the user: this answer is recorded now; the user collapses it to the spec and tickets later.
