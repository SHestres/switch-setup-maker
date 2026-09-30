# 23: Manage connections & cable layer

Type: task
Status: resolved
Blocked by: 22, 18

## What to build

A cable can be selected by clicking it — without opening the Switch inspector — and deleted, removing the Connection and freeing both Ports so mis-wires can be undone. The app bar gains a cables-above/behind control persisted in `ui.cableLayer`: "behind" draws switches over cables, "above" draws cables over switches. The blueprint theme always draws cables above regardless of the stored preference.

## Acceptance criteria

- [x] Selecting and deleting a cable removes the Connection, frees both Ports and survives a refresh.
- [x] The cable-layer control persists; "behind" and "above" order cables against switches correctly.
- [x] The blueprint theme always draws cables above while the stored preference stays intact.
- [x] Cable clicks never open the Switch inspector; Switch-body clicks never select a cable.
- [x] App-level tests cover deletion, the toggle and the blueprint override.

## Answer

Implemented on `ticket/23-connection-manage`.

**Gesture.** Click a cable to select it: its curve highlights in the theme's `--wire-hover` colour and a small "Delete cable" button appears at the curve's midpoint. Remove it with that button, Delete or Backspace. Escape or an empty-canvas click deselects. Each cable carries a transparent 16px `stroke` hit target (the prototype's width) with a pointer cursor and the prototype's hover highlight, so thin cables are comfortable to hit. Delete/Backspace never fire while an input, textarea, select or contenteditable has focus, so an inspector edit cannot sever a connection.

**Selection is ephemeral.** `selectedConnection` is App-local React state, never serialized; after a remount there is no selected curve or affordance.

**Layer order.** `ui.cableLayer` keeps its schema and serialize validation; the app bar gained a `Cable layer` segmented control ("Cables behind" / "Cables above") backed by the new `setCableLayer` document helper, so the choice autosaves and restores. The Canvas paints the `WireLayer` before or after the faceplates according to the effective order (DOM paint order, no z-index tricks). The blueprint theme forces the above order in that expression while `ui.cableLayer` stays untouched: the control still shows the stored value, toggling it never moves the blueprint drawing, and leaving blueprint re-applies the stored preference.

**Pending wire.** The transient wire being drawn moved into its own `PendingWire` layer that always sits above the faceplates, so an in-progress gesture stays visible even when settled cables are behind them. It is not part of the cable-layer preference.

**Evidence.** `npm test`: 14 files / 192 tests green, including the new app-level `managing cables` suite in `src/App.test.tsx` — affordance deletion frees both ports and survives refresh; Delete/Escape with the typing guard; click isolation (cable click selects and never opens the inspector nor disturbs an open one; a switch-body click clears/never sets the cable selection; empty-canvas click deselects); toggle ordering with persistence across refresh; blueprint always-above with the stored preference intact; pending wire above with cables behind. Existing wire/pending tests were updated only for the new hit paths. `npm run build`, `npm run lint` and `npm run format:check` all green.
