---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round, then wait for the user's answers before the next round.

Ask a round with the `question` tool: one entry in its `questions` array per frontier question, the whole round in a single call. The call blocks until the user has answered, so it carries the waiting for you — no need to ask and then idle.

- `header`: a short label for the question, 30 characters at most.
- `question`: the full prompt. Spend it on the body: the context and reasoning the user needs in order to answer well. Multiple paragraphs are fine.
- `options`: the choices, each a `label` of a few words plus a `description` saying what picking it commits them to. Put the answer you recommend first and mark the label `(Recommended)`, so every round ships with a default. Set `multiple` when picking more than one is a legitimate answer.
- A free-form answer is always offered alongside your options, so write the options as the plausible answers rather than a closed set, and never add an "other" option of your own.

```json
{
  "questions": [
    {
      "header": "Where uploads live",
      "question": "Where do uploaded files live? They are currently stored inline as base64 in the `files` table, which caps practical size at a few MB and bloats every row that references one.\n\nMoving them to object storage is the usual fix, but it adds a bucket to provision and a signed-URL read path.",
      "options": [
        { "label": "Object storage (Recommended)", "description": "S3-compatible bucket behind signed URLs. Lifts the size cap, costs a network hop per read." },
        { "label": "Keep inline base64", "description": "No new infrastructure. Stays capped at a few MB per file." },
        { "label": "Local disk volume", "description": "Cheapest, but breaks the moment you run a second instance." }
      ]
    }
  ]
}
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it and keep going; don't ask the user for anything you could look up yourself. Dispatch every such sub-agent _before_ you make the round's call, then ask around them: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; the rest of the frontier goes now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding — ask for that confirmation through the `question` tool too.

Some clients have no `question` tool, or the user dismisses the form. Then ask the round as plain text in your message body instead, one `❓ **Qn**` block per question with your recommended answer on the `➡️` line beneath it and a `---` between questions. The frontier and the round structure are unchanged; only the delivery differs.
