# Switch Setup Maker: devices, hardware presets, cable metadata, port inspection & highlighting

Status: ready-for-agent

## Problem Statement

IT professionals can already model switches, edit their Sections, wire Ports, and keep the Setup as JSON — but the app only understands switch-to-switch cables. Anything plugged into a Port that isn't a modelled Switch is invisible, so a real rack's patch panels, access points and server links cannot be recorded. Cables carry no color or length, so the diagram cannot match the rack's actual cabling. The preset gallery offers generic layouts and a fictional "Unifi 48 Port" entry instead of real hardware. Hovering a Port reveals nothing, so tracing a Connection means reading the whole Canvas. And nothing shows which Ports supply power or which run at which speed, so the diagram stops at connectivity.

## Solution

Extend the Setup beyond switch-to-switch wiring:

- **Devices** — the far end of a Connection can be a Device, generic or named, authored with right-click and a jack-anchored name popover.
- **Port hover** — a read-only card naming the Port's identity and what it connects to, tracing the Cable and flashing the far Port.
- **Cable metadata** — a nine-token cable color and a length in feet, edited from the wire or in bulk.
- **Hardware presets** — a searchable library seeded with eight real UniFi switches, replacing the hand-authored stand-in.
- **Speed & PoE** — an always-visible PoE bolt and an opt-in Speed highlight mode with a legend.

Everything stays local-first: no backend, no accounts, one autosaved document that imports and exports as JSON.

## User Stories

**Devices**

1. As an IT professional, I want to attach a generic Device to a free Port, so that I can record that something is plugged in even when I do not model it.
2. As an IT professional, I want to name a Device, so that the Setup records what is actually plugged in.
3. As an IT professional, I want Device names to be free text with no trimming and no length cap beyond Switch name/model parity, so that labels like "Rack 3, eth0" stay mine.
4. As an IT professional, I want two Ports to carry the same Device name independently, so that a dual-NIC server is representable.
5. As an IT professional, I want right-click on a free Port to attach a generic Device immediately, so that marking a patch is one gesture.
6. As an IT professional, I want right-click on a generic-attached Port to detach immediately, so that undoing a patch is one gesture.
7. As an IT professional, I want right-click on a named-attached Port to confirm before detaching, so that named information is not lost by accident.
8. As an IT professional, I want right-click on a wired Port to confirm replacing the Cable with a Device, so that cross-kind changes are deliberate.
9. As an IT professional, I want Shift+right-click to open a "Name?" popover anchored at the jack, so that I can label a Device in place.
10. As an IT professional, I want that popover prefilled with the current name and Enter to save — blank meaning generic — so that edits are quick.
11. As an IT professional, I want a wired Port's name edit to confirm the replacement first, so that a Cable is never silently dropped.
12. As an IT professional, I want Esc or clicking away to cancel the popover, so that I can back out.
13. As an IT professional, I want the browser's context menu suppressed on Ports, so that the gestures feel native.
14. As an IT professional, I want any Device action to cancel a pending wire first, so that gestures never fight each other.
15. As an IT professional, I want starting or landing a wire on a device-attached Port to confirm the replacement, so that wiring can reclaim a Port.
16. As an IT professional, I want cancelling that confirm to keep my pending wire, so that a refusal is not a dead end.
17. As an IT professional, I want both blocked ends confirmed one at a time, so that I understand each replacement.
18. As an IT professional, I want device-attached Ports to read exactly like wired connected Ports, so that "occupied" is one visual language.
19. As an IT professional, I want no fake Cable, lead, chip or plug motif drawn for a Device Connection, so that the Canvas stays honest.
20. As an IT professional, I want a Device Connection to occupy its Port exactly like a Cable does, so that one-Port-one-link holds across both kinds.
21. As an IT professional, I want deleting a Switch or removing Ports to purge their Device Connections with the count in the confirm, so that cascades are truthful.
22. As an IT professional, I want Device Connections to survive autosave, export and import, so that nothing is lost.
23. As an IT professional, I want a document without Device ends to load unchanged, so that upgrading never strands my files.
24. As the maintainer, I want the importer to normalise a Device end written in the wrong slot and reject device-to-device or malformed links, so that stored documents stay in normal form.

**Port hover**

25. As an IT professional, I want hovering a Port to show its label, kind and speed, so that I can confirm what I am looking at.
26. As an IT professional, I want a wired Port's card to name the far Switch and Port label, so that I can trace a Cable.
27. As an IT professional, I want a same-Switch link to repeat the Switch's own label, so that there is no special case to learn.
28. As an IT professional, I want a device-attached Port's card to show the Device's name, or "Device" when generic, so that the far end is always answered.
29. As an IT professional, I want a `PoE: yes` row when the Port's Section supplies PoE, so that capability is confirmable.
30. As an IT professional, I want a `Cable: <n> ft` row when a length is set, so that the record is complete.
31. As an IT professional, I want hovering to highlight the far Port and the Cable with existing cues, so that I can see the chain without a new legend.
32. As an IT professional, I want connected Ports to open the card quickly and free ones slowly, so that sweeping a field stays quiet.
33. As an IT professional, I want the card gone immediately on mouse-out, so that it does not linger.
34. As an IT professional, I want the source Port quiet while I am wiring and refusal hints to win, so that those gestures stay clear.
35. As a keyboard or screen-reader user, I want a connected Port's accessible name to include the far end, so that I get the connection information without hover.
36. As an IT professional, I want no card for a ghost draft Port, so that previews stay inert.
37. As an IT professional, I want no auto-pan when the far end is off-screen, so that hovering never moves my view.

**Cable metadata**

38. As an IT professional, I want to set a Cable's color from nine named tokens, so that the diagram matches my physical cabling practice.
39. As an IT professional, I want an unset color to render the theme's default wire, so that new Cables need no decision.
40. As an IT professional, I want choosing Default to clear a color, so that I can undo a choice.
41. As an IT professional, I want to record a length in feet to one decimal, so that short patch runs are accurate.
42. As an IT professional, I want length chips for 1, 2, 3, 4, 5, 6 and 10 ft plus free entry, so that the common cases are one click.
43. As an IT professional, I want a light or dark wire to show its true color, so that Cables are recognisable.
44. As an IT professional, I want blueprint to stay tinted with true color only in swatches, so that the theme stays legible.
45. As an IT professional, I want hover and selection to keep the Cable's color visible under highlights, so that state never hides information.
46. As an IT professional, I want clicking a wire to select it and show Edit cable / Delete cable at its midpoint, so that management is local.
47. As an IT professional, I want Edit cable to open the bottom panel in a cable mode, so that editing has a stable home.
48. As an IT professional, I want a Bulk edit cables mode with "Leave unchanged" defaults, so that I can paint color or length across many Cables without touching the other field.
49. As an IT professional, I want press-drag to paint each crossed wire and a plain click to paint one, so that bulk edits are fast.
50. As an IT professional, I want Done or Esc to exit bulk mode, so that it cannot trap me.
51. As an IT professional, I want wires not to select while bulk mode is on, so that painting cannot mis-select.
52. As an IT professional, I want no cable type field, trusting a future export to infer type from the Port kinds, so that I do not maintain redundant data.
53. As an IT professional, I want Cable metadata to autosave and export with the rest of the document, so that nothing is special-cased.
54. As an IT professional, I want a document without Cable metadata to load unchanged, so that old files keep working.

**Hardware library**

55. As an IT professional, I want real UniFi switch models as Layout presets, so that I can pick my actual hardware.
56. As an IT professional, I want a hardware preset's model name prefilled and its label to read `<vendor> <model>`, so that the Faceplate shows the real device.
57. As an IT professional, I want generic and hardware presets in one list, so that choosing a layout is one place.
58. As an IT professional, I want to filter that list by label, vendor or model, so that finding my switch is typing, not scanning.
59. As an IT professional, I want the list sorted by port count descending, so that bigger switches surface first.
60. As an IT professional, I want one click to create-and-select a Switch from any entry, so that picking stays fast.
61. As an IT professional, I want hover or focus to show the layout details line, so that I can check before committing.
62. As an IT professional, I want the handmade 48-port stand-in gone, so that no preset claims hardware that does not exist.
63. As an IT professional, I want each hardware model's Sections, numbering and uplinks to mirror the real Faceplate, so that the diagram is trustworthy.
64. As the maintainer, I want models to be data-only additions, so that extending the library needs no code changes.

**Speed & PoE**

65. As an IT professional, I want a PoE checkbox on every Section card, so that I can record power capability on custom switches.
66. As an IT professional, I want the draft builder to have the same checkbox, so that custom builds are complete before commit.
67. As an IT professional, I want every PoE Port marked with an always-visible bolt, so that PoE is readable at a glance.
68. As an IT professional, I want the bolt tokenised across all themes, so that it reads in light, dark and blueprint.
69. As an IT professional, I want the draft ghost to show its bolts, so that the preview is faithful.
70. As a screen-reader user, I want a PoE Port's accessible name to say PoE, so that the capability is not visual-only.
71. As an IT professional, I want an app-bar Speed highlight toggle, off by default and remembered, so that the mode is opt-in but persistent.
72. As an IT professional, I want calm tints for 100M/1G, warm for 2.5G/5G and accent for 10G, so that speed tiers separate at a glance.
73. As an IT professional, I want connected Ports to blend their tier tint toward the connected gray, so that occupancy and speed read together.
74. As an IT professional, I want the mode additive — Cables, labels and chrome untouched, no dimming — so that it layers without hiding.
75. As an IT professional, I want a small legend while the mode is on, so that the colors are decodable.
76. As an IT professional, I want the Speed highlight to leave the draft ghost alone, because it is a view mode, not a property of the switch.

**Quality & compatibility**

77. As the maintainer, I want Device rules, serialization and preset seeds unit-tested, so that model invariants are pinned.
78. As the maintainer, I want gestures and UI flows tested at the app level, so that user outcomes are asserted.
79. As the maintainer, I want old documents to keep importing, so that version changes never strand data.
80. As the maintainer, I want behaviour-level assertions rather than CSS or gesture internals, so that tests do not brittle-lock the renderer.

## Implementation Decisions

**Document schema bumps once, to version 3.** The device union and the Cable metadata fields are both additive, so they share one `DOCUMENT_VERSION` bump; `Section.poe` and `ui.speedHighlight` are additive fields that ride along without a second bump, and missing `poe`/`speedHighlight` read as `false`. Versions 1 and 2 keep loading through the existing conversion and defaults; export always writes `poe` explicitly and the normal form. Trimmed to the decision-rich shape:

```json
{
  "version": 3,
  "setup": {
    "switches": [
      {
        "id": "sw1", "name": "Core", "model": "USW-Pro-48-PoE", "x": 120, "y": 360,
        "layout": {
          "sections": [
            {
              "kind": "rj45", "speed": "1G", "rows": 2, "columns": 8, "poe": true,
              "numbering": "alternating-top-first", "startMode": "auto", "start": 1,
              "ports": [{ "id": "p1", "label": "1", "kind": "rj45", "speed": "1G" }]
            }
          ]
        }
      }
    ],
    "connections": [
      { "a": { "switch": "sw1", "port": "p1" }, "b": { "switch": "sw2", "port": "p12" }, "color": "blue", "length": 2.5 },
      { "a": { "switch": "sw1", "port": "p2" }, "b": { "device": { "name": "Office AP" } } }
    ]
  },
  "ui": {
    "theme": "light", "cableLayer": "behind",
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "speedHighlight": false
  }
}
```

Ports stay materialised; `poe` is a Section fact, never repeated per Port. Cable `color` and `length` are optional on any Connection; v1 authors them only on wired Connections.

**Devices are the far end of a Connection, not an entity.** A Connection stays an unordered `{ a, b }` pair with `b` widened to `PortRef | { device: { name } }`; `a` is always a Port. Normal form: at most one Device end and never device-to-device, so every Connection has one or two Port ends. A blank `name` is a generic Device, any other value a named Device; duplicate names across Ports are allowed and edited independently; no trimming and no cap beyond Switch name/model parity. A Device Connection occupies its Port exactly like a Cable: the existing one-cable-per-Port rule and `usedPorts` import check cover both kinds, and the model's pair/occupancy/cascade helpers all become union-aware (same-pair identity, occupancy, connections touching a Switch, Port removal, Switch removal, confirm counts). Deleting a Switch or removing Ports purges Device Connections with the rest; delete and layout-edit confirms count them.

**Device gestures.** Right-click a Port is the Device gesture: free → attach a generic Device immediately; wired → shared confirm, then replace with a generic Device; generic-attached → detach immediately; named-attached → shared confirm ("Remove <name> from this Port?"), then detach. Shift+right-click opens the jack-anchored "Name?" popover with one autofocused input, prefilled when attached; Enter saves (blank makes it generic; a wired Port confirms first), Esc or click-away cancels. The popover is the shell future predefined-device rows land in; it has no Remove item. The browser context menu is suppressed on Ports, and every Device action cancels a pending wire first. Wiring still starts a pending wire even on a device-attached Port; when a wire would start from or land on a blocked Port, the shared confirm replaces the Device, and cancelling keeps the pending wire. When both ends are blocked, they are confirmed one at a time. Only named-device loss and cross-kind replacement confirm; detach and generic attach are immediate, like deleting a Cable.

**Device rendering.** A device-attached Port reads exactly like a wired connected Port — the same connected gray shift from the jack, layered under speed tints — with no lead, no name chip, no plug motif and no wire geometry. `WireLayer` draws nothing for a Device Connection; the absent Cable plus hover and the popover are the device signals. Device Connections carry no authored Cable metadata in v1.

**Port hover card.** Hovering a Port opens a small read-only bubble anchored above its jack, reusing the refusal hint's dark-bubble styling and `portAnchor` placement with `pointer-events: none`. Rows are data-driven, appended by this work and future tickets, and hold no actions: always the Port's label · kind · speed; then `Connected to: <switch label> · <port label>` for a wired Port (a same-Switch link repeats the Switch's own label), or `Connected to: <name>` / `Connected to: Device` for a Device Connection; then `PoE: yes` only when the Section supplies PoE; then `Cable: <n> ft` only when a length is set — no color row or swatch. It opens after ~250 ms on connected Ports and ~500 ms on free ones, and hides immediately on mouse-out. While a pending wire is drawing, candidate Ports behave normally but the source Port stays fully quiet, and a refusal hint takes precedence at the same Port. The trace highlights the chain with existing cues only: the hovered Port keeps its accent border, the far Port gets the same accent border, and the Cable gets its hover highlight; a Device Connection has no far-end geometry, so the card is the whole reveal. No auto-pan. Ghost draft Ports stay inert. Far-end information also rides each connected Port's accessible name (e.g. `RJ45 port 1 (1G) on Unifi 48 Port, connected to Core Switch port 24`, with `PoE` joining as in the Speed & PoE decision). WCAG 1.4.13's "hoverable" condition is consciously accepted as a gap for the visual card.

**Cable metadata is color and length only — no stored type.** A Connection gains optional `color` from a fixed nine-token palette — red, orange, yellow, green, teal, blue, purple, pink, brown — where absent renders the theme's default wire and choosing Default clears the field; and optional `length` in feet, a positive number to one decimal where blank means unset. The importer rejects an unknown token or a non-positive/un-finite length; documents without the fields load unchanged. Type is never authored: a future port-diagram export infers it from the Port kinds at each end and carries the note that it assumes external devices use RJ45 connectors. American spelling (`color`) is used in production code and UI.

**Cable rendering and editing.** In light and dark, a wire's stroke is its Cable color (unset uses the theme default); hover brightens and slightly thickens it, and selection adds thickness plus an accent halo, with the color staying visible throughout. Blueprint keeps its monochrome identity — theme-tinted wires, highlight color on hover and selection — with true color shown only in swatches. Clicking a wire selects it and shows a midpoint popover with Edit cable and Delete cable, replacing the standalone Delete affordance; the existing Delete/Backspace shortcut keeps its guard against text fields. Edit cable opens the bottom panel in a cable mode: palette swatches and the length field, with the 1/2/3/4/5/6/10 ft chips plus free entry. Bulk edit cables is an app-bar toggle opening the bottom panel in a bulk mode whose two fields each default to Leave unchanged, with Default available to clear color and Clear to clear length; while on, press-drag across wires paints the set fields onto every wire crossed (a plain click paints one) and wires do not select; Done or Esc exits. All writes go through normal document writes, so autosave and export carry them.

**Hardware library replaces the stand-in.** `LayoutPreset` gains an optional `vendor`; hardware presets have it, generic presets do not. `model` prefills the Switch's model on create, `label` reads `<vendor> <model>`, and `details` stays the hover/focus line. The gallery becomes a searchable list — substring filter over label, vendor and model, generic and hardware entries together, sorted by port count descending — with one-click create-and-select and `Start blank` unchanged. Seed data comes from the UniFi front-panel research, data-only in the model's preset seed. The `unifi-48-port` stand-in is deleted; the generic presets stay and seed `poe: false`:

| Preset label / `vendor` `model` | Sections, left → right (rows×cols, kind, speed; PoE in bold) | Numbering | Printed range |
| --- | --- | --- | --- |
| UniFi USW-Lite-8-PoE / UniFi `USW-Lite-8-PoE` | 1×4 RJ45 1G **PoE**; 1×4 RJ45 1G | sequential, auto | 1–8 |
| UniFi USW-Lite-16-PoE / UniFi `USW-Lite-16-PoE` | 2×4 RJ45 1G **PoE**; 2×4 RJ45 1G | alternating top-first, auto | 1–16 |
| UniFi USW-24 / UniFi `USW-24` | 2×6 RJ45 1G; 2×6 RJ45 1G; 2×1 SFP 1G | alternating top-first, auto | 1–24; SFP 25–26 |
| UniFi USW-24-PoE / UniFi `USW-24-PoE` | 2×6 RJ45 1G **PoE**; 2×2 RJ45 1G **PoE**; 2×4 RJ45 1G; 2×1 SFP 1G | alternating top-first, auto | 1–24; SFP 25–26 |
| UniFi USW-48-PoE / UniFi `USW-48-PoE` | 2×8 RJ45 1G **PoE**; 2×8 RJ45 1G **PoE**; 2×8 RJ45 1G; 2×2 SFP 1G | alternating top-first, auto | 1–48; SFP 49–52 |
| UniFi USW-Pro-24-PoE / UniFi `USW-Pro-24-PoE` | 2×6 RJ45 1G **PoE**; 2×2 RJ45 1G **PoE**; 2×4 RJ45 1G; 2×1 SFP 10G | alternating top-first, auto | 1–24; SFP 25–26 |
| UniFi USW-Pro-48-PoE / UniFi `USW-Pro-48-PoE` | 2×8 RJ45 1G **PoE**; 2×8 RJ45 1G **PoE**; 2×4 RJ45 1G **PoE**; 2×4 RJ45 1G; 2×2 SFP 10G | alternating top-first, auto | 1–48; SFP 49–52 |
| UniFi USW-Aggregation / UniFi `USW-Aggregation` | 2×4 SFP 10G | alternating top-first, auto (assumption) | 1–8 |

**PoE splits Sections at power boundaries.** Section-level `poe` stays the model, so models whose power region covers only part of a physical group seed with a Section split at the boundary rather than a false or missing bolt — Lite-8 (1–4), Lite-16 (1–8, the sibling USW-16-PoE convention), USW-24-PoE and Pro-24-PoE (1–16), and Pro-48-PoE (1–40). Because gaps between Sections are driven by Port kind, a same-kind split is visually invisible and Auto numbering chains straight through. SFP-only Sections and generic presets seed `poe: false`; the editor may still tick any Section, because `poe` is power capability, not connector shape.

**Speed highlight is a persisted view mode.** An app-bar control beside Cable layer toggles Speed highlight, off by default and remembered as `ui.speedHighlight`. While on, jack fills tint by tier — 100M/1G calm, 2.5G/5G warm, 10G accent — using theme tokens in every theme. Connected Ports (wired or device-attached) show the tier tint blended toward the connected gray so occupancy and tier stay legible together; LED, border, hover and selection layer exactly as today. The mode is additive: Cables keep their colors, labels and chrome are untouched, and nothing dims. A small non-interactive legend mapping swatch to tier floats in a Canvas corner only while the mode is on; the draft ghost never takes the tint.

**PoE faceplate and editor.** Every Port of a PoE Section carries a small always-visible lightning bolt by the jack, tokenised across light, dark and blueprint; the draft ghost shows it too. A PoE Port's accessible name gains `PoE` (e.g. `RJ45 port 24 (1G, PoE) on sw1`). Every Section card in the bottom panel gains a PoE checkbox — the shared section fields carry it, so the draft builder gets it as well; there is no budget field.

**Work order.** The order that avoids rework: (1) model and serialization v3 — the Device union and its union-aware helpers, Cable color/length, `Section.poe`, `ui.speedHighlight`, import/export rules; this item owns the single version bump. (2) Hardware seed and gallery — `vendor`, the real presets with the PoE splits, the searchable list. (3) Device gestures and the hover card — the card consumes the Device, PoE and length data. (4) Cable metadata UI — wire popover, panel cable mode, bulk mode. (5) Speed/PoE faceplate and editor — bolt, highlight mode and legend, hover row, Section checkbox. Dependencies: (2) and (5) need `Section.poe`; (3) needs the Device union; (4) needs the Cable fields.

**Vocabulary.** Use the repo glossary throughout — Setup, Switch, Faceplate, Port, Port kind, Port speed, PoE, Port layout, Section, Row, Port numbering preset, Layout preset, Connection, Device, Cable, Cable color, Canvas. No new canonical terms are introduced; "Speed highlight" and "Bulk edit cables" are UI labels, not model entities. American spelling applies to production code and UI copy.

## Testing Decisions

Good tests exercise external behaviour through the highest available seam and assert user-visible outcomes, never implementation details. No new seams are introduced; the existing three cover this work:

- **App-level integration (primary, existing).** Render `<App />` and drive it with Testing Library — the real model, storage and UI. Prior art: the existing App suite. This seam covers the full right-click / Shift+right-click gesture matrix and its confirms, pending-wire cancellation and replace-on-cancel, the device-attached jack treatment, hover-card content and timers (fake timers), the far-end trace, accessible names including `PoE`, wired and device connection rows, cable selection and the midpoint popover, the panel cable mode, bulk paint and its Done/Esc exit, the searchable hardware gallery (filter, sort, one-click create-and-select, details line), the PoE checkbox in editor and draft, and the Speed highlight toggle, persistence and legend.
- **Model unit tests (existing seam).** The model's connections module for the union-aware helpers, occupancy across kinds, pair identity, cascades and confirm counts; serialization for version-3 round-trips, Device normalisation and rejection, Cable color/length validation, `poe` defaults and explicit export, `speedHighlight` defaults; the preset seed for vendor/model/labels, Section splits, PoE flags and port counts. Prior art: the existing connections, serialization and preset tests.
- **Pure canvas geometry (existing, unaffected).** `portAnchor` stays the shared anchor for the hover card and the name popover; dense inputs in, coordinates out. The static-server suite is untouched.

Deliberately not unit-tested: drag/pan/zoom gesture physics, exact CSS transforms or selectors, per-theme hex values, and visual fidelity of bolts, tints, the legend and wire colors — those stay behaviour-level assertions plus a production-build visual acceptance pass in all three themes. Keep tests deterministic and reuse the existing fixtures and helpers.

## Out of Scope

- The map's remaining fog: CSV/Excel port-diagram exports (including the cable-type inference table and its RJ45 assumption), cable/SFP inventory counts, speed-mismatch warnings, spanning-tree/loop checks, connection state colors beyond link state, a multiple-setups library, predefined device types and their menu rows, undo/redo, and the heavy post-MVP test hardening push.
- PoE classes, wattages and switch-level budgets, and any per-Port PoE flag; Sections carry a single boolean and the seed splits instead.
- Touch gestures and keyboard equivalents for the hover card and the right-click Device gestures; the accessible-name enrichment is the non-hover path.
- Backend, accounts, multi-user sharing, publishing and host-specific deploy config (the MVP self-host path stands).
- A real-browser assertion suite for theme fidelity; visual acceptance stays a manual production-build pass.

## Further Notes

- **Provenance.** This spec collapses tickets 29–38: the Device decision (29), the port hover decision (30), Cable metadata (31), the device-model library decision (32) with its UniFi research (37), and speed/PoE highlighting (33), plus the build tickets 34, 35 and 38, which are now superseded. The three deferred-build decisions (30, 31, 33) are absorbed here in full. This file replaces the MVP spec in place; the MVP spec stays recoverable from the `integration/mvp` branch and git history.
- **Seed caveats.** USW-Aggregation's SFP numbering is undocumented — the seed assumes alternating top-first and this should be flagged to the user before shipping if it matters. Lite-16's powered range is not stated in the datasheet; ports 1–8 follow the sibling USW-16-PoE QSG convention. USW-24 (non-PoE) reuses the USW-24-PoE front layout, which the research rates low risk.
- **Visual references.** The section-editor prototype (variant D) is the reference for the bottom panel and Section cards; the faceplate prototype encodes the three themes and density; the UniFi research file holds the seed JSON the library is built from.
- **Accessibility stance.** The hover card is a visual convenience with a consciously accepted WCAG 1.4.13 gap; connection, Device and PoE information is repeated in accessible names so nothing is visual-only. Device attach/detach has no keyboard path in this tranche.
- **Acceptance.** A production build served locally: exercise the gesture matrix, hover card and trace, cable editing and bulk paint, the library search and creation, the PoE editor and bolts, the Speed highlight and legend across all three themes, and an old version-2 document import; then `npm test`, lint and build green.
