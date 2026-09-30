# Scaffold the repo & tooling

Type: task
Status: resolved
Blocked by: 03

## Question

Stand up the project skeleton per the chosen stack (ticket 03):

- `git init`, `.gitignore`, initial commit.
- Package setup, build/dev tooling, test runner, lint/format.
- Folder structure for model, canvas, and UI.
- README stub.
- Hello-world app that builds and runs.

Done when `npm run dev` serves a placeholder page and the test runner executes.

## Answer

Scaffold landed and verified 2026-09-30; initial commit `988ee25` on `main`.

- **Stack**: React 19 + TypeScript 6 on Vite 8 (static build); Tailwind CSS 4 via `@tailwindcss/vite`; shadcn/ui with the Base UI base library and Nova preset (`components.json`); `react-zoom-pan-pinch` 4.2 installed ready for the canvas. `src/lib/utils.ts` exports shadcn's `cn` (the `cn` package; `clsx`/`tailwind-merge` are not needed).
- **Scripts**: `dev`; `build` = `tsc --noEmit && vite build`; `preview`; `test`/`test:watch` (Vitest 5 + Testing Library, jsdom); `lint` (ESLint 10 flat config + typescript-eslint + react-hooks + react-refresh + prettier); `format`/`format:check` (Prettier).
- **Host-agnostic build**: `base: './'` — built `dist/index.html` references `./assets/…`, so one build works at a domain root or under a sub-path.
- **Dev/preview servers**: wildcard bind + permissive hosts by default, env-overridable — `HOST` (default `0.0.0.0`), `DEV_PORT` (default `5173`), `PREVIEW_PORT` (default `4173`), documented in the README.
- **Layout**: `src/model/` (plain-TS domain, empty for now), `src/canvas/` (empty for now), `src/ui/` (placeholder page + smoke test), `src/lib/` (shadcn util), `src/test/` (Vitest setup). Alias `@/*` → `src/*` in both tsconfig and Vite.
- **README stub**: requirements, scripts table, host-agnostic/env-var notes, project layout, docs pointers.

**Verified**: `npm run dev` serves the placeholder page (wildcard network address logged), `npm test` 1/1 green, `npm run build` succeeds, `npm run lint` clean, `npm run format:check` clean.

**Operational notes for later tickets**:

- shadcn CLI 4.21 fails under npm 11.19: it sets the `allow-scripts` config on project-scoped installs, which npm rejects (`EALLOWSCRIPTS`). Adding components later needs a wrapped `npm` that drops that config (a PATH shim, as used here) or a different npm version.
- Build uses `tsc --noEmit` + `vite build` on a single `tsconfig.json` (no project references); `baseUrl` is omitted because TypeScript 6 deprecates it — `paths` alone works.

## Comments

- 2026-09-30 — **Direction from [07](07-hosting-decision.md)** (platform-agnostic hosting):
  - Keep the production build host-agnostic: relative asset base (e.g. Vite `base: './'`) so one `dist/` works at a domain root or under a sub-path.
  - Dev/preview servers: bind wildcard (`0.0.0.0`) and allow any host so the app is reachable from other machines and containers; keep both env-overridable rather than hard-coded.
  - No deploy config, host-specific files, or remote wiring in this ticket — hosting is deferred; the name `switch-setup-maker` is reserved for the future remote.
- 2026-09-30 — **Resolved**: scaffold above; initial commit `988ee25`, working tree clean. The commit is authored as repo-local `shestres <shestres@localhost>` (no global git identity on this machine); the repo-local config keeps future commits consistent — change it once a real identity is set.
