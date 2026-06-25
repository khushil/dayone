---
name: mle-resume
description: 'Resume a task clone from a remote branch on a fresh VM or different machine.'
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
keywords:
  - 'resume task'
  - 'resume clone'
  - 'resume branch'
  - 'fresh vm'
  - 'mle resume'
intent_patterns:
  - "(resume|restore|recreate)\\s+(a\\s+)?(task|clone|branch)"
---

# MLE Resume

Resume work on a remote branch by cloning it as a local task clone.

## When to Use

- When the user says "resume my task on a fresh VM", "I'm on a new machine",
  or invokes `/mle-resume` after losing the local workspace
- When `mle doctor` on the new VM reports zero workspaces under
  `~/src/<your-repo>-clones/` and the operator wants to re-hydrate from `origin`
- After ADO shows an open PR under the operator's identity but the matching
  local workspace is absent — the workspace state is recoverable from the
  remote branch tip
- Before any commit on a fresh repo clone — resume reconstructs
  `.mle-metadata.json` from the branch name and WI linkage in ADO
- When migrating between development machines and the per-WI workspace
  inventory needs to be rebuilt without re-running `mle work` for each ticket

## Workflow

1. **Determine scope**: Single branch or all branches
2. **Single branch**: `mle resume <branch-name>`
3. **All branches**: `mle resume --all --dry-run` (preview), then `mle resume --all`
4. **Report**: List resumed clones with their paths

## Specific Techniques

| Situation                                   | Technique                                                                                                     | Reference                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Single branch known by name                 | `mle resume feature/us-<wi>-<slug>` — pre-checks `git ls-remote` before clone                                 | `mle resume --help`                   |
| Many branches to re-hydrate on a fresh VM   | `mle resume --all --dry-run` to enumerate candidates, then `mle resume --all` to execute                      | `mle resume --help`                   |
| Resume scoped to one author's branches only | `mle resume --all --user <email>` filters via ADO's branch metadata                                           | `mle resume`                          |
| Branch name typo or already merged          | `mle resume <branch>` fails fast on `git ls-remote` returning empty — re-issue with the canonical branch name | `.claude/rules/workspace-strategy.md` |
| Old local workspace lingers from prior VM   | `mle abandon <old-dirname>` first to free the path, then `mle resume <branch>` to land cleanly                | `mle-abandon`                         |

## Common Rationalizations

| The agent thinks…                                                                                       | Actually…                                                                                                                                                                                                                                                | Gate                             | Corpus |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "Resume looks like a no-op when the local workspace already exists — I'll skip the abandon-first step." | A pre-existing workspace at the resume target conflicts on directory creation; resume errors are surfaced but the half-cloned state can leak `.git/objects` that diverge from `origin`. Always run `mle abandon` first when the target path is occupied. | `merge-check:pr-completed`       |        |
| "The branch isn't on origin any more — must have been merged. Safe to skip."                            | Merged-and-removed AND merged-and-pending-cleanup look identical at `git ls-remote`. If the branch was deleted before merge completed, resume's silent skip masks the data loss; an active PR still references the branch in ADO.                        | `branch-policy:wi-link-required` |        |
| "`.mle-metadata.json` is missing post-resume but the branch is checked out — I'll hand-edit it in."     | Hand-edited metadata files bypass the audit comment that resume posts to ADO. The WI never learns that work resumed on a new host; the watcher's WI-state plugin records a stale assignee/host pair.                                                     | `ungated`                        |        |

## Red Flags

- `mle resume <branch>` invoked while a workspace at the derived path
  already exists — the second attempt will conflict or, worse, overwrite
  uncommitted local state from the prior run
- Remote branch returns empty under `git ls-remote origin refs/heads/<branch>`
  but resume proceeds anyway — the silent skip masks either a typo or a
  branch already deleted post-merge
- `.mle-metadata.json` missing or has `work_item_id: null` after resume reports
  success — the metadata reconstruction step failed and the WI linkage
  is lost on the new VM
- ADO WI's `**MLE**: Task workspace resumed` comment is absent within 10
  minutes of `mle resume` completing — the audit step was skipped or
  the PAT was invalid at the moment of the ADO call
- `mle resume --all --yes` invoked without first running `--dry-run` — batch
  cloning kicks off blind to the candidate set and may pull dozens of
  stale branches onto disk

## Verification

```bash
# Workspace exists at the derived path
test -d ~/src/<your-repo>-clones/<branch-flattened> && echo "workspace present"

# Metadata parses with the linked WI
jq -r '.work_item_id, .branch' ~/src/<your-repo>-clones/<branch-flattened>/.mle-metadata.json

# HEAD resolves and upstream tracks origin
git -C ~/src/<your-repo>-clones/<branch-flattened> rev-parse HEAD
git -C ~/src/<your-repo>-clones/<branch-flattened> rev-parse --abbrev-ref '@{upstream}' | grep '^origin/'

# Local HEAD matches the remote tip captured at resume time
git -C ~/src/<your-repo>-clones/<branch-flattened> rev-list --count HEAD..@{upstream}

# WI received the audit comment
az boards work-item show --id <wi> --expand all 2>&1 | \
  grep -F "**MLE**: Task workspace resumed"
```

Observable evidence:

- The workspace directory resolves via `test -d` under `~/src/<your-repo>-clones/`
- `.mle-metadata.json` parses and `work_item_id` is non-null and matches
  the WI ID encoded in the branch name
- `git rev-parse HEAD` returns a SHA and `git rev-parse @{upstream}`
  prints `origin/<branch>`
- `git rev-list HEAD..@{upstream}` returns `0`, confirming the local HEAD
  is at the remote tip (no missed commits)
- A comment starting with `**MLE**: Task workspace resumed` appears in
  the WI's history with a `created_at` timestamp inside the last 10 minutes

## Rules

- Pre-checks `git ls-remote` to verify branch exists on remote
- Uses `--single-branch` for efficiency
- After resume, suggest `mle shell` for environment isolation
- `--dry-run` shows what would be resumed without cloning
- `--user <email>` filters to branches by a specific author
