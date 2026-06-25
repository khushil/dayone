---
name: forge
description: 'Multi-agent orchestration — decompose a large task into a dependency graph of subagents, fan out independent tracks in parallel, and verify every deliverable on disk before declaring success. Use when work is too big for one session and has independent tracks.'
---

# Forge

Coordinate a body of work across multiple Claude Code subagents. You act as the
orchestrator: you decompose the task, declare the dependency graph, dispatch
specialist agents in order, parallelise independent tracks, and verify each
deliverable on disk. **The orchestrator coordinates — it does not implement.**

## When to use

- The work spans multiple interdependent tasks too large for one agent session.
- There is a real dependency graph (Task B needs a file Task A produces).
- Independent tracks can run in parallel (e.g. three components built at once).
- You need progress that survives context compaction across sessions.

**Do not use** when the task fits one session with no parallelism — write it
directly. Don't fan out work that has no independent tracks; the coordination
overhead outweighs the benefit.

## Tools

- **`Agent`** — spawn a subagent for one task. Choose the right `subagent_type`
  (e.g. `ts-developer` to implement, `style-reviewer` for review-only,
  `Explore` for read-only search). Launch independent agents in a single message
  so they run concurrently. Use `isolation: "worktree"` when agents mutate files
  in parallel and would otherwise conflict.
- **`SendMessage`** — continue a named, still-running agent with its context
  intact, instead of starting a fresh one.

## Workflow

### Step 1 — Decompose into a task graph

Break the work into tasks, each producing a named deliverable (a file, a passing
test, a green check). For each task record: its deliverable path, its
dependencies (which tasks must finish first), and its verifier (the command or
inspection that proves the deliverable landed). Tasks with no shared dependency
are an independent track.

### Step 2 — Surface prerequisites

Before spawning a single agent, confirm the branch, fixtures, and any inputs
exist. Surface blocking conditions up front rather than discovering them
mid-run. Each agent gets a self-contained brief: its task, its inputs, its
deliverable path, and the verifier its output must satisfy.

### Step 3 — Dispatch in dependency order

Spawn tasks whose dependencies are met. Run independent tracks in parallel
(one message, multiple `Agent` calls). Hold a dependent task until its upstream
deliverable is verified on disk — not merely reported complete.

### Step 4 — Verify every deliverable on disk

Never accept an agent's "done" status alone. After each agent returns, confirm
the deliverable exists and has the expected shape:

```bash
ls src/renderer/src/lib/<expected-file>.ts   # the file exists
npm run typecheck && npm run lint             # it integrates cleanly
npm run test -- <pattern>                     # its tests pass
git diff --stat                               # the change is what was asked
```

Only once verified do you unblock dependent tasks.

### Step 5 — Monitor and retry

Read each agent's return value. Give a failing task a bounded retry budget
(default: 2 attempts). After two failures on the same root cause, stop retrying —
open a GitHub Issue capturing the blocker (`gh issue create`), mark the task
escalated, and advance to the next independent task. Never burn retries on the
same cause without a real fix.

### Step 6 — Report completion

Summarise deliverables produced, verifiers that passed, tasks escalated, and any
follow-up Issues filed.

## Compaction survival

Keep a lightweight run log (a scratch markdown file or a checklist in the
tracking Issue): one line per task with its status and verifier result. If the
session is compacted mid-run, re-read the log and resume from the last verified
task rather than restarting.

## Common rationalisations

| The orchestrator thinks…                            | Actually…                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "The agent says it's done — no need to check disk." | Agent status is unreliable. A task is done when the deliverable exists at the expected path and shape. |
| "I'll fan out everything at once."                  | Dependent tasks started before their inputs land produce broken work. Respect the graph.               |
| "It failed twice — one more try will fix it."       | Without a root-cause fix, a third attempt repeats the same failure. Escalate to a GitHub Issue.        |
| "I'll just implement this bit myself."              | The orchestrator coordinates and verifies; mixing in implementation loses the audit trail.             |

## Rules

- **Coordinate, don't implement** — spawn agents to do the work; you verify it.
- **Verify on disk** — every deliverable is confirmed by file inspection,
  `npm run test`, `npm run typecheck`, or `git diff` — never status alone.
- **Respect the graph** — a dependent task waits for its upstream deliverable to
  be verified.
- **Parallelise independent tracks** — launch them in a single message.
- **Bounded retries** — max 2 per task, then escalate via `gh issue create`.
- **British English** in all summaries and Issue text.
