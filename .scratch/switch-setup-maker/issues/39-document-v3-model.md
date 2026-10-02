# 39: Document v3 — Device ends, Cable color & length, Section PoE, speed preference

Type: task
Status: ready-for-agent
Blocked by: None (can start immediately)

## What to build

The model and serialization half of the [post-MVP spec](../spec.md), with no UI: the single version-3 document bump that owns Device Connections and Cable metadata together, plus the two additive fields.

- `Connection.b` becomes `PortRef | { device: { name: string } }`. Normal form: `a` is always a Port, at most one Device end, never device-to-device, so every Connection has one or two Port ends. `name` is free text, no trimming and no cap beyond Switch name/model parity; a blank name is a generic Device. Duplicate names across Ports are allowed and edited independently.
- `Connection` gains optional `color` (nine tokens: red, orange, yellow, green, teal, blue, purple, pink, brown) and optional `length` in feet (positive, one decimal). No type field.
- `Section` gains `poe: boolean`; `ui` gains `speedHighlight: boolean`. Missing values read as `false`; export always writes `poe` explicitly.
- Every connection helper becomes union-aware: attach/detach/replace, same-pair identity, occupancy, connections touching a Switch, Switch removal, Port removal, and confirm counts. The one-cable-per-Port rule covers both kinds, so attaching a Device to a wired Port — or wiring a device-attached Port — replaces the existing Connection.
- Serialization: import normalises a Device end written in the other slot when the far end is a Port, and rejects device-to-device, unknown endpoint shapes, extra endpoint keys, unknown color tokens, non-positive/non-finite lengths and non-text names. `usedPorts` covers both kinds. Export and autosave always write the normal form. Versions 1 and 2 keep loading through the existing conversion and defaults; there is no data migration.

Done when a v3 JSON carrying a Device Connection, Cable color/length and `poe` survives an import → export round-trip through the app bar unchanged, and an old v2 export still imports.

## Acceptance criteria

- [ ] `b` union and normal form implemented and documented; `a` is always a Port; blank name = generic Device.
- [ ] Cable color and length are optional and validated; no type field anywhere.
- [ ] `Section.poe` and `ui.speedHighlight` default to false; `poe` is written explicitly on export.
- [ ] One version-3 bump owns Device ends and Cable metadata; v1/v2 documents load unchanged.
- [ ] Union-aware helpers cover occupancy across kinds, pair identity, cascades and confirm counts.
- [ ] Import normalises and rejects as decided; export writes the normal form; round-trip covered.
- [ ] Unit tests for all of the above; `npm test` is green.
