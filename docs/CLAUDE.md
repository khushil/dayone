# Project Documentation

DayONE's documentation hub — start here when entering a topic.

## Key documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system architecture
- [`CODING_STANDARDS.md`](CODING_STANDARDS.md) — Google TypeScript Style Guide (canonical)
- [`PROVIDERS.md`](PROVIDERS.md) — data-provider abstraction
- [`RELEASING.md`](RELEASING.md) — release-please flow
- [`REQUIREMENTS.md`](REQUIREMENTS.md) — feature requirements

## Agent tooling

DayONE carries Claude Code tooling derived from MLE and realigned for TypeScript +
GitHub — see [`.claude/rules/mle-overview.md`](../.claude/rules/mle-overview.md):

- `.claude/rules/` — code / testing / architecture / security standards, git policy,
  goal-structure, epistemic-discipline (loaded by path scope)
- `.claude/skills/` — standalone SDLC methodology skills plus `google-style`
- `.claude/agents/` — `ts-developer`, `style-reviewer`, `github-workflow`

## Conventions

- British English for user-facing text; cross-link with repository-root paths.
