# 35: Attach devices on the canvas — right-click, name popover & jack marking

Type: task
Status: ready-for-agent
Blocked by: 34, 27

## What to build

The canvas/UI half of [29](29-port-devices-model-and-editing.md)'s answer, on the section faceplate from [27](27-section-faceplate-and-editor.md) and the model from [34](34-device-connections-model.md).

- **Right-click a Port**: free → attach a generic Device; wired → shared confirm, then replace with a generic Device; generic-attached → detach immediately; named-attached → shared confirm (“Remove <name> from this Port?”), then detach. Suppress the browser context menu on Ports; right-click cancels any pending wire first.
- **Shift+right-click a Port**: popover anchored at the jack with one autofocused “Name?” input, prefilled with the current name when attached. Enter saves (blank = generic; wired Ports confirm first); Esc or click-away cancels; the popover is the shell future predefined-device rows land in.
- **Wiring**: confirm-to-replace when a wire lands on or starts from a device-attached Port; cancelling keeps the pending wire; both ends blocked confirms one at a time.
- **Faceplate**: device-attached Ports get the distinct jack fill plus plug motif, tokenised across the three themes; `WireLayer` skips Device Connections; wired Ports keep the current connected treatment.
- App-level tests for the gesture matrix and confirms; visual acceptance of the jack treatment on a production build.

## Acceptance criteria

- [ ] The full right-click / Shift+right-click matrix works, with confirms only on named-device loss and cross-kind replacement.
- [ ] Device actions cancel a pending wire; the wiring replace-confirm keeps the pending wire on cancel.
- [ ] Device-attached Ports are marked through the jack only — no wire or lead rendered — in all three themes.
- [ ] App-level tests cover the matrix; visual acceptance against a production build; `npm test` is green.
