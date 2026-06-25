---
name: mle-wi-create
description: 'Submit a rubric-compliant ADO work-item via the gated `mle wi create` workflow — author, validate, then submit. Refuses to create below-threshold or critical-finding bodies (default threshold 4.00). Pairs with `mle-wi-author` to close the authoring loop.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'create work item'
  - 'file work item'
  - 'submit work item'
  - 'mle wi create'
  - 'file a bug'
  - 'open a story'
intent_patterns:
  - "(create|file|submit|open)\\s+(a\\s+)?(work\\s+item|story|epic|feature|bug|task)"
  - "mle\\s+wi\\s+create"
---

# MLE Work-Item Create (Pre-Create Gate)

Submits a rubric-validated body to Azure DevOps using `mle wi create`, the
pre-create gate that scores the body against
`rubrics/work-item-authoring-rubric.md` BEFORE the WI is opened. Where
`mle-wi-author` produces the skeleton, `mle-wi-create` finishes the loop —
fill, validate, submit. The companion agent `wi-create-gate` orchestrates
this flow autonomously when a creation request arrives.

## When to Use

- After `mle-wi-author` has emitted a skeleton and you have filled every
  `{placeholder}`. This skill takes you the rest of the way to a live WI.
- When the user says "create the WI", "submit this bug", "open a story for
  X", or "/mle-wi-create".
- BEFORE invoking the raw `mcp__azure-devops__wit_create_work_item` tool or
  `az boards work-item create`. The gate is the supported submission path —
  raw tool calls bypass scoring and are blocked by the
  `wi-create-validator` hook (see Cross-References below).
- When a prior submission was rejected by the validator and you need to
  iterate on the body until it passes.

## Workflow

### Phase 1: Generate the skeleton

Use `mle-wi-author` (parent skill) to produce a rubric-shaped scaffold:

```bash
mle wi author --type <T> --seed "<short description>" \
    [--parent <WI-ID>] [--parent-type <T>] \
    --format markdown > /tmp/body.md
```

The skeleton uses the curly-brace placeholder convention (`{role}`,
`{capability}`, `{value}`). See the `mle-wi-author` skill for the full
type taxonomy and hierarchy rules.

### Phase 2: Fill the placeholders (mandatory checklist)

Walk through every line of `/tmp/body.md` and replace every `{placeholder}`
with substantive content. The "Fill before submit" checklist from
`mle-wi-author` applies here verbatim:

- [ ] Every `{placeholder}` is replaced with substantive content.
- [ ] No `TBD`, `TODO:`, `FIXME:`, or legacy angle-bracket markers remain.
- [ ] Section heading numbering is sequential — no gaps.
- [ ] Type-specific required sections are present (per the rubric).
- [ ] Body length is appropriate for the WI type — too short auto-fails;
      too long hurts the sizing-accuracy dimension.

### Phase 3: Validate (dry run, no ADO call)

Run the validator standalone before invoking the gate. This produces the
same score the gate will see and surfaces any unfilled placeholders or
critical findings:

```bash
mle wi validate --body-file /tmp/body.md --type <type> --threshold 4.00
```

If the verdict is FAIL, iterate on the body until it passes. Repeat until
the score is **>= 4.00** and there are no critical findings.

### Phase 4: Submit through the gate

```bash
mle wi create --type <type> --seed "<title>" \
    --from-file /tmp/body.md \
    [--parent <WI-ID>] \
    [--threshold 4.00]
```

The gate runs the validator a second time inside the create flow. If the
score is below threshold or any critical findings fire, the WI is NOT
created and the validator findings are printed. On PASS, the WI is created
and the new ID + URL are printed.

Body sources are resolved in priority order: `--body` inline >
`--from-file <path>` > `$EDITOR` interactive (TTY only) > stdin pipe >
error. See `mle wi create --help` for the full flag set.

## Threshold cascade (four levels)

The pass threshold resolves through four sources, each overriding the
next:

| Priority    | Source                                          | Example                                      |
| ----------- | ----------------------------------------------- | -------------------------------------------- |
| 1 (highest) | `--threshold` CLI flag                          | `mle wi create --threshold 4.50 ...`         |
| 2           | `MLE_WI_VALIDATOR_THRESHOLD` env var            | `export MLE_WI_VALIDATOR_THRESHOLD=4.25`     |
| 3           | `~/.mle/config.toml` `[wi_validator] threshold` | `threshold = 4.10`                           |
| 4 (default) | Built-in default                                | `4.00` (raised from 3.0 in v0.11.0; see ADR) |

The default was raised from 3.0 to 4.0 to align with the publishing bar
documented in the rubric. See the ADR linked below for the rationale and
the migration path for in-flight WIs scored below 4.0.

## `--force` escape hatch

`--force` bypasses the gate; the validator still runs and its findings are
written to stderr, but the WI is created regardless. Justified uses:

- Authoring a body whose subject IS the placeholder syntax (e.g. a
  rubric-update Story discussing `{like_this}` — the validator would
  otherwise mark its own examples as unfilled).
- Recovery from a validator bug (the gate refuses something the rubric
  actually permits).
- One-off automation backfills where the body is known-good.

NOT justified: "the score is 3.95 and I want to ship it". Iterate on the
body to clear 4.00 or, if the rubric is wrong, raise an issue against the
rubric instead. Forcing without a documented justification is a review
finding.

## Examples

### Example A — Bug submission

```bash
# 1. Skeleton
mle wi author --type bug --seed "TUI crashes on resize during stream" \
    --format markdown > /tmp/bug.md

# 2. Fill placeholders (manual)
${EDITOR:-vi} /tmp/bug.md

# 3. Pre-validate
mle wi validate --body-file /tmp/bug.md --type bug --threshold 4.00

# 4. Submit through gate (parent linkage optional for Bug)
mle wi create --type bug --seed "TUI crashes on resize during stream" \
    --from-file /tmp/bug.md --parent 1234
```

### Example B — User Story under a Feature

```bash
mle wi author --type story --seed "Parent comment on PR creation" \
    --parent 2255 --format markdown > /tmp/story.md
${EDITOR:-vi} /tmp/story.md   # fill {role}/{capability}/{value} etc.
mle wi validate --body-file /tmp/story.md --type story --threshold 4.00
mle wi create --type story --seed "Parent comment on PR creation" \
    --from-file /tmp/story.md --parent 2255
```

## Specific Techniques

These techniques sharpen the four-phase workflow when the body is on the
threshold or the gate's behaviour needs to be audited:

| Technique                                                                                         | When to apply                                                  | Mechanical signal                                                                                                    |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Run `mle wi create --dry-run --from-file <path>` before the live submission                       | Body is borderline (3.9–4.1) on the rubric scorer              | Dry-run reports the score without an ADO round-trip; iterate cheaply                                                 |
| Pin the threshold explicitly via `--threshold 4.00` rather than relying on the cascade            | Cross-machine reproducibility (CI, peer review)                | Removes ambiguity from the four-level cascade table; gate `wi-validator:rubric-threshold` records the resolved value |
| Capture the validator findings with `--skill` for downstream audit                                | Automated WI filing, regression triage                         | Structured JSON envelope carries score, findings, and threshold for the run's progress log                           |
| Verify the parent link via `az boards work-item show --id <new-id>` after creation                | Hierarchy is load-bearing (Story under Feature; Bug under PBI) | Gate `branch-policy:wi-link-required` enforces the parent at merge time; catch the absence at create time            |
| Cross-reference the resolved threshold against `pyproject.toml [tool.mle.wi_validator] threshold` | Suspect config drift between repo and developer machine        | Operator-side audit logs reference the same value; mismatches surface migration gaps                                 |
| Keep the `--force` justification in the WI's discussion thread, not the PR                        | Genuine validator bug or rubric-update Story                   | The `--force` bypass is auditable later; PR descriptions disappear from history after squash-merge                   |

## Common Rationalizations

| The agent thinks…                                                                                                                           | Actually…                                                                                                                                                                                                                                                                                                   | Gate                               | Corpus |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| "Adding `--force` here matches the existing test corpus — that's the documented escape hatch."                                              | The 4.0 rubric-threshold gate was raised in Story #2258 / ADR-002 specifically because the prior 3.0 floor let weak bodies through. Threading `--force` into new fixtures revisits the exact pattern the threshold change closed; the mock bodies should carry descriptions long enough to clear the gate.  | `wi-validator:rubric-threshold`    | R005   |
| "I'll patch `_validate_wi_body_or_abort` at the test boundary to bypass the rubric-threshold abort — test-only mock, production untouched." | Patching the validator at the test boundary to suppress its abort is functionally identical to silencing it. The production-untouched rationale loses force when the test suite no longer exercises the abort path the production code depends on. A test that mocks the abort cannot prove the gate fires. | `wi-validator:rubric-threshold`    | R006   |
| "Score is 3.9 — just slightly under the 4.0 floor; a one-line note about scope will round it up."                                           | Nudging a 3.9 to a 4.0 by adding rhetorical padding is the gate-evasion pattern the threshold change exists to deter. The note shouldn't be the difference; the body's substantive content should clear the floor without polish. Score-targeting is rationalisation dressed as care.                       | `wi-validator:rubric-threshold`    |        |
| "The skill rubric used to be looser — this draft would have passed last release; I'll let it through."                                      | Threshold history is the wrong precedent. The validator scores the current state against the current rubric; appealing to an older floor argues against the explicit decision to tighten. Drift in that direction normalises regression.                                                                    | `skill-validator:rubric-threshold` |        |

## Red Flags

- `--force` invoked without a written escalation rationale in the WI discussion thread — audit log gate `wi-validator:rubric-threshold` records the bypass but operators cannot reconstruct intent later.
- Resolved threshold in the create-flow log reads `3.0` instead of `4.00` — config drift between `pyproject.toml`, env var, or `~/.mle/config.toml` overrode the default.
- Created WI lacks a parent link despite the hierarchy table requiring one — merge-time gate `branch-policy:wi-link-required` will refuse PRs that name the WI.
- `mle wi validate` reports PASS on a body that diverges from the submitted body in ADO — a post-validate edit slipped through; re-run the validator against the committed body.
- `mle wi create` exits 0 but the ADO REST round-trip returned a transient 5xx — round-trip the new WI ID via `az boards work-item show` before declaring submission complete.

## Verification

```bash
# Dry-run the create flow against a filled body and capture the resolved threshold.
mle wi create --dry-run --type story --seed "<descriptive title>" \
    --from-file /tmp/story.md --threshold 4.00 --skill > /tmp/dryrun.json
cat /tmp/dryrun.json | python3 -m json.tool   # expected: verdict=PASS, threshold=4.00

# Live create — capture the new WI ID.
NEW_ID=$(mle wi create --type story --seed "<descriptive title>" \
    --from-file /tmp/story.md --parent <parent-wi-id> --threshold 4.00 --skill \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['work_item_id'])")
echo "Created WI: ${NEW_ID}"

# Confirm the parent link landed and the body matches the submission.
az boards work-item show --id "${NEW_ID}" \
    --query '{id:id, title:fields.\"System.Title\", parent:fields.\"System.Parent\"}'
```

Observable evidence:

- `/tmp/dryrun.json` carries `verdict: "PASS"`, a `score` at or above 4.00, and the resolved threshold value matching the four-level cascade priority order.
- `mle wi create` (live) returns a non-zero numeric `work_item_id` and posts the body verbatim to ADO; `az boards work-item show` round-trips the same Title and Description.
- The resolved threshold logged in the create flow matches `pyproject.toml [tool.mle.wi_validator] threshold` (or the env-var override, when set).
- `az boards work-item show` returns the expected `parent` field when `--parent` was passed; the gate `branch-policy:wi-link-required` accepts a follow-on PR that names the new WI ID.

## Rules

- **Always run the gate** — never invoke `wit_create_work_item` directly;
  the `wi-create-validator` PreToolUse hook will block it.
- **Pre-validate** — run `mle wi validate` standalone before the gate to
  iterate cheaply (no ADO round-trip on each attempt).
- **British English** — required by the rubric's British-English
  dimension; American spellings drawn from the rubric's canonical
  allowlist cost marks. See `rubrics/work-item-authoring-rubric.md`
  §"Pass-Fail Criteria" for the full table.
- **Keep the parent link** — when the rubric mandates one (e.g. Story
  under Feature), pass `--parent <ID>`; the typed `link_parent()` wrapper
  in `mle.ado.work_items` adds the `Hierarchy-Reverse` relation.
- **Never `--force` silently** — if you bypass, write the justification
  into the WI's discussion thread or the PR description that links it.

## See Also

- `mle-wi-author` skill (parent) — produces the skeleton this skill
  consumes.
- `wi-create-gate` agent — autonomous orchestrator for the full
  author -> fill -> validate -> submit loop.
- `wi-create-validator` PreToolUse hook
  (`.claude/hooks/wi-create-validator.json`) — blocks raw
  `wit_create_work_item` calls that route around the gate.
- `rubrics/work-item-authoring-rubric.md` — authoritative spec; the
  scoring dimensions, type templates, and Pass/Fail criteria.
- `.claude/rules/work-item-standards.md` — path-scope rule that loads on
  every Claude Code session.
- ADR on the threshold default raise (3.0 -> 4.0) — rationale and
  migration; see `docs/adr/`.
- `mle work` / `mle create` — workspace-time validator integration that
  re-checks the parent WI body against the same rubric.
