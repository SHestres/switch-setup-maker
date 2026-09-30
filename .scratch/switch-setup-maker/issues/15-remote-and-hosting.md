# Create the remote & publish the app

Type: task
Status: open
Blocked by: 13, 14

## Question

Stand up the hosted home that ticket 07 deliberately deferred — after the MVP has passed acceptance (ticket 14), so the first thing published is a validated build.

- **User action first**: the user creates the remote manually at a later time (reserved repo name `switch-setup-maker`) and gives the agent push access.
- **Choose the host**: the platform-agnostic static build can go to GitHub Pages, Netlify, Cloudflare Pages, or any static host; no custom domain for now.
- **Wire the deploy**: build + publish on main; build-only — no test gate (standing preference from ticket 07).
- **Record** the public URL in this ticket's answer, and handle sub-path/base implications if the chosen host serves from one.

Done when the public URL serves the app and a push to main updates it.

## Answer

<!-- filled on resolution -->
