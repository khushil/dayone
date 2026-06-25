---
name: mle-cleanup
description: 'Orchestrated cleanup: doctor + complete merged workspaces + prune stale remote branches.'
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
keywords:
  - 'cleanup'
  - 'clean up everything'
  - 'prune'
  - 'housekeeping'
  - 'mle cleanup'
intent_patterns:
  - "(clean up|prune|housekeep)\\s+(all|everything|clones|branches)"
---

# MLE Cleanup

Batch housekeeping for MLE-managed workspaces and stale remote
branches. The `mle cleanup` command groups every workspace under
`~/src/<repo>-clones/` into three buckets (`complete` / `abandon` /
`skip`), then — under `--yes` — invokes `mle complete` or `mle abandon`
per workspace so the lifecycle audit trail is preserved. A sibling
`--prune` surface deletes stale remote branches on `origin`.

All destructive operations are gated by the **nine-layer trust
framework** documented in [ADR-055](../../../../docs/adr/ADR-055-cleanup-trust-framework.md).

## When to Use

- After a forge or batch operation lands multiple PRs and `~/src/<repo>-clones/` carries several merged workspaces
- Before starting a long-running task that needs disk headroom; cleanup typically frees 2-8 GB on a fleet of 10 workspaces
- When `git ls-remote origin 'refs/heads/feature/*' | wc -l` reports significantly more branches than `mle doctor` shows local workspaces
- Weekly housekeeping cadence on a developer machine that runs `mle work` daily
- Before backing up `~/src/` to verify the snapshot is not bloated with merged workspaces

## Workflow

1. **Preview** — Run `mle cleanup` (bare invocation; equivalent to `mle cleanup --dry-run`). Reads every workspace, classifies each into `complete` / `abandon` / `skip`, renders three Rich tables. ZERO mutations.
2. **Review** — Inspect the candidate list. Verify the `complete` bucket is what you expect; verify `skip` reasons explain why each skipped workspace is preserved.
3. **Execute** — Run `mle cleanup --yes` to destroy the `complete` and `abandon` candidates. The CLI pauses 3 seconds with a kill-window banner before the first destructive op; Ctrl+C aborts cleanly.
4. **Prune (optional)** — Run `mle cleanup --prune` to preview stale remote branches on `origin`; `mle cleanup --prune --yes` deletes them.
5. **Audit** — Review `~/.mle/cleanup-audit.log` for per-invocation JSONL records (timestamp, candidates, actions, bypasses).

## Specific Techniques

| Situation                                                      | Technique                                                                                                                                                                                                                                                                                      | Reference                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Operator unsure what cleanup will touch                        | Run `mle cleanup` (bare invocation) or `mle cleanup --dry-run`; the output lists each candidate with its rationale. No destruction; the two forms are equivalent per Story #3438 AC #3.                                                                                                        | `cli/cleanup_cmd.py::cleanup()`             |
| Pipe-to-bash workflow preferred over `mle cleanup`             | `mle doctor --suggest-cleanup` emits one `mle complete` or `mle abandon` line per candidate; pipe to `bash` to execute them per-workspace under each command's own lifecycle gates.                                                                                                            | `cli/doctor.py::_emit_suggest_cleanup()`    |
| Remote branches outnumber local workspaces by a large margin   | Preview with `mle cleanup --prune`; delete with `mle cleanup --prune --yes`. Layer 8 reversibility weighting requires both flags together; `--prune` alone is preview-only and `--yes` alone does not trigger remote-branch deletion.                                                          | `cli/cleanup_cmd.py::_execute_prune()`      |
| Cleanup reports a workspace as skipped with `pr_not_completed` | Cleanup re-queries ADO at execution time per Layer 2 (the doctor snapshot may lag); if the PR was reverted, the workspace is correctly preserved. Re-run `mle doctor --verbose` to inspect the current PR state.                                                                               | `core/cleanup.py::filter_for_destruction()` |
| ADO comment trail must be preserved across cleanup             | `mle complete` (called internally by `mle cleanup --yes`) posts an `**MLE**:`-prefixed audit comment to the linked WI BEFORE removing the workspace. Layer 6 of the trust framework: comment-post failure aborts cleanup of THAT candidate, not the whole run. Never bypass with raw `rm -rf`. | ADR-055 §L6                                 |
| Workspace has uncommitted changes the operator considers safe  | The default L2 filter skips uncommitted candidates with `skip_reason="uncommitted_changes"`. The audited bypass is `mle cleanup --yes --include-uncommitted`; it emits a loud stderr banner and records the bypass in `~/.mle/cleanup-audit.log`. NO `--force` flag exists.                    | ADR-055 §L2                                 |
| Operator wants to skip the 3-second pause for CI usage         | `mle cleanup --yes --skip-pause` bypasses the kill window. The bypass is loud (stderr banner) and recorded in the audit log. Layer 3 itself remains in force on every other run.                                                                                                               | ADR-055 §L3                                 |
| Stale workspaces are old but not merged                        | Cleanup classifies these as `abandon` candidates (per F.S0 `STALE_CLONE_THRESHOLD`); `mle cleanup --yes` invokes `mle abandon` rather than `mle complete` for them. The audit comment records `state: abandoned` rather than `state: completed`.                                               | `core/workspace_enumeration.py`             |

## Common Rationalisations

| The agent thinks…                                                                 | Actually…                                                                                                                                                                                                                                                                                                                                                                                            | Gate                           | Corpus                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------- |
| "I'll skip the dry-run because doctor already showed me the merged list"          | Doctor's snapshot can lag the actual PR status; cleanup's own Layer 2 filter re-queries ADO at execution time and may surface a workspace whose merge was reverted between the doctor run and the cleanup. The preview is the operator's review gate before destruction.                                                                                                                             | merge-check:pr-completed       | mle-cleanup-rationalisation-001 |
| "I'll add `--force` to bypass the trust framework — the PRs are obviously merged" | NO `--force` flag exists per the bypass-flag discipline. Per-purpose bypass flags (`--skip-pause`, `--include-uncommitted`) name the specific defence; both are loud (stderr banner + audit-log entry). A blanket `--force` would conflate nine independent layers into one toggle and defeat the trust framework's whole point.                                                                     | wi-validator:rubric-threshold  | mle-cleanup-rationalisation-002 |
| "Remote branches are cheap; I can skip `--prune` and let them accumulate"         | The ADO project hits its branch-count policy ceiling within a few months at typical orchestrator cadence; stale branches also slow `git fetch` on large repos. Prune cadence is operator-chosen, but skipping `--prune` entirely defers the cleanup rather than removing it. Layer 8 keeps `--prune` gated stricter than local cleanup; both `--prune` and `--yes` must be present for any deletion. | branch-policy:wi-link-required | mle-cleanup-rationalisation-003 |

## Red Flags

- Cleanup invoked with `--yes` before any preview — destructive operations across the whole fleet should never be blind; always preview first
- A workspace appears in the `complete` bucket that the operator does not recognise — indicates either a stale `.mle-metadata.json::pr_status` (re-query with `mle doctor --verbose`) or a regression in the Layer 2 five-AND filter
- `--prune` flag passed but `git ls-remote origin 'refs/heads/feature/*' | wc -l` does not decrease after `--prune --yes` runs — check `~/.mle/cleanup-audit.log` for per-branch errors
- Cleanup reports success but `mle doctor` afterwards still shows the supposedly cleaned workspaces — silent failure in the inner `mle complete` call (Layer 7 audit log should record the failure per-workspace)
- Cleanup invoked from inside a candidate workspace's directory tree — Layer 4 CWD-guard refuses, exits 2 with `skip_reason="cwd_within_workspace"`. Operator must `cd` elsewhere first
- `~/.mle/cleanup.lock` held by a stale process — Layer 5 breaks locks older than 24 hours; sub-24h holds indicate genuine concurrent cleanup

## Verification

```bash
# Preview the candidate list before any destructive action.
mle cleanup --dry-run --skill > /tmp/cleanup-preview.json
python3 -c "import json; d=json.load(open('/tmp/cleanup-preview.json')); plan=d['data']['plan']; print(len(plan['complete'])+len(plan['abandon'])+len(plan['skip']),'candidates')"

# Run cleanup and capture before/after workspace counts.
before=$(mle doctor --json | python3 -c "import json,sys; print(len(json.load(sys.stdin)['workspaces']))")
mle cleanup --yes
after=$(mle doctor --json | python3 -c "import json,sys; print(len(json.load(sys.stdin)['workspaces']))")
echo "before=$before after=$after"

# Preview then prune stale remote branches.
mle cleanup --prune
mle cleanup --prune --yes

# Verify the audit log captured the run.
tail -1 ~/.mle/cleanup-audit.log | python3 -m json.tool
```

Observable evidence:

- `mle doctor` workspace count decreases by exactly the number of candidates approved during cleanup
- Each cleaned workspace's directory under `~/src/<repo>-clones/` no longer exists (`ls -d ~/src/<repo>-clones/<workspace> 2>&1 | grep -q "No such"`)
- `git ls-remote origin | wc -l` decreases by the prune count reported in cleanup's summary (after `--prune --yes`)
- Each cleaned workspace's linked ADO WI has a fresh `**MLE**:`-prefixed comment posted BEFORE the workspace removal (Layer 6)
- `~/.mle/cleanup-audit.log` carries one JSONL record per invocation, including bypass flags, candidate list, action outcomes, and final summary counts

## Rules

- Preview-by-default — bare `mle cleanup` is preview-only; `--yes` required for destruction (Layer 1)
- NO `--force` flag exists — per-purpose bypass flags only (`--skip-pause`, `--include-uncommitted`, `--prune`); each is loud and audited
- Conservative five-AND candidate filter (Layer 2) — merged AND PR-completed AND merge-SHA-reachable AND no force-push divergence AND zero uncommitted changes (with linked WI Closed)
- 3-second pause before destruction (Layer 3) with Ctrl+C kill window; bypass via `--skip-pause` is stderr-loud and audited
- Refuses to clean the operator's CWD or any ancestor (Layer 4 CWD-guard)
- Single `~/.mle/cleanup.lock` flock-held across the run; shared between local-workspace and `--prune` paths (Layer 5)
- ADO `**MLE**:`-prefixed audit comment posted BEFORE workspace removal (Layer 6); comment-post failure skips THAT candidate, not the whole run
- Append-only `~/.mle/cleanup-audit.log` per invocation (Layer 7); review with `cat` or `jq`
- Remote-branch deletion (`--prune --yes`) gated stricter than local cleanup (Layer 8) — both flags required together
- Every skipped candidate carries a structured `skip_reason` from the closed vocabulary (Layer 9); no silent drops
