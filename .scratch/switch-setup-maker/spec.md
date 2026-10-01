# Switch Setup Maker MVP: switch builder, canvas, connections, and shipping

Status: ready-for-agent

## Problem Statement

IT professionals who document network switch setups have no lightweight, trustworthy tool for the job: ad-hoc diagrams go stale, spreadsheets don't understand ports, and online tools want accounts or send data to a server. The app's domain model, autosave and JSON import/export have landed, but there is still no way to model anything: no switch builder, no faceplate rendering, no canvas, no connections. Until that exists the app cannot be used, validated, or published — the MVP is all groundwork and no product.

## Solution

Complete the MVP: a full-width bottom-panel switch editor that adds and edits switches from layout presets or from hand-built sections; a themed canvas that renders each switch as a faceplate whose sections lay out left to right, supports drag and pan/zoom, and hosts the draft-switch preview; and click-to-connect wiring between ports. Then stand up the self-host path (Node and Docker), run the whole MVP story end-to-end on a production build, and publish the app once the user creates the remote.

## User Stories

1. As an IT professional, I want to add a switch from a layout preset, so that common hardware appears fully configured in one click.
2. As an IT professional, I want the 48-port preset to carry its model name onto the faceplate, so that the diagram shows the device I actually own.
3. As an IT professional, I want to start a blank switch, so that I can model hardware the presets don't cover.
4. As an IT professional, I want the blank switch to exist as a ghost draft before I commit it, so that I can judge the layout first.
5. As an IT professional, I want `Add switch` disabled until the draft has at least one non-empty section, so that I cannot commit an empty switch.
6. As an IT professional, I want an untouched draft discarded silently and an edited one confirmed before discarding, so that I neither lose edits nor get nagged.
7. As an IT professional, I want to set a switch's name and model, so that I can label my actual rack.
8. As an IT professional, I want to add and remove sections in a switch's layout, so that the faceplate matches the real port arrangement.
9. As an IT professional, I want to choose each section's rows, columns, kind and speed, so that every port carries the right attributes.
10. As an IT professional, I want to choose each section's numbering convention, so that printed labels follow the vendor's convention.
11. As an IT professional, I want each section to start numbering automatically after the previous one or at a number I set, so that uplinks read 49–52 or 1–2 as the real device does.
12. As an IT professional, I want all three generated numbering conventions to produce labels that match real hardware, so that I trust the diagram.
13. As an IT professional, I want to edit an existing switch's layout, so that I can fix mistakes.
14. As an IT professional, I want a confirmation naming how many connections an edit will sever, so that I don't silently lose wiring.
15. As an IT professional, I want deleting a switch confirmed with its name and connection count, so that destructive acts are deliberate.
16. As an IT professional, I want builder validation inline and the offending field marked, so that I know exactly what to fix.
17. As an IT professional, I want every section after the first to start at the end of the previous one by default, so that labels run continuously without extra clicks.

18. As an IT professional, I want each switch rendered as a faceplate with its sections, ports, kinds, speeds and labels, so that the canvas reads like real hardware.
19. As an IT professional, I want every switch at one consistent rack width, so that arrangements look like a rack.
20. As an IT professional, I want ports to be real interactive controls, so that I can hover and click them for wiring.
21. As an IT professional, I want light, dark and blueprint themes, so that the diagram suits my taste and context.
22. As an IT professional, I want connected ports to change their jack fill — not just an LED — so that wired ports are obvious at a glance.
23. As an IT professional, I want faceplate chrome (status LEDs, console/USB tiles, brand mark) to be real or absent, so that nothing pretends to be functional.
24. As an IT professional, I want to drag switches into place, so that the canvas mirrors the rack.
25. As an IT professional, I want to pan and zoom freely, so that I can work at the density I prefer.
26. As an IT professional, I want to find switches where I left them after panning, zooming and refreshing, so that the layout is stable.
27. As an IT professional, I want to click a switch body to select it and open its editor, so that editing is one gesture.
28. As an IT professional, I want to click empty canvas to deselect and close the panel, so that I can get the editor out of the way.
29. As an IT professional, I want port clicks reserved for wiring, so that selection never competes with connecting.
30. As an IT professional, I want new switches to land at the visible centre with a small diagonal cascade, so that none appear off-screen or stacked.
31. As an IT professional, I want a first-run card explaining "add a switch, then click any two ports to wire them", so that I know where to start.
32. As an IT professional, I want the draft switch previewed live on the canvas as I edit sections, so that I see the builder's result before committing.
33. As an IT professional, I want the draft to be non-interactable until committed, so that I cannot wire a switch that does not exist.
34. As an IT professional, I want the editor panel not to resize or re-fit the canvas, so that my view does not jump while editing.
35. As an IT professional, I want a cables-above / cables-behind toggle, so that wires read clearly in dense areas.
36. As an IT professional, I want the blueprint theme to always draw cables above, so that the theme stays legible.
37. As an IT professional, I want cables to leave ports vertically by default, so that they cover less of the faceplate and look like real cables.
38. As an IT professional, I want a connection drawn as a line or curve between its two ports, so that the link is visible.

39. As an IT professional, I want to start a connection on one port and land it on another, so that wiring is two clicks.
40. As an IT professional, I want each port to accept only one connection, so that the model stays real.
41. As an IT professional, I want to connect two ports on the same switch, so that real-world patch cables and future loop checks are representable.
42. As an IT professional, I want refused links explained near the port — self-link, duplicate, port already in use — so that nothing fails silently.
43. As an IT professional, I want the refusal hint to name the busy port ("Port 24 is already connected."), so that I know which end is the problem.
44. As an IT professional, I want to select a connection and delete it, so that mis-wires can be undone.
45. As an IT professional, I want deleting a switch to remove its connections, so that no dangling links remain.
46. As an IT professional, I want connections purged when their ports are removed by a layout edit, so that the diagram never lies.
47. As an IT professional, I want connections to survive a refresh along with everything else, so that wiring is not transient.

48. As an IT professional, I want every change autosaved, so that closing the tab cannot lose the setup.
49. As an IT professional, I want the setup restored on load, so that work persists between sessions.
50. As an IT professional, I want to export the setup as pretty JSON, so that I can back it up or share it.
51. As an IT professional, I want to import a JSON setup with validation that names the first problem, so that bad files are rejected clearly.
52. As an IT professional, I want `New setup` to confirm before clearing and to keep my theme and cable preferences, so that resets are deliberate but not total.

53. As someone self-hosting, I want to build a clean checkout and serve `dist/` with any static server, so that I can run the app anywhere.
54. As someone self-hosting, I want a one-command Docker run with no required config and an overridable port, so that deployment is trivial.
55. As someone self-hosting, I want the same build served from a domain root or a sub-path, so that hosting is agnostic.
56. As the maintainer, I want the user to create the remote and choose a static host, so that publishing happens under the user's account.
57. As the maintainer, I want a push to main to update the public URL, so that the hosted app tracks the source.
58. As an IT professional, I want my data to stay in my browser with no backend or accounts, so that the tool stays private.

59. As the maintainer, I want the whole MVP story exercised on a production build served locally, so that what ships is what was tested.
60. As the maintainer, I want small gaps fixed and bigger ones captured as tickets or fog, so that the MVP phase ends cleanly.

## Implementation Decisions

**Architecture (settled; ADR 0001 is the authority).** React + TypeScript on Vite; Tailwind CSS + shadcn/ui; desktop-first; Vitest + Testing Library. The canvas is hand-rolled and hybrid: faceplates are HTML/CSS elements, every wire lives in one SVG overlay, and pan/zoom is delegated to react-zoom-pan-pinch. Ports stay plain DOM elements so they are accessible and testable in jsdom. Geometry is derived from the model's port grid, never from DOM measurement — the model-first boundary is what keeps a future renderer swap contained.

**Model state already in place (consume, don't rebuild).**
- `useDocument()`: the document plus a setter; lazy restore on load and synchronous autosave on every change.
- Layout rules: the row-based `generateLabels`, `materialiseRows(preset, rows)`, `relabelRows`, `removePortsFromSwitch`, `nextPortId` and the builder's `RowSpec` view form the current baseline; [ticket 26](issues/26-section-model.md) replaces them with sections, section materialisation and relabelling, the per-section numbering chain and a section spec view.
- Connection rules: `connect` (returns success or a problem carrying a `port` and ready-to-show message), `disconnect`, `isPortConnected`, `connectionsTouchingSwitch`, `removeSwitch`, `removePorts`.
- Document facts: `findSwitch`, `findPort`, `nextSwitchId`, `resetSetup`; serialization validates every invariant from the domain-model decision; storage and file I/O are wired through the app bar.
- The section model supersedes the row model: [ticket 26](issues/26-section-model.md) bumps the document schema version and defines the v1 migration policy; serialisation, storage and file I/O follow it.

**Document schema (target shape; trimmed to the decision-rich shape).**

```json
{
  "version": 2,
  "setup": {
    "switches": [
      {
        "id": "sw1", "name": "Core", "model": "Unifi 48 Port", "x": 120, "y": 360,
        "layout": {
          "sections": [
            {
              "kind": "rj45", "speed": "1G", "rows": 2, "columns": 8,
              "numbering": "alternating-top-first", "startMode": "auto", "start": 1,
              "ports": [
                { "id": "p1", "label": "1", "kind": "rj45", "speed": "1G" },
                { "id": "p2", "label": "2", "kind": "rj45", "speed": "1G" }
              ]
            },
            {
              "kind": "sfp+", "speed": "10G", "rows": 2, "columns": 2,
              "numbering": "sequential", "startMode": "auto", "start": 49,
              "ports": [
                { "id": "p49", "label": "49", "kind": "sfp+", "speed": "10G" },
                { "id": "p50", "label": "50", "kind": "sfp+", "speed": "10G" }
              ]
            }
          ]
        }
      }
    ],
    "connections": [{ "a": { "switch": "sw1", "port": "p1" }, "b": { "switch": "sw2", "port": "p12" } }]
  },
  "ui": { "theme": "light", "cableLayer": "behind", "viewport": { "x": 0, "y": 0, "zoom": 1 } }
}
```

The ports above are sketched; each section materialises all rows × columns ports, row by row, with readable stable ids, and labels are display data generated from the section's numbering convention and start. Connections are undirected port pairs and the pair is the identity; one connection per port; no self-links; no duplicate pair; same-switch links are allowed. Deleting a switch or a port purges every connection touching it. `ui` holds only theme, cable layer and viewport — selection, the draft and a pending wire are ephemeral UI state and never enter the document or storage. The section model bumps the schema to version `2`; [ticket 26](issues/26-section-model.md) defines and documents the v1 migration policy (automatic conversion with a defined mapping, or clear rejection). Port kind is RJ45 or SFP; the 10G distinction rides on Port speed ([ADR 0002](../../docs/adr/0002-sfp-single-port-kind.md)), and a document that still spells the kind `sfp+` reads as `sfp` with its speeds intact.

**Layout presets.** The gallery is data (a seam for a real device library later). Exactly one 48-port entry, with the model name prefilling `model`; chips create the switch immediately, while `Start blank` starts the draft flow. Each preset is an ordered list of Section recipes; section order is faceplate order, and Auto sections chain so a preset's labels read continuously.

| Chip (model if set) | Sections | Numbering & start |
| --- | --- | --- |
| 24×1G + 2×SFP | RJ45 1G 2×12; SFP 1G 1×2 | alternating top-first, auto (1–24); sequential, custom (SFP 1–2) |
| **Unifi 48 Port** | RJ45 1G 2×8; RJ45 1G 2×8; RJ45 2.5G 2×8; SFP 10G 2×2 | alternating top-first, auto (1–16, 17–32, 33–48); sequential, auto (SFP 49–52) |
| 24×1G + 4×SFP | RJ45 1G 2×12; SFP 10G 2×2 | alternating top-first, auto (1–24); sequential, auto (SFP 25–28) |
| 12×1G + 2×SFP | RJ45 1G 2×6; SFP 1G 1×2 | alternating top-first, custom 0 (0–11); sequential, custom 0 (SFP 0–1) |
| Start blank | draft flow | — |

**Switch builder.** A full-width bottom panel (never modal) is the add/edit surface, opened by `+ Add switch` or by selecting a switch; it closes with ✕, Esc, or an empty-canvas click, and hosts all three modes: the preset gallery, the draft builder and the editor. Its height is draggable and auto-fits its content on open and after sections are added; the cards and panel carry a little extra padding. One card per section sits in a row, exposing rows × columns, kind (RJ45/SFP), speed (100M–10G), the numbering convention, the start mode — Auto (end of previous) by default, or Custom with an explicit number — and move-left/move-right controls. Rows, columns and the start number commit as you edit: a valid change reaches the document immediately, and invalid input never does. A typed value that would remove connected ports waits for blur or Enter and then shows the confirm, so a dialog can never interrupt a longer number; a spinner click or arrow key that would remove connected ports confirms at once. New-switch mode shows the preset gallery; chips create and select a switch and flip the panel to its editor. `Start blank` creates a ghost draft switch — transparent, non-interactable, zero ports, not in the setup — that the section builder live-previews; `Add switch` commits it via section materialisation. Sections can be moved left or right to reorder them; no label editing in v1; the old disabled `Custom` numbering option is gone. Dismissal discards a draft silently when untouched, after a "Discard this switch?" confirm once edited. Delete switch and any edit that would remove connected ports (section removed, rows or columns lowered) go through one confirm dialog naming the switch and the connection count.

**Canvas.** All switches render at one rack width; body width, port pitch, row heights and similar constants are canvas-layer renderer constants kept at the prototype's proportions, never model fields. Ports render as sections left to right, each vertically centred on the faceplate; adjacent sections sit 6px apart when they share a port kind and 16px apart otherwise, and labels sit above the top row and below the bottom row of each row-pair, as the current faceplate does. A switch's `x`/`y` is its top-left corner in canvas units (1 unit = 1 CSS px at 100% zoom). New switches land at the visible centre with a small diagonal cascade. Selection comes from body clicks, which also open the bottom panel; empty-canvas clicks clear both; port clicks belong to wiring. The bottom panel overlays without resizing or re-fitting the canvas. The empty canvas shows a centred "No switches yet" card until the first switch exists.

**Themes and cables.** The faceplate is a themed component skinned with CSS variables across light (diagrammatic), dark (photoreal plus the light theme's dot-grid canvas) and blueprint. Theme and cable layer live in `ui` and get controls in the app bar. Cables leave ports vertically by default; the cables-above/behind toggle lives in `ui`, and the blueprint theme always draws above. Connected ports change jack fill (distinct grey in v1) in addition to the green LED.

**Chrome honesty.** Status LEDs, console/USB tiles and the brand mark must either be real or be de-emphasised, because the prototype read them as functional.

**Connections.** Click a port to start a connection and click another to land it; the connection renders as a line/curve between the two ports in the shared SVG overlay (endpoints computed from the port grid by a pure geometry module). Rejected links surface a transient hint near the port using the connection rules' existing copy ("Port 24 is already connected."), never silence. A connection can be selected and deleted; removing a switch or its ports cascades through the connection list. Draft-switch ports cannot be wired or selected. v1 stays link-state only — cable metadata and future state colours are post-MVP.

**Self-hosting.** A multi-stage Dockerfile: Node builds the app, a minimal static server serves `dist/` bound to `0.0.0.0`; `docker run` alone suffices and the port is overridable. The README documents `npm ci && npm run build` plus serving `dist/` with any static server, and the Docker commands. The relative-base build already makes one `dist/` work at a root or sub-path; the acceptance pass verifies both. Dev/preview wildcard binding and port overrides stay as they are.

**Publishing (after MVP acceptance).** The user creates the remote manually (name reserved: `switch-setup-maker`) and grants push access. The host is chosen then — any static host fits; no custom domain. The deploy is build-only on main, no test gate. The public URL is recorded, and sub-path implications are handled if the host serves from one.

**Prefactoring worth doing first.** The canvas replaces the throwaway `SetupSummary` stand-in, and the app bar is the natural home for the new theme/cable controls; selection, draft and pending-wire state live in local React state at the app/canvas level, not in the document.

**Vocabulary.** Use the repo glossary terms throughout — Setup, Switch, Faceplate, Port, Port kind, Port speed, Port layout, Section, Row, Port numbering preset, Layout preset, Connection, Cable, Canvas. "Draft switch" is UI-only shorthand, not a model entity. New terms, if any surface, go through the domain-modeling skill.

**Acceptance.** Run the MVP story on a production build served locally per the self-host instructions: fresh browser, add switches from presets and by hand, configure layouts, wire connections, refresh, export and re-import JSON, delete things. Fix small gaps found; capture anything bigger as new tickets or fog; then the map's MVP phase can be declared complete.

## Testing Decisions

Good tests exercise external behaviour through the highest available seam and assert user-visible outcomes, never implementation details. Three seams cover this work:

- **App-level integration (primary, existing).** Render `<App />` and drive it with Testing Library — the real model, storage and UI layers. Prior art: the restore/import/export/`New setup` suite in the existing App tests. Because ADR 0001 keeps ports as plain DOM elements, this seam can cover: adding from each preset, the blank draft (commit, silent discard, confirmed discard, disabled Add), editing name/model/sections/numbering/start modes, delete-with-connection-count confirm, structural severing confirm, selection opening/closing the panel, click-to-connect and every rejection hint, connection deletion, cascade on switch/port removal, theme and cable-layer controls, viewport persistence, and the existing persistence flows. Assert that the draft never reaches the document or storage until `Add switch` commits it.
- **Pure canvas geometry (secondary).** One geometry module computes port anchors and wire endpoints from the model's port grid and renderer constants. Unit-test it directly — dense inputs in, coordinates out — like the layout tests. It exists so jsdom never has to measure layout, per ADR 0001.
- **Node static-server (existing, narrow).** `scripts/serve.test.mjs` drives the built `dist/` at the HTTP seam — root, sub-path, content types, 404s and containment. It counts as this work's third seam.

Deliberately not unit-tested in this phase: drag, pan and zoom gesture physics, and exact CSS transforms or internal selectors — those assertions are trimmed to behaviour-level checks (a drag/wheel gesture persisting the viewport is fine; the exact transform string is not). Theme fidelity and faceplate density stay real-browser acceptance items, and the pure canvas geometry unit tests stay. This matches the map's stance that domain logic gets unit tests first and the heavy test push follows validation. Keep tests deterministic — no real layout, no timing on gestures — and reuse the existing fixtures and helpers (fake storage, object-URL stubs, sample documents).

## Out of Scope

- The map's post-MVP fog: CSV/Excel port-diagram exports, cable metadata (colour, length, type), cable/SFP inventory counts, port speed and PoE highlighting, speed-mismatch warnings, spanning-tree/loop checks, connection state colours beyond link state, a multiple-setups library, a real device-model library, undo/redo and custom labels. (The cable layer toggle is in scope; cable metadata is not.)
- The post-MVP test hardening / heavy TDD push.
- Backend, accounts and multi-user sharing; mobile/touch-first layouts; custom domains; host-specific deploy config.

## Further Notes

- **Provenance.** This spec collapses the remaining route of the Switch Setup Maker wayfinder map into one implementable artifact. The route's decisions live in the map's Decisions-so-far: the stack/render choice (ADR 0001), the faceplate and port-numbering research, the faceplate prototype (screenshots and HTML are the visual reference), the domain-model decision, the MVP UX flow decision, and the hosting decision; the model/autosave/JSON-I/O work is landed with 67 tests green. The map's open build tickets are the work queue this spec describes; tickets cut from here can replace them once approved.
- **Visual reference.** The faceplate prototype's HTML and screenshots encode the three themes and density; the faceplate conventions research encodes the labelling and uplink-cage details. The section-editor prototype ([prototype/26-sections-editor.html](prototype/26-sections-editor.html), variant D) is the visual/interaction reference for the bottom panel and section cards.
- **Fallbacks.** If the hybrid canvas fails at realistic density, the documented fallback order is React Flow, then Konva — contained to the canvas layer by the model-first boundary.
- **Remote.** Reserved repo name `switch-setup-maker`; the user creates it; no custom domain; no test gate on deploy.
- **After acceptance.** The hosted home is stood up from a validated build, and the map's MVP phase closes.
