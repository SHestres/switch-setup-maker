# Switch Setup Maker

A local-first web app for modelling network switch setups: switches rendered as faceplates on a
canvas, wired port-to-port. Static build, no backend — data stays in the browser.

**Status**: MVP in progress, ticket by ticket; the plan lives in the
[wayfinder map](.scratch/switch-setup-maker/map.md). The domain model, autosave/restore and JSON
import/export have landed — the switch builder and canvas are next.

## Requirements

Node 20.19+ (or 22.12+) with npm.

## Getting started

```sh
npm install
npm run dev
```

The dev server prints its URL (default `http://localhost:5173`).

## Scripts

| Script                 | What it does                               |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Vite dev server                            |
| `npm run build`        | Type-check, then build the static `dist/`  |
| `npm run preview`      | Serve the built `dist/` locally            |
| `npm run serve`        | Serve `dist/` with the bundled Node server |
| `npm test`             | Vitest, single run                         |
| `npm run test:watch`   | Vitest in watch mode                       |
| `npm run lint`         | ESLint                                     |
| `npm run format`       | Prettier write                             |
| `npm run format:check` | Prettier check                             |

## Self-hosting

The app is a static build — no backend, nothing to configure. Serve `dist/` from anywhere.

### Build and serve with Node

From a clean checkout:

```sh
npm ci
npm run build
npm run serve
```

Then open <http://localhost:8080>. `npm run serve` runs `scripts/serve.mjs`, a dependency-free
Node static server for `dist/`; `HOST` (default `0.0.0.0`) and `PORT` (default `8080`) are
overridable. Any other static server works too — point it at `dist/`:

```sh
npx serve dist
```

### Docker

```sh
docker build -t switch-setup-maker .
docker run --rm -p 8080:8080 switch-setup-maker
```

No configuration is required and the port is overridable:

```sh
docker run --rm -e PORT=3000 -p 3000:3000 switch-setup-maker
```

### Domain root or sub-path

`dist/` uses relative asset paths, so the same build works at a domain root
(`https://example.com/`) or under a sub-path (`https://example.com/tools/switch-setup-maker/`)
with no rebuild and no server config. To exercise the sub-path locally, copy `dist/` into a
subdirectory of a doc root and serve that:

```sh
mkdir -p /tmp/ssm/sub && cp -r dist/. /tmp/ssm/sub/
node scripts/serve.mjs /tmp/ssm   # -> http://localhost:8080/sub/
```

### Dev and preview servers

The dev and preview servers bind `0.0.0.0` and accept any Host header by default, so the app is
reachable from other machines and containers. Override per environment:

| Variable       | Default   | Applies to              |
| -------------- | --------- | ----------------------- |
| `HOST`         | `0.0.0.0` | dev, preview and serve  |
| `DEV_PORT`     | `5173`    | `npm run dev`           |
| `PREVIEW_PORT` | `4173`    | `npm run preview`       |
| `PORT`         | `8080`    | `npm run serve`, Docker |

## Project layout

```
src/
├── model/    domain + persistence: document types, layout, connections, storage, React binding
├── canvas/   faceplates, wire overlay, viewport interaction
├── ui/       app chrome: app bar, inspector, dialogs
└── test/     shared Vitest setup
```

Vocabulary is defined in [GLOSSARY.md](GLOSSARY.md); architecture decisions are recorded in
[docs/adr/](docs/adr/).
