---
name: mle-shell
description: 'Enter an isolated subshell for a task workspace with venv activation and modified prompt.'
type: rigid
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'mle shell'
  - 'isolated shell'
  - 'clone shell'
  - 'enter clone'
  - 'activate venv'
intent_patterns:
  - "(enter|open|start)\\s+(an?\\s+)?(isolated\\s+)?(shell|environment)"
---

# MLE Shell

Enter an isolated subshell for a task workspace.

## Workflow

1. **Execute**: `mle shell [<dirname>]` (defaults to current directory)
2. **Environment**: Sets MLE_CLONE, MLE_BRANCH, MLE_HOME env vars
3. **Venv**: Auto-activates Python venv if found (.venv, venv, env)
4. **Prompt**: Modified to show `[mle:<clone-name>] /path$`
5. **Exit**: Type `exit` to leave the subshell

## Rules

- Prevents shell state bleeding between workspaces
- Subshell has full access to the workspace filesystem
- Temporary rcfile self-cleans on shell exit
