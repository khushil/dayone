# Git Policy

**Path scope**: `**`

## Branching & merging

- No direct commits/pushes to `master` — all changes via pull request, on a
  `feature/*` (or `bugfix/*` / `hotfix/*`) branch.
- **Squash-merge only** to `master`; the PR title becomes the squashed commit and
  is what `release-please` reads — write it as the release-worthy summary.
- The creator may approve their own PR (solo phases); CI must be green to merge.

## Commit & PR messages — Conventional Commits

- `type(scope): description`; types `feat | fix | docs | refactor | test | chore | build | ci | perf`.
  A breaking change is `feat!:` or a `BREAKING CHANGE:` footer.
- Enforced by **commitlint**: locally via the lefthook `commit-msg` hook
  (`npx commitlint`, bypassable with `--no-verify`) and in CI on the **PR title**
  (the authoritative gate, since merges are squashed).

## Versioning — release-please + SemVer

- Versions are **derived, never hand-edited**. `release-please` bumps
  `package.json` + `CHANGELOG.md` and cuts the GitHub release. Never run
  `npm version` or push `v*` tags. CI's version-guard rejects out-of-band
  `package.json` version changes from non-release branches.

## Enforcement

| Layer  | Mechanism                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Local  | lefthook `commit-msg` → commitlint; Claude `branch-guard` blocks commits/pushes to `master`                                         |
| GitHub | branch protection on `master` (PR required, squash only); `commitlint.yml` lints the PR title; `release-please.yml` owns versioning |

## See also

- `review-standards.md`, `.github/workflows/`
