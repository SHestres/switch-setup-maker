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

| Script                 | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Vite dev server                           |
| `npm run build`        | Type-check, then build the static `dist/` |
| `npm run preview`      | Serve the built `dist/` locally           |
| `npm test`             | Vitest, single run                        |
| `npm run test:watch`   | Vitest in watch mode                      |
| `npm run lint`         | ESLint                                    |
| `npm run format`       | Prettier write                            |
| `npm run format:check` | Prettier check                            |

## Host-agnostic builds

`dist/` uses relative asset paths, so the same build works at a domain root or under a sub-path on
any static host.

The dev and preview servers bind `0.0.0.0` and accept any Host header by default, so the app is
reachable from other machines and containers. Override per environment:

| Variable       | Default   | Applies to              |
| -------------- | --------- | ----------------------- |
| `HOST`         | `0.0.0.0` | dev and preview servers |
| `DEV_PORT`     | `5173`    | `npm run dev`           |
| `PREVIEW_PORT` | `4173`    | `npm run preview`       |

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
