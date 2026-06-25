---
name: mle-refactor-module
description: 'Review module size and cohesion — recommend safe decomposition strategies with import and test migration plans.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'refactor module'
  - 'split module'
  - 'decompose'
  - 'module too big'
  - 'file too large'
  - 'break up module'
  - 'module size'
  - 'mle refactor-module'
intent_patterns:
  - "(split|decompose|refactor|break up)\\s+(this\\s+)?(module|file)"
  - "(module|file)\\s+(is\\s+)?(too\\s+)?(big|large|long)"
---

# Refactor Module

Analyse a Python module for size, cohesion, and coupling, then produce a safe decomposition plan with import rewiring and test migration guidance.

## When to Use

- When a module exceeds 500 lines or contains more than 10 public functions
- When the user says "this file is too big", "split this module", "decompose", or "/mle-refactor-module"
- Before adding features to an already large module
- During architecture review or technical debt reduction

## Workflow

### Step 1: Measure

Count lines, functions, classes, and imports for the target module. Record totals in the metrics table.

### Step 2: Analyse Cohesion

Group functions by shared state, common imports, data structures, or thematic responsibility. Identify distinct responsibility groups.

### Step 3: Map Dependencies

Build the import graph — find all files that import this module (fan-in) and all modules it imports (fan-out).

### Step 4: Identify Seams

Find natural split points. A valid seam exists when functions share internal calls but have few cross-group calls, the group has a distinct public API, and extraction does not create circular imports.

### Step 5: Plan Migration

For each proposed split: new file path, import rewrites (production and test), `__init__.py` re-exports for backward compatibility, and a `git checkout` rollback command.

### Step 6: Report

Produce the decomposition plan using the output format below.

## Specific Techniques

| Situation                                                         | Technique                                                                                                                                                             | Reference                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Module exceeds 500 lines but functions are tightly coupled        | Run `radon cc <file> -a -s` to surface cyclomatic clusters; split on the highest-CC function group rather than the largest line block                                 | `.claude/rules/code-standards.md`         |
| New submodule retains `from <pkg>.cli import ...` imports         | `core/` decomposition must remain framework-free; rewrite the import to inject the CLI hook via a Protocol, keep `core/` pure                                         | `.claude/rules/architecture-standards.md` |
| `__init__.py` re-exports broken after split                       | Append `from .new_submodule import *` and freeze the public API list in `__all__`; run `python -c 'import <pkg>.<old_module>'` to assert no AttributeError            | `<pkg>/core/<module>/__init__.py`         |
| `conftest.py` fixtures still under the old test path              | Move shared fixtures up to the nearest parent `conftest.py` ; pytest discovers fixtures by directory inheritance, so split test files inherit without explicit import | `.claude/rules/testing-standards.md`      |
| Cyclomatic complexity unchanged after the proposed split          | Re-cluster: a split that preserves complexity is rearrangement, not decomposition; raise the threshold to >8 only when CC clusters cross 80% similarity               | `src/<pkg>/core/refactor_module.py`       |
| Circular import detected post-split (`A` imports `B` imports `A`) | Extract the shared symbols into a third module `C`; both `A` and `B` import `C`; never break the cycle with deferred imports inside function bodies                   | `.claude/rules/architecture-standards.md` |

## Common Rationalizations

| The agent thinks…                                                                                        | Actually…                                                                                                                                                                                                                                                                                                      | Gate                                  | Corpus |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| "The new submodule under `core/` can import Rich for the diagnostic output — it's still business logic." | `core/` is framework-free by hard rule. A Rich import in `core/` makes the module untestable on a machine without UI dependencies and trips the architecture-boundary scan baked into the architecture tests. Diagnostic formatting moves to `cli/` or returns a structured dataclass that the caller renders. | `pre-commit:ruff`                     |        |
| "Skipping the `__init__.py` re-export is fine — callers can update their imports."                       | Backward compatibility is non-negotiable for any module with fan-in >= 5. The migration plan includes `from .new_submodule import *` precisely so existing callers keep working through the deprecation cycle. Skipping the re-export breaks `pytest` discovery on every consumer test.                        | `mle-pre-commit-review:blocker-found` |        |
| "I'll move the `conftest.py` fixtures later — pytest will still find them."                              | Pytest discovers fixtures only by directory walk; a fixture that lives under a removed source path is invisible to relocated tests. The `pre-commit:ruff` pass does not catch this — it surfaces as `fixture not found` on the next test run. Relocate fixtures in the same PR as the source split.            | `pre-commit:ruff`                     |        |

## Red Flags

- Refactor plan lists new submodules but `git diff -- src/<pkg>/__init__.py` shows no changes — `__init__.py` re-exports were forgotten
- New submodule under `src/<pkg>/core/` contains `from click import ...` or `from rich import ...` — core-isolation breached
- Test files split alongside source but `tests/<pkg>/conftest.py` is unchanged — fixtures stayed at the old path
- `radon cc <new-files> -a` reports cyclomatic-complexity average equal to pre-split value — the split was rearrangement, not decomposition
- `python -c 'import <pkg>.<old_module>'` raises `ImportError` post-split — the public API was not preserved through re-exports

## Verification

```bash
# Pre-split metrics: capture before changes
wc -l src/<pkg>/core/<module>.py > /tmp/pre-split.txt
radon cc src/<pkg>/core/<module>.py -a -s | tail -1 >> /tmp/pre-split.txt

# Post-split: every new module imports cleanly
python -c 'import <pkg>.core.<new_module_1>; import <pkg>.core.<new_module_2>'

# Backward compatibility: old import path still resolves
python -c 'from <pkg>.core.<old_module> import *; print("OK")'

# All affected tests pass post-split
python -m pytest tests/unit/test_<old_module>.py \
  tests/unit/test_<new_module>.py -q

# Architecture boundary intact: no Click/Rich/Textual in core/
grep -rnE 'from (click|rich|textual)' src/<pkg>/core/ | wc -l   # expect 0

# Cyclomatic complexity dropped on at least one new submodule
radon cc src/<pkg>/core/<new_module_1>.py -a | tail -1
```

Observable evidence:

- Pre-split LOC and CC captured in `/tmp/pre-split.txt`; post-split sum is within 5% of pre-split totals (lines moved, not duplicated)
- `python -c 'import ...'` exits 0 for every new submodule and for the old module path
- `pytest` on the affected test set exits 0
- `grep` for framework imports in `core/` returns zero hits
- `radon cc` average drops on at least one new submodule below the original module's average

## Decomposition Criteria

| Metric                             | Threshold | Recommendation      |
| ---------------------------------- | --------- | ------------------- |
| Lines of code                      | > 500     | RECOMMENDED         |
| Public functions                   | > 10      | RECOMMENDED         |
| Responsibility groups              | > 3       | RECOMMENDED         |
| Cyclomatic complexity (module avg) | > 8       | RECOMMENDED         |
| Import fan-in                      | > 15      | CAUTION — high risk |

If no metric exceeds its threshold, report that the module does not require decomposition.

## Safety Checklist

- **No circular imports** — new modules must not import each other in a cycle
- **Re-exports preserved** — all names importable from the original module remain importable
- **Test imports updated** — every test file referencing the original has a migration entry
- **Architecture boundaries** — `core/` stays framework-free; no Click, Rich, or Textual imports

## Output Format

```
## Refactor Module — {module_name}

### Module Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Lines  | {n}   | 500       | {OK/OVER} |
| Public functions | {n} | 10 | {OK/OVER} |
| Responsibility groups | {n} | 3 | {OK/OVER} |
| Fan-in | {n}   | 15        | {OK/CAUTION} |
| Fan-out | {n}  | —         | — |

### Proposed Splits
1. **{new_module}** — {responsibility}
   - Functions: {list}
   - Lines: ~{n}

### Import Migration
| File | Old Import | New Import |
|------|-----------|------------|

### Test Migration
| Test File | Change Required |
|-----------|----------------|

### Risk Assessment
- Overall: {LOW/MEDIUM/HIGH} — {explanation}
```

## Rules

- **Never split below 100 lines** — do not extract a module smaller than 100 lines
- **Respect MLE boundaries** — `core/` must remain framework-free; splits must not violate package rules
- **Include rollback** — every split includes a `git checkout` rollback command
- **British English** — use British English throughout (e.g. "analyse", "behaviour")
- **Report only** — produce the plan; let the developer execute the refactoring
- **Preserve public API** — re-exports in `__init__.py` maintain backward compatibility
- **Analyse working tree** — when pending changes exist, analyse the current version on disk
