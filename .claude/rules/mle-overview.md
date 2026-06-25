# MLE-derived tooling in DayONE

**Path scope**: `**`

DayONE was scaffolded with tooling derived from MLE (Machine Led Engineering), then
realigned for this project's stack (Electron + React 19 + TypeScript) and host (GitHub).
The Azure-DevOps lifecycle — work-item commands, the HUD, and the memory subsystem —
has been removed. DayONE uses `gh`, GitHub Issues/PRs, release-please, and GitHub
Actions instead.

## What remains (all standalone — no `mle` CLI required)

- **SDLC methodology skills** (`.claude/skills/`): `mle-req`, `mle-estimate`,
  `mle-design`, `mle-coverage`, `mle-test-gen`, `mle-trace`, `mle-impact`,
  `mle-feedback`, `mle-error-audit`, `mle-harden-async`, `mle-refactor-module`,
  `mle-pre-commit-review`, `mle-security-scan`, `mle-config-audit`, `mle-evolve`,
  `mle-goal-structure`, `mle-sustained-interrogation`, plus `forge` (subagent
  orchestration) and `google-style`.
- **Discipline rules** (`.claude/rules/`): code / testing / architecture / security /
  documentation standards, git policy, review standards, goal-structure,
  epistemic-discipline, ADR & BDD conventions, issue/PR conventions, SDLC workflow.
- **Agents** (`.claude/agents/`): `ts-developer`, `style-reviewer`, `github-workflow`.

## See also

- `sdlc-workflow.md`, root `CLAUDE.md`
