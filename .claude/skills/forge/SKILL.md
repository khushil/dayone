---
name: forge
description: Execute a FORGE orchestrator — multi-agent prompt execution with dependency graphs
user_invocable: true
type: rigid
archetype: orchestrator
priority: low
maturity: L2
keywords:
  - 'forge'
  - 'orchestrator'
  - 'multi-agent'
  - 'dependency graph'
intent_patterns:
  - "/forge\\s+\\w+"
  - "run\\s+(a\\s+)?forge"
---

# /forge

Execute a named FORGE orchestrator to coordinate multi-agent task execution.

## Overview

`/forge` is the entry point for MLE's multi-agent orchestration system. When invoked,
it reads a named FORGE prompt file (`prompts/{name}/{NAME}-FORGE.md`), follows the
orchestration protocol encoded there, creates an agent team, declares a task dependency
graph, spawns specialist agents in dependency order, verifies each deliverable on disk,
and produces a completion summary. The orchestrator coordinates — it does not implement.

## When to Use

**Invoke `/forge` when:**

- A body of work spans multiple interdependent tasks too large for a single agent session.
- The work has a natural dependency graph (Task B cannot start until Task A delivers a specific file).
- Parallel execution of independent tracks is desirable (e.g. MEMORY-FORGE ran 12 agents concurrently).
- You need compaction-safe progress tracking across multiple sessions (the forge writes `forge-progress.yaml`).
- The work scope is already captured in a registered FORGE prompt under `prompts/`.

**Do NOT invoke `/forge` when:**

- The task fits in a single agent session with no parallelism — use a direct task prompt instead.
- The forge name is not in the registration table (see `## Available Forges` below and `.claude/rules/forge-execution.md`).
- You are mid-forge: resume the existing run by re-reading `forge-progress.yaml` rather than re-invoking `/forge`.
- You want to author a NEW forge — use `prompts/templates/FORGE-TEMPLATE.md` as your starting point.

## Core Workflow

When the user runs `/forge {NAME}`:

1. **Validate the forge name** — look up `{NAME}` in `.claude/rules/forge-execution.md` (the
   registration table). Reject unknown names immediately with a list of valid names.

2. **Locate the master forge prompt** — at `prompts/{name.lower()}/{NAME}-FORGE.md` (check
   the exact `prompts/...` path in the registration row). Read it fully before proceeding.

3. **Check for an existing run** — look for `.work/{forge-id}-*` directories; if
   `forge-progress.yaml` exists, load it and resume from the last completed phase rather
   than restarting.

4. **Check prerequisites** — read the forge's `<context>` and `<critical_reminders>`;
   surface any blocking conditions (missing PAT, prerequisite Stories not on `origin/main`,
   locked work-dir) before spawning a single agent.

5. **Create the workspace** — `mle work <WI-ID>` (or verify one already exists for this run).
   All agents operate inside the workspace. Never work in the main clone.

6. **Execute orchestration**:

   ```bash
   # Establish the team
   TeamCreate <forge-name>-orchestrator

   # Declare tasks with dependency graph
   TaskCreate <task-id> blocked_by=[]           # no dependencies
   TaskCreate <task-id> blocked_by=[<prior-id>] # depends on prior output

   # Spawn agents respecting the graph; parallelise where permitted
   # Spawn Task 1
   # (wait for Task 1 deliverable on disk before spawning Task 2)
   # Spawn Tasks 3 and 4 in parallel (independent)
   ```

7. **Verify outputs on disk after every agent completes**:

   ```bash
   # Never accept "task complete" status alone — verify the deliverable file exists
   git show origin/main:<expected-file>   # for merged tasks
   ls <workspace>/<expected-file>          # for in-progress tasks
   ```

8. **Monitor and retry** — read agent return values and `forge-progress.yaml`; respect the
   per-task retry budget (default: max 2). After two failures, escalate by filing an
   Impediment work item linked as `blocks`, mark the task `escalated`, and advance.

9. **Report completion** — summary of deliverables produced, escalations filed,
   follow-up work item references.

## Available Forges

The canonical index is `prompts/CLAUDE.md`. The registration table in `.claude/rules/forge-execution.md` mirrors it.

| Forge                    | Tasks    | Purpose                                                                                                                                                                                                                                           |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TOKEN                    | 14       | Token usage tracking and cost attribution                                                                                                                                                                                                         |
| WORKSPACE                | 34       | Workspace Strategy Engine — git worktree support with intelligent clone/worktree selection                                                                                                                                                        |
| QUINTGOV                 | 12       | QuintGov formal verification integration — detection, HUD, watcher, CLI, ADO                                                                                                                                                                      |
| QUINTGOV-WIKI            | 10       | Comprehensive QuintGov wiki — governance, formal verification, regulatory mappings, patterns                                                                                                                                                      |
| REVIEW-TOOLING           | 22       | Review infrastructure — skills, seeds, rubrics for code review methodology                                                                                                                                                                        |
| ERROR-HANDLING-AUDIT     | 23       | Error handling fixes — broad exception narrowing, subprocess protection, shell=True audit                                                                                                                                                         |
| WATCHER-HARDENING        | 19       | Watcher daemon hardening — plugin isolation, signal handling, atomic writes                                                                                                                                                                       |
| CONFIG-OBSERVABILITY     | 19       | Centralised config + structured logging with correlation IDs                                                                                                                                                                                      |
| CLI-ARCHITECTURE         | 25       | CLI decomposition — split 7.5K-line cli.py into package                                                                                                                                                                                           |
| CORE-REFACTORING         | 23       | Core module decomposition + type hints + test coverage gaps                                                                                                                                                                                       |
| FUNCTIONAL-TEST          | 11       | CLI functional testing — smoke, contract, integration, snapshot                                                                                                                                                                                   |
| TRAINING                 | 17       | End-to-end training system — 76 exercises across L1–L5, automated verification, training agent                                                                                                                                                    |
| BUG-TRIAGE               | 21       | Systematic functional test of every MLE command, bug filing, fix forge generation                                                                                                                                                                 |
| BUG-TRIAGE-VERIFY        | 21       | Verification-mode re-run of BUG-TRIAGE: confirm fixes, refute false fixed-claims, open only genuinely new bugs                                                                                                                                    |
| BUG-FIX                  | 13       | Fix 24 bugs (7 MLE CLI + 17 training exercises) found by BUG-TRIAGE, targeting 90% pass rate                                                                                                                                                      |
| BUG-FIX-V2               | 10       | V2 — fix 32 bugs surfaced by BUG-TRIAGE-VERIFY                                                                                                                                                                                                    |
| COST                     | 21       | Cost calculation validation & HUD redesign — plan-aware display, cross-check against Claude Code's authoritative `lastCost`, current model coverage                                                                                               |
| MEMORY                   | 63       | Memory & Knowledge Subsystem (Epic #2022) — embedded Postgres + pgvector + pg_trgm + Apache AGE; Cognee 6-stage knowledge graph; hybrid RRF retrieval; ACON compression; Memify + Auto-Dream refresh; Ed25519-signed federation                   |
| PROCESS-STANDARDISATION  | 6 phases | Standardise all `project-troy` ADO projects on the Agile process template (Epic #2269)                                                                                                                                                            |
| MLE-BUG-CONVERGENCE      | 9 phases | Active-bug-queue convergence loop — drains the active Bug + User Story + PBI queue across configured ADO projects; Verifier embodies D12 contract (snapshot fingerprint + threshold env-pin + queue-wide regression scan + 3-mutation escalation) |
| AGENT-PLATFORM           | 7 phases | MLE Local Agent Platform (Epic #2511) — replaces the 21-plugin watcher daemon with single user-scoped `agentd`; Phases 0-6 strangler-fig migration; two-tier sandbox; SQLite agent_platform DB; ADR-029 binding migration plan                    |
| MLE-MANIFESTO-ANALYSIS   | 21       | Stage 1 of the Manifesto Alignment programme — produces `docs/manifesto-alignment/` doctrine area. Documentation only. Per-Task PRs; rubric self-score ≥ 4.0                                                                                      |
| MLE-MANIFESTO-COMPLIANCE | 39       | Stage 3a — closes Review-06 Gaps 1–8 (Epic #2702; Features #2703–#2710). F-COMP-1 through F-COMP-8. Per-Story PRs; default `MAX_PARALLEL_STORIES = 1`. T06 roadmap is the semantic source                                                         |
| MLE-REGULATED-USE        | 17       | Stage 3b — deployer-facing regulated overlay (Features #2711–#2713). Default-permissive; F-COMP-6 hard prerequisite; T05 + T06 §2.9–§2.11 are the semantic source                                                                                 |
| MLE-MANIFESTO-REASSESS   | 5        | Focused re-score mini-forge — re-walks Stage 1 doctrine against post-Stage-3 HEAD. Documentation only. T0 → T2/T3/T4 (parallel) → T8                                                                                                              |

## Workspace Protocol — MANDATORY

Every forge MUST execute within an isolated MLE workspace:

1. `mle work <WI-ID>` — create the workspace (clone or worktree per Strategy Engine).
2. `cd` into the workspace — all agents execute from there.
3. `mle sync` for commits — not raw git.
4. `mle pr create` for pull requests — not raw `az repos pr create`.
5. `mle complete` after merge — cleans up the workspace.

The orchestrator does NOT do implementation work itself — it coordinates agents who do.

## Common Rationalisations

| The orchestrator thinks...                                    | Actually...                                                                                                                                                  | Gate                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| "Task status says complete — I don't need to verify on disk." | Agent status is unreliable. A task is only done when the deliverable file exists at the expected path with the expected shape.                               | verify-on-disk:deliverable-exists |
| "Auto-complete was set — the PR must be merged by now."       | Auto-complete fires only when CI passes AND approvals are met. `status: active` means it has not merged yet. Check `lastMergeCommit.commitId` explicitly.    | merge-check:pr-completed          |
| "The agent reported its SHA — that must be the merge SHA."    | Agents may report their last source-branch commit SHA, not the merge SHA. Always verify via `az repos pr show --id <id> --query 'lastMergeCommit.commitId'`. | merge-check:pr-completed          |
| "I'll handle the WI link at the end."                         | `az repos pr update --status completed` rejects completion without a linked work item. Link the WI before completing.                                        | branch-policy:wi-link-required    |
| "This task's score is 3.99 — close enough to pass."           | The validator threshold is 4.0 and rejects below it. Fix the skill or prompt before closing the task.                                                        | skill-validator:rubric-threshold  |
| "I spawned 12 agents — I can keep all panes open."            | Tmux pane budget is ~10–13. Sending a `shutdown_request` after each merge is mandatory. Exceeding the budget causes `Agent()` calls to fail silently.        | agent-platform:pane-budget        |

## Retry Budget

Default per-task retry max: **2**. After two failed attempts on the same task, escalate:
file an Impediment work item linked as `blocks`, mark the task `escalated`, advance to the
next independent task. Never burn the retry budget on the same root cause without a code fix.

## Compaction Survival

Every forge writes runtime state to:

- `.work/{forge-id}-task-{N}/progress.yaml` — per task
- `.work/{forge-id}-forge/forge-progress.yaml` — orchestrator level

If the session is compacted mid-run, restart by re-reading those files and resuming from the
last completed phase. Do not re-invoke `/forge` — that starts a fresh run with a new run-id.

## See Also

- `.claude/rules/forge-execution.md` — full registration table, dependency graphs, orchestration discipline (10 lessons from MEMORY-FORGE).
- `prompts/CLAUDE.md` — canonical forge index.
- `prompts/templates/FORGE-TEMPLATE.md` — authoring template for new forges (the 7 mandatory XML sections).
- `rubrics/prompt-engineering-rubric.md` — quality bar every forge prompt is scored against.
- `docs/forge-authoring/` — human-readable guide to authoring and executing forges.
