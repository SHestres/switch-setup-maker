# 25: MVP acceptance pass

Type: task
Status: claimed
Blocked by: 16, 17, 18, 19, 20, 21, 22, 23, 24

## What to build

Run the whole MVP story on a production build served locally per the self-host instructions: fresh browser, add switches from presets and by hand, configure layouts, wire connections, refresh, export and re-import JSON, delete things. Fix the small gaps found; capture anything bigger as new tickets or fog. Deploying to the user's own server is deliberately out of this ticket for now — the user will test locally and deploy when ready.

## Acceptance criteria

- [ ] The story passes end-to-end on the production build: presets and hand-built switches, layout edits, wiring, refresh persistence, export/import round-trip and deletions.
- [ ] Small gaps found during the pass are fixed; anything bigger is captured as new tickets or fog.
- [ ] The result is recorded in this ticket and the map's MVP phase can be declared complete.

## Answer

Acceptance-fix pass on branch `ticket/25-acceptance-fixes` (based on `integration/mvp` @ `b96f51f`). Three gaps fixed; the ticket stays `claimed` because the coordinator re-runs acceptance and records the final result.

### 1. Wheel zoom far too coarse (story G2)

- `src/canvas/Canvas.tsx`: `TransformWrapper` now passes `wheel={{ step: 0.0015 }}`. With RZPP's default `smooth: true`, one standard `deltaY ±100` notch adds `0.0015 × 100 = 0.15` (`1.0 → 1.15`) instead of the default `+1.5`; the clamp is only reached after ~20 notches. `onWheelStop`/viewport autosave is untouched.
- Test seam: the existing jsdom test ("persists zoom after a wheel gesture") is strengthened to drive two real wheel events through RZPP and assert `1.1 ≤ zoom ≤ 1.2` on the first notch, a strictly larger second step, and no clamp. (jsdom does exercise the RZPP wheel path; real-browser probe below confirms it.)

### 2. Short same-switch cables unselectable with "Cables behind" (story G1)

- `src/canvas/geometry.ts`: settled cables (`connectionCurve`, `connectionMidpoint`) now compute a clearance sag. For level-ish pairs (`|Δy| ≤ 24`), the cable's lowest point must clear the bottom edge of every faceplate its dip passes under by `SAG_CLEARANCE = 8` canvas units; `faceHeight()` derives each face's rendered height from the same bank/row constants the renderer mirrors. The scan repeats to a fixed point (a raised dip can enter another face). Clearance wins over `MAX_BOW` for tall faceplates. `wireCurve`/`wirePoint` keep their 2/3-arg behaviour (`minSag = 0`), so the always-above pending wire and the vertical-exit rule (control x = endpoint x) are unchanged; no schema change. ADR 0001 holds: pure, model-derived, no DOM reads.
- Tests (`src/canvas/geometry.test.ts`): dense inputs — same-switch adjacent ports on the sample document, adjacent SFP+ uplinks on a 48-port face, a level cross-switch pair under overlapping faceplates, an already-clear level pair that keeps its style, and a property test over every adjacent pair of the dense face (deepest point ≥ face bottom + 8).
- Caveat: steep same-switch spans (e.g. row 0 → row 2, `|Δy| > 24`) are still hidden in behind mode; clearing those would require inverting an endpoint's vertical exit, which this fix deliberately preserves.

### 3. Light-theme micro-label contrast (visual gap 1)

- `src/canvas/faceplate.css` (light block only): `--muted` `#93a0af → #64748b` (`.bank-label`/`.cage-num`: 2.66 → **4.76:1** on the white face), `--tag` `#64748b → #5b6b7f` (`.sw-tag`: 4.20 → **4.81:1** on the canvas). Dark and blueprint override both tokens and are untouched.
- Caveat: `.cage-num` is painted under the SFP `.jack` (pre-existing order), so its rendered pixels stay hidden in the light theme; the measured token now meets the target the visual pass used.

### Verification

- `npm test` 196/196, `npm run build`, `npm run lint` green in the worktree.
- Real-browser probe (production build served with `PORT=4180 node scripts/serve.mjs`): `/tmp/opencode/ssm-accept/probes/verify-fixes.mjs`, **23/23 checks, 0 console/page errors** (`after-run.log`, `after-results.json`, screenshots `after-*.png`). Key before → after: one notch `2.5 → 1.15`; four notches `[2.5, 4, 4, 4] → [1.15, 1.30, 1.45, 1.60]`; short-cable `elementFromPoint` `BUTTON.port` → `path.wire-hit` with 8 px clearance, selectable and deletable; `.bank-label`/`.cage-num` `2.66 → 4.76`, `.sw-tag` `4.20 → 4.81`; endpoint alignment re-measured **0.0000 px** for both cables; preset add + cross-switch wire + drag smoke all pass. Re-run with the same script after any merge.
- Changed test expectations: `geometry.test.ts` same-switch curve literal `'M 509 409 C 509 433, 536 433, 536 409'` → `'M 509 409 C 509 473, 536 473, 536 409'` (deliberate, same worked-example method); `App.test.tsx` wheel test now sends `deltaY -100` twice and asserts the 10–20 % range instead of `zoom > 1`. All other literals (sloped `connectionCurve`, all `wireCurve` cases, port anchors) are unchanged.
