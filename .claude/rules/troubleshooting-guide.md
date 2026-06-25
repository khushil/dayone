# Troubleshooting Guide

**Path scope**: `**`

## Diagnostic Commands

| Command                      | What it checks                                                           |
| ---------------------------- | ------------------------------------------------------------------------ |
| `mle doctor`                 | All workspaces: stale branches, unpushed commits, merged PRs, disk usage |
| `mle auth status`            | ADO authentication, configured organisation and project                  |
| `mle verify`                 | 12-point workspace health (git identity, hooks, remote, clean state)     |
| `mle verify --phase <phase>` | SDLC phase gate with maturity-scaled thresholds                          |
| `mle watcher status`         | Daemon PID, active plugins, last event timestamps                        |
| `mle strategy --explain`     | Factor-by-factor workspace strategy breakdown                            |
| `mle security tools`         | Which security scanners are installed and available                      |

## Common Errors

| Error                                    | Cause                          | Fix                                                           |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| "No PAT configured"                      | ADO token missing              | `mle auth login` or set `AZURE_DEVOPS_PAT` env var            |
| "Work item ID required for traceability" | `mle create` without work item | Use `mle work <ID>` or pass `--force`                         |
| "Work item not found"                    | Wrong ADO project              | Check with `mle auth status`, verify project config           |
| "PR not merged yet"                      | `mle complete` before PR merge | Wait for merge, or use `mle complete --force` / `mle abandon` |
| "Workspace not found"                    | Not inside a task workspace    | `cd` into the workspace or specify name explicitly            |
| "Push rejected (non-fast-forward)"       | Remote has newer commits       | `git pull --rebase` then `mle sync`                           |
| "Nothing to commit"                      | No staged or unstaged changes  | Make changes first; check with `git status`                   |
| "MLE data directory not found"           | Package installed incorrectly  | `pipx reinstall mle` or `pip install -e .`                    |

## Workspace Issues

- **Stale workspaces** — branches with no recent commits. Run `mle doctor` to identify, then `mle abandon --stale` to clean up.
- **Orphaned worktrees** — worktree directory removed without `git worktree remove`. Run `git worktree prune` from the home repository.
- **Unpushed commits** — `mle doctor` flags workspaces with local-only commits. Run `mle sync` to push.

## Pre-Commit Hook Failures

If `mle verify` reports hooks path issues:

```bash
bash scripts/setup-git-hooks.sh   # Configures core.hooksPath
pip install pre-commit             # If pre-commit binary missing
pre-commit install                 # Install hook scripts
```

## ADO Connectivity

- Verify authentication: `mle auth status`
- Token permissions required: Work Items (Read/Write), Code (Read/Write), Pull Requests (Read/Write)
- Project auto-detected from git remote URL; override in `~/.mle/auth/config.toml` if needed

## Phase Gate Failures

- **Advisory (L1-L2)**: failures are warnings only, never block
- **Soft-mandatory (L3-L4)**: failures block; override with `mle verify --phase <phase> --force`
- **Hard-mandatory (L5)**: failures always block, no override available
- Missing phase data (e.g., "No coverage data"): run the corresponding phase engine first (`mle design coverage`, `pytest --cov`, `mle trace matrix`)

## Watcher Issues

- **Stale PID file**: `mle watcher stop` then `mle watcher start`
- **High CPU**: increase `transcript_poll_interval` in `~/.mle/watcher.toml` (default 2.0s)
- **Disabled plugin**: check `disabled_plugins` in `~/.mle/watcher.toml`
- **Manual test**: `mle watcher trigger <plugin-name> --dry-run`
