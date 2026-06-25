---
name: mle-auton
description: Inspect and run the Auton autonomic loop. Use when the user asks to run a reflex, check an auton run's progress, list available reflexes, or interpret auton exit codes and artefacts.
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
allowed-tools:
  - Bash
  - Read
keywords:
  - 'auton'
  - 'autonomic loop'
  - 'reflex'
  - 'convergence run'
  - 'mle auton'
  - 'defect reflex'
intent_patterns:
  - "(run|launch|start)\\s+(the\\s+)?(auton|defect)\\s+(reflex|loop|run)"
  - "(auton|reflex)\\s+(status|progress|summary|state)"
---

# MLE Auton

Run, inspect, and manage Auton kernel reflexes — the productised autonomic convergence loop that supersedes `/forge MLE-BUG-CONVERGENCE` (ADR-045).

## When to Use

- When the user says "run the defect reflex" or "kick off an auton run"
- When the user asks "how is the auton run going?" or "did the run converge?"
- Before launching a run, to confirm the target reflex is registered (`mle auton list-reflexes`)
- After an `mle auton run` exits non-zero, to map the exit code onto the recover-or-investigate decision
- When operators audit a finished run's spend and iteration history from the `.work/auton/` artefacts

## Core Workflow

### Step 1 — Discover the registered reflexes

```bash
mle auton list-reflexes
```

Expected output: a table of conforming reflexes (the in-tree `defect` reflex at minimum) plus any incompatible entries with their failure reason. An empty registry prints `No reflexes registered.` and exits 0.

### Step 2 — Launch the run

```bash
mle auton run defect --max-iterations 25 --wall-clock-hours 8.0 --yes
```

Use `--dry-run` for a preview that makes no commits, PRs, ADO mutations, or new-bug filings. Without `--yes` the CLI prompts interactively; `--skill` mode requires an explicit `--yes`. The provider defaults to `anthropic` (override with `--provider stub` or `MLE_AUTON_PROVIDER`).

### Step 3 — Inspect progress and the terminal summary

```bash
mle auton status            # newest run; add a reflex name or --run-id to narrow
mle auton summary           # renders summary.md, or rebuilds it from the progress file
```

Both are read-only YAML readers — they never instantiate the engine or call a provider. Exit 0 when a run is found (or none exist); exit 2 only when an explicit `--run-id` matches nothing.

### Step 4 — Interpret the run's exit code

| Exit code | Meaning                                                         | Operator action                            |
| --------- | --------------------------------------------------------------- | ------------------------------------------ |
| 0         | CONVERGED                                                       | Done — read `summary.md`                   |
| 1         | ABORTED, recoverable (budget or queue drained)                  | Re-launch when ready                       |
| 2         | ABORTED, needs investigation (spiral, stuck cluster, exception) | Read the progress file before re-running   |
| 3         | Preflight failed                                                | Apply the printed remediation, then re-run |
| 4         | Invalid invocation (unknown reflex/provider, bad params)        | Fix the command line                       |

## The four `[auton]` gates (all default OFF)

Configured in `~/.mle/config.toml`; every gate defaults `false` per ADR-061 rule 2, so the shipped default run is byte-identical to the ungated behaviour.

| Gate             | When `true`                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `record_cost`    | Wraps the provider in a recording decorator so every dispatch lands cumulative Auton spend in the token DB (session key `auton-<run-id>`) — surfaces in `mle cost` |
| `recall_enabled` | Injects memory-backed priors into dispatch via the recaller seam, when the PostgreSQL cluster is healthy (graceful degradation otherwise)                          |
| `emit_outcome`   | Publishes each iteration's outcome event on the agentd bus topic `auton.outcome` (silent no-op when the daemon is absent)                                          |
| `auto_trigger`   | Enables event-driven auto-triggering of runs (the A7 seam)                                                                                                         |

## Run artefacts

Every run writes a run-id-suffixed work directory `.work/auton/<reflex>-<run-id>/` (run id is a UTC timestamp, `YYYY-MM-DDTHH-MM-SSZ`):

- `auton-progress.yaml` — the single source of cross-iteration truth: params snapshot, every transition, every iteration record (with `cost_usd`), and the terminal `run_record`. Written atomically; resumption reads it via `--resume-from-run <run-id>`.
- `summary.md` — the operator-facing terminal summary (re-buildable on demand by `mle auton summary`).

The same file feeds the read-only surfacing: the statusline HUD widget and `mle auton status`.

## Specific Techniques

| Situation                                        | Technique                                                                                                                                           | Reference                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Need to verify a third-party reflex before a run | `mle auton check <reflex>` walks the seven Protocol hooks and exits 0 (PASS) or 1 (FAIL); add `--strict` in CI                                      | `src/mle/core/auton/reflex.py`   |
| Run exits 2 and the cause is unclear             | Read the last entry of `transitions[]` in `.work/auton/<reflex>-<run-id>/auton-progress.yaml` — the engine records every guard firing with a reason | `src/mle/core/auton/progress.py` |
| Spend looks wrong or absent in `mle cost`        | Confirm `[auton] record_cost = true` was set BEFORE launch — the recording decorator wraps the provider at construction, never mid-run              | `docs/auton/getting-started.md`  |
| Operator wants a no-risk preview                 | `mle auton run <reflex> --dry-run --yes` exercises the loop without commits, PRs, or ADO mutations                                                  | `mle auton run --help`           |
| A run must be stopped cleanly                    | `mle auton abort --yes --reason "<why>"` records the abort in the progress file instead of killing the process blind                                | `mle auton abort --help`         |
| Resuming an interrupted run                      | Pass `--resume-from-run <run-id>` (and optionally `--resume-from <iteration>`) so state lands in the existing run directory                         | `src/mle/cli/auton_cmd.py`       |

## Common Rationalizations

| The agent thinks…                                                                   | Actually…                                                                                                                                                                                             | Gate                            |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| "The run exited 1, which is basically success — I'll report it as converged."       | Exit 1 is ABORTED-recoverable: the queue was only partly drained or a budget fired. Reporting it as converged hides unfinished signals; re-launch or surface the abort reason from the progress file. | `merge-check:pr-completed`      |
| "Preflight failed but the check looks cosmetic — I'll bypass it and launch anyway." | Preflight failures (exit 3) fail closed for a reason; each check prints a remediation. Bypass flags require explicit operator authorisation per command — apply the remediation instead.              | `wi-validator:rubric-threshold` |
| "The progress YAML is half-written, so I'll hand-edit it to unblock resumption."    | The file is written atomically by the engine; hand edits break the resumption contract and the fingerprint checks. Use `--resume-from-run` against the intact prior state, or start a fresh run.      | `wi-validator:rubric-threshold` |

## Red Flags

- An `mle auton run` invocation in a script without `--yes` — it will hang on the interactive confirmation prompt.
- `.work/auton/` contains a run directory with no `auton-progress.yaml` — the run died before INIT completed; investigate before resuming.
- Exit code 2 treated as retryable — spiral and stuck-cluster aborts repeat identically until the underlying cause is investigated.
- Spend reported as zero across many iterations with `record_cost = true` — the gate was read at construction time; confirm the config was set before launch.
- A reflex name typed at `run` that `list-reflexes` does not show — exit 4 follows; the reflex package is not installed or not registered.

## Verification

```bash
# The reflex registry resolves and includes the target reflex.
mle auton list-reflexes --skill | python3 -c "import json,sys; d=json.load(sys.stdin); print([r['name'] for r in d['data']['conforming']])"

# A finished run's status renders without engine instantiation; exit code is 0.
mle auton status; echo "exit=$?"

# The newest run directory carries the two canonical artefacts.
ls .work/auton/*/auton-progress.yaml .work/auton/*/summary.md 2>/dev/null

# Structured terminal envelope carries the contractual exit code.
mle auton run defect --dry-run --yes --skill | python3 -m json.tool
```

Observable evidence:

- `mle auton list-reflexes` exits 0 and lists `defect` in the conforming table.
- `mle auton status` prints reflex, run id, terminal state, iteration table, and cumulative spend for the newest `.work/auton/<reflex>-<run-id>/` directory.
- `auton-progress.yaml` parses as YAML with top-level `run_id`, `reflex_name`, `transitions`, `iterations`, and `terminal_state` keys.
- The `--skill` envelope's `data.exit_code` matches the process exit code (0–4 contract).
