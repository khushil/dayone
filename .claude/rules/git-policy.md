# Git Policy

**Path scope**: `**`

## Branch Protection

- No direct commits to main — all changes via pull requests
- All pull requests require at least 1 reviewer (creator can approve)
- Squash merge only to main

## Branching Model

| Prefix      | Purpose             |
| ----------- | ------------------- |
| `feature/*` | New features        |
| `bugfix/*`  | Bug fixes           |
| `hotfix/*`  | Urgent fixes        |
| `release/*` | Release preparation |

## Commit Messages

Use conventional commits: `type(scope): description`

- Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `spike`
- `spike(scope): ...` is accepted under Bug #3508 alongside the original US #2195 set; use it for Spike-WI work where the type-of-work signal matters in the commit log
- Enforced by `.githooks/commit-msg` hook and `conventional-pre-commit` in `.pre-commit-config.yaml`

Examples:

```
feat(core): add clone health check
fix(ado): correct work item linking
docs: update developer workflow guide
test(functional): add sync validation tests
spike(hygiene): investigate option A versus option B
```

## Enforcement

| Layer      | Mechanism                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| Local git  | `.githooks/pre-push` blocks push to main                                        |
| Local git  | `.githooks/commit-msg` validates conventional format                            |
| Local git  | `.githooks/pre-commit` runs pre-commit framework                                |
| ADO server | Branch policies: 1 reviewer, comment resolution, squash only, work item linking |
