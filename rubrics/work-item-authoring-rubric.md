# Work-Item Authoring Rubric

## Overview

This rubric defines what "good" looks like for authoring Azure DevOps work items
(WIs) across the three common process templates (Agile, Scrum, Basic). It covers
both the _taxonomy_ (which type to use, what parent it attaches to, how long it
should take) and the _body content_ (required sections, ready-to-copy skeletons).
The rubric is consumed by the `mle-wi-author` skill, the `work-item-standards`
rule, and the pre-create rubric validator invoked from `mle work` / `mle create`.

Scope: every WI created in a project that installs MLE. Applies equally to human
authors and AI agents. One-line WI bodies are an automatic FAIL regardless of
weighted score.

## Quality Dimensions

| Dimension                 | Weight | Description                                                                                      |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Completeness              | 25%    | Every required section for the chosen type is present with real content, not placeholder prose   |
| Type Correctness          | 20%    | The chosen work-item type matches the scope and the parent link obeys the hierarchy              |
| Actionability             | 20%    | Acceptance criteria are concrete, verifiable, and bounded; a reader can tell when the WI is done |
| Traceability              | 15%    | Parent links, dependency links, and cross-references to related WIs / PRs / commits are present  |
| Sizing Accuracy           | 10%    | The work-item type's expected size (quarters / weeks / days / hours) matches the scope described |
| British English & Clarity | 10%    | British spelling throughout; no jargon without expansion; prose reads cleanly                    |

Overall pass: weighted average ≥ 3.0. Any Critical anti-pattern (see below) causes
automatic FAIL regardless of score.

## Pass/Fail Criteria

| Criterion           | Pass Threshold                                               | Fail Indicator                                                                   |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Body length         | ≥ 500 characters of substantive content                      | One-line or prose-only stub                                                      |
| Required sections   | All sections for the chosen type are present                 | Missing Acceptance Criteria on any Story / Feature / Bug                         |
| Parent link         | Link obeys the hierarchy (§ Type Taxonomy)                   | Story linked directly to a Task; Feature with no Epic parent                     |
| Acceptance criteria | Every criterion is verifiable against an observable artefact | Criteria that say "works correctly" or "is complete" without evidence definition |
| Bug-specific        | Traceback or repro steps present when State ≠ "By Design"    | Bug with no repro, no traceback, no environment                                  |
| British English     | All user-facing text uses British spelling                   | American spellings ("color", "authorize") in body                                |

## Scoring Guide

### Completeness (25%)

| Score | Label          | Observable Evidence                                                                       |
| ----- | -------------- | ----------------------------------------------------------------------------------------- |
| 5     | Excellent      | Every required section populated with specifics; scope boundaries ("IN" / "OUT") explicit |
| 4     | Good           | All required sections present; one or two have brief content that could be richer         |
| 3     | Acceptable     | Core sections present (summary, acceptance criteria, parent); optional sections missing   |
| 2     | Below Standard | One required section missing, or most sections present but filled with placeholder text   |
| 1     | Poor           | Fewer than half of required sections present; body reads as a stub                        |

### Type Correctness (20%)

| Score | Label          | Observable Evidence                                                                                    |
| ----- | -------------- | ------------------------------------------------------------------------------------------------------ |
| 5     | Excellent      | Type matches scope; parent link correct; hierarchy deviation (if any) is called out with justification |
| 4     | Good           | Type and parent correct; hierarchy deviation present but not explained                                 |
| 3     | Acceptable     | Type plausibly matches scope; parent missing where one should exist                                    |
| 2     | Below Standard | Type is one level off (Story authored as Task, or Feature authored as Story)                           |
| 1     | Poor           | Type clearly wrong for scope (Epic-sized scope filed as Task, or trivial change filed as Feature)      |

### Actionability (20%)

| Score | Label          | Observable Evidence                                                                         |
| ----- | -------------- | ------------------------------------------------------------------------------------------- |
| 5     | Excellent      | Every acceptance criterion names the observable artefact (file, command output, grep count) |
| 4     | Good           | Most criteria verifiable; one or two use soft language ("works", "is supported")            |
| 3     | Acceptable     | Criteria exist and describe desired end-state but verification method is implicit           |
| 2     | Below Standard | Criteria read as feature descriptions rather than verification steps                        |
| 1     | Poor           | No acceptance criteria, or criteria consist of "the feature is built"                       |

### Traceability (15%)

| Score | Label          | Observable Evidence                                                                      |
| ----- | -------------- | ---------------------------------------------------------------------------------------- |
| 5     | Excellent      | Parent link present; dependencies called out; related WIs / PRs / commits cited with IDs |
| 4     | Good           | Parent link present; one or two related references; no explicit dependency list          |
| 3     | Acceptable     | Parent link present; no further cross-references                                         |
| 2     | Below Standard | Parent link missing but referenced in prose                                              |
| 1     | Poor           | Neither parent link nor prose references to related work                                 |

### Sizing Accuracy (10%)

| Score | Label          | Observable Evidence                                                                            |
| ----- | -------------- | ---------------------------------------------------------------------------------------------- |
| 5     | Excellent      | Scope and effort match the type (Task ≤ 1d, Story ≤ 1wk, Feature ≤ 1 sprint, Epic ≥ 1 quarter) |
| 4     | Good           | Scope within one-step tolerance of expected size                                               |
| 3     | Acceptable     | Scope plausibly within the type's range; unclear whether on the small or large end             |
| 2     | Below Standard | Scope two sizes off (Story-sized work filed as Task, or Epic-sized work filed as Feature)      |
| 1     | Poor           | Scope radically mismatched (minute-sized Task filed as Epic, or year-long Epic filed as Story) |

### British English & Clarity (10%)

| Score | Label          | Observable Evidence                                                                  |
| ----- | -------------- | ------------------------------------------------------------------------------------ |
| 5     | Excellent      | British spelling throughout; technical terms expanded on first use; short paragraphs |
| 4     | Good           | British spelling consistent; one or two unexpanded acronyms                          |
| 3     | Acceptable     | One or two American spellings; prose readable                                        |
| 2     | Below Standard | Mixed spellings; long wall-of-text paragraphs                                        |
| 1     | Poor           | American spellings dominant, or prose unreadable without re-reading                  |

## ADO Type Taxonomy & Hierarchy

### Agile process template

```
Epic → Feature → User Story → Task
                            └─ Bug          (Task sibling)
                            └─ Test Case    (Task sibling)
                            └─ Issue        (Task sibling)
```

### Scrum process template

```
Epic → Feature → Product Backlog Item (PBI) → Task
                                           └─ Bug          (Task sibling)
                                           └─ Test Case    (Task sibling)
                                           └─ Impediment   (Task sibling)
```

### Basic process template

```
Epic → Issue → Task
             └─ Bug    (Task sibling)
```

### Sizing expectations

| Type               | Expected duration              | Expected scope                            |
| ------------------ | ------------------------------ | ----------------------------------------- |
| Epic               | 1 or more quarters             | Strategic outcome, multiple capabilities  |
| Feature            | 1–4 sprints                    | One coherent capability, multiple Stories |
| User Story / PBI   | 1–5 days                       | One user-visible change, multiple Tasks   |
| Task               | 1–8 hours                      | One concrete unit of work                 |
| Bug                | Hours to days                  | Defect — triage to fix                    |
| Spike              | Timeboxed (typically ≤ 3 days) | Answer a question, produce a decision     |
| Test Case          | Minutes to hours               | Executable test scenario                  |
| Impediment / Issue | Variable                       | Blocker surfaced for resolution           |

## Per-Type Templates

Each subsection gives: **Purpose**, **Parent / Child**, **Required sections**, and a **Body skeleton** ready to copy.

### Epic

**Purpose** — A strategic outcome spanning multiple Features. Defines _why_ a body of work exists and what success looks like at the business level.

**Parent / Child** — No parent. Children are Features.

**Required sections** — Business outcome; Strategic rationale; Success metrics; Scope (IN / OUT); Child Features (table with WI IDs once created); Stakeholders; Motivating incidents (optional but strongly recommended).

**Body skeleton**

```markdown
# <Epic title>

## 1. Business outcome

<One paragraph: what changes in the business / product / codebase when this Epic is done?>

## 2. Strategic rationale

<Why now, why this approach, what is the alternative we rejected?>

## 3. Success metrics

| Metric | Baseline | Target |
| ------ | -------- | ------ |

## 4. Scope

IN: ...
OUT: ...

## 5. Child Features

| WI  | Title | Notes |
| --- | ----- | ----- |

## 6. Stakeholders

<Owner, affected teams>

## 7. Motivating incidents / prior art

<Links to past bugs, PRs, ADRs that triggered this work>
```

### Feature

**Purpose** — One coherent capability delivered over 1–4 sprints. Decomposes into Stories / PBIs.

**Parent / Child** — Parent: Epic. Children: User Stories / PBIs.

**Required sections** — Capability; User value; Acceptance criteria; Scope (IN / OUT); Dependencies; Child Stories (proposed); Target release; Parent Epic link.

**Body skeleton**

```markdown
# Feature: <title>

## 1. Capability

<What the Feature adds>

## 2. User value

<Who benefits and how>

## 3. Acceptance criteria

- [ ] ...

## 4. Scope

IN: ...
OUT: ...

## 5. Dependencies

<Other Features / Stories this blocks or is blocked by>

## 6. Proposed child Stories

1. ...

## 7. Target release

<Sprint / quarter / release tag>

## 8. Parent Epic

#<id>
```

### User Story / PBI

**Purpose** — One user-visible change, deliverable in 1–5 days. User Story (Agile) and PBI (Scrum) are interchangeable for authoring purposes.

**Parent / Child** — Parent: Feature (preferred) or Epic (allowed when the Story is a single-deliverable increment not grouped with siblings — see Hierarchy Note below). Children: Tasks.

**Required sections** — User story (as a role I want X so that Y); Why now; Acceptance criteria; Scope (IN / OUT); Non-functional constraints; Child Tasks (proposed); Effort estimate; Parent link.

**Body skeleton**

```markdown
# <Story title>

## 1. User story

_As a <role> I want <capability> so that <value>._

## 2. Why now

<Triggering context>

## 3. Acceptance criteria

- [ ] Observable artefact: ...
- [ ] Observable artefact: ...

## 4. Scope

IN: ...
OUT: ...

## 5. Non-functional constraints

<Perf, a11y, compat, security>

## 6. Proposed child Tasks

1. ...

## 7. Effort estimate

Size: S / M / L / XL. Confidence: Low / Medium / High.

## 8. Parent

#<id>
```

### Task

**Purpose** — One concrete unit of work completable in hours.

**Parent / Child** — Parent: User Story / PBI / Bug. No children.

**Required sections** — Objective; Definition of done; Parent link; Effort estimate.

**Body skeleton**

```markdown
# Task: <title>

## 1. Objective

<Single-sentence statement of what this Task changes>

## 2. Definition of done

- [ ] ...

## 3. Parent

#<id>

## 4. Effort estimate

<Hours>
```

### Bug

**Purpose** — A defect against existing behaviour.

**Parent / Child** — Parent: User Story / PBI / Feature (the capability the defect was found against), or Epic (allowed for the bug-triage parent pattern — see Bug Hierarchy Note below). Children: Tasks (for multi-part fixes).

**Required sections** — Summary; Environment; Repro; Expected vs Actual; Full traceback or logs; Root cause (when known); Scope (affected files / components); Verification; Acceptance criteria; Severity.

**Body skeleton**

```markdown
# Bug: <short symptom>

## 1. Summary

<User-visible symptom>

## 2. Environment

<Version, OS, relevant dependencies>

## 3. Repro
```

<commands>
```

## 4. Expected vs Actual

| Expected | Actual |
| -------- | ------ |

## 5. Full traceback

```
<traceback or log snippet>
```

## 6. Root cause

<If known at creation time; otherwise leave for triage>

## 7. Scope

<Files / components affected>

## 8. Verification

<Commands the fixer runs to prove the fix>

## 9. Acceptance criteria

- [ ] ...

## 10. Severity

<1 Critical / 2 High / 3 Medium / 4 Low>

````

### Spike / Investigation

**Purpose** — Answer a question that gates a downstream decision. Timeboxed.

**Parent / Child** — Parent: Feature or Story. Output: decision document (ADR, wiki page, or comment on parent).

**Required sections** — Question; Timebox; Deliverable; Exit criteria; Parent link.

**Body skeleton**

```markdown
# Spike: <question>

## 1. Question
<What decision does this Spike unblock?>

## 2. Timebox
<Max effort, e.g. 3 days>

## 3. Deliverable
<ADR number, wiki page, comment on parent — pick one>

## 4. Exit criteria
- [ ] Decision documented at <location>
- [ ] Follow-up WIs created (if decision is "proceed")

## 5. Parent
#<id>
````

### Refactor / Tech Debt

**Purpose** — Improve internal quality without changing external behaviour.

**Parent / Child** — Parent: Feature (if part of a capability) or Epic (if cross-cutting). Children: Tasks for individual refactors.

**Required sections** — Current pain; Proposed end-state; Scope (IN / OUT); Risk; Verification (must prove no behaviour change); Parent link.

**Body skeleton**

```markdown
# Refactor: <area>

## 1. Current pain

<What is wrong today and who feels it>

## 2. Proposed end-state

<What the code looks like after>

## 3. Scope

IN: ...
OUT: ...

## 4. Risk

<What could break; mitigations>

## 5. Verification

<How we prove no behaviour change — tests, golden files, bench>

## 6. Parent

#<id>
```

### Doc

**Purpose** — Produce or update documentation.

**Parent / Child** — Parent: Feature or Epic. No children unless substantial.

**Required sections** — Audience; Topic; Outline; Location(s); Acceptance criteria.

**Body skeleton**

```markdown
# Doc: <topic>

## 1. Audience

<Who reads it>

## 2. Topic & scope

<What it covers and does not cover>

## 3. Outline

1. ...

## 4. Location(s)

- `docs/...`
- Wiki page: ...

## 5. Acceptance criteria

- [ ] ...
```

### Security / Compliance

**Purpose** — Address a security finding or regulatory requirement.

**Parent / Child** — Parent: Feature or Epic. Children: Tasks.

**Required sections** — Finding; Affected surface; Regulatory mapping (if any); Remediation plan; Verification; Severity.

**Body skeleton**

```markdown
# Security: <short title>

## 1. Finding

<What was discovered, how, by whom>

## 2. Affected surface

<Files / services / data flows>

## 3. Regulatory mapping

<DORA / EU AI Act / Solvency II article, if applicable>

## 4. Remediation plan

<Steps>

## 5. Verification

<How we prove the finding is closed>

## 6. Severity

<1–4>
```

### Test Case

**Purpose** — One executable test scenario linked to a requirement.

**Parent / Child** — Parent: User Story / Feature (the requirement under test). No children.

**Required sections** — Precondition; Steps; Expected result; Linked requirement.

**Body skeleton**

```markdown
# Test Case: <scenario>

## 1. Precondition

<State the system must be in before the test runs>

## 2. Steps

1. ...
2. ...

## 3. Expected result

<Observable outcome>

## 4. Linked requirement

#<id>
```

### Impediment / Issue

**Purpose** — Surface a blocker for resolution (Scrum uses "Impediment", Agile uses "Issue").

**Parent / Child** — Parent: whichever WI is blocked. No children.

**Required sections** — Blocker description; Affected work; Ask (what unblocks us); Owner.

**Body skeleton**

```markdown
# Impediment: <blocker>

## 1. Blocker

<What is blocking progress>

## 2. Affected work

<WI IDs>

## 3. Ask

<What the team needs to unblock>

## 4. Owner

<Who is resolving>
```

## Hierarchy Note — when a Story may parent directly to an Epic

Strict Agile: Story parents to Feature, never to Epic. In practice, small-scope
Epics (a single document, a single skill, one-off migrations) sometimes have only
one Story and creating a Feature layer adds bureaucracy without traceability value.
The rubric allows a Story to parent directly to an Epic when **all** the following
hold:

1. The Epic's full scope is deliverable in ≤ 10 working days.
2. The Story is the sole deliverable under the Epic, OR subsequent sibling work
   is Task-sized (not Feature-sized).
3. The Story's body explicitly documents the hierarchy deviation and why.

Otherwise, introduce a Feature.

## Bug Hierarchy Note — when a Bug may parent directly to an Epic

Strict Agile: a Bug parents to the User Story / PBI / Feature whose capability it
defects against. In practice, the bug-triage parent pattern — collecting many
related defects under a single triage Epic — is operator-tolerated and observed
across `project-troy` (e.g. Epic #1880 has 10+ direct Bug children). The rubric
allows a Bug to parent directly to an Epic when **all** the following hold:

1. The Epic is a triage / convergence umbrella whose explicit purpose is to
   aggregate defects (not a feature-delivery Epic).
2. No User Story / PBI / Feature would be a more specific parent — i.e. the
   defect crosses capability boundaries or pre-dates the affected capability's
   own WI.
3. The Bug's body Section 7 (Scope) names the cross-capability surface and
   references the umbrella Epic explicitly.

Otherwise, parent the Bug to the Story / PBI / Feature whose capability the
defect was found against.

## Worked Examples

| WI                                                                               | Type         | What it demonstrates                                                                                                           |
| -------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [#1963](https://dev.azure.com/project-troy/ai-sdlc-tooling/_workitems/edit/1963) | Task (chore) | Short but rich Task body: summary, what happened, why it matters, single-line change, verification, acceptance criteria        |
| [#1964](https://dev.azure.com/project-troy/ai-sdlc-tooling/_workitems/edit/1964) | Bug          | The full Bug template: traceback, environment, repro, expected vs actual, root cause, scope, verification, severity            |
| [#1966](https://dev.azure.com/project-troy/ai-sdlc-tooling/_workitems/edit/1966) | Epic         | The full Epic template: business outcome, metrics, scope IN/OUT, child WI table (not prose placeholders), motivating incidents |

## Common Anti-Patterns

| Pattern                                | Why it fails                                                               | Correct form                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| One-line body                          | Zero context for pickup; any agent will re-derive it (poorly) from commits | Fill in the template for the chosen type                                                   |
| Prose-only child list                  | Placeholders drift; work gets lost (see WI #1963 motivating incident)      | Create child WIs as real items; link them in a table                                       |
| "As a user, I want the feature"        | Empty user-story shell; no role, no value                                  | Name the role and the value: _As a **TUI contributor**, I want …_                          |
| Acceptance criteria stated as features | "The skill should work" is not verifiable                                  | Name the observable artefact: "`mle-wi-author --type bug` emits a body with sections 1–10" |
| Story filed as Task                    | Hours-sized claim but days-sized scope; estimation drift                   | Re-author as User Story; decompose into Tasks                                              |
| Missing parent link                    | Breaks hierarchy navigation; burden shifts to readers                      | Always set the parent; if none applies, reconsider whether the WI should exist             |
| Bug without traceback                  | Triage has to re-run the bug                                               | Paste the full traceback, even if long — use fenced code blocks                            |

## Version History

| Version | Date       | Change                                  |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-04-22 | Initial draft (Story #1967, Epic #1966) |

## See Also

- `src/mle/data/scaffold/rubrics/work-item-authoring-rubric.md` — scaffold mirror deployed by `mle init`
- `.claude/rules/work-item-standards.md` — rule enforcing the rubric at Claude Code session level (Feature #1969)
- `docs/reference/skills-overview.md` — location of the `mle-wi-author` skill once delivered (Feature #1968)
- `rubrics/README.md` — rubric catalogue
- `docs/review-tooling/rubric-format-conventions.md` — rubric authoring guide
