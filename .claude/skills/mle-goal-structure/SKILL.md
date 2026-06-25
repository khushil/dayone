---
name: mle-goal-structure
description: 'Plan-before-coding methodology — restate the goal in observable terms, define per-step verifiers, decompose into independently-executable steps. Activates when given a non-trivial implementation, bug fix, or refactor task.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'plan before coding'
  - 'structured plan'
  - 'verifiable goals'
  - 'per-step verification'
  - 'before I implement'
  - 'before I start'
  - "what's the plan"
  - 'goal structure'
  - 'mle goal-structure'
intent_patterns:
  - "(plan|structure|design)\\s+(this|the|my)\\s+(implementation|change|fix|refactor)"
  - "(before|prior\\s+to)\\s+(coding|implementing|starting)"
  - "(what'?s|what\\s+is)\\s+(the|my)\\s+plan"
  - "(structure|verify)\\s+(my\\s+)?(goal|plan)"
---

# Goal Structure

Apply the goal-structure discipline before coding: restate the task in observable terms, define a verifier per step, and confirm the plan is executable without further user clarification.

## When to Use

- Before writing code on a non-trivial task — guideline thresholds: more than an hour of expected effort OR crosses module boundaries OR the work item body contains weak verbs ("make it work", "fix it", "tidy up")
- When the user invokes `/mle-goal-structure` explicitly
- When you notice you cannot answer "what test or command proves this is done?" without checking with the user

This is a pre-implementation skill — it does not run after the code is written. Post-implementation review is owned by `mle-pre-commit-review` and `mle-peer-code-review`.

## Workflow

### Step 1: Restate the goal in observable terms

Paraphrase the task in your own words and check the paraphrase against the work item body. Flag any verbs that are weak ("make it work", "fix it", "improve", "tidy up") and substitute or escalate.

If the paraphrase reads like the original brief, the rephrasing is doing no work — try again. The aim is to surface the assumed-but-unstated success criterion.

Example transformation:

- Brief: "Make the cost report show plan-aware totals."
- Paraphrase: "Add a `--plan` flag to `mle cost` that aggregates token spend per Claude plan (Pro/Max/etc.) and renders the breakdown in the report header."
- Verifier surfaced: "`mle cost --plan pro --skill | jq .aggregated_by` returns the literal string `plan`."

### Step 2: Define the verifier(s)

For each acceptance criterion in the work item body, name the observable verifier. Allowed verifier shapes:

- A test that fails before the change and passes after (`pytest tests/X/test_Y.py::test_Z -v` reports PASS)
- A command whose output proves the step landed (`grep -c '^## ' file.md` returns a specific number)
- A file inspection (`git show origin/main:path/to/file` exists and contains a literal string)

Disallowed verifier shapes:

- "Looks right"
- "User accepts the change"
- "Code review approves"
- Any verifier that defers to a human decision rather than a mechanical check

For bug fixes, the test that reproduces the bug is the first verifier; the fix's verifier is the same test now passing.

For refactors, the structural verifier is "tests pass before AND after"; if the tests are absent, the first step is writing the baseline tests.

### Step 3: Decompose into steps

List each step as one row in this form:

```
Step N — <action> → verify: <observable check>
```

Each row has exactly one action and exactly one verifier. If a step has multiple verifiers, decompose it into multiple steps. If a step has no verifier, the step is in-head — write it down or remove it.

Map each step to one or more acceptance criteria in the work item body. If a step maps to no AC, decide whether the step is in scope or whether the AC is missing from the work item.

### Step 4: Sanity-check independence

Read each step in turn and ask: can I execute this step and verify it locally without re-checking with the user?

- If YES: the criterion is strong; the agent can loop independently to verification.
- If NO: the criterion is weak; surface the missing detail and clarify before starting Step 1.

A plan that survives the independence check is the success-criteria contract for the work. Land it in the PR description or as a work-item comment so reviewers and future you can reference it.

## Specific Techniques

| Situation                                        | Technique                                                                                                                                            | Reference                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Acceptance Criterion uses a weak verb            | Substitute an observable verifier; if the substitution is unclear, ask the user — do not guess                                                       | `rubrics/goal-structure-rubric.md` Common Anti-Patterns                                      |
| Bug-fix has no reproducing test in the WI body   | Author the test as the first commit on the branch; the test is the bug's specification                                                               | `.claude/rules/testing-standards.md` TDD discipline (the agent-platform-scoped form of this) |
| Refactor PR with no test evidence in the WI body | Run the test suite on the pre-refactor tip; record the output in the PR description; the refactor's verifier is the same suite passing post-refactor | `.claude/rules/review-standards.md` Review Checklist                                         |
| Multi-step plan reads as one giant step          | Decompose until each row has one action and one verifier; reviewers cannot evaluate compound steps                                                   | `.claude/rules/goal-structure.md` Per-Step Verification Discipline                           |
| Verifier is "code review approves"               | Substitute with a mechanical check; reviewer approval is the gate, not the verifier                                                                  | This skill, Step 2                                                                           |

## Common Rationalizations

| The agent thinks…                                                                       | Actually…                                                                                                                                                                                                                      | Gate                                  |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| "The work item body says 'make it work', so I'll start coding and figure out the rest." | "Make it work" is a vague criterion; the verifier is unknown. The agent that starts without clarifying will waste cycles producing something that may not match the user's unstated intent. Surface and clarify before coding. | `wi-validator:rubric-threshold`       |
| "This is a small fix, I don't need a written plan."                                     | Small fixes still need a verifier — for bugs, the reproducing test; for tweaks, the observable change. The fix-versus-no-op distinction is unobservable without a verifier; reviewers cannot evaluate the change.              | `mle-pre-commit-review:blocker-found` |
| "I'll write the plan in my head and just code."                                         | In-head plans cannot be reviewed and cannot be referenced after the PR closes. Land the plan in the PR description; the cost is two minutes and the benefit is reviewer alignment plus future-you's audit trail.               | `branch-policy:reviewer-required`     |
| "I'll define the verifier after I see what the code looks like."                        | Post-hoc verifiers tend to be reverse-engineered from whatever the code already does, which defeats the point. The verifier must be defined before the code so it can fail before the code lands.                              | `pre-commit:ruff`                     |
| "The acceptance criteria in the work item body are good enough."                        | Acceptance criteria are the success contract; the per-step plan is the execution structure. They are different artefacts. A good plan maps each step to one or more ACs explicitly.                                            | `wi-validator:rubric-threshold`       |

## Red Flags

- Starting implementation without a written plan visible in the PR body or work-item thread
- Plan steps that contain actions but no verifiers
- Bug-fix branch whose first commit is the implementation, not a reproducing test
- Refactor PR with no evidence that tests passed before the refactor
- Verifier text that contains "user accepts", "looks right", "feels clean", or any other appeal to taste
- A plan that restates the task title with no decomposition

## Verification

```bash
# Plan visible in PR body before implementation commits
mle pr show --skill | jq -r '.body' | grep -E '^Step [0-9]+ —.+→ verify:'
# Expected: at least one match

# Bug-fix: first commit on the branch is a failing test
git log --reverse --format='%s' origin/main..HEAD | head -1
# Expected: starts with "test:" or "test(scope):" — the reproducing test

# Refactor: PR body cites pre-refactor and post-refactor test evidence
mle pr show --skill | jq -r '.body' | grep -cE 'pre-?refactor.*pass|post-?refactor.*pass'
# Expected: at least 2

# Step count maps to acceptance criteria
mle wi show $(mle pr show --skill | jq -r '.work_item_id') --format md | grep -c '^- \[ \]'   # ACs
mle pr show --skill | jq -r '.body' | grep -cE '^Step [0-9]+'                                 # Plan steps
# Steps should equal or exceed ACs (steps may be more granular)
```

Observable evidence of skill success:

- The PR body contains a per-step plan visible to reviewers
- Each plan step has a verifier; no step appeals to taste or defers to the user
- For bug-fix PRs, a reproducing test commit precedes the implementation commit
- For refactor PRs, pre/post test evidence is recorded
- The agent's questions about the task (if any) surfaced before Step 1 of implementation, not during

## Rules

- **State the plan in writing** — in the PR body or the work-item thread; in-head plans do not satisfy the discipline
- **One verifier per step** — every step has exactly one observable check; multi-verifier steps decompose
- **Bug-fix-as-test-first** — the reproducing test is always the first commit on a bug-fix branch
- **Refactor-as-test-gate** — refactors record pre and post test evidence; refactors that change tests are not refactors
- **British English** — use British English in all plan text (e.g. "behaviour", "recognise")
- **Pre-implementation only** — invoke this skill before coding; do not invoke after the code is written
- **Mechanical verifiers** — every verifier is a test, command, or file inspection; never "user accepts" or "looks right"
- **Surface weak verbs** — flag "make it work" / "fix it" / "tidy up" and clarify before Step 1
- **Independence check** — every plan must survive the question "can I execute and verify this locally without re-checking with the user?"
