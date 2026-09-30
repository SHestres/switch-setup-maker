# 01 — Stack & diagram-rendering survey

Findings for ticket [01 — Survey stack & diagram-rendering options](../issues/01-stack-rendering-research.md).
Researched 2026-09-29 against primary sources (framework/library docs, source repos, registry metadata, specs/reference docs). Versions, stars and activity dates are point-in-time; links are listed in [Sources](#sources).
**This file surveys and compares. It does not pick.** Ticket [03](../issues/03-choose-the-stack.md) makes the decision with the user.

---

## 1. What the app actually needs from its renderer

From the map and ticket 01, the renderer must support:

- switches drawn as **faceplates** with individually interactive ports (hover, click, later highlight states);
- **port-to-port connections** (wires) drawn between specific ports;
- **drag to reposition** switches on a canvas, plus **pan/zoom**;
- a look that is **not constrained to a node-graph style** (realistic faceplates matter);
- **static/self-hostable** build, no backend;
- a **good test story** (MVP: unit tests for domain logic; later: a heavier test push);
- nothing that blocks later CSV/Excel exports, cable metadata, speed/PoE highlighting, or loop checks.

Two scoping observations that shape everything below:

1. **All later features are model features.** Exports, cable metadata, speed/PoE highlighting and spanning-tree/loop checks are computations over the domain model. They do not read the DOM, the SVG scene or the canvas. The render stack only has to (a) make the canvas pleasant to use and (b) avoid becoming the model. See [§7 Cross-cutting findings](#7-cross-cutting-findings).
2. **The scale envelope is low thousands of elements at worst.**

   | Scenario | Switches | Ports | Wires (≤) | Interactive elements |
   | --- | --- | --- | --- | --- |
   | Small wiring closet | 2–5 | ~100–250 | ~100–250 | ~200–500 |
   | Medium setup | ~10–20 | ~500–1,000 | ~500–1,000 | ~1,000–2,000 |
   | Stated worst case ("dozens × up to ~50 ports") | ~50 | ~2,400 | ~2,400 | ~5,000 |

   The ticket's own envelope says "dozens of switches × up to ~50 interactive ports each". That is a **hundreds-to-low-thousands** DOM-node problem, which lands in the band where SVG-family rendering is documented as comfortable and canvas only becomes necessary an order of magnitude higher (see §2).

---

## 2. SVG vs canvas: what the sources say

**SVG keeps every shape as a DOM element.** MDN: SVG is "designed specifically to work well with other web standards including CSS, DOM, JavaScript"; SVG text is searchable/indexable/scriptable, and vectors stay crisp at any zoom ([MDN — SVG](https://developer.mozilla.org/en-US/docs/Web/SVG)). That means per-port CSS, DOM events, `tabindex`, ARIA roles and Testing Library queries all come for free.

**Canvas is a bitmap with no per-shape DOM.** MDN: "The `<canvas>` element is just a bitmap and does not provide information about any drawn objects… Canvas content is not exposed to accessibility tools like semantic HTML is. In general, you should use canvases like images and avoid using them to render significant content without accessible backing markup" ([MDN — Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)). A canvas library can rebuild an object model on top (Konva does), but it does not give back DOM-level accessibility, CSS or testability.

Konva's own comparison page is unusually candid about this and is the cleanest source for the trade-off table ([Konva — Canvas vs SVG](https://konvajs.org/docs/posts/canvas-vs-svg.html)):

| Requirement | Konva's "usual choice" |
| --- | --- |
| Accessible DOM elements for each shape | SVG |
| CSS selectors and DOM events on each shape | SVG |
| Thousands of frequently changed shapes | Canvas |
| A retained shape model on Canvas | Konva (i.e. canvas alone doesn't have one) |

The same page: "SVG keeps each shape as a DOM element… This model works well for diagrams with a small number of shapes," and "Konva does not create accessible DOM elements for canvas shapes. Keep essential controls and content in HTML."

Canvas does buy real performance at scale, but it must be managed: Konva's performance guide recommends layer separation (`listening(false)` on non-interactive layers), culling off-screen nodes for very large scenes, shape caching and reducing shadows/filters; it notes each layer allocates both a scene and a hit canvas (roughly 41 MB per layer for a 1920×1080 retina stage) ([Konva — All Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)). Its dedicated perf page demonstrates 2,000 non-interactive circles on a background layer plus an interactive layer ([Konva — Canvas Performance](https://konvajs.org/docs/posts/canvas-performance.html)); the docs also ship a "10,000 shapes with tooltip" demo ([Konva demos](https://konvajs.org/docs/sandbox/10000_Shapes_with_Tooltip.html)).

**Reading for this app:** the stated envelope (~5,000 interactive elements worst case, and most layouts far smaller) sits in the documented SVG band. The transition point to canvas is "thousands of **frequently changed** shapes" (Konva), not thousands of mostly-idle interactive ones. A diagram where you drag one switch at a time and hover one port at a time is not a per-frame redraw workload.

> Secondary benchmark write-ups (vendor blogs and comparison posts) were checked but are not relied on here: their methodology and vintages are not verifiable. The primary sources above define the band, and ticket 04's prototype is the right place to measure the real scene (Konva's own advice: "Measure the real scene on the devices that your users have").

---

## 3. Approach A — hand-rolled SVG inside a component framework

**What it is:** the framework renders one `<svg>` canvas; each switch is a `<g>` with a faceplate drawing and one element per port (`<circle>`, `<rect>`, LED); wires are `<path>`s in a shared coordinate system; pan/zoom is a single transform on a wrapper group.

**Zoom/pan and drag:** you can implement the transform math yourself (it is small: translate + scale, pointer events, wheel delta), or use D3's behavior modules as headless helpers. d3-zoom is explicitly "agnostic about the DOM, so you can use it with HTML, SVG, or Canvas"; it gives programmatic transforms, `scaleExtent`/`translateExtent`, and `transform.toString()` emits an SVG `translate(...) scale(...)` transform string ([d3-zoom docs](https://d3js.org/d3-zoom)). d3-drag "unifies mouse and touch input and avoids browser quirks" and provides a subject accessor for hit targets ([d3-drag docs](https://d3js.org/d3-drag)).

**Strengths (from the criteria):**

- *Faceplate freedom:* you draw exactly what you want; no library's node/edge semantics in the way. CSS and SVG filters/gradients apply to individual parts.
- *Port-level interactivity:* each port is its own DOM element — hover, click, focus, `aria-label`, disabled states. Testing Library can query ports by role/name rather than reaching into a scene graph.
- *Test story:* components and ports are testable in jsdom with the standard Vitest + Testing Library stack; jsdom's known limits are layout-related (see §6), not existence-related. Drag/pan interaction tests can move to Vitest browser mode when they need real geometry ([Vitest browser mode](https://vitest.dev/guide/browser/)).
- *Static build:* plain Vite app → `dist` → any static host ([Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html)).
- *No attribution/licensing surprises:* no diagram library, no badge.

**Costs:**

- You own pan/zoom gestures, selection, marquee, hit-test tolerance, focus order, and re-render discipline.
- Wires between ports must be recomputed as switches move (trivial math, but you own it and its performance).
- Using D3's selection API to write DOM while a framework owns the DOM is a known impedance mismatch; the safe pattern is to use D3's math/behavior modules only (zoom, drag, shapes) and let the framework render. (Design judgment, not a sourced claim.)
- Per-port re-render discipline matters at ~10³ ports: ports should be memoized/isolated, and drag should move a switch via a transform rather than re-rendering all ports.

**Framework sub-choice (React vs Svelte vs Solid vs Vue):** all four render SVG competently and all four have first-party Vitest-based test stories — Svelte recommends Vitest and documents both `mount` and `@testing-library/svelte` ([Svelte — Testing](https://svelte.dev/docs/svelte/testing)); Solid's official guide prescribes Vitest + jsdom + `@solidjs/testing-library` + user-event ([Solid — Testing](https://docs.solidjs.com/guides/testing)); Vue recommends Vitest and `@vue/test-utils` (with a documented Suspense caveat for `@testing-library/vue`) ([Vue — Testing](https://vuejs.org/guide/scaling-up/testing.html)). Svelte's compiler turns components into "lean, tightly optimized JavaScript" ([Svelte — Overview](https://svelte.dev/docs/svelte/overview)); Solid's selling point is fine-grained reactivity without a virtual DOM. The renderer-relevant difference between them is small; the bigger variables are team familiarity and the availability of a flow library if Approach B is wanted.

---

## 4. Approach B — a node-graph library: React Flow / Svelte Flow

**What it is:** the library owns the canvas (viewport, pan/zoom, selection, drag, edges) and you supply custom node components. Faceplate = custom node; ports = handles; ports-to-port wires = edges bound to handle ids.

**Fit for port-to-port connections (primary source: React Flow handles docs):**

- "Handles are the connection points on nodes… you can customize your nodes with as many different handles as you need" ([React Flow — Handles](https://reactflow.dev/learn/customization/handles)).
- Multiple handles on a node require unique `id`s; edges attach to a specific port with `sourceHandle`/`targetHandle` ([Handles](https://reactflow.dev/learn/customization/handles)) — i.e. port-to-port connections are a first-class concept.
- Any custom component can be a handle (wrap it in `<Handle />`), so a port can look like an RJ45/SFP element ([Handles](https://reactflow.dev/learn/customization/handles)).
- Gotchas with many handles: if you add/remove/move handles dynamically you must call `useUpdateNodeInternals()`; handles must stay measurable when hidden (`visibility: hidden`/`opacity: 0`, never `display: none`) — the library needs their dimensions ([Handles](https://reactflow.dev/learn/customization/handles)).

**Strengths:**

- Canvas behaviors are done: viewport, zoom/pan, selection, node drag, edge drawing/reconnection, minimap/controls ([React Flow docs home / examples](https://reactflow.dev/examples)).
- Custom nodes are arbitrary React components: "render anything you want within your nodes… even embed form inputs, charts, and other interactive elements" ([Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)). The node-graph look is a default, not a constraint.
- Accessibility is built in at the node/edge level: tab navigation, ARIA roles, arrow-key node movement, `aria-live` announcements, and `domAttributes` for custom ARIA on nodes/edges ([React Flow — Accessibility](https://reactflow.dev/learn/advanced-use/accessibility)).
- Real shipped precedent: Retool workflows, Stripe docs flowcharts, Supabase schema visualizer, LangFlow, Dify, and many more ([React Flow — Showcase](https://reactflow.dev/showcase)).
- MIT-licensed core, actively maintained: `xyflow/xyflow` is MIT, ~38.5k stars, last pushed the morning of this research; `@xyflow/react` 12.12.0 published 2026-09-24 (GitHub API, npm registry).

**Costs and caveats:**

- *Look freedom is high but not total:* nodes are library-managed wrappers (selection/drag/measurement semantics); your faceplate is a component inside that model.
- *Per-port overhead:* every port is a measured DOM element (`Handle`) plus edge bookkeeping. For 48-port faceplates this is the design's stress point rather than a blocker, but it should be measured.
- *Performance guidance is explicit:* memoize custom node/edge components and callbacks, don't read the whole `nodes` array in components, collapse/hide large node trees, and simplify heavy CSS — "animations, shadows, or gradients can significantly impact performance" ([React Flow — Performance](https://reactflow.dev/learn/advanced-use/performance)). Faceplates trade realism (gradients, shadows) against this.
- *Test story:* the docs "recommend Cypress or Playwright" for app tests because "React Flow needs to measure nodes in order to render edges and for that relies on rendering DOM elements." Jest/jsdom requires shims for `ResizeObserver`, `DOMMatrixReadOnly`, `offsetWidth/Height`, and `SVGElement.getBBox`, plus `waitFor` for edges and disabling d3-drag (`nodesDraggable={false} panOnDrag={false}`) to test mouse events inside nodes ([React Flow — Testing](https://reactflow.dev/learn/advanced-use/testing)). Domain logic tests are unaffected.
- *Attribution:* the library displays a "React Flow" attribution by default; removing it is a **paid Pro** feature — "Subscribing to React Flow Pro permits you to remove the attribution" ([Remove attribution](https://reactflow.dev/remove-attribution)). Not a license blocker, but a product/budget decision for a self-hosted tool.
- *Dependency shape:* `@xyflow/react` depends on `zustand`, `classcat` and `@xyflow/system`, peer React ≥17 (npm registry metadata). React Flow's interactions are built on d3-drag/d3-zoom (the testing page instructs disabling d3-drag for jsdom tests), so the underlying mechanics are the same style as Approach A, just pre-wired.

**Sibling implementations (same architecture, other frameworks):**

- **Svelte Flow** — same team, "The Node-Based UI for Svelte" ([svelteflow.dev](https://svelteflow.dev/)); `@xyflow/svelte` 1.7.0 published 2026-09-24 (npm registry).
- **Vue Flow** — community port, MIT, ~6.9k stars, `@vue-flow/core` 1.48.2 (Jan 2026 publish; repo pushed Jul 2026) ([bcakmakoglu/vue-flow](https://github.com/bcakmakoglu/vue-flow), npm registry).
- **Reaflow** — Apache-2.0, ~2.5k stars, but lower maintenance cadence (last npm publish Apr 2025, repo pushed Jun 2025, 89 open issues) and it is oriented around ELK auto-layout rather than fully custom faceplates ([reaviz/reaflow](https://github.com/reaviz/reaflow), npm registry). Weaker candidate for this app.

---

## 5. Approach C — canvas with an object model: Konva / react-konva

**What it is:** a scene graph over a single `<canvas>` element. Shapes are retained objects with events, properties and drag support; Konva manages hit detection and redraws ([Konva — Canvas vs SVG](https://konvajs.org/docs/posts/canvas-vs-svg.html)). `react-konva` provides the React bindings; `konva` 10.7.0 and `react-konva` 19.3.0 are current (npm registry), MIT licensed (LICENSE file), with `react-konva` requiring React ^19.3 and Konva ^8–^10 (npm peer deps).

**Strengths:**

- Documented to scale to thousands of shapes with the standard optimizations (layer separation, `listening(false)`, culling, caching) ([All Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html), [Canvas Performance](https://konvajs.org/docs/posts/canvas-performance.html)).
- Full drawing control (custom shapes, textures, gradients), drag and drop, stage scale for zoom.

**Costs (all primary-sourced):**

- **No DOM per port.** No CSS on shapes, no Testing Library queries against ports. Konva's docs: "Konva does not create accessible DOM elements for canvas shapes. Keep essential controls and content in HTML."
- **Test story moves to real browsers.** react-konva's testing page: "Testing canvas is not like testing DOM. Your shapes are not elements, so Testing Library queries never find them." It warns that jsdom does not fail loudly — `getIntersection` returns `null`, `toDataURL` returns a stub, pixel readback is transparent — so a green jsdom test can test nothing. Their own recommendation is jsdom for store/logic and Vitest browser mode + Playwright for anything touching a `Stage` ([react-konva — Testing](https://konvajs.org/docs/react/Testing.html)).
- **Memory/perf management is on you:** per-layer canvas allocations (~41 MB per layer on a 1920×1080 retina stage per [All Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)), culling for large scenes, and drag costs.
- **Crisp text/zoom** requires pixel-ratio handling; text is drawn, not selected or announced.

**When canvas would win:** if a future layout regularly exceeds ~10⁴ simultaneously animating/changing shapes, or if the prototype proves SVG-family rendering slow on target devices. Neither follows from the stated MVP or long-term feature list, so treat Konva as a documented contingency, not a current recommendation.

---

## 6. Test story snapshot (the criterion with the biggest spread)

| Aspect | Hand-rolled SVG | React Flow / Svelte Flow | Konva / react-konva |
| --- | --- | --- | --- |
| Domain logic (Vitest, node env) | unaffected | unaffected | unaffected |
| Component/render tests in jsdom | yes; ports are DOM (layout APIs still stubbed) | possible with shims (`ResizeObserver`, `DOMMatrixReadOnly`, offsets, `getBBox`); `waitFor` for edges; disable d3-drag for mouse tests | Testing Library queries never see shapes; jsdom canvas silently fakes results |
| Interaction tests (drag/zoom) | Vitest browser mode or Playwright | docs recommend Cypress/Playwright for app-level; jsdom workarounds exist | docs recommend Vitest browser mode/Playwright; scene-graph assertions work, pixels need a browser |
| Accessibility assertions | per-port roles/labels, fully assertable | node/edge roles built in; per-port ARIA is custom work | manual; no DOM to assert against |

Primary sources: React Flow [Testing](https://reactflow.dev/learn/advanced-use/testing) and [Accessibility](https://reactflow.dev/learn/advanced-use/accessibility); Konva/react-konva [Testing](https://konvajs.org/docs/react/Testing.html); jsdom README's caveat that layout "does not do any layout or rendering" and returns zeros for many layout-related properties ([jsdom README](https://github.com/jsdom/jsdom#caveats)); Vitest [browser mode](https://vitest.dev/guide/browser/) (Playwright/WebdriverIO providers, `vitest-browser-react`/`-svelte`/`-vue` renderers, Testing Library for Solid).

Note: jsdom gained `PointerEvent` in April 2025 ([jsdom#2527](https://github.com/jsdom/jsdom/issues/2527)), so pointer-based synthetic events are no longer an automatic blocker — layout and canvas remain the limits.

---

## 7. Cross-cutting findings

### 7.1 Tooling weight and static hosting

- Every candidate builds to static files with Vite: "By default, the build output will be placed at `dist`. You may deploy this `dist` folder to any of your preferred platforms" ([Vite — Static Deploy](https://vite.dev/guide/static-deploy.html)). `vite preview` is explicitly "not meant as a production server" — a plain static host (or the user's own server) serves the built files.
- Svelte's framework (SvelteKit) can be static too: `adapter-static` prerenders the site to static files, with a fallback page option for SPA mode ([SvelteKit — adapter-static](https://svelte.dev/docs/kit/adapter-static)). Plain Vite + Svelte (no SvelteKit) is also viable for a single-screen app.
- No candidate in this survey requires a backend, an account, or SSR. React Flow supports SSR/SSG but doesn't need it here ([React Flow — SSR/SSG](https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration)).
- Runtime weight differences (React vs Svelte- compiled vs Solid vs Vue) are real but small relative to a diagram app's own code; the dominant weight is whichever diagram library is chosen.

### 7.2 Future exports (CSV/Excel) do not constrain the render stack

- Exports read the **domain model**, not the render tree, so any stack qualifies. The libraries that matter are client-side data writers:
  - **SheetJS CE** (Apache-2.0; GitHub metadata): note the install caveat — the official docs state "the public npm registry as `xlsx`… is out of date. The latest version on that registry is 0.18.5", while `https://cdn.sheetjs.com` is "the authoritative source"; the recommended install is the CDN tarball (vendoring recommended), e.g. `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, with dynamic-import wrappers to keep bundles lean ([SheetJS — Installation](https://docs.sheetjs.com/docs/getting-started/installation/), [Frameworks and Bundlers](https://docs.sheetjs.com/docs/getting-started/installation/frameworks)).
  - **ExcelJS** (MIT): publishes browserified bundles in `dist/`; "A portion of this library has been isolated and tested for use within a browser environment" ([exceljs/exceljs README](https://github.com/exceljs/exceljs#browser)). Slower maintenance cadence (last repo push Jan 2025, GitHub API) than SheetJS.
  - **PapaParse** (MIT, actively maintained) for plain CSV if that is all that's needed ([mholt/PapaParse](https://github.com/mholt/PapaParse)).
- All of these run in the page and download via a Blob/object URL; none requires a server.

### 7.3 Model-first design (relevant to the stack decision)

- Keep the canonical model (switches, port layouts, connections) as plain TypeScript with **no diagram-library types**. If React Flow/Svelte Flow is chosen, map model → nodes/edges/handles at the boundary; if hand-rolled, map model → SVG. This keeps JSON import/export stable and keeps loop checks/speed highlighting pure functions that work under any stack. (Design judgment; supported by the ticket's data-flow description.)

### 7.4 Criteria matrix (approximate, evidence-linked)

| Criterion | Hand-rolled SVG | Flow library (React/Svelte Flow) | Canvas (Konva) |
| --- | --- | --- | --- |
| Port-level interactivity at ~10³ ports | Direct DOM per port; you control re-render granularity | Handles per port; library measures each; memoization guidance applies | Custom hit detection; no DOM; needs culling/listening management |
| Zoom/pan | Build small transform layer or borrow d3-zoom/d3-drag | Built in | Stage scale; you wire gestures |
| Faceplate freedom | Total | High (custom node component), inside library wrapper | Total drawing freedom, no CSS |
| Tooling weight | Framework + optional d3 modules | Framework + @xyflow (~zustand/system) | Framework + konva |
| Test story | Best in jsdom; browser mode for geometry | Shim-assisted jsdom; docs recommend E2E | Browser-only for real assertions |
| Static/self-host | Vite `dist` | Vite `dist` | Vite `dist` |
| Exports later | Orthogonal | Orthogonal | Orthogonal |
| Accessibility of ports | Best (DOM) | Node-level built in; per-port custom | Weakest (bitmap) |
| Extra commercial note | — | Attribution badge; removal is Pro-paid | — |

---

## 8. Candidate stacks (2–3 to take into ticket 03, plus a documented contingency)

Trade-offs only; no ranking is intended.

### Candidate A — React + TypeScript + Vite + hand-rolled SVG (optionally d3-zoom/d3-drag)

- **Shape:** React 19 + TS + Vite; one SVG scene; ports as DOM elements with roles/labels; wires as `<path>`; custom transform layer (or d3 behaviors) for pan/zoom; plain-TS domain model; Vitest + Testing Library, browser mode for gesture tests.
- **Picks up:** maximum faceplate freedom, first-class port DOM (events, focus, ARIA, testability), no library attribution or interaction constraints, smallest conceptual surface.
- **Pays for:** pan/zoom/selection/marquee/hit-testing/edge-routing are yours to build and maintain; performance discipline at high port counts is on you; more MVP code than Candidate B.
- **Good fit when:** the team wants to own the interaction model, per-port accessibility/testing matters, and the canvas behavior set is considered small enough to build once.

### Candidate B — React + TypeScript + Vite + React Flow (`@xyflow/react`)

- **Shape:** faceplate = custom node; one `<Handle>` per port with stable ids; edge `sourceHandle`/`targetHandle` = port-to-port; built-in viewport/zoom/pan/selection; Vitest for domain logic; Playwright or shim-assisted jsdom for app tests.
- **Sibling:** Svelte 5 + Svelte Flow is the same architecture with a different framework ([svelteflow.dev](https://svelteflow.dev/)); useful if the team prefers Svelte.
- **Picks up:** fastest path to a working interactive canvas; canvas behaviors and node-level a11y built in; huge example/showcase corpus; MIT core; active maintenance.
- **Pays for:** interaction model constraints around custom nodes; per-port handles are measured DOM and need care (`useUpdateNodeInternals` on dynamic handles, measurable hidden handles, memoization, heavy CSS caution at 48-port density); jsdom shims/Playwright for app tests; default attribution badge (removal tied to paid Pro); one more conceptual dependency in the model boundary.
- **Good fit when:** delivery speed of the canvas is the priority, and the team accepts measuring the per-port load in the prototype and paying for/living with the attribution question.

### Candidate C — Svelte 5 (or Solid) + TypeScript + Vite + hand-rolled SVG (optionally Svelte Flow)

- **Shape:** same as A but with a lighter compile-first framework; optionally swap in Svelte Flow if the library route wins on the merits.
- **Picks up:** small runtime, comfortable SVG templating, Vitest + Testing Library test story ([Svelte — Testing](https://svelte.dev/docs/svelte/testing), [Solid — Testing](https://docs.solidjs.com/guides/testing)), a path to the same Flow architecture if wanted.
- **Pays for:** fewer hands in the open-source ecosystem for diagram tooling than React (Svelte Flow exists and is actively maintained by the React Flow team; Vue Flow exists for Vue); team familiarity and hiring are the real questions.
- **Good fit when:** the team already leans Svelte/Solid or values runtime leanness; otherwise the framework difference is likely smaller than the rendering-model decision.

### Contingency (not a recommendation) — canvas via Konva / react-konva

Documented as the escape hatch if the prototype shows SVG-family rendering failing on target devices or if the scale envelope grows an order of magnitude. Costs are explicit and primary-sourced: no per-shape DOM/CSS/accessibility, Testing Library cannot see shapes, jsdom silently fakes canvas results, and canvas memory/layers must be managed ([§5](#5-approach-c--canvas-with-an-object-model-konva--react-konva)).

---

## 9. Open questions ticket 03 should settle with the user

1. **Target devices/scale:** does the worst case (~50 switches × 48 ports) need to stay smooth on low-end hardware, or is a typical laptop enough?
2. **Per-port accessibility:** is keyboard/screen-reader access to individual ports a requirement (domain: IT pros; accessibility may also be a procurement rule)? This is the strongest technical divider between SVG and canvas.
3. **Attribution:** if the library route is attractive, is a persistent "React Flow" badge acceptable, or is the paid Pro plan/hand-rolled route preferred?
4. **Team familiarity:** React vs Svelte vs Solid vs Vue affects delivery speed more than the measured differences between them in this survey.
5. **Prototype feedback (ticket 04):** measure a realistic faceplate grid — e.g. 20 faceplates × 48 ports with hover/drag — under the candidate(s), and note interaction latency. Konva's own advice is to measure the real scene, not node counts.
6. **Faceplate visual ambition:** the more gradients/shadows/animations per faceplate, the more the Flow-library performance guidance bites (per its own docs). Decide the visual budget before locking the stack.

---

## Sources

Primary sources, accessed 2026-09-29. Point-in-time metadata from GitHub REST API and the npm registry on the same date.

**Rendering models**
- MDN, *SVG: Scalable Vector Graphics* — https://developer.mozilla.org/en-US/docs/Web/SVG
- MDN, *Canvas API* (accessibility concerns) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Konva, *Canvas vs SVG for Interactive Graphics* — https://konvajs.org/docs/posts/canvas-vs-svg.html

**React Flow / xyflow**
- Custom Nodes — https://reactflow.dev/learn/customization/custom-nodes
- Handles (multiple handles, ids, `sourceHandle`/`targetHandle`, dynamic handles, hidden handles) — https://reactflow.dev/learn/customization/handles
- Performance — https://reactflow.dev/learn/advanced-use/performance
- Testing — https://reactflow.dev/learn/advanced-use/testing
- Accessibility — https://reactflow.dev/learn/advanced-use/accessibility
- Remove attribution (Pro) — https://reactflow.dev/remove-attribution
- Showcase — https://reactflow.dev/showcase
- Repo (MIT, stars, activity) — https://github.com/xyflow/xyflow
- npm: `@xyflow/react` 12.12.0, `@xyflow/svelte` 1.7.0 — https://www.npmjs.com/package/@xyflow/react , https://www.npmjs.com/package/@xyflow/svelte
- Svelte Flow — https://svelteflow.dev/
- Vue Flow repo — https://github.com/bcakmakoglu/vue-flow ; npm `@vue-flow/core` 1.48.2
- Reaflow repo — https://github.com/reaviz/reaflow ; npm `reaflow` 5.4.1

**Konva / react-konva**
- All Performance Tips — https://konvajs.org/docs/performance/All_Performance_Tips.html
- Canvas Performance — https://konvajs.org/docs/posts/canvas-performance.html
- react-konva Testing — https://konvajs.org/docs/react/Testing.html
- Demos index (10,000 shapes) — https://konvajs.org/docs/sandbox.html
- Repo/LICENSE (MIT) — https://github.com/konvajs/konva
- npm: `konva` 10.7.0, `react-konva` 19.3.0 (peer deps)

**D3**
- d3-zoom — https://d3js.org/d3-zoom
- d3-drag — https://d3js.org/d3-drag

**Frameworks & test tooling**
- Svelte Testing — https://svelte.dev/docs/svelte/testing
- Svelte Overview — https://svelte.dev/docs/svelte/overview
- SvelteKit adapter-static — https://svelte.dev/docs/kit/adapter-static
- Solid Testing — https://docs.solidjs.com/guides/testing
- Vue Testing — https://vuejs.org/guide/scaling-up/testing.html
- Vitest Browser Mode — https://vitest.dev/guide/browser/
- jsdom README caveats (layout/rendering) — https://github.com/jsdom/jsdom#caveats
- jsdom issue #2527 (PointerEvent closed Apr 2025) — https://github.com/jsdom/jsdom/issues/2527

**Build & hosting**
- Vite, *Deploying a Static Site* — https://vite.dev/guide/static-deploy.html

**Exports**
- SheetJS Installation (CDN authoritative; npm registry stale at 0.18.5) — https://docs.sheetjs.com/docs/getting-started/installation/
- SheetJS Frameworks and Bundlers (tarball install, vendoring) — https://docs.sheetjs.com/docs/getting-started/installation/frameworks
- SheetJS repo/license (Apache-2.0) — https://github.com/SheetJS/sheetjs
- ExcelJS README (browser bundles) — https://github.com/exceljs/exceljs
- PapaParse — https://github.com/mholt/PapaParse

**Secondary sources checked but not relied on:** yWorks blog (*SVG, Canvas, WebGL?*), ApexCharts benchmark post, FusionCharts comparison, assorted 2025–2026 SVG-vs-canvas benchmark blogs. Methodology/vintage not verifiable; retained only as corroborating context.
