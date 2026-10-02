# 32: Device-model library — real hardware presets

Type: grilling
Status: resolved
Blocked by: None

## Question

Decide how real hardware models become pickable presets with baked layouts.

- **Data**: a curated static, in-repo list of models with section layouts — rows × columns, kinds, speeds, numbering and start defaults; which vendors/models to seed.
- **Research**: whether a research pass for hardware specs is needed; it may surface a separate research ticket.
- **UX**: extending or replacing the preset gallery ([06](06-mvp-ux-flows.md), [17](17-add-flow-and-selection.md)); search/filter by vendor/model; how a pick prefills Name/Model and sections ([27](27-section-faceplate-and-editor.md)).
- **Relationship** to the Layout preset term ([06](06-mvp-ux-flows.md)) and the section model ([26](26-section-model.md), [27](27-section-faceplate-and-editor.md)).
- **Maintenance**: adding models as data-only changes; no pricing or connectivity data.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.

## Answer

Locked via grilling:

- **Data**: a curated static, in-repo seed of real UniFi switches (representative ~6–10 models across 8/16/24/48-port, PoE and non-PoE), sourced from a dedicated research pass — ticket [37](37-unifi-front-panel-research.md) (UniFi only; the Cisco/Aruba/MikroTik/Juniper reading stays for a later effort).
- **Model**: `LayoutPreset` gains a `vendor` field; hardware models are the presets with `vendor` set. `model` prefills the Switch's model; labels read `<vendor> <model>`. Generic presets carry no `vendor`. The hand-authored `unifi-48-port` stand-in is replaced.
- **UX**: the bottom panel's preset gallery becomes a searchable list — substring filter over label/vendor/model, sorted by port count descending, generics and hardware in one list; one-click create-and-select and the hover/focus details line are preserved.
- **Terminology**: no new canonical term — `Layout preset` in GLOSSARY.md now covers both generic and vendor-backed (hardware) entries.
- **Maintenance**: data-only additions to `src/model/presets.ts`.

Build work: [38](38-device-model-library.md), blocked by [37](37-unifi-front-panel-research.md).
