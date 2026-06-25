# Goal Structure

**Path scope**: `**`

A non-trivial implementation, bug fix, or refactor lands more reliably when the goal is stated as observable verifiers up front and the steps are structured to be independently executable. This rule names that discipline.

## Per-Step Verification Discipline

Before writing code on a task that exceeds an hour of expected effort, or that crosses a module boundary, or that has an ambiguous Acceptance Criterion in its work item, state the plan as one row per step in this form:

```
Step 1 — <action> → verify: <observable check>
Step 2 — <action> → verify: <observable check>
Step N — <action> → verify: <observable check>
```

Each verifier must be observable — a test that fails before the step and passes after, a command whose output proves the step landed, or a file inspection. "I'll know it works when I see it" is not a verifier; it is a deferred decision.

Strong success criteria let the agent loop independently to verification without re-checking with the user. Weak criteria require constant clarification and waste both the agent's and the user's time.

## Strong vs Weak Success Criteria

A criterion is **strong** when it names the observable evidence that decides the outcome. Examples:

- "`pytest tests/unit/test_X.py::test_handles_empty_list -v` reports pass"
- "`ls dist/` lists the built wheel artefact"
- "`grep -c '^## ' docs/X.md` returns at least 6"

A criterion is **weak** when it appeals to taste, intent, or unobservable outcomes. Examples:

- "Make it work"
- "Fix the bug"
- "Tidy up the imports"
- "Improve readability"

Weak criteria indicate underspecified scope. Surface them and clarify the verifier before writing code. The clarified verifier becomes the success criterion that future work and review can both reference.

## Bug-Fix Variant

For bug fixes, the first step is always a test that reproduces the bug. The test fails before the fix and passes after. The implementation step's verifier is the same test now passing.

```
Step 1 — Add failing test reproducing the bug → verify: test runner reports FAIL
Step 2 — Implement the fix → verify: test runner reports PASS
Step 3 — Confirm no regressions → verify: test runner reports PASS on the affected modules
```

A fix landed without a reproducing test cannot prove regression resistance; the same bug can return silently.

## Refactor Variant

For refactors, the tests-pass-before-and-after gate is the structural verifier. If the tests are absent, write them first — the refactor cannot prove behavioural equivalence without a baseline.

```
Step 1 — Verify baseline tests pass on the pre-refactor code → verify: test runner reports PASS
Step 2 — Apply the refactor → verify: test runner reports PASS (no behavioural change)
Step 3 — Optional cleanup of orphans the refactor created → verify: lint and tests still PASS
```

If a refactor PR changes behaviour, it is no longer a refactor; treat it as a feature change and verify against the feature's acceptance criteria instead.

## See Also

- `.claude/rules/code-standards.md` — type, style, and architecture rules
- `.claude/rules/review-standards.md` — Review Checklist includes a Goal-structure row
- `.claude/rules/testing-standards.md` — testing conventions for this project
