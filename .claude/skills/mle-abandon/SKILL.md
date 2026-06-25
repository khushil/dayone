---
name: mle-abandon
description: 'Abandon a task workspace without merge check. Supports single workspace and batch stale cleanup.'
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
keywords:
  - 'abandon clone'
  - 'abandon task'
  - 'discard clone'
  - 'remove clone'
  - 'stale clones'
  - 'mle abandon'
intent_patterns:
  - "(abandon|discard|throw away|delete)\\s+(the\\s+)?(task|clone|branch)"
  - "(clean up|remove)\\s+(stale|old|abandoned)\\s+(clone|task)"
---

# MLE Abandon

Remove a task workspace without checking if the branch is merged. Use for abandoned work or stale cleanup.

## When to Use

- A spike or exploratory task ended without a mergeable result, and the
  workspace branch carries no commits worth landing on `main`
- The operator wants to free disk space and `mle doctor` reports
  workspaces older than the stale threshold (default 14 days)
- A prior `mle work <wi>` invocation produced a workspace whose PR was
  abandoned in ADO rather than completed — the local workspace + branch
  now lack a forward path
- Cleaning up after a force-pushed branch was reverted on `origin/main`
  and the local workspace's worktree has drifted irrecoverably from the
  remote tip

## Workflow

1. **Determine mode**: Single workspace or batch stale
2. **Single workspace**: `mle abandon <dirname>`
3. **Batch stale**: `mle abandon --stale --days <N>` (preview), then add `--yes` to execute
4. **Report**: Confirm removal with data loss warnings

## Specific Techniques

| Situation                                           | Technique                                                                                                                     | Reference                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Single stale workspace identified by name           | `mle abandon <dirname>` after confirming `git status --porcelain` is empty AND `git stash list` is empty inside the workspace | `mle-doctor`                          |
| Batch cleanup of many stale workspaces              | `mle abandon --stale --days <N>` (preview) → review the candidate list → re-run with `--yes`                                  | `.claude/rules/workspace-strategy.md` |
| Workspace contains unpushed commits that have value | Switch to `mle sync` and `mle pr create` first; abandon only if the branch is genuinely throw-away                            | `mle-sync`, `mle-pr`                  |
| Worktree-class workspace (not a clone)              | Abandon issues `git worktree remove`, NOT `shutil.rmtree`; verify via `git -C <home-repo> worktree list` post-run             | `.claude/rules/workspace-strategy.md` |
| Source branch still referenced by an open PR        | Close or abandon the PR in ADO BEFORE local abandon, otherwise the PR lingers as orphaned                                     | `mle-pr`                              |

## Common Rationalizations

| The agent thinks…                                                                       | Actually…                                                                                                                                                                                                                                                                                               | Gate                             | Corpus |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "This workspace looks stale — safe to abandon; nothing of value left in it."            | Looks-stale reads age, not state. An unpushed commit, an untracked WIP file, or a stash entry can outlive the visible branch history. Abandoning without inspecting reflog plus stash plus untracked surface is irreversible data loss masquerading as cleanup.                                         | `merge-check:pr-completed`       |        |
| "The branch was merged so the remote tip can be pruned; no further review needed."      | Merged-equals-prunable conflates two states. A branch can be merged AND still carry post-merge fixups the merge-check didn't see; pruning eagerly costs nothing visible today and a lot on a future bisect. The discipline is to prune on a cadence with explicit grace, not on every successful merge. | `ungated`                        |        |
| "Cleanup is reversible from reflog if I'm wrong — let me just delete this and move on." | The reflog covers around 30 days of the local copy only; a rebased-then-deleted branch loses its remote tip after the remote's gc cadence. Reversible buys time, not safety; the wi-link policy exists so deleted branches still trace back to their motivating ticket.                                 | `branch-policy:wi-link-required` |        |

## Red Flags

- `mle abandon <workspace>` invoked while `git stash list` inside the
  workspace returns non-empty or `git status --porcelain` reports
  uncommitted hunks — retainable state is being discarded silently
- Batch invocation `mle abandon --stale --days <N> --yes` issued without
  first running the same command in preview mode — candidates were
  never enumerated for the operator's eyes
- Workspace removed while an active pull request still references its
  source branch on the remote — the PR lingers as orphaned even when
  the local source branch is gone
- Branch tip exists locally but `git ls-remote origin refs/heads/<branch>`
  returns empty AND the workspace carries stash entries or unpushed
  commits — the only copy of unmerged work is about to vanish
- Immediate `mle work <wi>` re-creation against the same WI without
  `mle doctor` first — orphaned remote artefacts and watcher state from
  the abandoned cycle pollute the new one

## Verification

```bash
# After abandon, the workspace directory is gone
test ! -d ~/src/<repo>-clones/<workspace-name>

# But the local reflog still carries the branch tip for the gc window
git -C ~/src/<repo> reflog --all --since='30 days ago' | grep <branch-name>

# mle doctor no longer lists the workspace
mle doctor 2>&1 | grep -v '<workspace-name>'

# Stale-preview pass enumerates candidates before any deletion
mle abandon --stale --days 14 2>&1 | grep -E 'Would (remove|abandon)|Preview'
```

Observable evidence:

- The target directory under `~/src/<repo>-clones/` no longer resolves
  via `test -d`, while the parent home repository is untouched
- `git reflog` retains the branch tip ref so a same-day recovery is
  possible until the local gc cadence prunes
- `mle doctor`'s workspace table omits the abandoned dirname
- Stale-preview output lists every workspace older than the threshold
  with the data-loss surface enumerated (unpushed commits, stash
  entries) BEFORE `--yes` is accepted

## Rules

- No merge check — use `/mle-complete` for merged work
- Always warns about data loss (unpushed commits, uncommitted changes)
- For `--stale`, always show preview before asking for confirmation
- Default stale threshold is 14 days
- After abandoning, suggest `/mle-doctor` to see remaining workspaces
