# MLE Overview

**Path scope**: `**`

MLE (Machine Led Engineering) is a lifecycle-enforcing developer CLI with Azure DevOps integration. It scaffolds rules, skills, hooks, agents, and git hooks into projects, gated by maturity level.

## Maturity Levels

| Level | Name         | What it provides                                           | Auto-detected when            |
| ----- | ------------ | ---------------------------------------------------------- | ----------------------------- |
| L1    | Traditional  | Rules only                                                 | No tests or CI                |
| L2    | AI-Assisted  | + skills, git-policy, agent, hooks                         | Tests OR CI present           |
| L3    | AI-Augmented | + phase engines, BDD, security, ADRs, pre-commit (default) | Tests AND CI AND 50+ commits  |
| L4    | AI-Empowered | + forge templates, custom agents                           | `.claude/` with 3+ skills     |
| L5    | AI-Native    | + formal verification, QuintGov                            | `.quintgov/` directory exists |

## Workspace Lifecycle

Every task follows: **work** (create workspace linked to ADO work item) --> **sync** (commit and push) --> **PR** (create pull request) --> **complete** (clean up after merge).

## Top 10 Commands

| Command             | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `mle work <ID>`     | Start work on an ADO work item (end-to-end orchestration)   |
| `mle sync -m "msg"` | Commit, push, and optionally create PR                      |
| `mle pr create`     | Create a pull request with auto-generated description       |
| `mle complete`      | Clean up workspace after PR merge                           |
| `mle doctor`        | Health check all workspaces                                 |
| `mle verify`        | Run 12-point workspace check (add `--phase` for SDLC gates) |
| `mle abandon`       | Remove workspace without merge check                        |
| `mle strategy`      | Show Strategy Engine decision (add `--explain` for detail)  |
| `mle watcher start` | Start background daemon for token/time/event tracking       |
| `mle evolve`        | Detect maturity progression and propose upgrades            |

## Architecture

| Package       | Responsibility                                                  |
| ------------- | --------------------------------------------------------------- |
| `core/`       | Pure business logic (framework-free — no Click, Rich)           |
| `ado/`        | Azure DevOps REST API integration                               |
| `cli.py`      | Click CLI entry point                                           |
| `skill/`      | Structured JSON output for Claude Code `--skill` flag           |
| `statusline/` | MLE HUD statusline for Claude Code (up to 5 lines)              |
| `watcher/`    | Background daemon with plugins (token, time, capture, security) |

## Key Principles

- **Lifecycle enforcement by default** — every workspace links to a work item, every push checks for PR, every completion verifies merge
- **`--force` to bypass** — strict by default, escape hatch for experiments
- **ADO audit trail** — every operation adds a `**MLE**:` prefixed comment to the work item
- **`--skill` flag** — structured JSON output for Claude Code agent consumption
- **Core isolation** — `core/` modules have no framework imports, testable without UI or network

## What Gets Installed

| Artefact                 | Gating | Location                            |
| ------------------------ | ------ | ----------------------------------- |
| Rules (by path scope)    | L1+    | `.claude/rules/`                    |
| Skills (by intent)       | L2+    | `.claude/skills/`                   |
| Developer workflow agent | L2+    | `.claude/agents/`                   |
| Git hooks                | L2+    | `.githooks/`                        |
| Phase engine skills      | L3+    | `.claude/skills/`                   |
| Forge templates          | L4+    | `prompts/templates/`                |
| QuintGov scaffold        | L5     | `.quintgov/`, `specs/`, `patterns/` |
