---
name: mle-create
description: 'Create a new task clone linked to an ADO work item. Enforces lifecycle: requires work item ID unless --force.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'new task'
  - 'task clone'
  - 'create clone'
  - 'start task'
  - 'new feature'
  - 'new bugfix'
  - 'new branch'
  - 'mle create'
intent_patterns:
  - "(create|start|begin|setup)\\s+(a\\s+)?(new\\s+)?(task|clone|branch)"
---

# MLE Create

Create a new isolated task clone linked to an ADO work item.

## When to Use

- When the user says "make a new task clone", "create a clone", or invokes
  `/mle-create` directly with an explicit branch name in mind
- When `mle work <wi>` is not appropriate because the operator already knows
  the exact branch name and wants to skip ADO-driven derivation
- After `mle doctor` reports the target branch is not already checked out in
  another workspace under `~/src/<your-repo>-clones/`
- Before any commit against a feature/bugfix/hotfix/release prefix branch
  derived from an ADO work item
- When prototyping with `--force` for a one-off spike that genuinely has
  no associated WI (rare; default lifecycle enforcement requires `--work-item`)

## Workflow

1. **Gather details**: Ask for work item ID and branch name (or use `mle work <ID>` for auto-derivation)
2. **Execute**: `mle create --work-item <ID> <branch-name>`
3. **Verify**: Check output for 11/11 verification checks passing
4. **Report**: Print clone path and suggest entering the shell: `mle shell`

## Specific Techniques

| Situation                                          | Technique                                                                                                                            | Reference                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Operator knows both WI and branch up front         | `mle create --work-item <wi> feature/us-<wi>-<slug>` — skips the derivation step that `mle work` performs                            | `mle create --help`                    |
| Branch prefix unusual (e.g. `release/`)            | Pass the prefix explicitly; `mle create` validates against `feature/`, `bugfix/`, `hotfix/`, `release/`                              | `.claude/rules/git-policy.md`          |
| Spike or throw-away work that genuinely has no WI  | `mle create --force feature/spike-<topic>` — lifecycle enforcement bypassed, no ADO audit comment posted                             | `.claude/rules/work-item-standards.md` |
| Workspace exists under a stale name from prior run | `mle abandon <stale-dirname>` first, then `mle create --work-item <wi> <branch>` to land cleanly                                     | `mle-abandon`                          |
| 11/11 verification checks include failures         | Read each failed check from the output; common failures are missing git identity, missing ADO PAT, or branch-already-exists conflict | `mle verify`                           |

## Common Rationalizations

| The agent thinks…                                                                                                                                  | Actually…                                                                                                                                                                                                               | Gate                             | Corpus |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "I'll just pass `--force` — the test fixture's mocked WI body is too short to clear the rubric threshold and adding length to the mock is fiddly." | Threading `--force` through tests trains the suite to accept the bypass as default. Mocks that carry rubric-compliant bodies make the gate visible and exercised; `--force` in CI normalises gate evasion.              | `wi-validator:rubric-threshold`  | R005   |
| "The WI ID is optional in practice — I can back-fill the link by editing `.mle-metadata.json` after the create."                                   | The audit comment posts to ADO at create time, not at metadata-edit time. Manual JSON edits leave the WI unaware that work has started; the assignee field stays stale and the watcher's WI-state plugin reports drift. | `branch-policy:wi-link-required` |        |
| "This is a small fix so the rubric threshold doesn't apply — the WI body is one line and that's fine for a typo."                                  | The threshold's job is to refuse one-line bodies; "small fix" is exactly the predicate the rubric was designed to catch. A typo with no acceptance criteria leaves the reviewer with no contract to verify against.     | `wi-validator:rubric-threshold`  | R005   |

## Red Flags

- `mle create --force` invoked outside an explicit spike scenario — the
  lifecycle enforcement is being bypassed in routine work, leaking through
  to the test corpus per R005
- `.mle-metadata.json` exists but the `work_item_id` field is `null` after
  `mle create` reports success — the ADO mutation step failed silently and
  the audit comment is missing
- Workspace created against a WI whose `System.State` reads `Closed` or
  `Completed` — work is being attached to a finished ticket, breaking the
  state machine
- Branch name already resolves under `git worktree list` from the home repo
  — the second worktree against the same ref will fail to check out
- ADO assignee step skipped (no `**MLE**: Task` comment posted within 10
  minutes of create) — `mle auth status` likely returns `PAT invalid`
  and the call swallowed the error

## Verification

```bash
# Workspace exists at the derived path
test -d ~/src/<your-repo>-clones/<branch-flattened> && echo "workspace present"

# Metadata contains the linked WI
jq -r '.work_item_id, .branch' ~/src/<your-repo>-clones/<branch-flattened>/.mle-metadata.json

# Remote branch ref exists on origin
git -C ~/src/<your-repo>-clones/<branch-flattened> ls-remote origin "refs/heads/<branch>"

# WI received the audit comment
az boards work-item show --id <wi> --expand all 2>&1 | \
  grep -F "**MLE**: Task clone created"

# 11/11 verification checks pass (mle output captured)
mle verify --workspace ~/src/<your-repo>-clones/<branch-flattened> 2>&1 | grep -E '11/11|PASS'
```

Observable evidence:

- The workspace directory resolves via `test -d` and contains a `.git/`
  directory (clone) or `.git` file (worktree)
- `.mle-metadata.json` parses and the `work_item_id` equals the value
  passed to `--work-item` at create time
- `git ls-remote origin refs/heads/<branch>` returns a SHA, confirming
  the branch was pushed to origin during create
- The WI's history includes an `**MLE**: Task clone created` comment
  timestamped at the create moment
- `mle verify` reports `11/11 checks PASS` against the new workspace

## Rules

- Work item ID is **required** by default (lifecycle enforcement)
- Use `--force` to bypass for experiments/prototyping
- Branch must use an allowed prefix: feature/, bugfix/, hotfix/, release/
- MLE adds an audit comment to the work item: "**MLE**: Task clone created..."
- After creation, suggest `mle shell` for environment isolation
- Prefer `mle work <ID>` for end-to-end orchestration (fetches WI, derives branch name)
