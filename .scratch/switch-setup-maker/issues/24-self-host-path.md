# 24: Self-host path

Type: task
Status: ready-for-agent
Blocked by: None (can start immediately)

## What to build

A multi-stage Dockerfile: Node builds the app, a minimal static server serves `dist/` bound to `0.0.0.0`; `docker run` alone suffices with no required configuration and an overridable port. The README documents the self-host path: `npm ci && npm run build`, then serving `dist/` with any static server, plus the Docker build and run commands. The same `dist/` is verified served from a domain root and from a sub-path; the relative-base build already supports this, and dev/preview wildcard binding and port overrides stay as they are.

## Acceptance criteria

- [ ] A clean checkout builds and serves locally following the README's Node path only.
- [ ] `docker build` and `docker run` with no configuration serve the app, with the port overridable.
- [ ] The same `dist/` works served from a domain root and from a sub-path.
- [ ] The README documents both paths exactly as executed.
