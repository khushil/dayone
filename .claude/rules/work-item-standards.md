# Issue & PR Conventions

**Path scope**: `**`

DayONE tracks work as **GitHub Issues** and changes as **pull requests** (no Azure
DevOps). Keep both substantive enough to understand without external context.

## Issues

- Title: concise, imperative. Body: a short summary paragraph plus acceptance criteria
  (verifiable statements, not vague intent). Label by type (`bug`, `feature`, `chore`,
  `docs`) and reference related issues/PRs.
- Bugs: include repro steps, expected vs actual, environment, and the stack trace in a
  fenced block. Lead the fix with a failing test (see `goal-structure.md`).

## Pull requests

- One branch per change (`feature/*`, `bugfix/*`). The PR **title** is a Conventional
  Commit — it becomes the squashed commit and feeds release-please (see `git-policy.md`).
- Body: what changed and why, how it was verified (commands/tests), and any breaking
  change (`BREAKING CHANGE:` footer + migration note). Link the issue (`Closes #NN`).
  Keep PRs reviewable (see `review-standards.md` — ~500-line guidance).

## See also

- `git-policy.md`, `review-standards.md`, `goal-structure.md`
