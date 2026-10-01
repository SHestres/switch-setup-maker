# SFP+ folds into SFP; Port speed carries the difference

A Port's kind is RJ45 or SFP — never SFP+. SFP and SFP+ are different connectors in the real world, but the model already has a Port speed axis, so a separate kind made every preset, section and edit state the same fact twice (`sfp+` always came with `10G`). One kind keeps the kind/speed matrix small and lets later speeds (25G, 40G) ride on the same cage rendering.

Documents written before this decision spell the kind `sfp+`. The parser reads that spelling as `sfp` and keeps the speed, so old autosaves and exports stay importable without a document-version bump; written documents only ever say `sfp`.

## Considered Options

- **Keep both kinds** — the connector spelling matches hardware catalogues, but it forces kind and speed to encode the same 10G fact and doubles the kind select for no modelling gain.
- **Version 3 migration** — an explicit on-disk rewrite is cleaner in principle, but it would stop older builds from reading new exports for a purely cosmetic vocabulary change.

## Consequences

- Merging is hard to undo for documents saved afterwards: re-introducing a distinct SFP+ kind cannot recover which 10G cages were SFP+ versus SFP.
- Presets that carried SFP+ 10G uplinks now label them SFP 10G (for example `24×1G + 4×SFP`).
- The reader must keep tolerating the legacy `sfp+` spelling; `serializeDocument` never writes it.
