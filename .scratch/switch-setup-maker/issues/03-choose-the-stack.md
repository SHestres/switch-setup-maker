# Choose the stack

Type: grilling
Status: resolved
Blocked by: 01

## Question

Lock the stack for the app, using the candidates and trade-offs from ticket 01: framework, rendering approach (SVG vs. canvas vs. diagram library), build tooling, and test tooling.

Criteria: static/self-hostable, port-level interactivity, freedom for the faceplate look, testability, and a smooth path to later CSV/Excel exports.

Record the choice and its rationale in the answer; an ADR in `docs/adr/` may be warranted.

## Answer

Stack locked in a grilling session (2026-09-29). Inputs: [01 — stack survey](../research/01-stack-rendering.md) and [03 — render-layer findings](../research/03-render-layer-options.md); decision recorded in [ADR 0001](../../../docs/adr/0001-stack-and-render-layer.md).

- **Framework**: React + TypeScript.
- **Build tooling**: Vite; builds static `dist`, self-hosted.
- **Rendering**: hand-rolled hybrid — faceplates as HTML/CSS elements (clean, diagrammatic, rounded look), one SVG overlay for wires inside a CSS-transformed viewport; wire endpoints computed from the model's port grid (ticket 02 conventions), never DOM-measured.
- **Pan/zoom**: react-zoom-pan-pinch (MIT, zero deps; 4.2.0 as of 2026-09). Switch drags stop propagation so they don't pan the canvas.
- **Styling / chrome**: Tailwind CSS + shadcn/ui.
- **Tests**: Vitest + Testing Library. Domain unit tests in the MVP under jsdom; browser mode later for gesture/geometry tests. Heavy test/TDD push stays post-MVP per the map.
- **Accessibility**: accessible names/roles where they come free (ports are DOM elements); no v1 keyboard/screen-reader canvasing program.
- **Devices**: desktop-first (mouse/trackpad).

**Rationale**: the CSS-first look was the user's lead requirement, and the research showed the HTML-node/SVG-edge split is the mainstream architecture (it is how React Flow and X6 work internally). It keeps ports as plain DOM — testable in jsdom, labels free — has no licensing or attribution costs, and carries the least dependency weight. The renderer stays outside the domain model, so the later feature set (exports, cable metadata, speed/PoE, loop checks) remains pure computation and the canvas stays swappable.

**Rejected**: React Flow (measured per-port handles are its documented stress point at 48-port density; jsdom shims/Playwright for app tests; paid Pro to remove the badge); pure SVG scene (per-port SVG elements — the shape the user was wary of); Konva (scale contingency only; no DOM/CSS per port).

**Seams for downstream tickets**: the domain model (05/09) must carry enough layout data — rows, port types, pitch — for the canvas to derive port positions, and must stay plain TS with no render types. Ticket 04's prototype is the falsification point for density/drag feel; fallback order if it fails: React Flow, then Konva.
