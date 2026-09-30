# 22: Wire ports by clicking

Type: task
Status: resolved
Blocked by: 21

## What to build

Click a Port to start a Connection and click another to land it; the pending wire is ephemeral — never in the document or storage — and follows the pointer until it lands or is cancelled. One Connection per Port holds; same-Switch links are allowed; self-links and duplicate pairs are refused. Every refusal surfaces the transient hint near the offending Port using the connection rules' ready-made copy ("Port 24 is already connected."), naming the busy Port — nothing fails silently. A landed Connection renders immediately and autosaves.

## Acceptance criteria

- [x] Clicking a Port starts a Connection and clicking another lands it; the landed Connection renders and survives a refresh.
- [x] The pending wire is ephemeral and can be cancelled without effect.
- [x] One Connection per Port holds; same-Switch links are allowed.
- [x] Self-link, duplicate pair and busy-port attempts show the transient hint near the offending Port, naming the busy Port.
- [x] App-level tests cover the happy path and each refusal.

## Answer

Two-click wiring. First click starts a pending wire (dashed accent curve + accent ring on the source Port); the curve follows the pointer in canvas units (client → canvas via the live pan/zoom transform). Second click runs `connect(setup, a, b)`: success commits through `useDocument`, so the wire renders immediately and autosaves (`onReplace` is untouched); a refresh restores it.

**Refusals.** `connect`'s problem decides everything: the hint bubble (`role="status"`, `data-hint-port`) is anchored at `problem.port` (model-derived anchor) and shows the rules' copy verbatim — "Port 2 is already connected.", "A port cannot connect to itself.", "Those ports are already connected." It fades after `WIRE_HINT_MS` (3 s). The pending wire survives a refusal so only the offending end is abandoned. Same-Switch links land normally; the refusal paths are: click the same Port twice (self-link), land on a connected Port (busy), or re-click an already-connected pair (duplicate — `connectionProblem` checks duplicate before in-use).

**Cancel gestures (deliberate).** Esc and an empty-canvas click cancel the pending wire and its hint; clicking the same Port again is the self-link refusal rather than a silent cancel, so the click-to-attempt path for self-links stays representable. Pending and hint are App-local state (`PortRef` + `WireHintState`); nothing reaches the document or storage until `connect` succeeds — tests byte-compare the serialized document after start, refusal and cancel.

**Draft ports.** `handlePortClick` ignores refs `findPort(document.setup, ...)` cannot resolve, so a draft switch's ports (ticket 20) can never start or land a wire, whatever component renders them. Port clicks still never select a Switch or open the Inspector (existing tests).

**Files.** New: `src/canvas/wiring.ts` (types + timeout), `src/canvas/WireHint.tsx`. Additive edits: `src/App.tsx` (pending/hint state, click handler, Esc), `src/canvas/Canvas.tsx` (`pendingPort`/`hint` props, pointer mapping), `src/canvas/WireLayer.tsx` + `src/canvas/geometry.ts` (`pointForPort` export, pending curve), `src/canvas/Faceplate.tsx` (`pending` jack), `src/canvas/faceplate.css`, `src/App.test.tsx` (new `wiring` describe; removed ticket 21's now-obsolete "port clicks inert" placeholder).

**Evidence.** `npm test`: 14 files / 173 tests green (165 before; +9 wiring tests, −1 obsolete). `npm run build`, `npm run lint`, `npx prettier --check src` green. Wiring tests cover: start → land → immediate render → refresh persistence; same-Switch link; busy-port hint copy and placement; self-link; duplicate pair; Esc cancel; empty-canvas cancel; hint auto-fade; pointer-following pending curve; storage byte-equality on start/refuse/cancel.
