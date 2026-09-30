# 22: Wire ports by clicking

Type: task
Status: claimed
Blocked by: 21

## What to build

Click a Port to start a Connection and click another to land it; the pending wire is ephemeral — never in the document or storage — and follows the pointer until it lands or is cancelled. One Connection per Port holds; same-Switch links are allowed; self-links and duplicate pairs are refused. Every refusal surfaces the transient hint near the offending Port using the connection rules' ready-made copy ("Port 24 is already connected."), naming the busy Port — nothing fails silently. A landed Connection renders immediately and autosaves.

## Acceptance criteria

- [ ] Clicking a Port starts a Connection and clicking another lands it; the landed Connection renders and survives a refresh.
- [ ] The pending wire is ephemeral and can be cancelled without effect.
- [ ] One Connection per Port holds; same-Switch links are allowed.
- [ ] Self-link, duplicate pair and busy-port attempts show the transient hint near the offending Port, naming the busy Port.
- [ ] App-level tests cover the happy path and each refusal.
