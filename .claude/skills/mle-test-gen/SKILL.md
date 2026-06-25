---
name: mle-test-gen
description: 'Test generation engine — generate unit, integration, and BDD tests from stories, specs, and source code.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'generate tests'
  - 'create tests'
  - 'add test coverage'
  - 'test generation'
  - 'unit tests'
  - 'integration tests'
  - 'BDD tests'
  - 'mle test'
intent_patterns:
  - "(generate|create|add|write)\\s+(unit\\s+|integration\\s+|BDD\\s+)?tests"
  - "(increase|improve|add)\\s+(test\\s+)?coverage"
---

# MLE Test Generation

Generate tests from user stories, API specifications, formal specifications, and source code. Supports pytest, jest, vitest, NUnit, go test, and cargo test frameworks.

## When to Use

- After implementation to generate regression tests
- When the user says "generate tests", "add test coverage", "create tests", or "/mle-test-gen"
- When coverage is below threshold
- Before creating a pull request

## Workflow

1. **Generate from story**: `mle test generate --story <ID>` — generate tests for a user story
2. **Generate from spec**: `mle test generate --spec <spec-file>` — generate from formal spec
3. **Generate from source**: `mle test generate --source <file>` — generate for source file
4. **Generate from API**: `mle test generate --api-spec <openapi.yaml>` — generate API tests

## Specific Techniques

| Situation                                                                 | Technique                                                                                                                  | Reference                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Generated test asserts only on return-value type, not value               | Re-run `mle test generate --source <file> --invariants` to seed Hypothesis property tests with value-bound predicates      | Hypothesis property-test template            |
| BDD `.feature` file lacks `Examples:` for parameterised behaviour         | Re-run with `--bdd --scenario-outline`; the BDD generator emits an `Examples:` table seeded from the AC values             | `.claude/rules/bdd-conventions.md`           |
| Integration test mocks the framework API instead of using a real fixture  | Mark the test `@pytest.mark.integration` and use the recorded-fixture pattern from `tests/functional/conftest.py`          | `tests/functional/conftest.py`               |
| Coverage report claims 100% but no assertion text references the branches | Run `pytest --cov=<module> --cov-branch --cov-report=term-missing`; missing `else` arms appear under `Missing`             | `.claude/rules/testing-standards.md`         |
| Test file accidentally overwrites an existing test on regeneration        | Pass `--append-only` to `mle test generate`; the generator refuses to overwrite and writes a `_v2.py` sibling instead      | `src/<pkg>/core/test_gen.py:write_tests`     |
| Generated pytest tests use bare `except:` or `except Exception:`          | The `ruff` BLE001 rule fires at the next pre-commit; rewrite to specific exception types per the error-handling guidelines | `.claude/rules/error-handling-guidelines.md` |

## Common Rationalizations

| The agent thinks…                                                                                      | Actually…                                                                                                                                                                                                                                                                                                                         | Gate                                  | Corpus |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| "Asserting `isinstance(result, dict)` is enough for a unit test — the value is implementation detail." | Type-only assertions catch refactors but not regressions in business logic. A test that says nothing about value drift fails to flag the case where the function returns `{}` when it should return populated data. The skill validator's verification rigor dimension explicitly penalises tests with no value-bound predicates. | `skill-validator:rubric-threshold`    |        |
| "BDD `Examples:` tables are overhead — one scenario per behaviour is cleaner."                         | Without `Examples:` the scenario covers a single concrete row; boundary cases (empty string, max length, unicode) go untested. The pre-commit review skill flags `.feature` files with parameterised AC and no `Examples:` table as a blocker.                                                                                    | `mle-pre-commit-review:blocker-found` |        |
| "Mocking the boundary in the integration test is faster — the real fixture is too slow."               | An integration test that mocks the boundary it claims to integrate against is a unit test in disguise. The functional tier explicitly uses recorded-fixture patterns — not raw `MagicMock`. Tests that bypass this contract land as `unit` tests by accident.                                                                     | `pre-commit:ruff`                     |        |

## Red Flags

- Generated test contains `assert isinstance(result, ...)` as the only assertion line — value-bound predicates are absent
- `.feature` file uses `Scenario Outline:` but has no `Examples:` table — the outline is unbound
- Integration test imports `from unittest.mock import MagicMock` and patches the framework API directly — the test should use the recorded-fixture pattern
- `coverage report --branch` shows `Missing` lines that match `else:` or `except:` blocks in the new module — branches are uncovered despite 100% line coverage claim
- `mle test generate --skill --output <file>` JSON lists generated paths but `git status` shows no new files — generation ran in dry-run by accident

## Verification

```bash
# --skill JSON enumerates generated files and they exist on disk
mle test generate --source path/to/module.py --skill --output /tmp/testgen.json
python -c 'import json, os; d=json.load(open("/tmp/testgen.json")); \
  [open(p).read() for p in d["generated_files"]]; \
  print("OK", len(d["generated_files"]))'

# Generated pytest tests pass
python -m pytest tests/unit/test_<module>.py -q

# Coverage at or above 80% on the targeted module
python -m pytest tests/unit/test_<module>.py --cov=<pkg>.<module> \
  --cov-fail-under=80 --cov-report=term-missing -q

# BDD feature count matches the report
ls tests/Features/*.feature | wc -l   # compare to JSON 'feature_files' count
```

Observable evidence:

- `/tmp/testgen.json` parses with `generated_files: [...]` and every path exists on disk
- `pytest <generated-tests>` exits 0
- `coverage report --include='*<module>*'` prints `TOTAL` line with coverage >= 80%
- `.feature` files on disk match the count reported in the `--skill` JSON
- `ruff check <generated-tests>` exits 0 (no BLE001 or other rule violations)

## Rules

- Detect the project's test framework automatically
- Generate tests in the framework convention (pytest for Python, jest for JS/TS, etc.)
- Include both positive and negative test cases
- Generate BDD feature files when the project uses a BDD framework
- Never overwrite existing tests — create new files or append
