# Goal Structure

**Path scope**: `**`

A non-trivial implementation, bug fix, or refactor lands more reliably when the goal
is stated as observable verifiers up front and the steps are independently executable.

## Per-step verification discipline

Before writing code on a task that exceeds ~an hour, crosses a module boundary, or has
an ambiguous acceptance criterion in its issue/brief, state the plan as one row per step:

```
Step 1 — <action> → verify: <observable check>
Step N — <action> → verify: <observable check>
```

Each verifier must be observable — a test that fails before and passes after, a command
whose output proves the step landed, or a file inspection. "I'll know it when I see it"
is not a verifier.

## Strong vs weak success criteria

**Strong** (names the observable evidence):

- "`npm run test -- src/renderer/src/lib/returns.test.ts` reports pass"
- "`ls out/renderer` lists the built bundle"
- "`npm run typecheck` exits 0"

**Weak** (taste/intent/unobservable): "make it work", "fix the bug", "tidy up the
imports". Weak criteria mean underspecified scope — surface and clarify the verifier
before writing code.

## Bug-fix variant

```
Step 1 — Add a failing test reproducing the bug → verify: Vitest reports FAIL
Step 2 — Implement the fix → verify: that test reports PASS
Step 3 — Confirm no regressions → verify: `npm run test` PASS on affected modules
```

A fix landed without a reproducing test can't prove regression resistance.

## Refactor variant

Tests-green-before-and-after is the structural verifier. If tests are absent, write them
first — the refactor can't prove behavioural equivalence without a baseline. If behaviour
changes, it's a feature change, not a refactor.

## See also

- `code-standards.md`, `review-standards.md`, `testing-standards.md`
