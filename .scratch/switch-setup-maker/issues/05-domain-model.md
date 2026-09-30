# Design the domain model: switch, port, connection

Type: grilling
Status: resolved
Blocked by: 02

## Question

Design the MVP's domain model and its JSON shape:

- **Setup** (the root document): one at a time; what it holds.
- **Switch**: identity/label, port layout (rows), position on the canvas.
- **Port**: how numbering works (per ticket 02's conventions), type (RJ45/SFP+), speed — only what the MVP needs, but with sensible extension seams for cable metadata and per-port speed/PoE highlighting later.
- **Connection**: port↔port; undirected semantics; what rules stop invalid links (self-link, duplicate, same switch?).
- Coordinates/units for canvas positions.

Use the `domain-modeling` skill: sharpen the terms and start `GLOSSARY.md` with the resolved vocabulary. Deliverable: the model and JSON shape in the answer, ready for ticket 09 to implement.

## Answer

Resolved by grilling + domain-modeling (2026-09-30). Ready for ticket 09 to implement and ticket 10 to build against. Vocabulary recorded in [GLOSSARY.md](../../../GLOSSARY.md).

### One versioned document

Autosave and JSON export share one shape. `ui` is a sibling of `setup`; import applies both.

```json
{
  "version": 1,
  "setup": {
    "switches": [
      {
        "id": "sw1",
        "name": "Core",
        "model": "NSW-24G-4X",
        "x": 120,
        "y": 360,
        "layout": {
          "numbering": "odd-top-even-bottom",
          "rows": [
            {
              "ports": [
                { "id": "p1", "label": "1", "kind": "rj45", "speed": "1G" },
                { "id": "p2", "label": "2", "kind": "rj45", "speed": "1G" }
              ]
            },
            {
              "ports": [
                { "id": "p49", "label": "49", "kind": "sfp+", "speed": "10G" }
              ]
            }
          ]
        }
      }
    ],
    "connections": [
      {
        "a": { "switch": "sw1", "port": "p1" },
        "b": { "switch": "sw2", "port": "p12" }
      }
    ]
  },
  "ui": {
    "theme": "light",
    "cableLayer": "behind",
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

### Decisions

- **Geometry is renderer-owned.** A switch's `x`/`y` is its top-left corner in canvas units (1 unit = 1 CSS px at 100% zoom). Body width, port pitch and row heights are canvas-layer constants kept at the prototype's mm-equivalent proportions (442 mm body, ~14 mm pitch, 1U = 44.45 mm) — never model fields. The model carries no physical sizes; a future device library adds them additively.
- **Switch fields.** `name` and `model` are optional free text; blank prints nothing on the faceplate; fake brand chrome stays gone. The future device library may prefill or supersede `model`.
- **Ports are materialised.** Each row holds ordered port objects — `id`, `label`, `kind`, `speed`. Printed labels are display data; they may change or repeat freely.
- **Port identity is readable and stable.** `id`s run `p1`, `p2`, … unique within their switch, generated one past the highest existing suffix. Renumbering or changing a row's count never changes an existing port's id, so connections survive; removing a port purges any connection touching it.
- **Numbering preset** (`odd-top-even-bottom` | `sequential` | `even-top-zero-based` | `custom`; default `odd-top-even-bottom`) records the authoring convention so the builder can regenerate labels on structural edits; `custom` means labels are user-owned. Uplink rows number independently or continue the sequence, as chosen in the builder — guidance for ticket 10.
- **Kind and speed enums** (MVP): kind `rj45` | `sfp` | `sfp+`; speed `100M` | `1G` | `2.5G` | `5G` | `10G`. The research's sfp28/qsfp kinds and higher speeds are additive later.
- **Connections are undirected port pairs** — `{ a: { switch, port }, b: { switch, port } }`; the pair is the identity (no connection id). Same-switch links are allowed (future loop checks need them); one connection per port; no self-link; no duplicate pair.
- **Cable metadata rides on the connection and lives in `setup`, not `ui`.** Colour is semantic — users colour cables to denote things (VLANs, purposes) — so an exported setup carries it with the model; length and type join later.

### Invariants for import/validation (ticket 09)

- Unknown/newer `version` → reject with a clear message; unknown extra fields are ignored; missing `name`/`model`/`numbering`/`ui` take defaults.
- Switch ids unique in the setup; port ids unique within their switch; every connection endpoint resolves; no self-link; no duplicate unordered pair; no port in more than one connection.
- Rows are non-empty and every row has at least one port; `x`, `y` and `zoom` are finite numbers.
- Deleting a switch or a port deletes every connection touching it.

### Deferred (fog seams, all additive)

- Cable metadata shape (palette, selection, defaults, length, type) — future fields on the connection, post-MVP.
- Per-port `poe`, per-port speed overrides, combo ports (shared number, mutually exclusive), more kinds/speeds.
- Real device-model library, multiple setups.

## Comments

- 2026-09-30 — **Direction from [04](04-faceplate-prototype.md)**: every switch body renders at one **consistent rack width** (same-rack assumption); layout variation lives inside that width and blank space is acceptable. Decide whether the model carries a fixed body width or whether it stays a renderer constant.
