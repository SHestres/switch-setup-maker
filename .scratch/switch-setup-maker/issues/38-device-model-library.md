# 38: Implement the device-model library

Type: task
Status: superseded
Blocked by: 37

## Question

Wire the researched UniFi hardware models into the app as real layout presets. Locked decisions from [32](32-device-model-library.md):

- `LayoutPreset` gains a `vendor` field; hardware models are the presets with `vendor` set. `model` prefills the Switch's model; `label` is `<vendor> <model>` (e.g. "UniFi USW-Pro-48-PoE"). Generic presets carry no `vendor`.
- The hand-authored `unifi-48-port` stand-in is replaced by the real seed.
- The bottom panel's preset gallery replaces the chip row with a searchable list: substring filter over label/vendor/model, sorted by port count descending (most to least); generic presets and hardware entries live in the same list.
- One click on any entry still creates-and-selects the switch; hover/focus still shows the details line.
- Model + presets live in `src/model/presets.ts`; gallery UI in `src/ui/PresetGallery.tsx`. Glossary's `Layout preset` entry already extended ([32](32-device-model-library.md)).

Seed data comes from [37](37-unifi-front-panel-research.md)'s JSON, kept data-only so adding models later needs no code change.

## Comments

- 2026-10-02 — Superseded by the post-MVP spec cut: [spec.md](../spec.md) absorbs this work (vendor field, real seed, searchable gallery, PoE splits).
