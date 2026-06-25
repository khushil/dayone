---
name: mle-complete
description: 'Clean up a task workspace after PR merge. Verifies merge status, removes workspace, deletes remote branch, updates ADO.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'complete task'
  - 'cleanup clone'
  - 'task done'
  - 'pr merged'
  - 'mle complete'
intent_patterns:
  - "(complete|finish|cleanup|close)\\s+(the\\s+)?(task|clone|branch)"
---

# MLE Complete

Clean up a task workspace after its pull request has been merged to main.

## When to Use

- A pull request has been completed (merged) on the remote and the local
  workspace has fulfilled its purpose
- The Story or Bug WI is ready to transition from "Resolved" to "Closed"
  and the audit-trail comment should record the cleanup event
- `mle doctor` reports a workspace whose branch has merged and whose
  remote branch still lingers because `--delete-source-branch` was not
  set at completion time
- After a long-running spike where multiple workspaces accumulated and
  the operator wants to retire each one cleanly in dependency order

## Workflow

1. **Verify merged**: Confirm PR is merged (ADO API or git merge-base)
2. **Execute**: `mle complete [--delete-remote]`
3. **ADO update**: Move work item to "Done", add audit comment
4. **Report**: Confirm workspace removed, remote branch deleted

## Specific Techniques

| Situation                                                      | Technique                                                                                                                           | Reference                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| PR appears merged in the ADO web UI                            | Re-query the REST API: `az repos pr show --id <id> --query 'lastMergeCommit.commitId' -o tsv` — non-null is the truth, the UI races | `mle-pr`                               |
| Auto-link from PR to Story did not fire                        | Manual close via `az boards work-item update --id <wi> --state Closed` AFTER verifying the merge SHA is on `origin/main`            | `.claude/rules/work-item-standards.md` |
| Remote branch lingers post-merge                               | Re-run `mle complete --delete-remote` OR explicit `az repos pr update ... --delete-source-branch true` on a still-active PR         | `mle-pr`                               |
| Workspace contains uncommitted hunks the operator forgot about | `mle complete` warns and refuses; resolve via `mle sync` (commit + push) before re-attempting cleanup                               | `mle-sync`                             |
| Worktree-class workspace (shares object store with home repo)  | Cleanup issues `git worktree remove`, not `shutil.rmtree`; verify via `git -C <home-repo> worktree list` post-run                   | `.claude/rules/workspace-strategy.md`  |

## Red Flags

- `mle complete` invoked while `az repos pr show --id <id> --query
'lastMergeCommit.commitId'` returns `null` — the operator trusts a
  UI-only "merged" signal that has not yet committed
- Workspace removed but `git ls-remote origin refs/heads/<branch>` still
  resolves — the remote source branch was orphaned (no `--delete-remote`
  and no auto-complete `--delete-source-branch`)
- Story WI's `System.State` remains "Active" 30+ seconds after `mle
complete` reported success — the auto-link from PR to WI did not fire
  and the manual close fallback was skipped
- Multiple `**MLE**:` audit comments on the same WI within a single
  `mle complete` invocation — the cleanup re-tried mid-flight and
  duplicated its trail
- `mle doctor` post-completion still lists the dirname in its workspace
  table — the local filesystem was not cleaned, only the metadata
  marker was updated

## Verification

```bash
# PR is truly merged on the remote, not just visually completed
az repos pr show --id <pr-id> --query 'lastMergeCommit.commitId' -o tsv \
  | grep -E '^[0-9a-f]{40}$'

# Workspace directory is gone
test ! -d ~/src/<repo>-clones/<workspace-dirname>

# Remote source branch deleted when --delete-remote was used
git ls-remote origin refs/heads/<branch-name> 2>&1 | wc -l   # expect 0

# Story WI moved to Closed (auto or manual fallback)
az boards work-item show --id <wi> \
  --query 'fields."System.State"' -o tsv   # expect: Closed

# Audit comment landed
az boards work-item show --id <wi> --expand all \
  --query 'fields."System.History"' -o tsv | grep '\*\*MLE\*\*: Task completed'
```

Observable evidence:

- `lastMergeCommit.commitId` is a 40-char SHA, never `null` after
  completion
- The workspace dirname is absent from both filesystem and `mle
doctor`'s workspace table
- `git ls-remote` returns empty for the source branch
- `System.State` reads `Closed` on the linked WI
- An ADO comment matching the `**MLE**:` audit-trail prefix is present
  on the WI

## Common Rationalizations

| The agent thinks…                                                                                      | Actually…                                                                                                                                                                                                                                                                                   | Gate                              | Corpus |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| "These remaining items get deferred to a sibling task — not blocking closure of this Story."           | Deferral is acceptable when explicitly tracked in a follow-up task with date and owner. Otherwise the deferred work disappears between the moving Story-Closed signal and the absent follow-up. Each deferred item must remain visible until tracked or closed.                             | `ungated`                         | R007   |
| "The PR shows merged in the UI; doesn't matter that the API's `lastMergeCommit` came back null."       | ADO's PR-update API races — the response can show `status: active, lastMergeCommit: null` even when the merge actually committed. Treating UI confirmation as the source of truth without re-querying after a 3-second pause is how `mle complete` declares done against a still-active PR. | `merge-check:pr-completed`        |        |
| "Story is functionally done — I'll close the WI now and let CI catch up later."                        | Closing the Story before the merge-commit is verified on `origin/main` breaks the audit-trail tie-back. A premature Story-Closed signals downstream consumers (release notes, traceability matrix) that artefacts have landed when they haven't.                                            | `branch-policy:reviewer-required` |        |
| "Source branch can be reaped by the next gc cycle — no need to set `delete-source-branch` explicitly." | Branches that linger in the remote complicate sibling discovery (rebase recipes grep on branch-name prefix) and clutter the policy view. The `delete-source-branch true` flag is the documented cleanup; ignoring it normalises orphan branches.                                            | `branch-policy:wi-link-required`  |        |

## Rules

- **Blocked** unless PR is merged to main (lifecycle enforcement)
- `--force` bypasses the merge check
- `--delete-remote` deletes the remote branch after verification
- Warns about uncommitted changes and unpushed commits before removal
- After cleanup, suggest `mle doctor` to see remaining workspaces
