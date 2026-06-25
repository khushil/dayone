---
name: mle-pr
description: 'Create and manage pull requests from task workspaces. Auto-generates description, links work items.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'create pr'
  - 'pull request'
  - 'raise pr'
  - 'open pr'
  - 'mle pr'
intent_patterns:
  - "(create|raise|open|make)\\s+(a\\s+)?(pull request|pr)"
---

# MLE PR

Create and manage pull requests from task workspaces.

## When to Use

- When the user says "open a PR", "create a pull request", or "raise PR"
- When `/mle-pr` is invoked from inside a workspace under `~/src/<your-repo>-clones/`
- After `mle sync -m "<msg>"` has pushed the local branch and the operator
  is ready to request review
- Before any merge attempt on `main` — the PR is the only path to integrate
  workspace branches into the trunk
- After running the project test command (e.g. `pytest`, `npm test`) and
  confirming the test suite is green, ready to expose the change for
  reviewer scrutiny

## Workflow

1. **Create PR**: `mle pr create [--draft]`
   - Auto-syncs if unpushed commits exist
   - Generates PR title from branch name
   - Generates PR description from commit log
   - Links work item from `.mle-metadata.json`
   - Stores PR ID in metadata
2. **Check status**: `mle pr status`
   - Shows PR status (active/completed/abandoned)
3. **Report**: PR ID, title, branch, linked work item

## Specific Techniques

| Situation                                                        | Technique                                                                                                                           | Reference                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Local branch ahead of remote when PR is requested                | `mle pr create` auto-runs `mle sync` first; alternative is explicit `git push origin HEAD` then `mle pr create`                     | `mle pr --help`                        |
| Draft PR for early review while work is in flight                | `mle pr create --draft` so the PR opens in draft and policy gates defer until promoted                                              | `mle pr`                               |
| `.mle-metadata.json` missing the `work_item_id` field            | Re-run `mle work <wi>` against the same branch to repopulate, then retry `mle pr create`                                            | `.claude/rules/work-item-standards.md` |
| Title or description override needed (conventional commit shape) | `az repos pr update --id <pr> --title "feat(scope): description"` post-create, or land via the underlying `az repos pr create` call | `.claude/rules/git-policy.md`          |
| PR fails to link WI in ADO despite metadata being present        | `az repos pr work-item add --id <pr> --work-items <wi>` to back-fill the linkage when the ADO API races on link attachment          | `mle pr`                               |

## Common Rationalizations

| The agent thinks…                                                                                                            | Actually…                                                                                                                                                                                                                                                                                                                                                 | Gate                              | Corpus |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| "That CHANGELOG reference is to `mle wi create --force` (still valid), not the removed `mle create --force`. Leaving as-is." | The disambiguation is correct in isolation, but the same pattern — selective doc updates based on agent judgement — is how docs drift accumulates. The skill should require explicit reasoning per file with grep-evidence cited, otherwise updates that should land get quietly skipped.                                                                 | `ungated`                         | R004   |
| "These children get deferred to a sibling task — schema-fixture issues, not flag issues."                                    | Deferral is acceptable when explicitly tracked in a follow-up task with date and owner. Declaring umbrellas mid-fix and rolling deferred children into a sibling task can mask coverage gaps if the sibling is later abandoned, scoped down, or merged under stricter criteria. Each deferred child must remain visible in the bug registry until closed. | `ungated`                         | R007   |
| "I can self-approve this PR — the change is small and no other reviewer is online."                                          | The reviewer-required branch policy expresses an institutional review obligation, not an availability test. Self-approval shrinks the audit population to one and removes the second pair of eyes the policy mandates; "small change" is the precise predicate behind which regressions slip in.                                                          | `branch-policy:reviewer-required` |        |
| "The PR description is for humans; the WI link in the squashed commit is the real audit trail."                              | The branch policy attaches the WI at the PR level so ADO can roll coverage up by Epic. A WI mentioned only in a squashed commit message disappears after merge; the policy exists because commit-message-only links are not queryable.                                                                                                                    | `branch-policy:wi-link-required`  |        |

## Red Flags

- `mle pr create` invoked while `git status` reports unpushed commits AND
  the auto-sync step was disabled — the PR will open against a stale remote tip
- PR description body lacks the `Work Item: #<id>` line or the WI is not
  attached in `workItemRefs[]` — the `branch-policy:wi-link-required` gate
  blocks completion until back-filled
- PR title does not match the conventional-commit pattern `type(scope): description`
  — `.githooks/commit-msg` would have rejected this locally; the PR title
  bypasses that hook by construction
- `mle pr create` invoked from a directory outside `~/src/<your-repo>-clones/`
  (e.g. from the home repository directly) — the workspace lookup returns
  `None` and the PR is opened against the wrong branch context
- Self-approval recorded on the PR (`createdBy` equals the only `approver`)
  when the `branch-policy:reviewer-required` policy is active — the audit
  population shrinks to one reviewer

## Verification

```bash
# PR ID stored in workspace metadata
jq -r '.pull_request_id' ~/src/<your-repo>-clones/feature--us-<wi>-*/.mle-metadata.json

# PR shows as active and links the expected WI
az repos pr show --id <pr-id> --query '{status: status, source: sourceRefName, target: targetRefName}' -o json
az repos pr show --id <pr-id> --query 'workItemRefs[].id' -o tsv | grep '^<wi>$'

# PR description references the WI ID
az repos pr show --id <pr-id> --query 'description' -o tsv | grep -E '#<wi>|AB#<wi>'

# Remote branch matches the local HEAD (auto-sync succeeded)
git -C ~/src/<your-repo>-clones/feature--us-<wi>-* rev-parse HEAD
git -C ~/src/<your-repo>-clones/feature--us-<wi>-* rev-parse '@{upstream}'

# Audit comment landed on the WI
az boards work-item show --id <wi> --expand all --query "fields.'System.History'" 2>&1 | \
  grep -F "**MLE**: PR #<pr-id>"
```

Observable evidence:

- `.mle-metadata.json` contains a non-null `pull_request_id` field matching
  the value returned by `az repos pr show`
- `az repos pr show --query status` returns `active` (or `completed` post-merge)
- `workItemRefs[].id` includes the WI ID — the linkage is present at the
  PR record, not only in the squashed commit message
- The two `git rev-parse` commands print the same SHA, confirming the
  remote tip matches the local HEAD that the PR was opened against
- A comment beginning with `**MLE**: PR #<pr-id>` appears in the WI's
  history, timestamped inside the last 10 minutes

## Rules

- Branch must be pushed before creating a PR
- Work item is linked automatically from metadata
- PR description follows FORMATTING.md template
- Adds audit comment to work item: "**MLE**: PR #{id} created..."
