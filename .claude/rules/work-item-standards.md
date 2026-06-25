# Work-Item Standards

**Path scope**: `**`

Every Azure DevOps work item created in this project must be rubric-compliant. The canonical spec is `rubrics/work-item-authoring-rubric.md`. Use the `mle-wi-author` skill (or `mle wi author` CLI) to generate bodies — do not hand-write from memory.

## Hierarchy Quick Reference

For the Agile process template this project uses:

| Type                  | Valid parents                                                                               | Sizing               |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| Epic                  | — (top-level)                                                                               | 1+ quarters          |
| Feature               | Epic                                                                                        | 1–4 sprints          |
| User Story            | Feature (preferred) or Epic (if single-deliverable)                                         | 1–5 days             |
| Task                  | User Story, PBI, Bug                                                                        | 1–8 hours            |
| Bug                   | User Story, PBI, Feature, or Epic (bug-triage exception — see rubric §"Bug Hierarchy Note") | hours to days        |
| Spike                 | Feature, User Story                                                                         | timeboxed (≤ 3 days) |
| Refactor              | Feature, Epic                                                                               | 1–5 days             |
| Doc                   | Feature, Epic                                                                               | 1–3 days             |
| Security / Compliance | Feature, Epic                                                                               | variable             |
| Test Case             | User Story, Feature                                                                         | minutes to hours     |
| Impediment / Issue    | — (linked via "blocks")                                                                     | variable             |

Scrum and Basic template hierarchies are covered in the rubric's §"ADO Type Taxonomy & Hierarchy".

## Required Body Content

Every WI body must contain at least:

| Content                                                  | Why it matters                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Summary (1 paragraph minimum)                            | Any reader must understand the ask without opening linked PRs or chats  |
| Per-type required sections                               | Each type has its own template — see the rubric's §"Per-Type Templates" |
| Acceptance criteria (Feature, Story, Bug, Doc, Security) | Verifiable statements, not feature descriptions                         |
| Parent link (where the hierarchy requires one)           | Breaks navigation and rolls up reporting if missing                     |
| Full traceback + repro (Bug only)                        | Without these triage re-runs the bug manually                           |

## Authoring Workflow

1. **Generate the body**:
   ```bash
   mle wi author --type <T> --seed "<short description>" \
       [--parent <WI-ID> | --parent-type <T>]
   ```
   Or invoke the `/mle-wi-author` skill in Claude Code.
2. **Fill the placeholders** — replace every `<like this>` placeholder before submitting.
3. **Create the WI** with the HTML output piped into `az boards work-item create --description`.
4. **Link to parent** immediately after creation (`az boards work-item relation add --relation-type parent --target-id <parent>`).

## DON'Ts

- Don't create one-line WI bodies — the pre-create validator (when Feature #1970 lands) will refuse them.
- Don't list child work as prose placeholders in a parent body — create real WIs and link them. (See WI #1963 for the motivating incident.)
- Don't file a WI whose type does not match its scope — Story-sized work as a Task or Epic-sized work as a Feature causes estimation drift.
- Don't skip the parent link when the hierarchy requires one. If no parent applies, reconsider whether the WI should exist.
- Don't paste truncated tracebacks on Bug WIs. The full stack goes in §5 inside a fenced code block.
- Don't use American spellings in user-facing text — all WI bodies are British English per MLE convention.

## Enforcement

| Layer           | Mechanism                                                                                                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authoring aid   | `mle-wi-author` skill + `mle wi author` CLI emit rubric-compliant skeletons (Feature #1968)                                                                                                                                                                                                                     |
| Pre-create      | `mle wi create` (or `mle work` validator / `mle wi validate` standalone) scores the linked WI body against the rubric; fails below threshold (default 4.0, raised from 3.0 in Story #2258 — see ADR-002; config via `[wi_validator]` in `~/.mle/config.toml` or `MLE_WI_VALIDATOR_*` env vars) unless `--force` |
| Path-scope rule | This file, loaded by Claude Code sessions based on the `**` path scope — every agent sees the authoring expectations                                                                                                                                                                                            |
| Review          | PRs link to WIs via branch policy; reviewers verify acceptance criteria from the WI match the PR deliverable                                                                                                                                                                                                    |

## See Also

- `rubrics/work-item-authoring-rubric.md` — authoritative spec (Pass/Fail criteria, scoring, per-type templates)
- `src/mle/data/skills/mle-wi-author/SKILL.md` — skill reference
- `.claude/rules/git-policy.md` — branch and commit rules that sit alongside these authoring rules
- Worked examples: WI #1963 (Task), #1964 (Bug), #1966 (Epic)
