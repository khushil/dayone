---
name: mle-error-audit
description: 'Audit error handling patterns — find bare excepts, swallowed errors, missing context, and inconsistent error reporting.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'error audit'
  - 'audit errors'
  - 'check error handling'
  - 'bare excepts'
  - 'exception handling'
  - 'error patterns'
  - 'swallowed errors'
  - 'mle error-audit'
intent_patterns:
  - "(audit|review|check|scan)\\s+(error|exception)\\s+(handling|patterns)"
  - "(find|detect)\\s+(bare|swallowed|missing)\\s+(except|error|exception)"
---

# Error Audit

Audit all error handling sites in a codebase, scoring each against a pattern table and producing a structured health report.

## When to Use

- Before a major release or quality gate
- When the user says "audit errors", "check error handling", "find bare excepts", or "/mle-error-audit"
- After refactoring exception hierarchies
- When investigating unreliable error recovery

## Workflow

### Step 1: Discover

Find all Python files in the target scope (default: `src/`), excluding vendored, generated, and `__pycache__` directories. Report the total: "Scanning N Python files."

### Step 2: Classify

For each file, identify every `try`/`except` block (note caught exceptions), every `raise` statement (note whether `from` is used), and error-returning patterns. Record the file, line number, and site type.

### Step 3: Analyse

Check each site against the pattern detection table.

| Pattern                                                      | Severity | Message                                                                       |
| ------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| `except:` or `except Exception:` without re-raise            | BLOCKER  | Bare/broad except swallows all errors — catch specific exceptions or re-raise |
| `except SomeError: pass` (swallowed error)                   | BLOCKER  | Exception caught and silently discarded — log or re-raise                     |
| `raise` without `from` in chained exceptions                 | WARNING  | Missing exception chaining — use `raise X from Y` to preserve traceback       |
| Missing error context (no message in raised exception)       | WARNING  | Exception raised without a descriptive message — add context                  |
| Exception logged at INFO or DEBUG level                      | WARNING  | Exception logged at wrong level — use `logging.exception()` or ERROR          |
| Inconsistent error reporting (mixed Rich console and print)  | INFO     | Inconsistent error output — standardise on one reporting mechanism            |
| Broad `except Exception` where specific exceptions are known | INFO     | Broad except clause — consider catching specific exceptions                   |

### Step 4: Correlate

Cross-reference error handling sites with logging. Verify errors are logged before re-raising, that `logging.exception()` or `exc_info=True` preserves tracebacks, and that `core/` modules do not use Rich or Click for error reporting (architecture boundary violation).

### Step 5: Report

Produce structured findings sorted by severity (BLOCKERs first), with a top-5 recommendations list.

```
## Error Audit Report
**Summary**: N BLOCKER, N WARNING, N INFO across N files (M error handling sites)

### BLOCKERs
- [BLOCKER] src/mle/foo.py:42 — Bare except swallows all errors
### WARNINGs
- [WARNING] src/mle/bar.py:17 — Missing exception chaining (raise without from)
### INFO
- [INFO] src/mle/baz.py:99 — Broad except where FileNotFoundError is expected

### Top 5 Recommendations
1. {Actionable recommendation}
```

### Step 6: Summary

Calculate an overall health score: `(sites passing / total sites) x 100`. Grade: **A** 90-100%, **B** 75-89%, **C** 60-74%, **D** below 60%.

## Specific Techniques

| Situation                                                                                | Technique                                                                                                                                                | Reference                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- |
| Audit must reach every `except` site, not a sample                                       | Walk the AST with `ast.parse` on every `.py` file under `src/`; record `ExceptHandler` nodes by `(file, lineno, type)`                                   | `<your-repo>/src/<your-package>/core/` exemplary error pattern |
| Existing `# noqa: BLE001` markers carry the project's justified-broad-handler rationales | Cross-check `# noqa: BLE001` count against rationale annotations on the same line; flag bare `# noqa: BLE001` with no trailing rationale comment as INFO | Project error-handling guidelines                              |
| Subprocess call sites that suppress non-zero exits silently                              | Match `subprocess.run(...)` calls where neither `check=True` nor an explicit `returncode` inspection appears in the next 3 lines                         | Project subprocess wrapper module                              |
| `logger.warning("...: %s", exc)` swallows the traceback                                  | Find `logger.(warning                                                                                                                                    | error                                                          | info)`calls that pass an exception as a format argument but omit`exc_info=True` | Python logging docs |
| Generic built-in exception raised from a domain module                                   | Walk every `Raise` node under `<your-repo>/src/<your-package>/core/`; flag raises of `ValueError`, `RuntimeError` etc. without a domain alternative      | Project API design rules                                       |
| Same exception caught and re-raised without `from` loses the chain                       | Inspect `Raise(exc=Call(...))` nodes inside `ExceptHandler`; flag when the `cause` (the `from` clause) is `None`                                         | PEP 3134 exception chaining                                    |

## Common Rationalizations

| The agent thinks…                                                                                             | Actually…                                                                                                                                                                                                                                                                                         | Gate                            | Corpus |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| "Decision: SKIP — a unit-level assertion on this defect would be brittle and fight every routine autoupdate." | The skip is defensible only when alternatives are enumerated and an integration mechanism (such as `pre-commit run --all-files`) provides equivalent regression signal. Skipping without that enumeration is indistinguishable from declining the work.                                           | `wi-validator:rubric-threshold` | R002   |
| "I'll mock the abort path — it's the cleaner test seam than refactoring the validator caller."                | Mocking the abort suppresses its signal in tests, leaving the production code's only enforcement point unmeasured. A test that mocks the abort cannot prove the gate fires; the seam masquerades as cleaner but it removes the assertion's power.                                                 | `wi-validator:rubric-threshold` | R006   |
| "Bare `except Exception` is logged at WARNING — operators will see it if something goes wrong."               | WARNING-level catch-all logs are routinely filtered out of operator dashboards; operators-will-see-it is a hope, not a guarantee. The ruff rule BLE001 exists because broad-except hides the precise exception type that would have steered the fix. Logging is not a substitute for specificity. | `pre-commit:ruff`               |        |
| "Catch-all is fine here — the daemon must survive any exception in this tick."                                | Daemon-survival is a recognised justified-broad-handler case, but it requires a `# noqa: BLE001 — <rationale>` marker AND logging at debug or warning. The discipline is the marker plus the rationale, not the exemption itself. A catch-all without the noqa breadcrumb is the unbounded one.   | `ungated`                       |        |

## Red Flags

- Audit reports zero `BLE001`-class findings on a codebase where `ruff check --select BLE001 src/` returns non-empty
- `# noqa: BLE001` count rose between the prior and current audit, but the matching rationale annotation count did not rise in step
- `subprocess.run(...)` calls without `timeout=` exist in `src/` but are not flagged in the report
- `logger.warning` calls suppress exceptions without `exc_info=True` and the audit silently classifies them as INFO
- Audit verdict is PASS on a codebase containing at least one `except:` (bare) site

## Verification

```bash
# Audit run with structured output
<your-tool> error-audit --skill | jq '.findings[] | select(.severity == "BLOCKER")'

# Cross-check noqa annotations match the audit's noqa count
grep -nE '# noqa: BLE001' src/ -r | wc -l    # noqa count
<your-tool> error-audit --skill | jq '.metrics.noqa_count'   # audit count
# Both must match

# Ruff BLE001 cross-check
ruff check --select BLE001 src/   # exit 0 if no broad excepts
```

Observable evidence:

- `<your-tool> error-audit --skill` exits with code 0 and emits JSON with `findings`, `metrics`, and `recommendations` keys
- Every BLOCKER row has a `file`, `line`, and `pattern` field populated
- `metrics.noqa_count` equals `grep -c '# noqa: BLE001' src/ -r`
- The recommendations array cites a concrete exemplar path in `<your-repo>/src/`
- Re-running on the same SHA produces an identical `findings` count

## Rules

- **Process ALL files** — scan every Python file in scope, never sample or truncate
- **Project code only** — skip vendored, generated, and third-party files
- **Architecture boundaries** — flag `core/` modules that import Rich, Click, or Textual for error reporting
- **British English** — use British English in all findings (e.g. "analyse", "standardise")
- **No auto-fix** — report findings only; let the developer decide how to remediate
- **Deterministic** — same codebase always produces the same report and score
- **Severity is final** — BLOCKER findings always count against the health score
- **Context matters** — `except Exception` with immediate re-raise or logging is acceptable; only flag when the exception is swallowed
