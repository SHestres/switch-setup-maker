# 32: Device-model library — real hardware presets

Type: grilling
Status: ready-for-agent
Blocked by: None

## Question

Decide how real hardware models become pickable presets with baked layouts.

- **Data**: a curated static, in-repo list of models with section layouts — rows × columns, kinds, speeds, numbering and start defaults; which vendors/models to seed.
- **Research**: whether a research pass for hardware specs is needed; it may surface a separate research ticket.
- **UX**: extending or replacing the preset gallery ([06](06-mvp-ux-flows.md), [17](17-add-flow-and-selection.md)); search/filter by vendor/model; how a pick prefills Name/Model and sections ([27](27-section-faceplate-and-editor.md)).
- **Relationship** to the Layout preset term ([06](06-mvp-ux-flows.md)) and the section model ([26](26-section-model.md), [27](27-section-faceplate-and-editor.md)).
- **Maintenance**: adding models as data-only changes; no pricing or connectivity data.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.
