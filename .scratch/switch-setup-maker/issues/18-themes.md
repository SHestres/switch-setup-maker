# 18: Themes & skinning

Type: task
Status: resolved
Blocked by: 16

## What to build

The Faceplate and Canvas become themed through CSS variables with the three styles from the prototype: light (diagrammatic), dark (photoreal, keeping the light theme's dot-grid canvas) and blueprint. An app-bar control switches themes; the choice lives in the document's `ui.theme`, persists and restores. Chrome (status LEDs, console/USB tiles, brand mark) stays honest and legible in every theme. The blueprint theme's cable-layer override lands with the connection work ([23](23-manage-connections-and-cable-layer.md)), not here.

## Acceptance criteria

- [ ] All three themes render the Canvas and Faceplates; switching is immediate and persists through refresh.
- [ ] Dark keeps the light theme's dot-grid canvas; blueprint stays legible at the validated density.
- [ ] Chrome stays honest and de-emphasised in every theme.
- [ ] App-level tests cover switching and restore.

## Answer

The Canvas and Faceplates are themed through CSS variables; an app-bar segmented control switches light/dark/blueprint and the choice rides the document (`ui.theme`), so it autosaves and restores.

**What landed**

- `src/ui/ThemeControl.tsx` (new) — segmented control (`role="group"` "Theme") with Light/Dark/Blueprint buttons carrying `aria-pressed`; de-emphasised and keyboard-focusable.
- `src/ui/AppBar.tsx` — one `onThemeChange` prop and one `<ThemeControl>` line alongside Import/Export/New setup.
- `src/App.tsx` — passes `setTheme` through `setDocument`; the existing autosave/restore does the persistence.
- `src/model/document.ts` — additive `setTheme(document, theme)` beside `setViewport`.
- `src/canvas/faceplate.css` — the light "diagrammatic" block gains the prototype's full token set (grid image/size, `--jack-shadow`, `--led-on`/`--led-glow`/`--led-socket`, `--wire*`, `--screw-shadow`, `--vents-opacity`, `--sfp*`); `[data-theme='dark']` (photoreal) and `[data-theme='blueprint']` override the tokens on `.canvas-root`, matching the prototype's A/B/C variable sets, plus their structural details (dark vents/uppercase model/number weight; blueprint mono labels, 26px line grid, 1.5px face border, hatched cages, small outlined screws, outlined latch). Dark keeps the light theme's 22px dot grid, dark-tinted (`#2b333e` on `#101418`), per the spec; the blueprint always-above cable layer is left to ticket 23 (tokens only).
- `src/App.test.tsx` — appended `themes` block: immediate switch (`data-theme` + `aria-pressed`), refresh persistence (localStorage `ui.theme` + remount), restore from a stored document.

**Decisions**

- Theme variables are scoped to `.canvas-root[data-theme=…]`, not `:root`: the spec themes the faceplate/canvas, so app chrome (shadcn tokens) is untouched and the diff stays clear of the parallel tickets.
- `setTheme` is a pure model helper; App stays a one-line wiring, and the theme survives `New setup` because `resetSetup` keeps `ui.theme`.
- Chrome stays static and `aria-hidden`, themed only through the same tokens (`--muted`, `--led-off`, `--jack-*`): no fake activity, no titles.

**Evidence**

- `npm test` — 11 files, **100 tests passing** (baseline 97; +3 theme tests).
- `npm run build` (tsc + vite), `npm run lint`, `npm run format:check` — all green.
- App-level tests drive the real app-bar control and assert the canvas root's `data-theme` and button `aria-pressed`, plus the autosaved document and a remount.

**Caveat:** no desktop browser was connected to this session, so theme fidelity/contrast at density is eyeballed during the ticket-25 acceptance run (same deferral as ticket 16).
