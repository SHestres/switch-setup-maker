# 27: Section faceplate rendering & bottom-panel editor

Type: task
Status: resolved
Blocked by: 26

## What to build

**Faceplate.** Ports render as Sections, left to right, each vertically centred on the faceplate; adjacent Sections sit 6px apart when both share the same Port kind and 16px apart otherwise. Labels sit above the top row and below the bottom row of each row-pair, exactly as the current faceplate does.

**Editor.** The right-side inspector becomes a full-width bottom panel, still never modal, hosting the same three modes: preset gallery, draft builder and editor. One card per Section, laid out in a row. Each card exposes rows, columns, kind, speed, numbering convention, the start mode/start (Auto or Custom), and move-left/move-right controls that reorder the Sections. The panel's height is draggable and auto-fits its content on open and after Sections are added; the cards and panel get a little extra padding (user request). The disabled "Custom (not editable in v1)" numbering option disappears — absorbed by the Section redesign.

Prototype reference: [prototype/26-sections-editor.html](../prototype/26-sections-editor.html), variant **D (cards · bottom panel)** — the HTML is the visual/interaction reference. The draft flow keeps its behaviour: ghost draft on the Canvas, commitment via `Add switch`, silent discard when untouched and a "Discard this switch?" confirm once edited.

## Acceptance criteria

- [ ] Sections render left to right, each vertically centred, with 6px gaps between same-kind neighbours and 16px otherwise; labels stay above the top row and below the bottom row of each row-pair.
- [ ] The editor is a full-width bottom panel with one card per Section; cards expose rows, columns, kind, speed, numbering and start mode/start; the panel height drags and auto-fits on open and after adding Sections; the extra padding is present.
- [ ] Section cards carry move-left/move-right controls; reordering re-renders the faceplate in the new section order.
- [ ] App-level tests cover Section editing and start-mode chaining (Auto follows the previous Section; Custom pins).
- [ ] Visual acceptance against the prototype's variant D on a production build.

## Answer

Implemented (work commit `a08612c`, merged `a737e58`). The Faceplate renders `layout.sections` left → right, each vertically centered on the chassis: 6px gaps between same-kind neighbors, 16px otherwise; labels sit above the top row and below the bottom row of each row-pair. `geometry.ts` mirrors the placement exactly (no DOM measurement) and its pure tests use hand-computed worked examples across densities. The Inspector became a full-width bottom panel (never modal) with one card per Section exposing rows, columns, kind, speed, numbering and start mode/start, plus move-left/right; the panel height is draggable (170px min, 70% viewport max) and auto-fits on open and after content changes until the user truly drags. Reordering re-renders and re-chains labels. The draft flow is unchanged: ghost preview, commit via `Add switch`, silent discard when untouched, confirm when edited. The disabled "Custom (not editable in v1)" numbering option is gone.

Verification: app-level tests cover Section editing, Auto chaining (resizing renumbers the following Auto Sections), Custom pinning, reorder, and the auto-fit/drag behavior. Production-build acceptance: story 134/134 and visual 27/27, including measured 6/6/16px gaps, 0.000px vertical-centering deviation and a variant-D comparison; evidence in `/tmp/opencode/ssm-accept2/evidence.md`. Review fixes (`64c67ae`) fixed auto-fit freezing on a click and the bottom-first range chip; acceptance fix `c1dbbd7` raised dialogs above the panel.
