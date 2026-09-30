# Survey stack & diagram-rendering options

Type: research
Status: resolved

## Question

Which frontend stack and diagram-rendering approach best fit this app? It is a static, local-first web app for modelling network switch setups: switches render as faceplates with rows of individually interactive ports, connections are drawn port-to-port, and the same model later feeds CSV/Excel-style exports.

Survey and compare candidates, e.g.:

- TypeScript + React + hand-rolled SVG
- React (or another framework) with a diagram library: React Flow, Reaflow, Konva, D3, …
- Lighter frameworks (Svelte, Vue, Solid) + SVG
- SVG vs. canvas for dozens of switches × up to ~50 interactive ports each

Judge on: port-level interactivity at scale, zoom/pan support, freedom to render a custom faceplate look (not constrained to a node-graph look), tooling weight (Vite vs. alternatives), test story (e.g. Vitest + Testing Library), static/self-hosted builds, and future export needs.

Deliverable: findings file at `.scratch/switch-setup-maker/research/01-stack-rendering.md` recommending 2–3 candidates with trade-offs and sources. Do not pick for the user; ticket 03 makes the decision.

## Answer

Findings: [`.scratch/switch-setup-maker/research/01-stack-rendering.md`](../research/01-stack-rendering.md) (survey, sources, no pick — ticket 03 decides).

Headlines:

- **SVG-family rendering fits the stated scale.** Worst case is ~50 switches × 48 ports (~2,400 ports + up to ~2,400 wires). Konva's own comparison puts canvas ahead only for "thousands of frequently changed shapes"; SVG keeps per-port DOM events, CSS, accessibility and Testing Library queries. Canvas (Konva/react-konva) is documented as a contingency if the prototype measures badly.
- **Three candidates for ticket 03, with trade-offs only:**
  1. **React + TS + Vite + hand-rolled SVG** (optionally d3-zoom/d3-drag): max faceplate freedom and best test story; you build pan/zoom/selection and own re-render discipline.
  2. **React + TS + Vite + React Flow** (faceplate = custom node, ports = handles with ids, edges via `sourceHandle`/`targetHandle`; Svelte + Svelte Flow is the sibling): fastest interactive canvas and built-in node-level a11y; costs are per-port measurement caveats (`useUpdateNodeInternals`, hidden handles must stay measurable), jsdom shims/Playwright, perf guidance for heavy node CSS, and a default attribution badge whose removal is paid Pro.
  3. **Svelte 5 (or Solid) + TS + Vite + hand-rolled SVG**: lighter runtime, good Vitest story; smaller diagram-tooling ecosystem; framework familiarity is the real variable.
- **Exports are orthogonal.** CSV/Excel read the domain model; SheetJS CE (install via cdn.sheetjs.com — npm `xlsx` is stale at 0.18.5), ExcelJS, PapaParse all run client-side.
- **All candidates build static via Vite `dist`** and self-host trivially.
- **Open questions for ticket 03:** target devices/scale, whether per-port keyboard/screen-reader access is required, attribution badge acceptance, team framework familiarity, and faceplate visual ambition (to be measured in ticket 04's prototype).
