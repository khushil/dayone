---
name: mle-troubleshoot
description: 'Diagnose common MLE errors and provide resolution steps.'
type: rigid
archetype: reference
priority: high
maturity: L2
allowed-tools:
  - Bash
  - Read
  - Grep
keywords:
  - 'error'
  - 'failed'
  - 'not working'
  - 'broken'
  - 'troubleshoot'
  - 'fix'
  - 'debug'
  - 'mle troubleshoot'
intent_patterns:
  - "(fix|debug|troubleshoot|diagnose)\\s+(this|the|my)\\s+"
  - "(not|isn't|doesn't)\\s+(working|running|starting)"
  - "(error|failure|exception)\\s+(in|with|from)"
---

# MLE Troubleshoot

Diagnose MLE errors and guide the user through resolution.

## When to Use

Invoke this skill when the user reports an error, something is not working,
or they need help debugging any MLE command or feature.

## Instructions

1. **Identify the error** — match the reported message or symptom to the table below.
2. **Run diagnostics** — execute the diagnostic sequence relevant to the error category.
3. **Apply the resolution** — follow the fix steps in order.
4. **Verify** — confirm the error is resolved before closing the conversation.

## Error → Resolution Map

| Error / Symptom                             | Category       | Resolution                                                                             |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| "No PAT configured"                         | Auth           | `mle auth login` or set `AZURE_DEVOPS_PAT` env var                                     |
| "Work item ID required for traceability"    | Lifecycle      | Use `mle work <ID>` or pass `--force` for experiments                                  |
| "Work item not found"                       | Auth/Config    | `mle auth status`; verify project in `~/.mle/auth/config.toml`                         |
| "TF401019: Git repository does not exist"   | Auth/Config    | Check `git remote get-url origin`; override project in config                          |
| "PR not merged yet" (`mle complete`)        | Lifecycle      | Wait for ADO merge, then retry; use `--force` or `mle abandon` to bypass               |
| "Workspace not found"                       | Workspace      | Run from inside a task workspace directory; or pass workspace name explicitly          |
| Push rejected (non-fast-forward)            | Git            | `git pull --rebase` then `mle sync`; or `mle sync --force`                             |
| "Nothing to commit" (`mle sync`)            | Git            | No changes exist; check `git status` first                                             |
| Watcher not starting (stale PID)            | Watcher        | `mle watcher stop && mle watcher start`                                                |
| Watcher not processing events               | Watcher        | Check `~/.mle/watcher.toml` `disabled_plugins`; use `mle watcher trigger <plugin>`     |
| Watcher high CPU                            | Watcher        | Increase `transcript_poll_interval` in `~/.mle/watcher.toml`                           |
| `mle cost` shows no data                    | Token Tracking | Start watcher: `mle watcher start`; backfill: `mle cost backfill`                      |
| Security scan finds nothing                 | Security       | `mle security tools` to check installed scanners; `pip install bandit semgrep`         |
| "Seedbed not found"                         | Seeds          | Clone seed-bed to `~/src/escalus-seed-bed/` or set `seedbed` in config                 |
| `mle init` — "MLE data directory not found" | Installation   | `pipx reinstall mle` or `pip install -e .`                                             |
| `mle verify` phase gate failure             | Lifecycle      | Use `--force` for soft-mandatory (L3-L4); fix underlying check for hard-mandatory (L5) |

## Diagnostic Command Sequence

Run these in order to gather context before applying a fix:

```bash
# Step 1 — Overall health check
mle doctor

# Step 2 — Auth and ADO connectivity
mle auth status

# Step 3 — Workspace verification (12-point check)
mle verify --verbose

# Step 4 — Git state
git status
git log --oneline -5

# Step 5 — Watcher status (if watcher-related)
mle watcher status
```

## Wiki Troubleshooting Links

| Page                      | URL                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Common Issues             | `https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki/MLE-CLI/Troubleshooting/Common-Issues` |
| Installation              | `https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki/MLE-CLI/Troubleshooting/Installation`  |
| Workspace Troubleshooting | `https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki/MLE-CLI/Workspace/Troubleshooting`     |
| Watcher Troubleshooting   | `https://dev.azure.com/project-troy/ai-sdlc-tooling/_wiki/wikis/ai-sdlc-tooling.wiki/MLE-CLI/Watcher/Troubleshooting`       |
