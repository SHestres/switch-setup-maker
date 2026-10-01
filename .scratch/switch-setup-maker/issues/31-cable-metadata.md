# 31: Cable metadata — colour, length & type

Type: grilling
Status: resolved
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

## Answer

Resolved 2026-10-01 by grilling + domain-modeling. Cable metadata is **color and length only** — cable type is not stored.

### The model

- `Connection` gains two optional fields, inside `setup`: `color?: CableColor` and `length?: number`.
- `CableColor` is a fixed nine-token palette — `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `brown`. Absent means the theme's default wire; choosing **Default** on an existing cable clears the field.
- `length` is in **feet**: a positive number; input accepts one decimal (e.g. `2.5`); blank means unset.
- **No `type` field.** Type is never authored: the future port-diagram export infers it from the port kinds at each end, and that export carries the note that it assumes all external devices use RJ45 connectors. Recorded in the map's exports fog.
- Device Connections may physically carry the fields, but v1 authors them only on wired Connections; the exporter handles device links (they feed inference, not authoring).
- Serialization: both fields optional; import rejects an unknown color token or a non-positive/non-finite length, and documents without them load unchanged. `DOCUMENT_VERSION` takes the next free number at implementation time, coordinating with [34](34-device-connections-model.md)'s device-model bump.
- User directive: American spelling in production code and UI (`color`, not `colour`); recorded in `AGENTS.md`.

### Palette & themes

- Nine tokens plus Default, shown as swatches in the cable editor and the bulk config.
- Exact per-theme hex values are chosen at implementation for contrast; this ticket fixes the token set.
- Light/dark show the cable's true color. Blueprint keeps its monochrome identity: every wire stays the theme's sky-blue tint and the true color appears only in swatches (panel, popover) — the hover card has no color row.

### Rendering & states

- Light/dark: a wire's stroke is its cable color; unset renders the theme's default wire.
- Hover brightens and slightly thickens the wire; selection adds thickness plus an accent halo — the cable color stays visible in both states (no more swap to the highlight color).
- Blueprint keeps today's behavior: theme-tinted wires, highlight color on hover/selection.
- The port hover card ([30](30-port-hover-connected-info.md), unbuilt) gains one row: `Cable: <n> ft`, shown only when a length is set. No color row, no swatch.

### Editing

- Clicking a wire selects it and shows a midpoint popover with **Edit cable** and **Delete cable** (replacing today's standalone Delete button).
- **Edit cable** opens the bottom panel in a new cable mode: palette swatches and the length field (chips **1 / 2 / 3 / 4 / 5 / 6 / 10 ft** plus free entry; positive, one decimal; blank clears).
- **Bulk edit cables** is an app-bar toggle opening the bottom panel in bulk mode. Each field's default is **Leave unchanged**, so a sweep can set color only, length only, or both without touching the other; pickable values include **Default** (clear color) and **Clear** (clear length).
- With bulk mode on, press-drag across wires paints the set fields onto each wire crossed (a plain click paints one); wires do not select while bulk mode is on. **Done** or Esc exits.
- Everything routes through normal document writes, so autosave and JSON export carry it.

### Vocabulary

- `GLOSSARY.md` updated: **Connection** carries the cable's color and length; **Cable** stores them on the Connection and never a stored type; **Cable color** added as the nine-token palette term.
- `AGENTS.md` records the American-spelling rule for production code and UI.

### Composition / deferrals

- **Build ticketing deferred by the user** — this answer is the source for a later spec/ticket collapse. Suggested cut, in dependency order: (A) model + serialization + wire color rendering & states, after [34](34-device-connections-model.md) which also touches the `Connection` schema and version; (B) wire popover + bottom-panel cable editor; (C) bulk edit mode.
- Deliberately open: per-theme hex values; the export-side type-inference table and its RJ45 assumption note (map fog); the hover card's build ([30](30-port-hover-connected-info.md)).
