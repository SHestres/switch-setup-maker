# 20: Draft switch builder

Type: task
Status: resolved
Blocked by: 19

## What to build

`Start blank` in the gallery begins the draft flow: a ghost draft switch — transparent, non-interactable, zero Ports, not in the Setup — appears on the Canvas and is live-previewed as rows are built in the inspector. `Add switch` commits the draft through `materialiseRows` (readable ids, generated labels) and selects it; the button is disabled until at least one non-empty Row exists. Dismissing the panel discards an untouched draft silently, and an edited draft only after a "Discard this switch?" confirm. The draft must never reach the document or storage before commit.

## Acceptance criteria

- [x] `Start blank` shows a ghost draft Switch on the Canvas — transparent, non-interactable, zero Ports, absent from the document — live-updated by the Row builder.
- [x] `Add switch` is disabled until at least one non-empty Row exists and commits exactly the previewed layout, selecting the new Switch.
- [x] An untouched draft is discarded silently; an edited draft asks "Discard this switch?" before discarding.
- [x] App-level tests assert the draft never reaches the document or storage before commit, and cover commit, silent discard and confirmed discard.

## Answer

Draft state is App-level ephemeral React state (`src/ui/draftSwitch.ts`); it never touches `useDocument`, so it can never be serialized. `Start blank` computes the commit position once via the existing `placeNewSwitch` rule, then `Canvas` receives an optional `draft` prop and renders it as a ghost `Faceplate` (`ghost` flag): `opacity: .5`, dashed face, `pointer-events: none`, decorative ports rendered as `aria-hidden` spans (no controls, no handlers, no `data-switch`), so it cannot be dragged, clicked, wired or selected. The ghost is hidden once committed and the "No switches yet" card is suppressed while drafting.

The row-builder UI is shared: `src/ui/SwitchFields.tsx` was extracted from `SwitchEditor` and is used by both `SwitchEditor` and the new `DraftSwitchBuilder`; existing editor tests pass unchanged. Live preview and commit both call `materialiseRows` on the same filtered row specs, so `Add switch` commits exactly what was previewed with readable `p1..pN` ids and generated labels; the button is disabled until a non-empty row exists. Every dismissal path (✕, Esc, empty-canvas click, gallery reopen, selecting another switch) routes through one App exit: untouched drafts are discarded silently, edited drafts get a `Discard this switch?` confirm whose cancel keeps them.

Evidence (branch `ticket/20-draft-builder`, worktree `/tmp/opencode/ssm-worktrees/20`):
- `npm test` — 12 files / 152 tests green (12 new app-level tests in the `draft switch` describe of `src/App.test.tsx`).
- Never in document/storage: while the ghost live-previews rows (port count 12 → 4) and the typed name/model, the tests assert `storedSwitches()` stays empty and `localStorage` never contains the typed values.
- Commit: stored layout asserted exactly and independently (`sequential`, four ports `p1..p4` labelled 1–4), position `{ x: 160, y: 355.5 }` from the placement rule, new switch selected, ghost gone.
- Silent discard covered on ✕, Esc and empty-canvas click; confirmed discard covers dialog copy, cancel-keeps and discard-removes; gallery and switch-selection hand-over covered too.
- `npm run build`, `npm run lint` and prettier check green. Canvas diff kept minimal and additive for ticket 21.

Superseded by [27](27-section-faceplate-and-editor.md) — the row editor is replaced by the section editor.
