# 45: PoE bolt & Section checkbox

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

Make Section-level PoE visible and editable ([post-MVP spec](../spec.md)).

- Every Port of a PoE Section carries a small always-visible lightning-bolt mark by the jack, tokenised across light, dark and blueprint. The draft ghost previews its bolts too.
- A PoE Port's accessible name gains "PoE", e.g. `RJ45 port 24 (1G, PoE) on sw1`, only when true.
- Every Section card in the bottom panel gains a PoE checkbox, shared with the draft builder; ticking it writes `Section.poe` and autosaves. There is no budget field.

## Acceptance criteria

- [ ] PoE Ports show the bolt in all three themes; non-PoE Ports do not.
- [ ] The draft ghost previews bolts.
- [ ] The Section checkbox appears in editor and draft builder and toggles `poe` with autosave.
- [ ] Accessible names include "PoE" only when true.
- [ ] App-level tests cover the checkbox, bolt and accessible name; `npm test` is green.
