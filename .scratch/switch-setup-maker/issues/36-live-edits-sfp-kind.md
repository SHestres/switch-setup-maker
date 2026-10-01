# 36: Live number commits & one SFP kind

Type: task
Status: resolved

## What to build

Two small post-MVP changes.

1. **Number fields commit live.** `rows`, `columns` and `start number` in the shared section fields (editor and draft builder) commit ~400 ms after the last edit, so the faceplate follows while typing; blur/Enter still commits immediately. A commit that would remove connected ports never auto-commits: it waits for blur/Enter, where the existing "Change layout?" confirm appears, so a dialog can never interrupt typing. Invalid values still never commit.

2. **SFP+ folded into SFP.** `PortKind` becomes `rj45 | sfp`; the 10G distinction rides on Port speed. The kind select drops SFP+, and the `kind-sfpp` render class goes. Presets update: Unifi 48 Port's uplinks become SFP 10G at 49–52, and `24×1G + 4×SFP+` becomes `24×1G + 4×SFP` (id `24x1g-4xsfp`). The parser reads the legacy `sfp+` spelling as `sfp` (sections and ports, v1 and v2 paths) and never writes it; the document version stays 2, so old autosaves and exports import cleanly.

## Acceptance criteria

- [x] A valid rows/columns/start-number change updates the faceplate immediately, without blur.
- [x] A stepper click or arrow-key change that would sever connections confirms immediately; a typed one waits for blur/Enter, and Cancel restores the last committed layout.
- [x] Invalid input never commits, with the inline error unchanged.
- [x] Both the editor and the draft builder get the live behavior.
- [x] SFP+ is gone from the model, kind select, rendering, presets, fixtures and tests; accessible names read `SFP port n (10G)`.
- [x] A saved version 2 document containing `sfp+` parses to `sfp` with speeds intact; serialized output never contains `sfp+`.
- [x] Glossary, spec and ADR 0002 updated; tests/lint/build green.

## Answer

Implemented on `ticket/36-live-edits-sfp-kind`.

**Live number commits.**

- `NumberField` commits every valid change immediately — no debounce. Typing, stepper clicks and arrow keys all reach the document at once; invalid values still never commit and keep the inline error.
- Typing is told apart from stepping by the keydown that precedes a change: an editing key (a character, Backspace, Delete) marks it as `live`, an arrow key clears it, and the marker resets after every change so a spinner click straight after typing is not mistaken for more typing. `SectionEditOptions { live }` threads that intent through `SwitchFields` → `SwitchEditor` → `App`.
- `requestLayoutEdit` skips a `live` edit when `countSeveredConnections` is positive, so a typed shrink that would sever connections waits for blur/Enter where the confirm belongs; a stepper click or arrow key commits without `live` and confirms at once — a spinner click that never focuses the field can no longer strand the edit. Cancel restores the last committed layout.
- Both surfaces share the behavior: the editor, and the draft builder (whose drafts have no connections, so its `live` flag is ignored).

**One SFP kind.**

- `PortKind` is `rj45 | sfp`; the kind select, `KIND_LABELS`, the faceplate kind mapping and the `.kind-sfpp` CSS are gone; presets are SFP 10G (`24×1G + 4×SFP`, id `24x1g-4xsfp`, Unifi uplinks 49–52).
- `readPortKind` in `serialize.ts` maps the legacy `sfp+` spelling to `sfp` for both sections and ports (v1 and v2 paths), so old autosaves and exports keep importing; `serializeDocument` never writes `sfp+` and the document version stays 2. Recorded in [ADR 0002](../../../docs/adr/0002-sfp-single-port-kind.md).

**Tests / checks.**

- `npm test`: 257 tests / 17 files green (was 250 / 17). New: five App-level number-field tests (immediate typed commit, safe shrink keeping connections, typed severing shrink deferring to blur, stepper severing shrink confirming at once, arrow key after typing confirming at once), two legacy-kind serialize tests, and the draft preview test now asserting the immediate update.
- Mutation check: stubbing out the `options?.live` skip makes the typed-deferral test fail.
- `npm run format:check`, `npm run lint` and `npm run build` green.
- Living docs updated: GLOSSARY Port kind, spec preset table/builder/schema paragraph, ADR 0002.

## Comments

- 2026-10-01 — Follow-up from the user after trying it: dropped the 400 ms pause (invalid values still hold back) and split destructive confirmation by input source. A spinner-click shrink that would sever connections previously relied on blur, but a spinner click need not focus the field, so the edit could strand forever; stepper/arrow changes now confirm immediately, typed ones still wait for blur. The keydown-based typing/stepping classification replaced the debounce timer; tests and the spec sentence were updated.
