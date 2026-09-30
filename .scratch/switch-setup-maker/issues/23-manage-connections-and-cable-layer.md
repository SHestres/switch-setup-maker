# 23: Manage connections & cable layer

Type: task
Status: claimed
Blocked by: 22, 18

## What to build

A cable can be selected by clicking it — without opening the Switch inspector — and deleted, removing the Connection and freeing both Ports so mis-wires can be undone. The app bar gains a cables-above/behind control persisted in `ui.cableLayer`: "behind" draws switches over cables, "above" draws cables over switches. The blueprint theme always draws cables above regardless of the stored preference.

## Acceptance criteria

- [ ] Selecting and deleting a cable removes the Connection, frees both Ports and survives a refresh.
- [ ] The cable-layer control persists; "behind" and "above" order cables against switches correctly.
- [ ] The blueprint theme always draws cables above while the stored preference stays intact.
- [ ] Cable clicks never open the Switch inspector; Switch-body clicks never select a cable.
- [ ] App-level tests cover deletion, the toggle and the blueprint override.
