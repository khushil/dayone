# Code Standards

**Path scope**: `src/**/*.py`

## Language and Runtime

- Python 3.12+ — use modern syntax: `match`, `X | Y` unions, f-strings
- Ruff enforced: line-length 100, rules E/F/I/N/W/UP (per pyproject.toml)
- Type hints on all public functions
- British English in user-facing text

## Architecture Boundaries

| Package               | Responsibility                                   | Allowed Imports                                         |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `src/mle/core/`       | Pure business logic                              | Standard library only — NO Click, Rich, or azure-devops |
| `src/mle/ado/`        | Azure DevOps REST API integration                | azure-devops SDK, core/                                 |
| `src/mle/cli.py`      | Click CLI entry point                            | Click, Rich, core/, ado/                                |
| `src/mle/skill/`      | Structured JSON output for Claude Code `--skill` | core/                                                   |
| `src/mle/statusline/` | MLE Hud statusline for Claude Code               | Standard library, core/                                 |
| `src/mle/watcher/`    | Background watcher daemon and plugins            | core/, ado/                                             |

**Core isolation is mandatory** — `core/` modules must remain framework-free so they can be tested without UI or network dependencies.

## DON'Ts

- Don't hardcode ADO org/project — read from `~/.mle/config.toml` or git remote
- Don't store PATs in plain text files (use keyring, fall back to env var)
- Don't modify the user's CLAUDE.md in `mle init` (human-curated)
- Don't suppress git errors silently — always report failures clearly
- Don't import Click or Rich in `core/` modules

## See Also

- `goal-structure.md` — per-step verification discipline for non-trivial changes
