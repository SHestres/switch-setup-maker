# 26: Section model, per-section numbering & migration

Type: task
Status: ready-for-agent
Blocked by: None (can start immediately)

## What to build

Replace the row-based `layout.rows[]` with an ordered `layout.sections[]`. A Section is a bank of Ports: rows × columns, one Port kind, one Port speed, one numbering convention and a starting number. Ports stay materialised with readable stable ids; labels are generated per Section.

**Numbering is per Section.** The layout-level numbering preset and the per-Row continue/start-over field are removed. The three conventions are **Alternating (top first)**, **Alternating (bottom first)** and **Sequential**. Within each pair of rows, the chosen row takes the start number and both rows step by 2; the next pair continues after that span (e.g. top-first 2×8 starting at 1 labels 1,3,…,15 on top and 2,4,…,16 below, and a following row-pair starts at 17). Each Section also has a **start mode**: **Auto (end of previous)** — the default; it starts at the previous Section's highest label + 1, and the first Section starts at 1 — or **Custom** with an explicit number. Resizing a Section renumbers all following Auto Sections; Custom Sections stay pinned.

Presets are re-expressed as Section recipes (see `spec.md`'s layout-preset table): a preset is an ordered list of Sections and the current chips keep their port counts. This ticket owns the model layer; the faceplate and editor land in [27](27-section-faceplate-and-editor.md), whose prototype [`../prototype/26-sections-editor.html`](../prototype/26-sections-editor.html) is the reference for the numbering semantics and start modes.

**Schema version and migration.** Bump the document schema version. The ticket owner decides and documents the v1 migration policy — automatic conversion with a defined row→section mapping, or clear rejection — in the `## Answer`, and implements whichever is chosen. Update serialisation validation, autosave/restore, import/export and the model unit tests to the new shape.

## Acceptance criteria

- [ ] `layout.sections[]` replaces `layout.rows[]`; each Section carries rows, columns, kind, speed, numbering convention and start mode + start; Ports stay materialised with stable ids.
- [ ] Labels generate per Section for all three conventions, including multi-pair Sections; the Auto chain starts at 1 / previous highest label + 1, and Custom starts stay pinned while resizing renumbers the following Auto Sections.
- [ ] Materialise/relabel preserve surviving Ports' ids, and structural edits purge the Connections of removed Ports through the existing cascade.
- [ ] Presets are re-expressed as Section recipes with their existing port counts.
- [ ] The document schema version is bumped and the v1 migration policy is decided and documented in this ticket; import/export, autosave/restore and validation match it.
- [ ] Unit tests cover the numbering chain (Auto/Custom, all three conventions, multi-pair Sections), materialise/relabel and connection purge; `npm test` is green.
