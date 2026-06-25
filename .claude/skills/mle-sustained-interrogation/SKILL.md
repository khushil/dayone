---
name: mle-sustained-interrogation
description: 'Epistemic-discipline methodology — surface assumptions and tag their confidence, enumerate at least two readings of an ambiguous brief, record a falsifier for every claim, and converge on observable criteria before committing to execution.'
---

# Sustained Interrogation

An invokable plan-mode methodology that surfaces assumptions, enumerates
alternative interpretations, records falsifiers, and verifies eight named
convergence criteria before any execution commitment. It mirrors
`.claude/rules/epistemic-discipline.md`.

## When to use

- **Plan authoring** — when writing a plan that downstream work inherits (a
  `.claude/plans/*.md` file, a design note, or a GitHub Issue body).
- **Multi-agent fan-out** — before dispatching subagents, where one weak
  assumption cascades across the team.
- **Explicit invocation** — "interrogate my plan", "surface my assumptions",
  "what am I missing?".
- **Self-triggered** — when you notice you are committing to one interpretation
  without surfacing alternatives, or accepting a brief whose verifier is unclear.

Pre-execution only; it does not run after code is written. The complementary
plan-shape skill is `mle-goal-structure` (per-step verification of _what_ is
built); this skill scopes _whether the plan's premises hold_. Record the output
in a findings note — a scratch markdown file, the plan itself, or the Issue/PR
body — so the reasoning is auditable.

## Workflow

### Step 1 — Brief restatement

Paraphrase the ask in your own words. If the paraphrase reads like the original
brief, it is doing no work — try again. Flag weak verbs ("make it work",
"fix it", "tidy up") for clarification in Step 7.

### Step 2 — Alternative interpretations

For any brief that admits multiple readings, enumerate at least two. For each,
record its scope, likely cost, and the evidence (file path, command output,
prior conversation) that supports or refutes it. Do not pick silently. If one
survives scrutiny, record the brief as unambiguous; if two or more survive, the
brief is ambiguous and the user must resolve it (see criterion 8).

### Step 3 — Assumption inventory

List every assumption the plan depends on and tag each with a confidence label:

- `verified` — directly read the source (file, command output) this session.
- `inferred` — follows from a verified fact via stated logic.
- `assumed` — taken on trust; not checked.
- `refuted` — known false (record the source).

Every `assumed` claim the plan depends on for correctness must be promoted to
`verified` or `refuted` before Step 6. `inferred` is acceptable if the logic is
recorded.

### Step 4 — Falsifiers

For every falsifiable claim, name a falsifier — a command, query, or inspection
whose output would refute it if it were wrong (`npm run test` reports FAIL,
`rg` returns 0, `git show` reports a missing file, `gh pr view` shows an
unexpected state). A claim with no falsifier is either tautological (tag it
`untestable-by-design`) or too vague (return to Step 1).

### Step 5 — Reversal cost

Tag every reversible decision with its reversal cost (`cheap`, `moderate`,
`expensive`) and the consequence of reversing it. Expensive-to-reverse decisions
deserve more scrutiny before commitment.

### Step 6 — Convergence verification

Walk the eight criteria; record an answer for each. The run terminates when ALL
eight are answered — there is no iteration cap; convergence drives termination.

1. Every sub-High-confidence assumption is named and confidence-tagged.
2. Every external-state claim is verified by direct read, not inferred.
3. Alternative interpretations are surfaced for any ambiguous ask.
4. Every reversible decision is tagged with its reversal cost.
5. Every dependency the plan relies on is verified to exist and be in the
   expected state (a tool, a file, a CI check, a branch).
6. Every falsifiable claim has a recorded falsifier.
7. No `TBD`, placeholder, or weak-verb success criteria remain — all resolved or
   escalated.
8. The user is given a single yes/no decision (or a small set of named options)
   when ambiguity exceeds your authority; the question is not deferred.

## Red flags

- Inventorying assumptions (Step 3) before surfacing interpretations (Step 2).
- An assumption tagged `verified` with no source cited.
- A claim with no matching falsifier.
- A weak verb accepted as the success criterion with no criterion-8 question raised.
- A findings note that is empty or only restates the brief.
- A convergence criterion answered "later" or "not applicable" with no rationale.

## Rules

- **Surface, don't perceive** — run the methodology when the trigger holds,
  regardless of how simple the brief looks; the eight criteria scale, the
  contract does not.
- **No iteration cap** — termination is convergence-driven (eight criteria).
- **Silent interpretation is forbidden** — enumerate ≥2 readings and surface the
  decision when a brief is ambiguous.
- **Verify before convergence** — promote every load-bearing `assumed` to
  `verified` or `refuted` before Step 6.
- **Falsifiable or flagged** — every claim gets a falsifier or an explicit
  `untestable-by-design` tag.
- **British English** in all findings text ("behaviour", "analyse").
- **Escalate, don't guess** — when ambiguity exceeds your authority, ask one
  clear question rather than picking a default.
