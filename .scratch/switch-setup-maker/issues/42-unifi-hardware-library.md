# 42: UniFi hardware library & searchable preset gallery

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

Replace the chip-row gallery and the handmade `unifi-48-port` stand-in with the real hardware library ([post-MVP spec](../spec.md); seed facts in [research/37-unifi-front-panels.md](../research/37-unifi-front-panels.md)).

- `LayoutPreset` gains an optional `vendor`; hardware entries carry it, generic presets do not. `model` prefills the Switch's model, `label` reads `<vendor> <model>`, `details` stays the hover/focus line.
- Seed the eight researched UniFi models as data-only entries: Lite-8-PoE, Lite-16-PoE, USW-24, USW-24-PoE, USW-48-PoE, Pro-24-PoE, Pro-48-PoE and Aggregation — real Sections, alternating top-first numbering, SFP uplinks continuing the count, and `poe` seeded with the boundary splits (Lite-8, Lite-16, USW-24-PoE/Pro-24-PoE, Pro-48-PoE) so every bolt is truthful. Generic presets stay and seed `poe: false`.
- The gallery becomes a searchable list: substring filter over label, vendor and model; hardware and generics in one list; sorted by port count descending; one click creates and selects; hover/focus still shows details; `Start blank` unchanged.
- Adding a model later is a data-only change.

## Acceptance criteria

- [ ] `vendor` field implemented; hardware labels read `<vendor> <model>` and prefill the model.
- [ ] All eight seeds match the researched layouts, numbering and uplink counts; the stand-in is gone.
- [ ] PoE flags follow the boundary splits; SFP-only and generic entries seed false.
- [ ] Filter, port-count-descending sort, one-click create-and-select and the details line work.
- [ ] Adding a model is a data-only change.
- [ ] App-level and preset-seed tests cover the gallery and the seeds; `npm test` is green.
