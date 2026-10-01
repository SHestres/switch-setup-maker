# 25: MVP acceptance pass

Type: task
Status: resolved
Blocked by: 16, 17, 18, 19, 20, 21, 22, 23, 24

## What to build

Run the whole MVP story on a production build served locally per the self-host instructions: fresh browser, add switches from presets and by hand, configure layouts, wire connections, refresh, export and re-import JSON, delete things. Fix the small gaps found; capture anything bigger as new tickets or fog. Deploying to the user's own server is deliberately out of this ticket for now — the user will test locally and deploy when ready.

## Acceptance criteria

- [x] The story passes end-to-end on the production build: presets and hand-built switches, layout edits, wiring, refresh persistence, export/import round-trip and deletions.
- [x] Small gaps found during the pass are fixed; anything bigger is captured as new tickets or fog.
- [x] The result is recorded in this ticket and the map's MVP phase can be declared complete.

## Answer

**Coordinator final acceptance — `integration/mvp` @ `1b72862`, production build served locally (`node scripts/serve.mjs`), headless Chromium:**

- **Story pass: 131/131 assertions PASS** in a fresh browser — first-run card and copy; add from all four presets with exact stored/DOM layouts (Unifi model prefill, 12-port even-top zero-based, SFP restarts); start-blank ghost draft never reaching the document or storage before commit; name/model/row/count/kind/speed/numbering edits with inline validation (0 and 49 rejected) and live label regeneration; cross- and same-switch wiring with the exact busy/duplicate/self-link hint copy; Esc and empty-canvas cancels leaving storage untouched; cable selection (inspector stays closed), affordance and Delete-key deletion freeing both ports; delete-switch confirm naming the switch and severed connection count; full refresh restore (switches, cables, moved switch, pan+zoom, theme, cable layer); export pretty JSON equal to the document; malformed import naming the first problem; re-import restoring the setup. Zero console/page errors. Evidence: `/tmp/opencode/ssm-accept/story/evidence.md` (+ 18 screenshots, storage snapshots, `exported.json`).
- **Visual/edge pass: all sections PASS** — three themes at density (light diagrammatic, dark keeps the 22px dot grid, blueprint 26px line grid; chrome honest and inert); wire endpoints align with port anchors at **0.0000 px** deviation across 48-port, 12-port and SFP densities and multiple zooms; cable above/behind DOM ordering and persistence correct; blueprint always-above with the stored `behind` preference intact; hit-testing isolation both ways; pending wire above with cables behind; Delete/Backspace guarded while typing; mouse drag, wheel zoom and pan persistence; the same `dist/` served from a sub-path with zero 404s. Evidence: `/tmp/opencode/ssm-accept/visual/evidence.md` (+ 19 screenshots).
- **Gaps fixed** on `ticket/25-acceptance-fixes` (merge `1b72862`): wheel zoom proportional (one notch 2.5 → **1.15**, clamps only after ~20 notches); clearance sag so short same-switch cables are selectable in "cables behind" mode (endpoint alignment unchanged at 0.0000 px); light-theme micro-label contrast 2.66 → **4.76:1**, `.sw-tag` 4.20 → **4.81:1**.
- **Re-verification of the merged build** with the reusable probe `/tmp/opencode/ssm-accept/probes/verify-fixes.mjs` (`PROBE_TAG=merged`): **23/23 checks, 0 console/page errors**. `npm test` 196/196, `npm run build`, `npm run lint` green on the merged tip.
- **Carried forward, non-blocking:** connected-jack fill vs empty is subtle (~1.6–2.3:1; the lit LED carries the signal); steep same-switch spans (`|Δy| > 24`) can still be fully hidden in behind mode; light-theme `.cage-num` stays painted under the SFP jack (pre-existing order). **Docker `build`/`run` remains unexecuted in this environment** (no container runtime) — [24](24-self-host-path.md)'s `[~]` box stays for a Docker-capable machine.
- **MVP phase complete.** The hosted-home/publish work (old ticket 15) remains off-queue by decision: the user tests locally and deploys on their own server.

### Acceptance-fix pass detail (branch `ticket/25-acceptance-fixes`, base `b96f51f`)

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
