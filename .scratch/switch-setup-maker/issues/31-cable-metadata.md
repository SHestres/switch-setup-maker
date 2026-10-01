# 31: Cable metadata — colour, length & type

Type: grilling
Status: claimed
Blocked by: None

## Question

Decide how Connections carry cable attributes (colour, length, type), how they are authored and how they display. The model seam is already settled — attributes ride on the Connection, inside `setup` ([05](05-domain-model.md)) — this ticket fills in the design.

- **Palette and defaults**: a fixed set of named colours, semantic vs aesthetic, or free choice; what a new Connection gets.
- **Length**: units (m/ft), preset steps vs free entry, precision.
- **Type**: which cable types to offer (Cat5e/6/6a, fibre, DAC, patch, …); whether type ever constrains speed — as a cross-feature note only.
- **Editing UI**: selected cable in the bottom-panel editor ([27](27-section-faceplate-and-editor.md)), a popover on the wire ([23](23-manage-connections-and-cable-layer.md)), and whether bulk edits are supported.
- **Rendering**: the wire shows its colour; how selected/hover states layer; whether type/length show anywhere — hover info belongs to [30](30-port-hover-connected-info.md).

Composition: cable metadata must slot into the section schema work ([26](26-section-model.md)) and the import validation in `serialize.ts`; any new glossary vocabulary goes through `domain-modeling` when resolved.

Deliverable: the decision recorded as an `## Answer` when resolved, plus any build tickets it surfaces.
