---
name: mle-feedback
description: 'Feedback loop for DayONE — when a later stage fails, classify the root cause and propose concrete upstream remediation tasks.'
keywords:
  - 'analyse feedback'
  - 'root cause'
  - 'why did this fail'
  - 'remediation tasks'
  - 'feedback loop'
  - 'upstream fix'
intent_patterns:
  - "(analyse|classify)\\s+(root\\s+)?cause"
  - "(generate|create)\\s+remediation\\s+tasks"
  - "why\\s+(did|does)\\s+(this|it)\\s+(fail|break)"
---

# Feedback Loops

When a downstream stage exposes a defect — a failing test, a design review
finding, a bug in the field — the cheapest fix is rarely at the point of
detection. Classify the **root cause**, then propose remediation aimed at the
upstream stage that actually let the defect through.

## When to Use

- After a test, review, or build failure reveals more than a local typo
- When the user says "root cause", "why did this fail", "remediation", or
  "/mle-feedback"
- When the same class of defect keeps recurring (a systemic, not local, signal)

## Inputs

- The failure evidence: `npm run test` / `npm run bdd` / `npm run typecheck` /
  `npm run build` output, an ESLint report, a code-review comment, or a bug
  report (GitHub issue).

## Root-Cause Categories

| Category          | Means                                                         | Upstream target                       |
| ----------------- | ------------------------------------------------------------- | ------------------------------------- |
| `requirement_gap` | Acceptance criteria were ambiguous or missing                 | Requirements (the issue/spec)         |
| `design_flaw`     | A boundary, contract, or architecture decision is wrong       | Design (ADR in `docs/adr/`)           |
| `code_bug`        | Implementation diverges from a correct design                 | Implementation (`src/**`)             |
| `test_gap`        | Behaviour was correct but untested, so the regression slipped | Tests (`*.test.ts(x)`, `features/**`) |
| `contract_drift`  | A Zod schema and its consumers fell out of sync               | `src/shared` + importers              |

## Workflow

1. **Gather the evidence** — capture the exact failing command output and the
   smallest reproduction.
2. **Classify the root cause** — pick the category above for the _origin_ of the
   defect, not where it surfaced. Ask: at which stage would catching this have
   been cheapest? A test that "should have existed" is a `test_gap`, not a
   `code_bug`.
3. **Propose remediation upstream** — write one concrete task per root cause,
   targeting the responsible stage:
   - `requirement_gap` → clarify the acceptance criteria on the GitHub issue.
   - `design_flaw` → raise/amend an ADR; supersede, never edit, an accepted one.
   - `test_gap` → add the missing Vitest/BDD test (failing first, then green).
   - `code_bug` → fix in `src/**`, led by a reproducing test per the bug-fix
     discipline.
   - `contract_drift` → update the `src/shared` schema and realign consumers.
4. **Close the loop** — note the verifier that will prove each task done (a
   command that fails now and passes after) and the GitHub issue/PR to track it.

## Rules

- Process **all** findings from every provided source, not the first one only.
- A remediation task targets the **root-cause stage**, never the detection stage.
- Every proposed task carries an observable verifier; "tidy up" is not a task.
- Recurring defects of one category signal a process gap — call it out.

## Verification

Each remediation task names a command (`npm run test|bdd|typecheck|build`) or a
file inspection that fails before the fix and passes after. The loop is closed
only when that evidence is recorded against a tracked GitHub issue/PR.
