---
name: mle-wi-author
description: 'Generate rubric-compliant ADO work-item bodies per type (Epic, Feature, Story/PBI, Task, Bug, Spike, Refactor, Doc, Security, Test Case, Impediment). Validates parent-type compatibility against the rubric hierarchy.'
type: flexible
archetype: methodology-pure
priority: high
maturity: L2
keywords:
  - 'author work item'
  - 'wi body'
  - 'write story'
  - 'draft work item'
  - 'mle wi author'
  - 'story body'
  - 'bug body'
intent_patterns:
  - "(author|draft|write|generate)\\s+(a\\s+)?(work\\s+item|story|epic|feature|bug|task)\\s+(body)?"
  - "mle\\s+wi\\s+author"
---

# MLE Work-Item Author

Generates a rubric-compliant body for an Azure DevOps work item, covering every type defined in `rubrics/work-item-authoring-rubric.md`. Emits both markdown (for review) and HTML (for `az boards work-item create --description`). Validates parent-type compatibility against the rubric's hierarchy rules.

## When to Use

- When the user says "author a WI", "draft a bug", "write a story", "create a work item body", or "/mle-wi-author"
- Before running `az boards work-item create` or `mle work <new-WI-ID>` — author the body first
- When the user asks for a WI type they are unfamiliar with (Spike, Refactor, Impediment) — the skill produces the right shape
- When a prior WI body was rejected by the pre-create validator for being sub-threshold

## Workflow

### Step 1: Identify type and seed

Elicit or infer:

- **Type** — one of: `epic`, `feature`, `story`, `pbi`, `task`, `bug`, `spike`, `refactor`, `doc`, `security`, `test`, `impediment`.
- **Seed** — short description used as the title (one line, ≤ 100 chars).
- **Parent** (optional) — either an ADO WI ID (`--parent <id>`) or an explicit parent type (`--parent-type <t>`).

If the type is Bug, additionally ask for: traceback / repro / environment. These become section content rather than placeholders.

### Step 2: Run the command

```bash
mle wi author --type <T> --seed "<short description>" \
    [--parent <WI-ID>] [--parent-type <T>] \
    [--format markdown|html|both]
```

Or, for agent consumption (structured output):

```bash
mle wi author --type <T> --seed "<...>" --skill
```

### Step 3: Validate hierarchy

If `--parent` is supplied, the command fetches the parent's type from ADO and validates it against the rubric's hierarchy rules. If the hierarchy is violated (e.g. Story under Task), the command fails with exit code 2 and a message listing the allowed parents.

If `--parent-type` is supplied, the same validation runs without an ADO call.

### Step 4: Fill in the skeleton

The command emits a scaffold with every required section headed and populated with a curly-brace placeholder, for example `{role}`, `{capability}`, `{value}`. The caller (human or agent) then replaces every placeholder with real content before submitting to ADO.

> **Note on convention:** the current generator uses the curly-brace form (`{like this}`). Older bodies may still contain the legacy angle-bracket form; the validator catches both forms as unfilled-placeholder findings.

### Step 5: Submit

```bash
# HTML-only output → pipe to az
mle wi author --type bug --seed "..." --format html > /tmp/body.html
az boards work-item create --type Bug --title "..." --description "$(cat /tmp/body.html)"
```

## Fill before submit (mandatory checklist)

Before invoking `wit_create_work_item` or `mle wi create`, walk through each line of the skeleton and confirm:

- [ ] Every `{placeholder}` has been replaced with substantive content
- [ ] No `TBD`, `TODO:`, `FIXME:`, or legacy angle-bracket markers remain
- [ ] Section heading numbering (1., 2., 3., ...) is sequential — no gaps
- [ ] All required type-specific sections are present (see rubric §"Per-Type Templates")
- [ ] Body length is appropriate for the WI type — too short auto-fails; too long hurts the sizing-accuracy dimension

Run `mle wi validate --body-file <path>.md --type <type> --threshold 4.00` to confirm a PASS verdict before submission. The publishing bar is **>=4.00** on the rubric. Do NOT submit anything below this score unless `--force` is explicitly invoked with documented justification.

## Scoring dimensions reminder

The rubric scores six dimensions: completeness (25%), type correctness (20%), actionability (20%), traceability (15%), sizing accuracy (10%), British English (10%). Aim for 5.0 on every dimension where possible; aim for >=4.00 overall to clear the publishing bar.

## Type Taxonomy Quick Reference

| Key          | Display               | Parents                                          | Sizing               |
| ------------ | --------------------- | ------------------------------------------------ | -------------------- |
| `epic`       | Epic                  | —                                                | 1+ quarters          |
| `feature`    | Feature               | epic                                             | 1–4 sprints          |
| `story`      | User Story            | feature, epic                                    | 1–5 days             |
| `pbi`        | Product Backlog Item  | feature, epic                                    | 1–5 days             |
| `task`       | Task                  | story, pbi, bug                                  | 1–8 hours            |
| `bug`        | Bug                   | story, pbi, feature, epic (bug-triage exception) | hours to days        |
| `spike`      | Spike                 | feature, story                                   | timeboxed (≤ 3 days) |
| `refactor`   | Refactor              | feature, epic                                    | 1–5 days             |
| `doc`        | Documentation         | feature, epic                                    | 1–3 days             |
| `security`   | Security / Compliance | feature, epic                                    | variable             |
| `test`       | Test Case             | story, feature                                   | minutes to hours     |
| `impediment` | Impediment            | —                                                | variable             |

Parents column = allowed parent type keys per the rubric. Empty means top-level or linked via "blocks" relations rather than strict parent.

## Specific Techniques

These techniques sharpen the five-step workflow when the body is complex
or the WI type is unfamiliar:

| Technique                                                                              | When to apply                                        | Mechanical signal                                                                                                      |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Pass `--parent <WI-ID>` on first invocation                                            | Hierarchy is known at authoring time                 | Exit code 2 surfaces hierarchy violations before any placeholder work begins                                           |
| Pipe markdown into `mle wi validate --threshold 4.00` after each edit pass             | Iterating to clear the rubric floor                  | Pre-create gate fires the same scorer; no surprise on submission                                                       |
| Use `--format both` and diff the HTML against the markdown                             | Rich-text submission to `az boards work-item create` | HTML preserves fenced blocks and tables; plain `--format html` strips review-side rendering                            |
| For Bug type, paste the full traceback into the fenced §5 block before any other edits | Authoring a regression Bug                           | Truncated tracebacks force triage to re-run the failure manually                                                       |
| Cross-reference the gate `wi-validator:rubric-threshold` from the generated body       | Any WI heading to `mle wi create`                    | Drift in the rubric-threshold gate ID surfaces under `mle skill validate --check-gates`                                |
| Walk every `{placeholder}` (and legacy `<like this>`) marker before submission         | After `mle wi author` returns                        | The pre-create validator (gate `wi-validator:rubric-threshold`) scores placeholder-bearing bodies below the 4.00 floor |

## Common Rationalizations

| The agent thinks…                                                                             | Actually…                                                                                                                                                                                                                                                                                   | Gate                             | Corpus |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "I'll leave the placeholders in — the reviewer can fill them in during PR review."            | Placeholders in a WI body are a quality signal the validator scores below the threshold. Reviewer fill-in is a separate workflow (post-create amendment) and bypasses the pre-create gate that catches under-specified asks before they land in the backlog.                                | `wi-validator:rubric-threshold`  |        |
| "The body is brief but the title is descriptive — combined they should clear the threshold."  | The rubric weights title and body separately; a strong title does not redeem a thin body. The combined-score reasoning conflates two scoring dimensions and produces a body that satisfies neither's standalone bar.                                                                        | `wi-validator:rubric-threshold`  |        |
| "Acceptance criteria can just read 'tests pass' — anything more specific would be premature." | AC of tests-pass pushes verification into the test-author's later judgement and loses the contract the WI is supposed to capture. A non-specific AC also fails the rubric's actionability dimension; premature-specificity is the rationalisation that produces unactionable backlog items. | `wi-validator:rubric-threshold`  |        |
| "I'll skip the parent link and patch it in the next PR — easier to file the WI first."        | ADO's hierarchy invariants check at create time. A WI filed without a parent rolls up to project-level and is harder to triage by Feature/Epic queries. Patching later assumes you'll remember; the discipline is to file with the parent in hand.                                          | `branch-policy:wi-link-required` |        |

## Red Flags

- Author output retains `{placeholder}` (or legacy `<like this>`) markers after the operator declares the body ready for submission — the pre-create validator scores it below the 4.00 floor.
- Acceptance Criteria section is absent or contains "tests pass" for a Feature, User Story, or Bug — the rubric's actionability dimension cannot find a contract to score.
- Parent-WI link is absent when the hierarchy table (above) mandates one — the WI rolls up to project-level and Feature/Epic queries miss it.
- American spellings (the `-ize` suffix, the `or` colour-form, the dropped `u` in honour-form) survive into the body — the British-English dimension of the rubric loses marks unconditionally.
- The generated body diverges from the per-type template in `rubrics/work-item-authoring-rubric.md` (sections removed, renamed, or reordered) — completeness dimension penalises the divergence.

## Verification

```bash
# Author a Story body and confirm structural compliance.
mle wi author --type story --seed "<descriptive title>" \
    --parent <parent-wi-id> --format markdown > /tmp/story.md

# Count the section headings — per-type minimum lives in the rubric.
grep -c '^## ' /tmp/story.md          # expected: matches the Story per-type template count

# Enumerate placeholders for fill-before-submit.
grep -nE '\{[a-z_]+\}|<[A-Za-z][^<>]{2,80}>' /tmp/story.md   # every hit must be filled

# Score against the publishing bar.
mle wi validate --body-file /tmp/story.md --type story --threshold 4.00
echo "exit=$?"                        # expected: 0 (PASS at or above 4.00)
```

Observable evidence:

- `/tmp/story.md` exists and carries every required section from `rubrics/work-item-authoring-rubric.md` §"Per-Type Templates".
- `mle wi validate` exits 0 with `Verdict: PASS` and a score at or above 4.00.
- The placeholder grep returns the enumerated list — operator fills every hit before any `mle wi create` invocation.
- The `--parent` flag's hierarchy check (Step 3) exits non-zero when the parent type violates the rubric's allowed-parents column.

## Rules

- **Always run the CLI** — do not hand-write bodies from memory; the command stays in sync with the rubric
- **Resolve hierarchy early** — pass `--parent` or `--parent-type` on first invocation so violations fail fast
- **British English** — all user-facing text (titles, prose) uses British spellings
- **No placeholder bodies** — replace every `{placeholder}` before submitting; the pre-create validator rejects bodies that still contain them
- **Preserve structure** — do not remove section headings even if you have no content; leave the heading with "N/A" if genuinely not applicable
- **Traceback completeness** — for Bug, paste the full traceback inside the fenced code block in §5, never a truncated version
- **Score gate** — aim for >=4.00 before submitting; run `mle wi validate` to check

## See Also

- `rubrics/work-item-authoring-rubric.md` — the authoritative spec this skill implements
- `.claude/rules/work-item-standards.md` — path-scope authoring rule (Feature #1969)
- `docs/user-guides/wi-authoring.md` — end-to-end worked example with validation walkthrough
- `mle work` / `mle create` — pre-create validator integration
