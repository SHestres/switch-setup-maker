# Prototype the switch faceplate & canvas feel

Type: prototype
Status: resolved
Blocked by: 02

## Question

What should a rendered switch look and feel like? Build a throwaway prototype (single HTML file or equivalent) rendering 2–3 switch examples — e.g. a 24×1G, a 48×1G + 4×SFP+ — with rows of numbered ports and visually distinct SFP cages, following ticket 02's conventions. Include just enough canvas to drag a switch around and judge density: does a 48-port faceplate stay readable, how big do ports need to be, is there room for connections to land.

Deliverable: the prototype linked from this ticket, plus the direction chosen in the user's reaction (or the changes they want). Feeds tickets 11 and 12.

## Answer

Resolved by user reaction (2026-09-30) after driving the prototype ([04-faceplate.html](../prototype/04-faceplate.html), screenshots in [prototype/shots](../prototype/shots/)).

**Verdict: all three styles read well and stay** — treat them as switchable themes: light (diagrammatic), dark (photoreal), blueprint.

Direction, by the user's points:

1. **Themes.** Keep all three. Add the light theme's **dot-grid canvas to the dark theme** as well. Blueprint keeps its blueprint grid.
2. **Consistent switch width.** All switch bodies render at one **standard rack width** (they're assumed to fit the same rack); layouts vary inside that width, blank space is acceptable.
3. **Density: good.** 48-port faceplate stays readable at 100% (27px pitch) and at fit (~22px). The live port-pitch readout was a useful instrument; no changes asked.
4. **Faces read *too* real.** The status LEDs, console/USB tiles and brand mark look functional when they're flavour — in the full implementation either make them real or de-emphasise them.
5. **Cable rendering.** Default exit direction should be **vertical** (cables leave the port up/down), not horizontal — covers less of the faceplate and reads more like cables leaving real hardware. Add a **toggle for cables drawn above vs behind** the switches; blueprint always draws above.
6. **Stronger connected-port styling.** Beyond the green LED, a connected port should change its jack fill too (a distinct grey in v1). Long-term, port/connection colours expand to *needs adapter*, *speed mismatch*, *aggregated (LAG)*, *loop membership* — explicitly not in v1; logged in the map's fog.

Refinements land in tickets [05](05-domain-model.md), [11](11-canvas-rendering.md) and [12](12-connections.md) as "Direction from 04" notes.

## Comments

- 2026-09-30 — Prototype built and self-verified (headless Chromium + jsdom: no console errors; drag, pan/zoom, click-to-connect, duplicate guard, cable deletion, LED states all pass; every cable endpoint lands inside its jack). User reaction received 2026-09-30 — see Answer below.
  - Artifact: [prototype/04-faceplate.html](../prototype/04-faceplate.html) — single self-contained file, no build step. Open directly or `python3 -m http.server` in `.scratch/switch-setup-maker/prototype/` and browse to `04-faceplate.html`.
  - Screenshots (1440×900, fit view): [style A](../prototype/shots/style-a.png) · [style B](../prototype/shots/style-b.png) · [style C](../prototype/shots/style-c.png).
  - Three style directions switchable via bottom bar / ←→ / `?style=a|b|c`: **A Diagrammatic** (clean app-native), **B Photoreal** (dark rack gear), **C Blueprint** (technical drawing).
  - Four switch examples following ticket 02 conventions: 24×1G + 2×SFP (odd/even, SFP 1–2); 48×1G + 4×SFP+ (odd/even, uplinks 49–52) as the density test; 24×1G + 4×SFP+ Aruba-style (cages left, number band ▲/▽); 12×1G + 2×SFP Juniper-style (0-based, even top).
  - HUD reports zoom and **narrowest port pitch in px** with a comfortable / tight / too-small threshold — the "how big do ports need to be" instrument.
- Follow-up for ticket 08: the prototype predates `git init`; capture it (ideally a throwaway branch, per the prototype skill) when the repo is initialised.
