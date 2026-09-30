# Choose the hosted home & self-host story

Type: grilling
Status: resolved
Blocked by: 03

## Question

Decide where the app is hosted publicly and what "self-hostable" must include:

- Host choice (e.g. GitHub Pages via Actions, Netlify, Cloudflare Pages), including repo remote setup — note there is no `gh` CLI on this machine yet, so plan for installing/authenticating it or a manual path.
- The deploy pipeline (build + publish on main).
- Self-host path: build + serve instructions, and whether a Dockerfile/image is expected.

Deliverable: the decision recorded in the answer; ticket 13 executes it.

## Answer

**Resolved 2026-09-30 — platform-agnostic and local-first for now; nothing is deployed.**

- **Host: none chosen, by design.** The app stays a plain static build (`dist/`) deployable to GitHub Pages, Netlify, Cloudflare Pages, or any static server. No host-specific config in the app; picking a host later means adding a pipeline, not changing the build.
- **Remote: deferred.** The repo stays local for now; the user will create the remote manually at a later time. Repo name reserved for it: `switch-setup-maker` (the local directory name does not need to change). No `gh` install needed by the agent.
- **Custom domain: none.** Host/origin-style settings — the dev and preview servers in particular — come from env vars. Default to wildcard binding (`0.0.0.0`) with permissive allowed hosts (Vite `server.host` / `server.allowedHosts`, mirrored on `preview`) so the app is reachable from other machines and containers.
- **Self-host path: README + Dockerfile.** Multi-stage image (Node build → minimal static server on `0.0.0.0`), documented in the README alongside the plain `npm ci && npm run build` route. No registry publishing.
- **Deploy pipeline: deferred with the remote.** Standing preference for when it exists: build-only — the test suite does not gate deploys.

**Scope changes from this resolution:**

- Ticket 13 is narrowed to the self-host path (Dockerfile + README + host-agnostic build).
- New [ticket 15](15-remote-and-hosting.md) carries the remote + host choice + deploy pipeline, sequenced after ticket 14; the MVP acceptance now runs against a locally served production build.
- Direction passed to [ticket 08](08-scaffold-repo.md): keep the production build host-agnostic (relative asset base) and default the dev/preview servers to wildcard + permissive hosts, env-overridable.
