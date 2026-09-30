# 24: Self-host path

Type: task
Status: resolved
Blocked by: None (can start immediately)

## What to build

A multi-stage Dockerfile: Node builds the app, a minimal static server serves `dist/` bound to `0.0.0.0`; `docker run` alone suffices with no required configuration and an overridable port. The README documents the self-host path: `npm ci && npm run build`, then serving `dist/` with any static server, plus the Docker build and run commands. The same `dist/` is verified served from a domain root and from a sub-path; the relative-base build already supports this, and dev/preview wildcard binding and port overrides stay as they are.

## Acceptance criteria

- [x] A clean checkout builds and serves locally following the README's Node path only.
- [~] `docker build` and `docker run` with no configuration serve the app, with the port overridable.
- [x] The same `dist/` works served from a domain root and from a sub-path.
- [x] The README documents both paths exactly as executed.

## Answer

**Resolved 2026-09-30 — self-host path landed: dependency-free Node static server, multi-stage Dockerfile, README.**

### What landed

- `scripts/serve.mjs` — minimal, dependency-free (`node:http`) static server for the built app. Serves `dist/` by default (optional doc-root argument), binds `0.0.0.0:8080` with `HOST`/`PORT` env overrides, correct content types, 404s, path-traversal containment, fail-fast when the doc root is missing. The Docker runtime stage runs this same script.
- `scripts/serve.test.mjs` — 7 tests at the HTTP seam (ephemeral port + real `fetch`/socket, `@vitest-environment node`): root index, sub-path mount, 404, asset content type, doc-root containment, missing doc root, 400 on a malformed request target.
- `package.json` — `npm run serve` script.
- `Dockerfile` — multi-stage: `node:22-alpine` runs `npm ci && npm run build`; a fresh `node:22-alpine` copies only `dist/` + `scripts/serve.mjs`, runs as `node`, `EXPOSE 8080`, `ENV HOST=0.0.0.0 PORT=8080`. Bare `docker run -p 8080:8080 <image>` needs no config; port overridable with `-e PORT=...`.
- `.dockerignore` — keeps node_modules/dist/.git/agent material out of the build context.
- `README.md` — Self-hosting section: `npm ci && npm run build` + `npm run serve` (or any static server), Docker build/run with port override, root vs sub-path, and the dev/preview wildcard/port table updated with `PORT` (dev/preview defaults unchanged).

### Evidence

- `npm test` → 8 files, 74 tests passed (67 existing + 7 new).
- `npm run build` → green; `dist/index.html` references `./assets/...` (relative base).
- `npm run lint` and `npm run format:check` → clean.
- Real execution of `node scripts/serve.mjs` against the production build, via curl:
  - root: `/` 200 text/html, JS 200 text/javascript, CSS 200 text/css, unknown 404.
  - sub-path: same `dist/` copied under a temp doc root's `sub/`, served with `node scripts/serve.mjs <docroot>`: `/sub/` 200, `/sub/assets/*` 200 with correct types.
  - default `PORT=8080` and `0.0.0.0` bind confirmed with `ss -ltn`; `PORT=18080`/`18081` overrides observed.
  - malformed request target (`GET http://[ ...` via raw socket) → 400 and the server stays up.
- Clean-checkout Node path: fresh copy with no `node_modules`/`dist` → `npm ci` (0 vulnerabilities, 0 tar warnings) → `npm run build` green → `node scripts/serve.mjs` → index 200 and asset 200. (Run on the home fs because `/tmp` hit its tmpfs quota; the copy was deleted afterwards.)
- Docker runtime layer simulated: a directory containing only `dist/` + `scripts/serve.mjs` (no `node_modules`) serves 200 — the server is dependency-free.
- `npx dockerfilelint Dockerfile` → no issues.

### Caveat: Docker was not executable in this environment

There is no container runtime here (`command -v docker podman nerdctl` → none), so `docker build` and `docker run` were **not executed**. The Dockerfile is correct by construction and validated as far as the environment allows: every command it runs (`npm ci`, `npm run build`, `node scripts/serve.mjs` with `HOST`/`PORT`) was executed locally against the production build, the runtime image contents were simulated exactly, and the syntax was linted. A `docker build && docker run -p 8080:8080` smoke test remains for a machine with a container runtime (acceptance box left `[~]`).

The `npx serve dist` alternative in the README is documented as an example of "any static server"; the bundled server was the executed path.
