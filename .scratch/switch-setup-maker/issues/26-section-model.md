# 26: Section model, per-section numbering & migration

Type: task
Status: resolved
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

## Answer

Implemented (work commit `182e941`, merged `9263f92`). `layout.sections[]` replaces `layout.rows[]`; a Section is `{kind, speed, rows, columns, numbering, startMode, start, ports[]}` with Ports materialized row-major and stable `p<n>` ids. Numbering is per Section (`alternating-top-first`, `alternating-bottom-first`, `sequential`): within each row pair the chosen row takes the start number and both rows step by 2, and each later pair continues after the span. Start mode: `auto` (first Section 1, each next = previous highest + 1) or `custom` (pinned; resizing renumbers the following Auto Sections). Helpers: `generateSectionLabels`, `resolveSectionStarts`, `materializeSections`, `relabelSections`, `sectionRows`; edits go through `planLayoutEdit`/`applyLayoutEdit`, preserving surviving Port ids and purging removed Ports' Connections through `removePorts`. Presets are Section recipes exactly matching the spec table (24×1G+2×SFP 26 ports; Unifi 48 Port 52; 24×1G+4×SFP+ 28; 12×1G+2×SFP 14, zero-based).

**Schema v2 and the v1 migration policy (automatic conversion; one rejection).** v1 `layout.numbering: "custom"` is rejected (`choose a generated numbering`) because v2 has no user-owned labels; everything else converts:

1. `odd-top-even-bottom` → alternating top-first base 1; `even-top-zero-based` → alternating top-first base 0; `sequential` → sequential base 1.
2. v1 Rows group while kind/speed match and no `start-over`; a `start-over`, kind change or speed change opens a group.
3. A group becomes one Section per pair of Rows (or one sequential Section under the sequential convention); a trailing unpaired Row becomes its own 1-row sequential Section, preserving v1's `…, 5, 6` counting.
4. The first group — and any group opened by `start-over` — is `custom` at the base (1 or 0); all others are `auto`, reproducing `continue`.
5. Port ids are preserved (Connections ride unchanged); ragged Rows pad to the widest with fresh ids; labels regenerate under v2 rules, identical for preset-shaped layouts.
6. Mixed kind/speed v1 Rows are rejected; `ui` is preserved and `version` becomes 2.

Verification: unit tests cover all three conventions, multi-pair Sections, the Auto/Custom chain, materialize/relabel, v1 conversion (9 migration tests plus storage restore) and connection purge; `npm test` green (250 at the integration tip).
