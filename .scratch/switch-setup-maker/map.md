# Switch Setup Maker — wayfinder map

Type: map

## Destination

A hosted, self-hostable web app that lets IT pros model network switch setups. The journey starts with a working MVP — add switches, configure their port layouts, draw port-to-port connections, autosave, JSON import/export — and continues through the long-term feature set: port-diagram exports (CSV/Excel), custom cable colors, cable/SFP inventory counts, port speed & PoE highlighting, speed-mismatch warnings, and spanning-tree/loop checks.

## Notes

- **Domain**: network switch setups for IT professionals. Term hardening goes through the `domain-modeling` skill; resolved terms land in the root `GLOSSARY.md`.
- **Execution is in scope for this effort.** Unlike a planning-only map, build tickets here deliver working software. Still one ticket per session, research tickets excepted.
- **Constraints settled while charting:**
  - Static, local-first, no backend, no accounts; data lives in the browser. Must be hostable at a URL and self-hostable.
  - MVP scope: add/edit switches; port-layout builder (rows of count/type/speed) plus common presets; full-diagram canvas (drag, pan/zoom, click-port-to-port connect, hover highlights); one layout at a time; browser autosave; JSON import/export. Cable metadata (color/length/type) is *not* MVP.
  - Testing: unit tests for domain logic in the MVP; a heavy test/TDD push follows MVP validation.
  - Repo: `git init` locally now; no remote yet — the user creates it manually later (name reserved: `switch-setup-maker`). Self-host path is ticket 13; remote + publish is [15](issues/15-remote-and-hosting.md), after MVP acceptance.
  - Hosting: platform-agnostic — one static `dist/` for any host, no host-specific config, no custom domain. Dev/preview servers bind wildcard with permissive allowed hosts, env-overridable, for container/VM access.
  - Stack settled by [03 — Choose the stack](issues/03-choose-the-stack.md); render architecture in [ADR 0001](../../docs/adr/0001-stack-and-render-layer.md).
- **Working conventions**: open tickets live in `issues/`; the frontier is the open, unblocked, unclaimed ticket with the lowest number. Claim a ticket by setting `Status: claimed` before any work; resolve it with an `## Answer` section + `Status: resolved`, then append a one-line pointer to Decisions so far below.
- Consult the matching skill per ticket type: `research`, `prototype` (04), `grilling` + `domain-modeling`, `tdd` for build tickets.

## Decisions so far

- [01 — Survey stack & diagram-rendering options](issues/01-stack-rendering-research.md) — resolved; findings in [research/01-stack-rendering.md](research/01-stack-rendering.md). SVG-family rendering fits the stated scale (canvas/Konva is a documented contingency); three candidate stacks (React+hand-rolled SVG; React/Svelte Flow library; Svelte/Solid+SVG) with trade-offs and sources — no pick, ticket 03 decides.
- [02 — Faceplate & port-numbering conventions](issues/02-faceplate-conventions-research.md) — resolved; findings in [research/02-faceplate-conventions.md](research/02-faceplate-conventions.md). Odd-top/even-bottom column pairs are the switch norm (Cisco/Ubiquiti/Aruba/MikroTik); Juniper is even-top/odd-bottom 0-based; row-major is patch-panel style. Uplink cages ~14 mm, usually right (left on Aruba 2930F); PoE + LED conventions and ASCII layout sketches included.
- [03 — Choose the stack](issues/03-choose-the-stack.md) — resolved; render-layer findings in [research/03-render-layer-options.md](research/03-render-layer-options.md). React + TS + Vite; hand-rolled hybrid canvas (HTML/CSS faceplates + one SVG wire overlay + react-zoom-pan-pinch); Tailwind CSS + shadcn/ui; Vitest + Testing Library; desktop-first. Recorded in [ADR 0001](../../docs/adr/0001-stack-and-render-layer.md).
- [04 — Prototype the switch faceplate & canvas feel](issues/04-faceplate-prototype.md) — resolved; [prototype](prototype/04-faceplate.html) + [screenshots](prototype/shots/). All three faceplate styles wanted as switchable themes: light (diagrammatic), dark (photoreal + dot grid), blueprint. Density validated (48 ports readable at 27px pitch). Direction: one consistent rack width for all switches; cables exit ports vertically by default with an above/behind toggle (blueprint always above); connected ports change jack fill, not just LED; faceplate chrome must be real or de-emphasised. Direction notes on tickets 05/11/12.
- [05 — Design the domain model: switch, port, connection](issues/05-domain-model.md) — resolved; full spec in the answer. One versioned document `{version, setup: {switches, connections}, ui}` (import applies both); materialised ports with readable stable ids (`sw1`, `p37`); connections are undirected `{a, b}` port refs — the pair is the identity, and cable metadata (colour is semantic) rides on it in `setup`, not `ui`; renderer owns physical geometry, switch x/y in canvas units. Vocabulary started in [GLOSSARY.md](../../GLOSSARY.md).
- [06 — Design the MVP editing UX](issues/06-mvp-ux-flows.md) — resolved; full flow spec in the answer. Right-side overlay inspector as the add/edit surface; app bar (`+ Add switch` / `New setup` / `Import` / `Export`); layout-preset gallery chips create switches immediately (48-port chip is "Unifi 48 Port"), while "Start blank" builds a ghost **draft switch** committed only by Add; body-click selects/opens, empty-canvas click closes; confirm dialogs for delete and for edits severing connections; guarded import; New keeps theme/cable prefs; centred first-run CTA. "Layout preset" added to the glossary.
- [07 — Choose the hosted home & self-host story](issues/07-hosting-decision.md) — resolved; platform-agnostic and local-first. No host chosen and no remote yet (user creates it manually later; name reserved `switch-setup-maker`), no custom domain; self-host = README + Dockerfile; dev/preview wildcard binding via env vars; deploys, when they exist, are build-only. Scope split: 13 is self-host only; [15 — Create the remote & publish the app](issues/15-remote-and-hosting.md) runs after 14.

## Not yet specified

The fog beyond the MVP — all in scope for this journey, none yet sharp enough to ticket:

- **Port-diagram exports (CSV/Excel)** — what a "port diagram" export contains; per-switch sheet vs. global connection list; format conventions.
- **Cable metadata** — palette, selection UI, defaults, types and lengths. Seam settled by [05](issues/05-domain-model.md): attributes ride on the connection and live in the setup (colour is semantic), never in `ui`.
- **Inventory** — counting SFP adapters and cables by length; what rules drive the counts; whether a stock/SKU notion is needed.
- **Port speed & PoE highlighting** — per-port speeds and PoE budgets; the visual language for highlighting.
- **Speed-mismatch warnings** — which combinations warn (1G↔10G, SFP vs RJ45, autoneg nuances).
- **Spanning tree / loops** — cycle detection in the connection graph; how loops are surfaced; multiple links between switches.
- **Connection state colours** — the port/cable colour language beyond link-state: needing an adapter, speed mismatch, aggregation (LAG), loop membership, layered over link state; what the model and cable metadata must carry for each (extends the speed/PoE and loop bullets above).
- **Multiple setups library** — create/name/switch between setups.
- **Real device-model library** — pick actual hardware models with pre-baked layouts.
- **Undo/redo** and other editing conveniences.
- **Post-MVP test hardening / TDD push** — the user wants a heavy test suite once the idea is validated.
- Plus whatever the "maybe more" turns out to be.

## Out of scope

- Backend, accounts, and multi-user sharing — ruled out in favour of a static, local-first app for this journey.
