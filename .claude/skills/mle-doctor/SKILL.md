---
name: mle-doctor
description: 'Health check all task workspaces and watcher daemon. Reports stale branches, unpushed commits, merged workspaces, stale remote branches, disk usage, and watcher status.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
allowed-tools:
  - Bash
  - Read
keywords:
  - 'doctor'
  - 'health check'
  - 'clone status'
  - 'task status'
  - 'mle doctor'
intent_patterns:
  - "(check|diagnose|scan)\\s+(the\\s+)?(clone|health|status)"
---

# MLE Doctor

Run a health check across all task workspaces and the watcher daemon on this machine.

## When to Use

- After resuming a session on an ephemeral VM, to detect unpushed commits before the workspace vanishes
- Before invoking `/mle-cleanup`, to enumerate merged workspaces and stale remote branches
- When `~/src/<repo>-clones/` accumulates more than three workspaces and the operator has lost track of state
- When CI agents are about to dispatch a new task and the orchestrator needs a workspace inventory
- When the watcher daemon stops emitting events or the statusline goes blank

## Workflow

1. **Execute**: `mle doctor`
2. **Interpret results**: Highlight workspaces needing attention
3. **Suggest actions**:
   - Merged workspaces: suggest `/mle-complete`
   - Stale workspaces (>7 days): suggest `/mle-sync` or `/mle-abandon`
   - Unpushed commits: suggest `/mle-sync` (critical on ephemeral VMs)
   - Stale remote branches: suggest deletion
4. **Report**: Summary table with Rich formatting

## Watcher Health Checks

After workspace checks, run watcher diagnostics to verify the background daemon is healthy.

### Watcher Diagnostics

| Check              | How                                      | Healthy                         | Unhealthy                         |
| ------------------ | ---------------------------------------- | ------------------------------- | --------------------------------- |
| Daemon running     | Check PID file and process               | Process alive, PID file current | PID file stale or process missing |
| Plugin load        | Parse watcher config, verify each plugin | All configured plugins loaded   | Missing or failed plugin          |
| Database size      | Check `~/.mle/watcher.db` size           | < 100 MB                        | > 100 MB (suggest vacuum)         |
| Database integrity | SQLite integrity_check                   | `ok` result                     | Corruption detected               |
| Event backlog      | Count unprocessed events                 | < 1000                          | > 1000 (suggest flush)            |
| Config validity    | Parse `~/.mle/watcher.toml`              | Valid TOML, known keys          | Parse error or unknown keys       |

### Suggested Actions

- **Stale PID file**: suggest `mle watcher restart`
- **Failed plugin**: suggest checking plugin configuration in `~/.mle/watcher.toml`
- **Large database** (> 100 MB): suggest `mle watcher vacuum`
- **Config error**: suggest `mle watcher config --validate`

### How to Run Watcher Checks

```bash
# Full doctor including watcher checks
mle doctor

# Watcher checks only
mle doctor --watcher

# Verbose watcher output (shows per-plugin status and DB table sizes)
mle doctor --watcher --verbose
```

## Specific Techniques

| Situation                                                                                 | Technique                                                                                                                                                                                     | Reference                               |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- | -------------------------- |
| Workspaces in `~/src/<repo>-clones/` outnumber the operator's mental model                | Run `mle doctor --json                                                                                                                                                                        | jq '.workspaces                         | length'`and compare against`ls ~/src/<repo>-clones/ | wc -l`; any mismatch points to an unregistered workspace | `core/doctor.py::doctor()` |
| Doctor reports a merged PR but the workspace persists                                     | Cross-check `az repos pr show --id <PR_ID> --query 'status'` against the workspace's `.mle-metadata.json::pr_id`; a real merge produces `status: completed` and a populated `lastMergeCommit` | `forge-execution.md` discipline #1      |
| Stale-branch count differs between runs without a `mle complete`/`mle abandon` invocation | Diff `mle doctor --json` outputs across the two timestamps; investigate the workspace whose `branch_status` changed                                                                           | `core/workspace.py`                     |
| Disk usage report omits one workspace                                                     | The workspace lacks `.mle-metadata.json`; either it was created outside `mle work` or the metadata file was deleted — repair with `mle adopt <path>`                                          | `core/metadata.py`                      |
| Watcher daemon stops emitting events                                                      | `mle doctor --watcher --verbose` inspects PID file, plugin load, and DB integrity without restarting the daemon                                                                               | `core/doctor.py` and `watcher/plugins/` |
| Doctor takes longer than 10 seconds on a machine with many workspaces                     | Invoke `mle doctor --workspace <name>` to target a single workspace; full-fleet runs walk every `.mle-metadata.json`                                                                          | `cli/doctor_cmd.py`                     |

## Common Rationalizations

| The agent thinks…                                                                 | Actually…                                                                                                                                                                                                                                            | Gate                           | Corpus                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------ |
| "Doctor reported PASS so the workspace is safe to delete with `rm -rf`"           | PASS in doctor means the inventory is consistent; it does not authorise destructive cleanup. Use `mle complete` (requires merged PR) or `mle abandon` (records the decision in ADO) so the lifecycle trail remains intact.                           | merge-check:pr-completed       | mle-doctor-rationalisation-001 |
| "Unpushed commits can wait because the machine is persistent"                     | Persistent-vs-ephemeral status is invisible to doctor; the next reboot or `tmpfs` mount eviction destroys the workspace. Push every unpushed commit before the session ends — the merge-check gate refuses completion without a pushed branch.       | merge-check:pr-completed       | mle-doctor-rationalisation-002 |
| "Doctor is read-only so I can run it from inside a workspace to inspect siblings" | Running from inside a workspace risks pwd-relative path inference on tooling layered above doctor (for example `mle cleanup`, `mle complete`). Invoke from the home repo or an unrelated directory so the workspace under inspection is not the cwd. | branch-policy:wi-link-required | mle-doctor-rationalisation-003 |

## Red Flags

- Doctor returns PASS but `git fsck --no-reflogs --full --unreachable` reports dangling refs in a workspace's `.git/`
- Output filtered or truncated mid-run with `| head` or `| less +q` — coverage gaps go undetected on long fleets
- Stale-branch count drops between two consecutive `mle doctor` runs without an intervening `mle complete` or `mle abandon` call
- `disk_mb` field missing for at least one workspace in `mle doctor --json` output (indicates a workspace whose `.git/objects` cannot be stat'd)
- Watcher PID file present but `kill -0 <pid>` reports `No such process` — the daemon crashed without removing its PID file

## Verification

```bash
# Doctor produces structured JSON with one entry per workspace and a watcher block.
mle doctor --skill > /tmp/doctor-out.json
python3 -c "import json,sys; d=json.load(open('/tmp/doctor-out.json')); assert d.get('workspaces') is not None; print(len(d['workspaces']),'workspaces')"

# Each workspace entry exposes branch_status, ahead, behind, disk_mb.
python3 -c "import json; ws=json.load(open('/tmp/doctor-out.json'))['workspaces']; [print(w['name'], w.get('branch_status'), w.get('ahead'), w.get('behind'), w.get('disk_mb')) for w in ws]"

# Watcher block parses cleanly; pid_alive matches process state.
mle doctor --watcher --json | python3 -c "import json,sys; d=json.load(sys.stdin); print('pid_alive=', d.get('watcher',{}).get('pid_alive'))"
```

Observable evidence:

- Every workspace shown by `ls ~/src/<repo>-clones/` appears in `mle doctor --json` output with a populated `branch_status` field
- Workspaces with `merged: true` correspond to PRs whose `az repos pr show` reports `status: completed`
- Watcher block reports `pid_alive: true` when `kill -0 $(cat ~/.mle/watcher.pid)` exits 0, and `pid_alive: false` otherwise
- Exit code is 0 for read-only inspection regardless of workspace health

## Rules

- **Read-only** — doctor never modifies any workspace or watcher state
- Use `--verbose` for per-workspace 12-point verification
- Use `--json` for machine-readable output
- Detects stale remote branches (merged but still on origin)
- **Watcher checks are non-blocking** — a failed daemon does not prevent workspace checks from completing
- Watcher checks inspect `~/.mle/watcher.pid`, `~/.mle/watcher.db`, and `~/.mle/watcher.toml` directly; they do not require a running daemon
