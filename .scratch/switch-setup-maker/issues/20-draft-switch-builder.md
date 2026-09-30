# 20: Draft switch builder

Type: task
Status: ready-for-agent
Blocked by: 19

## What to build

`Start blank` in the gallery begins the draft flow: a ghost draft switch — transparent, non-interactable, zero Ports, not in the Setup — appears on the Canvas and is live-previewed as rows are built in the inspector. `Add switch` commits the draft through `materialiseRows` (readable ids, generated labels) and selects it; the button is disabled until at least one non-empty Row exists. Dismissing the panel discards an untouched draft silently, and an edited draft only after a "Discard this switch?" confirm. The draft must never reach the document or storage before commit.

## Acceptance criteria

- [ ] `Start blank` shows a ghost draft Switch on the Canvas — transparent, non-interactable, zero Ports, absent from the document — live-updated by the Row builder.
- [ ] `Add switch` is disabled until at least one non-empty Row exists and commits exactly the previewed layout, selecting the new Switch.
- [ ] An untouched draft is discarded silently; an edited draft asks "Discard this switch?" before discarding.
- [ ] App-level tests assert the draft never reaches the document or storage before commit, and cover commit, silent discard and confirmed discard.
