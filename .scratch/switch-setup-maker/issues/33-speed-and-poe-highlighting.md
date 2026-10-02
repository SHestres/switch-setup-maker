# 33: Port speed & PoE highlighting

Type: grilling
Status: resolved
Blocked by: None

## Question

Decide the visual language for port speeds and PoE, and whether PoE enters the model.

- **Speed**: what showing speed means (badges on ports, colour coding, a filter/highlight mode); per-theme behaviour (light/dark/blueprint — [18](18-themes.md)); how it layers with wired/selected/hover states ([21](21-render-cables.md), [22](22-wire-ports.md), [23](23-manage-connections-and-cable-layer.md)).
- **PoE**: whether Ports model a PoE capability/class (PoE / PoE+ / PoE++ with wattages) and switch-level budgets; how powered vs unpowered reads.
- **Surfaces**: the faceplate, hover ([30](30-port-hover-connected-info.md)), and the editor ([27](27-section-faceplate-and-editor.md)).

Cross-reference (text only, no blocking): speed-mismatch warnings and connection state colours will read from this.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.

## Answer

Resolved 2026-10-02. Speed and PoE share one visual language: PoE is modelled on the Section, speed is a view mode over it.

### Model — PoE on the Section

- `Section` gains `poe: boolean`, alongside kind and speed. No per-Port flag, no PoE class/wattage, no switch-level budget.
- Missing `poe` in existing documents reads as `false`; no `DOCUMENT_VERSION` bump. Export always writes it explicitly (the additive-field pattern used by earlier additions).
- Hardware presets seed it from the model: a PoE model's RJ45 sections seed `true` (USW-48-PoE and friends), SFP-only sections and generic presets seed `false`. The editor can still tick an SFP section — the field is power capability, not connector shape.

### Faceplate — the PoE bolt

- Every Port of a PoE Section carries a small lightning-bolt mark by the jack, always visible (no toggle), tokenised across light/dark/blueprint like the other faceplate treatments.
- The draft ghost shows the bolt too (it previews hardware); the Speed highlight, being a view mode, never applies to the ghost.
- A PoE Port's accessible name gains "PoE" — e.g. "RJ45 port 24 (1G, PoE) on sw1" — following ticket 30's precedent of putting state in the accessible name.

### Speed highlight — a view mode

- An app-bar control beside Cable layer switches Speed highlight on and off; off by default; persisted as `ui.speedHighlight` through autosave/restore (additive field, no version bump).
- While on, jack fills tint by tier: 100M and 1G calm; 2.5G and 5G warm; 10G accent. Tier colours are theme tokens, blueprint included.
- Connected Ports — wired or Device-attached — show the tier tint blended toward the existing connected gray, so connectedness and tier stay legible together; LED, border, hover and selection states layer exactly as today.
- The mode is additive: cables keep their colours, labels and switch chrome are untouched. No dimming/focus behaviour.
- A small informational legend (swatch → tier) floats in a canvas corner only while the mode is on; not interactive.

### Hover card

- Ticket 30's card gains `PoE: yes` only when the Port's Section has PoE — never a "no" row. Exact speed stays on the card regardless of the highlight mode.

### Editor

- Each Section card in the bottom panel gains a `PoE` checkbox, seeded by presets; `SwitchFields` is shared, so the draft builder gets it too. No budget field.

### Explicitly not in this decision

- Speed-mismatch warnings and connection-state colours remain fog; they read from this language (the tier tints and the PoE capability) rather than inventing new cues.
- Switch-level PoE budgets, PoE classes/wattages, and any export/inventory use of PoE stay fog.

### Build tickets surfaced

- Ticketing deferred by the user (matching tickets 30–32). Suggested cut when created: a model ticket (Section.poe, preset seeding, serialisation, hover-card data) then a UI ticket (bolt, Speed control, tints, legend, editor checkbox).
- Revision to [29](29-port-devices-model-and-editing.md): Device-attached Ports use the same connected treatment as wired Ports — no distinct fill, no plug motif — and speed tints layer identically. 29's Answer and [35](35-attach-devices-canvas.md)'s body are amended accordingly.

## Comments

- 2026-10-02 — Seeding amendment decided during the spec collapse: for models whose PoE region covers only part of a physical group (Lite-8, Lite-16, USW-24-PoE/Pro-24-PoE, Pro-48-PoE), the seed splits the Section at the power boundary rather than marking the whole Section. Same-kind splits are visually invisible because gaps are kind-based. Captured in [spec.md](../spec.md); the "a PoE model's RJ45 sections seed true" wording above is superseded by the split rule.
