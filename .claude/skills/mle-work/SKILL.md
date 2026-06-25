---
name: mle-work
description: 'Start work on an ADO work item — fetch, derive branch, create workspace, assign, link. End-to-end orchestration.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
allowed-tools:
  - Bash
  - Read
keywords:
  - 'work on'
  - 'start work'
  - 'work item'
  - 'story'
  - 'pick up'
  - 'mle work'
  - 'take task'
  - 'begin work'
intent_patterns:
  - "(work on|start|pick up|take)\\s+(story|task|item|work item|#?\\d+)"
---

# MLE Work

End-to-end orchestration: fetch a work item, derive a branch name, create a workspace, assign and link.

## When to Use

- When the user says "work on #1234", "start work on the story", or "pick up that bug"
- When `/mle-work <wi-id>` is invoked from a Claude Code session at the home
  repository under `~/src/<your-repo>/`
- Before any code change against an ADO work item — this is the preferred
  lifecycle entry-point over raw `mle create`
- After `mle doctor` reports zero pre-existing workspaces for the target WI ID,
  confirming no in-flight branch exists for the same ticket
- When the WI's `System.State` field reads `New` or `Active` and assignment to
  the current operator is required before implementation begins

## Workflow

1. **Execute**: `mle work <work-item-id>`
2. **Fetch**: Gets work item title, type, state from ADO
3. **Derive branch**: Auto-generates `feature/us-{id}-{kebab-title}` or `bugfix/bug-{id}-...`
4. **Confirm**: Shows derived branch name, asks for confirmation
5. **Create workspace**: Runs the full workspace creation flow
6. **ADO updates**: Assigns WI to you, sets state to "In Progress", adds audit comment
7. **Report**: Workspace path, branch, work item link

## Specific Techniques

| Situation                                                                                  | Technique                                                                                                                               | Reference                              |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Branch derivation collides with existing local workspace under `~/src/<your-repo>-clones/` | Run `mle doctor` first; if a workspace already exists for the same WI, `cd` into it rather than re-create                               | `.claude/rules/workspace-strategy.md`  |
| Workspace strategy decision needed (clone vs worktree)                                     | `mle strategy --explain` before `mle work <wi>` to see the 7-factor breakdown                                                           | `mle strategy`                         |
| WI already assigned to a teammate                                                          | `az boards work-item show --id <wi>` to confirm current assignee, then negotiate reassignment in ADO before re-running `mle work`       | `.claude/rules/work-item-standards.md` |
| Branch-name override needed (slug too long, naming conflict)                               | `mle work <wi> --branch feature/us-<wi>-<short-slug>` to bypass derivation                                                              | `mle work --help`                      |
| Network or PAT failure mid-orchestration                                                   | `mle auth status` confirms PAT validity; re-run `mle work <wi>` after fixing — the operation is idempotent through `.mle-metadata.json` | `mle auth`                             |

## Common Rationalizations

| The agent thinks…                                                                                                                                   | Actually…                                                                                                                                                                                                                                                                                                                                            | Gate                             | Corpus |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "I'll add `--force` to the test invocations — it's the documented bypass for the rubric gate, simpler than mocking sufficiently long descriptions." | Threading `--force` through tests trains the suite to accept the bypass as default behaviour; future agents read the test corpus and conclude `--force` is the canonical way to invoke `mle work` in non-interactive contexts. The mocks should carry descriptions long enough to clear the 4.0 threshold; the cheaper path entrenches gate-evasion. | `wi-validator:rubric-threshold`  | R005   |
| "I'll skip the work-item link this once — it's a tiny doc fix and I can back-fill the link after the PR opens."                                     | The wi-link branch policy fires at PR-create time, not at completion. A back-fill-later plan defers the audit signal past the moment the reviewer would have caught the missing context; PRs without a linked WI rot in the queue or merge without traceability.                                                                                     | `branch-policy:wi-link-required` |        |
| "Workspace strategy doesn't really matter — clone or worktree, the branch will land the same way."                                                  | The strategy decision changes how `mle complete` reconciles state at cycle-end. A worktree cannot be removed with `shutil.rmtree`; a clone cannot share its object store. Treating the choice as cosmetic masks a real cleanup hazard the merge-check gate is designed to surface.                                                                   | `merge-check:pr-completed`       |        |
| "I'll silence the ruff complaint on the new test stub — it's a transient warning, not a real defect."                                               | Pre-commit's ruff hook runs every staged file uniformly; a transient warning in a test stub surfaces on every subsequent commit and trains the agent to scroll past it. Each silenced warning is a future regression masked.                                                                                                                         | `pre-commit:ruff`                |        |

## Red Flags

- Derived branch name omits the WI ID (e.g. `feature/quick-fix` without `us-<id>-`)
  — the `branch-policy:wi-link-required` gate fires at PR time and orphans
  the audit trail
- `mle work <wi>` invoked while another workspace under `~/src/<your-repo>-clones/`
  already exists for the same WI ID — the second workspace will diverge
  silently from the first
- ADO assignee field remains the prior owner after `mle work` completes —
  the assignment step was skipped or swallowed and the audit comment is
  missing from the WI
- `mle auth status` returns `PAT invalid` or `expired` and `mle work` proceeds
  anyway against cached metadata — the ADO mutation step silently failed
- `--force` invoked outside an explicit spike to bypass the rubric threshold
  for the WI body — see `wi-validator:rubric-threshold` and corpus R005

## Verification

```bash
# Workspace directory exists with the expected metadata
test -d ~/src/<your-repo>-clones/feature--us-<wi>-* && \
  jq -r '.work_item_id' ~/src/<your-repo>-clones/feature--us-<wi>-*/.mle-metadata.json

# ADO assignee transitioned to current user
az boards work-item show --id <wi> --query 'fields."System.AssignedTo".uniqueName' -o tsv

# Branch matches the derived pattern and tracks origin
git -C ~/src/<your-repo>-clones/feature--us-<wi>-* rev-parse --abbrev-ref HEAD | grep -E '^(feature|bugfix)/(us|bug)-<wi>-'
git -C ~/src/<your-repo>-clones/feature--us-<wi>-* rev-parse --abbrev-ref '@{upstream}'

# Audit comment landed on the WI
az boards work-item show --id <wi> --expand all --query "relations[?attributes.name=='Comments']" 2>&1 | \
  grep -c '\*\*MLE\*\*: Task'
```

Observable evidence:

- `.mle-metadata.json` exists at the workspace root and the `work_item_id`
  field equals the `<wi>` passed to `mle work`
- `az boards work-item show` returns the current operator's email in
  `System.AssignedTo` and `System.State` reads `Active` or `In Progress`
- Branch name printed by `git rev-parse --abbrev-ref HEAD` matches the
  derived pattern `feature/us-<wi>-<slug>` or `bugfix/bug-<wi>-<slug>`
- A comment beginning with `**MLE**: Task` appears in the WI's discussion
  history with a `created_at` timestamp inside the last 10 minutes

## Rules

- Work item must exist in ADO
- If WI is already assigned to someone else, warns and requires confirmation
- Adds audit comment: "**MLE**: Task workspace created on `{hostname}`..."
- This is the **preferred** way to start work (over raw `mle create`)
