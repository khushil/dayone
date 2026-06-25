# Forge Execution

**Path scope**: `prompts/**`

## Available Forges

| Forge | Tasks | Prompt                         | Purpose                                   |
| ----- | ----- | ------------------------------ | ----------------------------------------- |
| TOKEN | 14    | `prompts/token/TOKEN-FORGE.md` | Token usage tracking and cost attribution |

## Execution Pattern

Each forge is a multi-agent orchestrator that:

1. Creates a Claude Code agent team
2. Defines a task dependency graph
3. Spawns specialist agents to execute task prompts
4. Monitors progress and handles failures (max 2 retries)
5. Verifies outputs on disk before declaring success

## How to Run

Invoke via `/forge TOKEN` or read the forge prompt directly at `prompts/token/TOKEN-FORGE.md`.

## Forge Rules

- The orchestrator does NOT implement work — it coordinates agents
- Agents read their prompt files from disk
- Progress survives context compaction via `.work/` directories
- All outputs are verified on disk, not just by task status

## Epistemic Inheritance

Forges may opt into the sustained-interrogation discipline (per the Feature shipping ADR-050) by declaring `sustained_interrogation_required = true` in their `<parameters>` block. Forges that opt in inherit a PHASE 0 audit step from the canonical forge template, which invokes `mle interrogate plan` at orchestration time and emits the `sustained-interrogation:findings-exist` event in WARN mode.

The audit step writes the 8-step findings template to `.work/sustained-interrogation/<run-id>/findings.md`. The agent fills it in; the gate reads the populated file at later checkpoints.

Operators suppress the discipline for a session via `SUSTAINED_INTERROGATION_OPT_OUT=1` (env-var, never `--force`).
