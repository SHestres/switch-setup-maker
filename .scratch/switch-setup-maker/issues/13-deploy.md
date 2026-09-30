# Stand up the self-host path

Type: task
Status: superseded
Blocked by: 07, 08

## Question

Execute the self-host half of ticket 07's decision (the hosted half is deferred to ticket 15):

- Dockerfile: multi-stage image — Node builds the app, a minimal static server serves `dist/` bound to `0.0.0.0`; `docker run` alone is enough, no config required, port overridable.
- README: self-host instructions — `npm ci && npm run build`, then serve `dist/` with any static server; plus the Docker build/run commands.
- Verify the build is host-agnostic: the same `dist/` works served from a domain root and from a sub-path.

Done when a clean checkout can be built and served locally per the docs — both via Node and via Docker.

## Answer

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Superseded** by [spec.md](../spec.md)'s implementation tickets. Replaced by [24 — Self-host path](24-self-host-path.md).
