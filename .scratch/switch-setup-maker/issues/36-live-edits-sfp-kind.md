# 36: Live number commits & one SFP kind

Type: task
Status: resolved

## What to build

Two small post-MVP changes.

1. **Number fields commit live.** `rows`, `columns` and `start number` in the shared section fields (editor and draft builder) commit ~400 ms after the last edit, so the faceplate follows while typing; blur/Enter still commits immediately. A commit that would remove connected ports never auto-commits: it waits for blur/Enter, where the existing "Change layout?" confirm appears, so a dialog can never interrupt typing. Invalid values still never commit.

2. **SFP+ folded into SFP.** `PortKind` becomes `rj45 | sfp`; the 10G distinction rides on Port speed. The kind select drops SFP+, and the `kind-sfpp` render class goes. Presets update: Unifi 48 Port's uplinks become SFP 10G at 49–52, and `24×1G + 4×SFP+` becomes `24×1G + 4×SFP` (id `24x1g-4xsfp`). The parser reads the legacy `sfp+` spelling as `sfp` (sections and ports, v1 and v2 paths) and never writes it; the document version stays 2, so old autosaves and exports import cleanly.

## Acceptance criteria

- [x] A valid rows/columns/start-number change updates the faceplate after the typing pause, without blur.
- [x] A shrink that would sever connections does not auto-commit; blur/Enter opens the existing confirm, and Cancel restores the last committed layout.
- [x] Invalid input never commits, with the inline error unchanged.
- [x] Both the editor and the draft builder get the live behavior.
- [x] SFP+ is gone from the model, kind select, rendering, presets, fixtures and tests; accessible names read `SFP port n (10G)`.
- [x] A saved version 2 document containing `sfp+` parses to `sfp` with speeds intact; serialized output never contains `sfp+`.
- [x] Glossary, spec and ADR 0002 updated; tests/lint/build green.

## Answer

Implemented on `ticket/36-live-edits-sfp-kind`.

**Live number commits.**

- `NumberField` debounces valid values by 400 ms (`LIVE_COMMIT_MS`) and commits them with `live: true`; blur/Enter commit immediately without it. Invalid values still never commit and keep the inline error; the callback is read through a ref so parent re-renders refresh it without restarting the timer.
- `SectionEditOptions { live }` threads the intent through `SwitchFields` → `SwitchEditor` → `App`. `requestLayoutEdit` skips a `live` edit when `countSeveredConnections` is positive, so the "Change layout?" confirm can never interrupt typing; blur/Enter raises it as before, and Cancel restores the last committed layout.
- Both surfaces share the behavior: the editor, and the draft builder (whose drafts have no connections, so its `live` flag is ignored).

**One SFP kind.**

- `PortKind` is `rj45 | sfp`; the kind select, `KIND_LABELS`, the faceplate kind mapping and the `.kind-sfpp` CSS are gone; presets are SFP 10G (`24×1G + 4×SFP`, id `24x1g-4xsfp`, Unifi uplinks 49–52).
- `readPortKind` in `serialize.ts` maps the legacy `sfp+` spelling to `sfp` for both sections and ports (v1 and v2 paths), so old autosaves and exports keep importing; `serializeDocument` never writes `sfp+` and the document version stays 2. Recorded in [ADR 0002](../../../docs/adr/0002-sfp-single-port-kind.md).

**Tests / checks.**

- `npm test`: 255 tests / 17 files green (was 250 / 17). New: three App-level live-commit tests (typing-pause restart, safe shrink keeping connections, severing shrink never confirming mid-typing), two legacy-kind serialize tests, and the draft preview test now advances the debounce instead of blurring.
- Mutation check: stubbing out the `options?.live` skip makes the mid-typing confirm test fail.
- `npm run format:check`, `npm run lint` and `npm run build` green.
- Living docs updated: GLOSSARY Port kind, spec preset table/builder/schema paragraph, ADR 0002.
