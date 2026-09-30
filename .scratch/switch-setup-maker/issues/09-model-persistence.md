# Implement the domain model, autosave & JSON I/O

Type: task
Status: open
Blocked by: 05, 08

## Question

Implement the model from ticket 05 as code, with:

- Types for setup, switch, port, and connection.
- Autosave to browser storage; restore on load.
- JSON export/import with validation, wired to the UI entry points from ticket 06's spec.
- Unit tests for the domain logic — layout handling, connections, round-trip serialization.

Done when tests pass and a browser refresh restores the current setup.

## Answer

<!-- filled on resolution -->

## Comments

- 2026-09-30 — **Direction from [06](06-mvp-ux-flows.md)** (flow spec in its answer):
  - JSON actions live in the app bar: `New setup` (confirm; clears setup + viewport, keeps theme/cable-layer prefs), `Import` (validate → error dialog naming the first problem → confirm before replacing a non-empty setup → apply `setup` + `ui`), `Export` (pretty JSON download, e.g. `switch-setup-YYYY-MM-DD.json`; failures surfaced).
  - v1 error surfaces include the import dialog, the export-failure message and builder inline validation — failures are never swallowed silently.
  - The blank-mode **draft switch** is UI-only: it never enters the model or storage; only commit materialises it.
