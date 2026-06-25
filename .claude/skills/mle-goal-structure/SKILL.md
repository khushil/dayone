---
name: mle-goal-structure
description: 'Plan-before-coding methodology — restate the goal in observable terms, define a verifier per step, and decompose into independently-executable steps. Use before a non-trivial implementation, bug fix, or refactor.'
---

# Goal Structure

Apply this discipline before writing code: restate the task in observable terms,
attach a verifier to every step, and confirm the plan is executable without
further clarification. It mirrors `.claude/rules/goal-structure.md`.

## When to use

- Before coding a non-trivial task — guideline thresholds: more than an hour of
  effort, OR the change crosses a module boundary (`src/main` ↔ `src/renderer` ↔
  `src/shared`), OR the brief contains weak verbs ("make it work", "fix it",
  "tidy up").
- When invoked explicitly, or when you cannot answer "what test or command proves
  this is done?" without checking with the user.

This is a pre-implementation skill — it does not run after the code is written.

## Workflow

### Step 1 — Restate the goal in observable terms

Paraphrase the task in your own words. If the paraphrase reads like the original
brief, it is doing no work — try again. The aim is to surface the
assumed-but-unstated success criterion. Flag any weak verb and substitute an
observable outcome, or escalate to the user if you cannot.

- Brief: "Make the sector chart show year-to-date change."
- Paraphrase: "Add a YTD range option to `lib/` that computes percent change from
  the first trading day of the calendar year, and render it in the range picker."
- Verifier surfaced: "`npm run test -- ytd` reports a passing case asserting the
  YTD return for the frozen fixture."

### Step 2 — Define the verifier(s)

For each acceptance criterion, name one observable verifier. Allowed shapes:

- A test that fails before and passes after — `npm run test -- <pattern>` or a
  Cucumber scenario via `npm run bdd`.
- A command whose output proves the step landed — `npm run typecheck`,
  `npm run lint`, `rg -c '<pattern>' <file>`.
- A file inspection — `git show HEAD:path/to/file` contains a literal string.

Disallowed: "looks right", "user accepts", "code review approves", or anything
that defers to a human decision rather than a mechanical check.

- **Bug fix**: the reproducing test is the first verifier; the fix's verifier is
  that same test passing.
- **Refactor**: the verifier is "tests pass before AND after"; if tests are
  absent, the first step is writing the baseline.

### Step 3 — Decompose into steps

List each step as one row:

```
Step N — <action> → verify: <observable check>
```

Exactly one action and one verifier per row. Multiple verifiers → split into
multiple steps. No verifier → the step is in-head; write it down or remove it.
Map each step to one or more acceptance criteria; an unmapped step is either out
of scope or signals a missing criterion.

### Step 4 — Sanity-check independence

For each step ask: can I execute and verify this locally without re-checking with
the user?

- **Yes** → the criterion is strong; loop independently to verification.
- **No** → the criterion is weak; surface the missing detail and clarify before
  Step 1.

A plan that survives this check is the success-criteria contract. Record it in
the PR description (or the linked GitHub Issue) so reviewers and future-you can
reference it.

## Variants

- **Bug fix** — Step 1 adds a failing test that reproduces the bug (verify: test
  FAILS); Step 2 implements the fix (verify: same test PASSES); Step 3 confirms
  no regressions (verify: `npm run test` PASSES on affected modules).
- **Refactor** — Step 1 confirms baseline tests pass pre-change; Step 2 applies
  the refactor (verify: tests still PASS, no behavioural change); record the
  pre/post evidence in the PR body. A refactor that changes behaviour is a
  feature change — verify against the feature's criteria instead.

## Red flags

- Starting implementation with no written plan in the PR body or linked Issue.
- Steps with actions but no verifiers.
- A bug-fix branch whose first commit is the fix, not a reproducing test.
- A refactor PR with no before/after test evidence.
- Verifier text that contains "looks right", "feels clean", or any appeal to taste.

## Verification

```bash
# A per-step plan is visible in the PR body before implementation commits
gh pr view --json body -q .body | rg '^Step [0-9]+ —.+→ verify:'   # ≥1 match

# Bug fix: the first commit on the branch is a reproducing test
git log --reverse --format='%s' origin/master..HEAD | head -1       # starts "test"

# The affected suite is green
npm run test
```

## Rules

- **Plan in writing** — PR body or linked Issue; in-head plans do not count.
- **One verifier per step** — every step has exactly one observable check.
- **Bug-fix-as-test-first** — the reproducing test is the first commit.
- **Refactor-as-test-gate** — record pre and post test evidence.
- **Mechanical verifiers only** — a test, command, or file inspection; never
  "user accepts" or "looks right".
- **Surface weak verbs** — flag "make it work" / "fix it" / "tidy up" and clarify
  before Step 1.
- **British English** in all plan text ("behaviour", "recognise").
- **Pre-implementation only** — invoke before coding, not after.
