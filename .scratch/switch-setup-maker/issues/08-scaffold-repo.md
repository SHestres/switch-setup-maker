# Scaffold the repo & tooling

Type: task
Status: claimed
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

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Direction from [07](07-hosting-decision.md)** (platform-agnostic hosting):
  - Keep the production build host-agnostic: relative asset base (e.g. Vite `base: './'`) so one `dist/` works at a domain root or under a sub-path.
  - Dev/preview servers: bind wildcard (`0.0.0.0`) and allow any host so the app is reachable from other machines and containers; keep both env-overridable rather than hard-coded.
  - No deploy config, host-specific files, or remote wiring in this ticket — hosting is deferred; the name `switch-setup-maker` is reserved for the future remote.
