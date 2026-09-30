# Stack: React + Vite with a hand-rolled hybrid canvas

We're building the switch-setup modeller as a static, local-first React + TypeScript app on Vite. The canvas is hand-rolled: switch faceplates are HTML/CSS elements (rounded corners, flex rows of port buttons), wires are a single SVG overlay whose endpoints are computed from the domain model's known port grid, and pan/zoom is delegated to react-zoom-pan-pinch (MIT, zero runtime dependencies). Styling is Tailwind CSS + shadcn/ui; tests are Vitest + Testing Library.

Why: the product's core is a custom, CSS-first faceplate look with per-port interactivity, and every later heavy feature (CSV/Excel exports, speed/PoE highlighting, loop checks) is a computation over the domain model — the renderer only has to be pleasant and must not become the model. This route keeps ports as plain DOM (Testing Library works in jsdom, accessible names come free), avoids attribution and licensing costs, and carries the least dependency weight.

## Considered Options

- **React Flow** — the same HTML-node/SVG-edge architecture, with viewport, drag, selection and edge rendering pre-built. Rejected because its ports are measured handles (React Flow's own documented stress point at 48-port density), app tests need jsdom shims or Playwright, and removing the default attribution badge requires paid Pro.
- **Pure hand-rolled SVG** — one coordinate system for faceplates and wires, but ports become SVG elements: the dynamic-SVG-per-port shape we wanted to avoid in React.
- **Konva / react-konva** — documented scale contingency only. It conflicts with the CSS-first look (no DOM or CSS per port). Revisit if ticket 04's prototype measures badly or the scale envelope grows an order of magnitude.

## Consequences

- Wire endpoints are computed from the model's port grid (the faceplate conventions researched for ticket 02), never DOM-measured; the geometry stays testable in jsdom, but the model must carry enough layout data (rows, port types, pitch) to derive port positions.
- The interaction layer — switch drag, click-to-connect, wire selection, pan coordination — is ours; react-zoom-pan-pinch owns only the viewport transform.
- Fallback order if the hybrid fails at realistic density: React Flow, then Konva. The model-first boundary keeps either swap contained to the canvas layer.
