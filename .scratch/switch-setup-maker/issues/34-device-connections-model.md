# 34: Device connections — model, rules & serialisation

Type: task
Status: superseded
Blocked by: 26

## What to build

The model half of [29](29-port-devices-model-and-editing.md)'s answer — Device Connections, with no UI.

- `Connection.b` becomes `PortRef | { device: { name: string } }`; `a` stays a `PortRef`. Normal form: at most one Device end, never device-to-device. Document the shape and invariant in `types.ts`.
- Union-aware helpers in `src/model/connections.ts`: attach/detach/replace operations, and `samePair`, `isPortConnected`, `connectionsTouchingSwitch`, `removeSwitch`, `removePorts` over both kinds. The one-cable-per-Port rule extends across both kinds.
- Serialisation in `src/model/serialize.ts`: bump `DOCUMENT_VERSION` to the next free number after [26](26-section-model.md)'s bump; import normalises a Device end written in `a` when the other end is a Port, rejects device-to-device and unknown endpoint shapes, validates `name` as text (blank allowed), and keeps `usedPorts` covering both kinds. Export writes the normal form. No data migration — existing files load unchanged.
- Unit tests: attach/detach/replace, occupancy across kinds, port-pair vs device identity, cascades through `removePorts`/`removeSwitch`, import normalisation and rejection cases, round-trip.

## Acceptance criteria

- [ ] `b` union and normal form implemented and documented; `a` is always a Port.
- [ ] Union-aware helpers cover occupancy, pair identity, cascades and confirm counts.
- [ ] Version bumped; old files load unchanged; import normalises/rejects as decided in [29](29-port-devices-model-and-editing.md); export writes the normal form.
- [ ] Unit tests for all of the above; `npm test` is green.

## Comments

- 2026-10-02 — Superseded by the post-MVP spec cut: [spec.md](../spec.md) absorbs this work (Device union, helpers, serialization v3).
