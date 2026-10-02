# 40: Attach & name Devices on the Canvas

Type: task
Status: ready-for-agent
Blocked by: 39

## What to build

The canvas half of the Device work on the v3 model ([post-MVP spec](../spec.md)).

- **Right-click a Port**: free → attach a generic Device immediately; wired → shared confirm, then replace the Cable with a generic Device; generic-attached → detach immediately; named-attached → shared confirm (“Remove <name> from this Port?”), then detach. The browser context menu is suppressed on Ports.
- **Shift+right-click a Port**: jack-anchored “Name?” popover with one autofocused input, prefilled with the current name when attached. Enter saves — blank makes it generic; a wired Port asks the replace confirm first. Esc or click-away cancels. Any Device action cancels a pending wire first.
- **Wiring**: the first click still starts a pending wire even on a device-attached Port; when a wire would start from or land on a blocked Port, the shared confirm replaces the Device, and cancelling keeps the pending wire; both blocked ends are confirmed one at a time.
- **Faceplate**: device-attached Ports read exactly like wired connected Ports — the standard connected gray shift, no plug motif, lead, wire or name chip. `WireLayer` draws nothing for a Device Connection.
- **Cascades**: deleting a Switch or removing Ports purges Device Connections, and the shared confirms count them.

Done when a Switch can be patched with generic Devices, named and renamed in place, replaced by a Cable and back, all through the canvas gestures and shared confirms.

## Acceptance criteria

- [ ] The full right-click / Shift+right-click matrix works, with confirms only on named-device loss and cross-kind replacement.
- [ ] Device actions cancel a pending wire; the wiring replace-confirm keeps the pending wire on cancel; both blocked ends confirm one at a time.
- [ ] The name popover saves on Enter, treats blank as generic, and cancels on Esc/click-away.
- [ ] Device-attached Ports use the standard connected treatment — no motif, wire, lead or chip — in all three themes.
- [ ] Switch/Port removal purges Device Connections and counts them in the confirm.
- [ ] App-level tests cover the matrix and confirms; visual acceptance against a production build; `npm test` is green.
