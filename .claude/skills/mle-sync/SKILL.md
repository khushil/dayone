---
name: mle-sync
description: 'Commit and push work from current task workspace. Warns if no PR exists. Essential for ephemeral VMs.'
type: flexible
archetype: cli-wrapper-thin
priority: high
maturity: L2
allowed-tools:
  - Bash
keywords:
  - 'sync'
  - 'save work'
  - 'push'
  - 'commit and push'
  - 'mle sync'
intent_patterns:
  - "(sync|save|push|backup)\\s+(my\\s+)?(work|changes|task|clone)"
---

# MLE Sync

Commit and push changes from the current task workspace to the remote.

## Workflow

1. **Execute**: `mle sync [--message <msg>]`
2. **PR check**: If no PR exists for this branch, warn and offer to create one
3. **Report**: Show commit status, push result, unpushed remaining

## Rules

- Must be run from within a task workspace
- Warns if no PR exists for the branch (lifecycle enforcement)
- Use `--force` for `--force-with-lease` push (when branch diverged)
- Updates `.mle-metadata.json` lastSyncAt timestamp
- If commit fails (pre-commit hook), warns instead of silently proceeding
