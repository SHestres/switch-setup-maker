# 03 — Render-layer options: HTML/CSS faceplates + wire overlay

Research supporting ticket [03 — Choose the stack](../issues/03-choose-the-stack.md), follow-up to [01](01-stack-rendering.md). The user's steer: a CSS-first look (simple, pretty, rounded corners) and a worry that "dynamic SVG is going to be a challenge with React".

**Method: quick pass (~35 min), primary sources only, no prototype measurement** (that is ticket 04's job). Versions/dates point-in-time 2026-09-29 from the npm registry and GitHub REST API. Links in [Sources](#sources).

## TL;DR

1. **The HTML/CSS route is real and mainstream.** React Flow, Vue Flow/Svelte Flow, X6 and Drawflow all render **nodes as DOM elements** and **connections as an SVG (or drawing) layer**. React Flow's node wrapper is literally a `<div>` with a CSS `translate()`; its docs say edge paths "are always SVG-based".
2. **It removes the pain the user named.** Ports become HTML elements (CSS, roles, DOM events, Testing Library). SVG is demoted to one wire overlay whose contents are computed `<path>` strings — the part of SVG React handles fine.
3. **Two good shapes:** hand-rolled hybrid (React + CSS-transform viewport + one SVG overlay, optionally `react-zoom-pan-pinch`) or React Flow (HTML custom nodes + a `<Handle>` per port). `tldraw` is ruled out by its production license; `react-xarrows` is a small-scale shortcut, not the architecture.

## 1. Is the HTML/CSS route real?

Yes. This is the dominant architecture for node-editor UIs: **DOM elements for nodes, SVG for edges**.

- **React Flow renders each node as an HTML `<div>`.** Its `NodeWrapper` source renders `<div className="react-flow__node" style={{ transform: 'translate(x,y)' }} …>` with drag/selection/a11y wiring, and the custom-node component is mounted inside it as ordinary JSX ([NodeWrapper source](https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/NodeWrapper/index.tsx); [Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)). The docs state plainly: "React Flow nodes are simply React components, ready for your interactive elements. We play nice with Tailwind and plain old CSS" ([reactflow.dev](https://reactflow.dev/)); and "Edges are SVG-based" / custom edge paths "are always SVG-based" ([EdgeLabelRenderer](https://reactflow.dev/api-reference/components/edge-label-renderer), [Custom Edges](https://reactflow.dev/learn/customization/custom-edges)).
- **X6**: "X6 supports using SVG and HTML to render node content. On this basis, we can also use React and Vue components to render nodes" ([X6 Quickstart](https://x6.antv.antgroup.com/en/tutorial/getting-started)); it has a first-class ports API ([Ports](https://x6.antv.antgroup.com/en/tutorial/basic/port)).
- **Vue Flow** (the engine family behind several big-tool UIs) is "heavily based on ReactFlow", built on d3 zoom/pan, with custom nodes and edges ([vue-flow README](https://github.com/bcakmakoglu/vue-flow)).
- **Drawflow** takes `html` per node (string or framework component) and draws the connections between named inputs/outputs ([Drawflow README](https://github.com/jerosoler/Drawflow)).

So in practice the "CSS-first diagram" is exactly what every flow library does: nodes are `div`s you style; only the connectors are SVG. The per-port "dynamic SVG in React" pain disappears because **ports are no longer SVG elements** — they are buttons/divs with `border-radius`, flex rows, and CSS states. SVG only has to emit path strings for wires.

## 2. Options for the interaction layer (maintained as of 2026-09)

| Option | What you get | Wires attach via | License / cost | Status |
| --- | --- | --- | --- | --- |
| **React Flow** `@xyflow/react` | Canvas: viewport zoom/pan, node drag, selection, edges, minimap; **nodes are HTML by default**, edges SVG | One `<Handle>` per port; edge `sourceHandle`/`targetHandle`; handles are measured DOM ([Handles](https://reactflow.dev/learn/customization/handles)) | MIT core; **default attribution badge, removal is paid Pro** ([Remove attribution](https://reactflow.dev/remove-attribution)) | 12.12.0, 2026-09-24; repo active |
| **react-zoom-pan-pinch** | A transform wrapper for arbitrary HTML/SVG children + hooks (`useControls`, `useTransformContext`); no node/edge semantics | You draw them (or pair with react-xarrows) | MIT (paid support optional, $400/mo) | 4.2.0, 2026-09-03; ~1.9k★; repo pushed 2026-09-09 |
| **react-xarrows** | Draws SVG arrows between any two DOM nodes by id/ref; anchors, labels, grid/curve paths; `Xwrapper`/`useXarrow` to trigger updates while dragging | DOM ids/refs + anchors; you call `updateXarrow()` on drag | MIT, zero runtime deps | 2.2.0, 2026-08-28; "actively maintained again after a long gap" |
| **AntV X6** `@antv/x6` | Full diagram engine: SVG **and HTML/React nodes** (`@antv/x6-react-shape`), ports with layout algorithms, routers, minimap, snaplines | Ports API (`addPort`, port groups, labels) | MIT | 3.1.8, 2026-08-11; ~6.7k★; active-ish |
| **JointJS core** `@joint/core` | Mature SVG diagram engine; HTML via foreignObject-style markup | `ports` API | **MPL-2.0** (file-level copyleft); advanced features are commercial JointJS+ | 4.3.3, 2026-09-04; active |
| **Drawflow** | Vanilla, tiny DOM-node flow editor | Named `input_n`/`output_n` classes | MIT | 0.0.60, 2024-09; ~273 open issues; effectively stale |
| **tldraw** | Whole whiteboard SDK, canvas-rendered shapes, its own tooling/UI | Shape bindings/arrows | **Custom license: production use prohibited without a license key/commercial agreement; watermark enforced** ([LICENSE.md](https://github.com/tldraw/tldraw/blob/main/LICENSE.md)) | 5.4.2, 2026-09-10; very active — but **license rules it out** for this app |

Also surveyed, weaker fits: **Rete.js** (MIT; active; node-editor framework with sockets — different paradigm), **Reaflow** (see [report 01 §4](01-stack-rendering.md) — ELK-layout oriented, slower cadence). `leader-line` is **archived** and `leader-line-new` last published 2020 — treat as dead.

## 3. Hand-rolled hybrid: the real complexity

**Architecture.** Container div → world div with `transform: translate(x,y) scale(k)` and `transform-origin: 0 0` → inside it: (a) switch faceplates as absolutely positioned HTML `div`s with CSS rounded corners/flex port rows, (b) one sibling `<svg>` with `overflow: visible` and `pointer-events: none`. Wires are `<path>`s in world coordinates; give each a transparent fat stroke (or `pointer-events: stroke`) so a connection can be clicked/deleted without making the overlay swallow canvas gestures. Pan/zoom then comes free for content and wires via the single CSS transform.

**Wire endpoints — two techniques, prefer the first:**

1. **Compute from the model.** Report [02](02-faceplate-conventions.md) established that faceplates are deterministic grids (~14 mm pitch, known rows/offsets). Port centre = switch origin + row/col offset. No DOM reads, works in jsdom, and re-renders only the wires whose endpoints moved.
2. **Measure the DOM.** `getBoundingClientRect()` returns **viewport coordinates with the CSS transform applied** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)); convert with `world = (client − containerRect − translate) / scale`. This is what React Flow does internally (it "needs to measure nodes in order to render edges" — [Testing](https://reactflow.dev/learn/advanced-use/testing)). Costs: re-measure on resize/zoom, and jsdom returns zeros, so tests never see real geometry.

**React-specific pitfalls (design judgment, mostly):**

- **Don't put pan/zoom in React state per frame.** A pointermove that re-renders ~2,400 ports will feel it. Keep the viewport in a ref/external store and write one wrapper's `style.transform`, or let react-zoom-pan-pinch do it; re-render only what changed.
- **Isolate the wire layer** from the node layer, and memoize faceplates. During a switch drag, update the dragged switch's transform and only that switch's incident wires' `d`.
- **Coordinate/transform footguns:** apply translate then scale from `transform-origin: 0 0`; decide whether stroke width scales (`vector-effect: non-scaling-stroke` opts out); use pointer capture for drags; stop propagation on port clicks so panning doesn't start.
- **Tests:** ports are plain DOM, so Testing Library queries by role/name work in jsdom; pan/drag geometry goes to Vitest browser mode (same conclusion as [report 01 §6](01-stack-rendering.md)).

Effort: pan/zoom + drag + wire layer is a few hundred lines total; the CSS look is then pure styling.

## 4. Verdict (options, not a ranking)

- **A — Hand-rolled hybrid (lead recommendation).** React + TS + Vite; HTML faceplates + single SVG wire overlay; optional `react-zoom-pan-pinch` for the viewport; model-computed anchors. Best match for the CSS-first look, lowest dependency weight (one MIT 0-dep library at most), no attribution/paid tiers, static build, best jsdom story. You own pan/zoom/selection (small, once).
- **B — React Flow.** Take it if canvas behaviors and node-level a11y out of the box are worth the constraints: it is already an HTML-node/SVG-edge architecture, so the CSS look survives; you pay with the attribution badge (paid removal), jsdom shims, measured per-port handles at 48 ports, and a library-owned interaction model.
- **C — RZPP + react-xarrows (prototype shortcut only).** Fastest demo, both MIT and maintained; but react-xarrows re-renders arrows per `Xwrapper` and has no documented 10³-arrow story — do not make it the architecture.
- **D — X6 / JointJS / Rete.** Full engines if routing/snaplines/minimap become requirements; heavier, less React-idiomatic, JointJS is MPL. Not needed for this problem.

**Where report 01's candidates still win:** pure hand-rolled **SVG** (01 Candidate A) still wins if faceplates and wires must share one SVG coordinate system/filters and you accept per-port SVG — the hybrid trades that single system for HTML ports + an overlay. **React Flow** (01 Candidate B) still wins when delivery speed beats ownership. **Konva** remains the documented scale contingency, but the CSS-first goal works against it: no DOM/CSS per port.

**Direct answer to the user's worry:** yes — rendering ports as HTML removes the per-port dynamic-SVG problem. What remains is a single SVG overlay of computed path data, which React re-renders only when an endpoint actually changes.

## Sources

Primary sources, accessed 2026-09-29; npm/GitHub metadata same date.

- React Flow: [NodeWrapper source](https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/NodeWrapper/index.tsx) · [Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) · [Custom Edges](https://reactflow.dev/learn/customization/custom-edges) · [EdgeLabelRenderer](https://reactflow.dev/api-reference/components/edge-label-renderer) · [Handles](https://reactflow.dev/learn/customization/handles) · [Testing](https://reactflow.dev/learn/advanced-use/testing) · [Remove attribution](https://reactflow.dev/remove-attribution) · npm `@xyflow/react` 12.12.0 (2026-09-24) · [repo](https://github.com/xyflow/xyflow)
- react-zoom-pan-pinch: [README](https://github.com/BetterTyped/react-zoom-pan-pinch) · [docs/demo](https://bettertyped.github.io/react-zoom-pan-pinch/) · npm 4.2.0 (2026-09-03), MIT, 0 deps, ~1.9k★
- react-xarrows: [README](https://github.com/Eliav2/react-xarrows) · npm 2.2.0 (2026-08-28), MIT, 0 deps
- X6: [Quickstart](https://x6.antv.antgroup.com/en/tutorial/getting-started) · [Ports](https://x6.antv.antgroup.com/en/tutorial/basic/port) · npm 3.1.8 (2026-08-11), MIT
- JointJS: npm `@joint/core` 4.3.3 (2026-09-04), MPL-2.0 · [repo](https://github.com/clientIO/joint)
- Drawflow: [README](https://github.com/jerosoler/Drawflow) · npm 0.0.60 (2024-09-03), MIT, 2024 activity
- tldraw: [LICENSE.md](https://github.com/tldraw/tldraw/blob/main/LICENSE.md) · npm 5.4.2 (2026-09-10)
- Vue Flow: [README](https://github.com/bcakmakoglu/vue-flow) (built on d3 zoom/pan; based on ReactFlow)
- Rete.js: npm `rete` 2.0.6 (2025-06-30), MIT · [repo](https://github.com/retejs/rete)
- leader-line: [repo, archived](https://github.com/anseki/leader-line) · `leader-line-new` last published 2020
- MDN: [getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) (viewport coords, transforms, scrolling)
