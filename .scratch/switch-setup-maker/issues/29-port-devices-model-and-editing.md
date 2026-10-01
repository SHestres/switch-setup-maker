# 29: Devices — model & editing (generic + named)

Type: grilling
Status: resolved
Blocked by: None (decision ticket; implementation composes with 26–27)

## Question

Decide how a Port is marked as connected to an external device — generic, or a named device — how that attachment is authored and how it renders.

- **Scope**: current scope = a generic "device connected" marking plus named devices that carry just a name. Device types (server, access point, firewall, …) are out of scope and stay in the fog.
- **Open points to settle:**
  - Where the attachment lives in the document (a Device entity in `setup` referenced by the Port vs. an attachment on the Port).
  - Exclusivity with Connections (can a Port be both wired and device-attached?).
  - One device per Port.
  - How the faceplate shows an attached Port.
  - How it is authored (bottom-panel editor and/or direct on the faceplate).
  - Glossary vocabulary.
  - Serialisation and validation.
  - How it composes with the Section schema work ([26](26-section-model.md)).

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.

## Answer

Resolved 2026-10-01. A Device is the far end of a Connection — not a property of the Port and not a separate entity list.

### Model

- `Connection` stays `{ a, b }` with unordered pair identity, but `b` becomes `PortRef | { device: { name: string } }`. **Normal form**: `a` is always a Port; at most one Device end; a Connection always has one or two Port ends, never device-to-device.
- A Port with a Device Connection is occupied exactly like a wired one. The existing one-cable-per-Port rule (the `port-in-use` refusal and the importer's `usedPorts` check) extends across both kinds, so attaching a Device to a wired Port, or wiring a device-attached Port, replaces the existing Connection after a confirm.
- `name` is free text; a blank name is a **generic device**, any other value a **named device**. Duplicate names across Ports are allowed — two NICs on one server are two Connections carrying the same name, edited independently. No trimming and no length cap beyond Switch name/model parity.
- Cascades ride the existing connection purge: `removeSwitch` and `removePorts` (including ticket 26's section edits) drop a Device Connection with its Port. Switch-delete and layout-edit confirm counts include Device Connections.

### Operations & authoring

- **Right-click a Port** is the Device gesture: free Port → attach a generic Device immediately; wired Port → shared confirm, then replace with a generic Device; generic-attached Port → detach immediately; named-attached Port → shared confirm (“Remove <name> from this Port?”), then detach. The browser context menu is suppressed on Ports.
- **Shift+right-click a Port** opens the name popover anchored at the jack: one “Name?” input, autofocused, prefilled with the current name when attached. Enter saves — blank makes it generic; a wired Port asks the replace confirm before saving. Esc or click-away cancels. This popover is the shell the future predefined-device menu rows land in; no Remove item — right-click owns removal.
- Any Device action cancels a pending wire first.
- **Wiring**: the first click still starts a pending wire even on a device-attached Port; when a wire would land on (or start from) a Port whose Device blocks it, the shared confirm replaces the Device; cancelling keeps the pending wire, matching existing refusals. If both ends are blocked, the ends are confirmed one at a time.
- Detach and generic attach are immediate (the weight of deleting a cable); only named-device loss and cross-kind replacement confirm.

### Rendering

- Jack language only: a device-attached Port reads through the jack itself — a distinct fill plus a small plug motif — with no lead, no name chip and no wire geometry. The name appears on hover (ticket 30) and in the popover while editing. Wired Ports keep the existing connected treatment; the three themes tokenise the Device treatment like the others.
- `WireLayer` draws nothing for Device Connections (no second anchor).

### Serialisation

- The document version bumps again after ticket 26's bump; the build takes the next free number. Existing files load unchanged — a Device end is optional, so there is no data migration.
- Import normalises a Device end written in `a` (swapping it into normal form) when the other end is a Port; device-to-device, unknown endpoint shapes and extra endpoint keys are rejected. Port ends are validated as today; `usedPorts` covers both kinds; `name` must be a string (blank allowed).
- Export and autosave always write the normal form.

### Vocabulary

- **Device** is the canonical term; **Connection** is redrafted; **Switch** drops “Device” from its avoid-list and no longer describes itself as a device. See `GLOSSARY.md`.

### Composition

- Tickets 26/27: Device Ports are materialised Ports, so section edits preserve attachments for surviving Ports and purge them with removed ones; the faceplate and editor work composes with the section faceplate.
- Ticket 30: hover resolves a Port's Connection — the named Device, or “Device” for a generic one — for non-wired Ports.
- Ticket 31: Device Connections are Connections, so cable metadata (colour/length/type) may ride them; there is no rendered wire, so how metadata displays on a Device Connection stays ticket 31's decision.
- The future predefined-device menu rows and device types remain fog.

### Build tickets surfaced

- [34](34-device-connections-model.md) — Device connections: model, rules & serialisation (blocked by 26).
- [35](35-attach-devices-canvas.md) — Attach devices on the canvas: right-click, name popover & jack marking (blocked by 34, 27).
