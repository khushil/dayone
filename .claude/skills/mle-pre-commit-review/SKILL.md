---
name: mle-pre-commit-review
description: 'Pre-commit quality gate — scans changed files for anti-patterns, runs security checks, verifies build and tests, produces PASS/WARN/FAIL verdict.'
type: flexible
archetype: methodology-pure
priority: high
maturity: L2
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
keywords:
  - 'pre-commit'
  - 'precommit'
  - 'review changes'
  - 'check before commit'
  - 'quality gate'
  - 'pre commit review'
  - 'review my changes'
  - 'ready to commit'
intent_patterns:
  - "(review|check|scan|validate)\\s+(my\\s+)?(changes|code|diff|commit)"
  - "(pre.?commit|quality)\\s+(review|check|gate|scan)"
  - "(ready|about)\\s+to\\s+commit"
gate_signatures_reviewed:
  mle-pre-commit-review:blocker-found: bdfcea1accdc0dadb743269721c676e83b440c36dea833ef43cc7c38594720c6
  pre-commit:ruff: a69c0ad823034e11939a08d973adf4824cc55ac5a00aa65201f2ea17b6e6b0db
  wi-validator:rubric-threshold: 363408133ef87636565ac9abe14994338dd04175a4aa0261ea06142d23c8ba4a
---

# Pre-Commit Review

Automated quality gate that reviews all staged and unstaged changes before commit. Identifies security issues, anti-patterns, error handling defects, build failures, and test regressions. Produces a structured verdict with error pattern detection informed by the mle-error-audit methodology.

## When to Use

- Before every commit — run this to catch issues early
- When the user says "review my changes", "check before commit", or "/mle-pre-commit-review"
- After implementing a feature or fix, before staging and committing
- When you want to verify code quality before creating a PR

## Workflow

### Step 1: Identify Changed Files

Identify all files with uncommitted changes:

```bash
# Staged changes
git diff --cached --name-only

# Unstaged changes
git diff --name-only

# Untracked files (relevant to review)
git ls-files --others --exclude-standard
```

Combine into a single deduplicated list. Filter out:

- **Binary files**: .png, .jpg, .jpeg, .gif, .ico, .woff, .woff2, .ttf, .eot, .pdf, .zip, .tar, .gz
- **Lock files**: package-lock.json, yarn.lock, Pipfile.lock, Cargo.lock, go.sum, pnpm-lock.yaml
- **Generated files**: files in `**/generated/**`, `**/migrations/**`, `**/__pycache__/**`, `**/node_modules/**`, `**/bin/**`, `**/obj/**`
- **Vendored files**: `vendor/`, `third_party/`
- **MLE metadata**: `.mle-metadata.json`

Classify remaining files by language:

- **Python**: .py
- **TypeScript/JavaScript**: .ts, .tsx, .js, .jsx
- **C#**: .cs, .vb, .fs
- **Go**: .go
- **Rust**: .rs
- **Config**: .yaml, .yml, .toml, .json, .xml, .ini
- **Documentation**: .md, .rst, .txt
- **Shell**: .sh, .bash, .zsh

Report the total count: "Reviewing N changed files."

**CRITICAL**: Process ALL changed files. Never truncate with `head` or limit the count.

If no changed files remain after filtering, report "No reviewable changes found" and deliver a PASS verdict immediately.

### Step 2: Anti-Pattern Detection

Scan each changed file for common anti-patterns. Read the diff content using `git diff HEAD -- <file>` and only flag patterns found in **new or modified lines** (lines starting with `+` in the diff) to avoid false positives on pre-existing code.

#### Universal Patterns (all languages)

| Pattern                                             | Severity | Message                               |
| --------------------------------------------------- | -------- | ------------------------------------- |
| `<<<<<<< ` or `>>>>>>> ` or `=======` (at line end) | BLOCKER  | Merge conflict markers present        |
| `PRIVATE KEY-----`                                  | BLOCKER  | Private key detected in source        |
| `sk-` followed by 20+ alphanumeric characters       | BLOCKER  | Potential API secret key detected     |
| `AIza` followed by 35 alphanumeric characters       | BLOCKER  | Google API key pattern detected       |
| `ghp_` followed by 36 alphanumeric characters       | BLOCKER  | GitHub personal access token detected |

#### Python Patterns

| Pattern                                                                     | Severity | Message                                                                |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `import pdb` or `pdb.set_trace()`                                           | BLOCKER  | Debugger import/breakpoint left in code                                |
| `breakpoint()`                                                              | BLOCKER  | breakpoint() call left in code                                         |
| `password = '...'` or `password = "..."`                                    | BLOCKER  | Hardcoded password detected                                            |
| `api_key = '...'` or `api_key = "..."`                                      | BLOCKER  | Hardcoded API key detected                                             |
| `eval(` or `exec(`                                                          | BLOCKER  | eval()/exec() usage — potential code injection                         |
| `print(...)` at end of line                                                 | WARNING  | print() statement — consider using logging                             |
| `from unittest.mock import` or `import pytest` in src/ files                | WARNING  | Test import in production code — check file location                   |
| `except:` or `except Exception:` (bare)                                     | WARNING  | Bare except clause — catch specific exceptions                         |
| `except:` without `raise` in the block                                      | BLOCKER  | Bare except without re-raise — errors will be silently swallowed       |
| `except SomeError: pass`                                                    | BLOCKER  | Exception swallowed with pass — add logging or re-raise                |
| `raise SomeError()` without `from` in except block                          | WARNING  | Missing exception chaining — use `raise X from Y` for context          |
| `except Exception as e:` followed by only `logging.debug` or `logging.info` | WARNING  | Exception logged at wrong level — use logging.warning or logging.error |
| `os.system(`                                                                | WARNING  | os.system() — use subprocess.run() instead                             |
| `# TODO`, `# FIXME`, `# HACK`, `# XXX`                                      | INFO     | TODO/FIXME marker found — review before commit                         |

#### TypeScript Patterns

| Pattern                                    | Severity | Message                                                      |
| ------------------------------------------ | -------- | ------------------------------------------------------------ |
| `debugger` statement                       | BLOCKER  | debugger statement left in code                              |
| `password` assigned to string literal      | BLOCKER  | Hardcoded password detected                                  |
| `console.log(` or `console.debug(`         | WARNING  | console.log/debug left in code — use a logger                |
| `: any` type annotation                    | WARNING  | 'any' type used — prefer explicit types                      |
| `@ts-ignore` or `@ts-nocheck`              | WARNING  | TypeScript type suppression — consider fixing the type error |
| `alert(` or `confirm(`                     | WARNING  | Browser alert/confirm in code — use proper UI components     |
| `var ` declaration                         | WARNING  | 'var' declaration — use 'const' or 'let'                     |
| `// TODO`, `// FIXME`, `// HACK`, `// XXX` | INFO     | TODO/FIXME marker found — review before commit               |

#### C# Patterns

| Pattern                                    | Severity | Message                                                           |
| ------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `password = "..."` hardcoded               | BLOCKER  | Hardcoded password detected                                       |
| `Debug.WriteLine` or `Console.WriteLine`   | WARNING  | Debug/Console output — use ILogger                                |
| `Thread.Sleep(`                            | WARNING  | Thread.Sleep in production code — use async/await with Task.Delay |
| `catch (Exception`                         | WARNING  | Catch-all Exception — catch specific exceptions                   |
| `#pragma warning disable`                  | WARNING  | Warning suppression — verify this is intentional                  |
| `GC.Collect()`                             | WARNING  | Manual GC.Collect() — rarely appropriate in production            |
| `unsafe {`                                 | WARNING  | Unsafe code block — ensure this is necessary and reviewed         |
| `// TODO`, `// FIXME`, `// HACK`, `// XXX` | INFO     | TODO/FIXME marker found — review before commit                    |

#### Go Patterns

| Pattern                                    | Severity | Message                                                             |
| ------------------------------------------ | -------- | ------------------------------------------------------------------- |
| `password` assigned to string literal      | BLOCKER  | Hardcoded password detected                                         |
| `fmt.Print`, `fmt.Println`, `fmt.Printf`   | WARNING  | fmt.Print in production — use structured logging                    |
| `panic(`                                   | WARNING  | panic() in production code — prefer error returns                   |
| `time.Sleep(`                              | WARNING  | time.Sleep in production — consider context-aware waiting           |
| `_ =` (ignored error) in non-test files    | INFO     | Ignored error value — ensure error handling is intentional          |
| `go func(`                                 | INFO     | Goroutine spawned — verify lifecycle management and leak prevention |
| `// TODO`, `// FIXME`, `// HACK`, `// XXX` | INFO     | TODO/FIXME marker found — review before commit                      |

#### Rust Patterns

| Pattern                                    | Severity | Message                                                          |
| ------------------------------------------ | -------- | ---------------------------------------------------------------- |
| `password` assigned to string literal      | BLOCKER  | Hardcoded password detected                                      |
| `println!` or `dbg!`                       | WARNING  | println!/dbg! macro — use tracing/log crate                      |
| `unsafe {`                                 | WARNING  | Unsafe block — ensure this is necessary and documented           |
| `.unwrap()` or `.expect(`                  | WARNING  | unwrap()/expect() — prefer proper error handling with ? operator |
| `panic!(`                                  | WARNING  | panic!() macro — prefer Result return types                      |
| `#[allow(...)]`                            | INFO     | Lint suppression — verify this is intentional                    |
| `// TODO`, `// FIXME`, `// HACK`, `// XXX` | INFO     | TODO/FIXME marker found — review before commit                   |

Collect all findings as a list: `{severity, file, line, message}`.

Classify findings:

- **BLOCKER**: Security-sensitive anti-patterns (credentials, eval, os.system) and error handling defects (swallowed exceptions, bare except without re-raise)
- **WARNING**: Code quality anti-patterns (debug statements, bare except, missing exception chaining, wrong log level)
- **INFO**: Style issues (TODO comments, type: ignore)

### Step 3: Build Verification

Detect the project stack and run the appropriate build command:

| Stack   | Detection                | Build Command                                    |
| ------- | ------------------------ | ------------------------------------------------ |
| Python  | pyproject.toml, setup.py | `ruff check src/` (or `ruff check .` if no src/) |
| Node.js | package.json             | `npx tsc --noEmit`                               |
| .NET    | _.csproj, _.sln          | `dotnet build --no-restore`                      |
| Go      | go.mod                   | `go build ./...`                                 |
| Rust    | Cargo.toml               | `cargo check`                                    |

If multiple stacks are detected, run all applicable build commands.

If the build fails, add a **BLOCKER** finding.
If no build system is detected, skip this step with an **INFO** note.

### Step 4: Test Subset Execution

Identify and run tests related to changed files:

| Framework  | Detection                   | Test Command                                             |
| ---------- | --------------------------- | -------------------------------------------------------- |
| pytest     | conftest.py, pyproject.toml | `python -m pytest <related-test-files> -x -q --tb=short` |
| jest       | package.json (jest)         | `npx jest --passWithNoTests --bail <changed-files>`      |
| vitest     | package.json (vitest)       | `npx vitest related <changed-files> --run`               |
| NUnit      | \*.csproj (NUnit)           | `dotnet test --no-build`                                 |
| go test    | go.mod                      | `go test ./...`                                          |
| cargo test | Cargo.toml                  | `cargo test`                                             |

**Test file association**: For a changed file `src/foo/bar.py`, look for:

- `tests/test_bar.py`, `tests/unit/test_bar.py`, `tests/functional/test_bar_functional.py`
- `bar_test.py`, `bar.test.ts`, `bar.spec.ts`, `__tests__/bar.ts`

If tests fail, add a **BLOCKER** finding.
If no tests are found for changed files, add a **WARNING** finding: "No tests found for changed files — consider adding test coverage."
If no test framework is detected, skip with an **INFO** note.

### Step 5: Security Scan

If `mle` CLI is available, delegate to the SecurityScanner:

```bash
mle review --security-only --skill 2>/dev/null || true
```

This invokes `SecurityScanner().scan(path, diff_only=True)` which checks for:

- Hardcoded secrets and credentials (gitleaks)
- Known vulnerabilities in dependencies (trivy, safety)
- Static analysis findings (semgrep, bandit)
- Infrastructure misconfigurations (checkov)

If `mle` CLI is not available, perform a manual check:

- Scan changed files for patterns from the Universal Patterns table in Step 2
- Check for `.env` files or files containing `SECRET`, `TOKEN`, `PASSWORD`, `API_KEY` in variable assignments

Map security findings to review severity:

- **critical** / **high** -> BLOCKER
- **medium** -> WARNING
- **low** / **info** -> INFO

If no security scanners are available, add an INFO finding: "No security scanners installed — consider installing semgrep, gitleaks, or trivy."

### Step 6: Verdict and Report

Collect all findings from Steps 2-5 and deliver the verdict.

1. Count findings by severity: BLOCKER, WARNING, INFO
2. Determine verdict:
   - **FAIL** — if any BLOCKER findings exist (build failure, test failure, secrets, security gate failure)
   - **WARN** — if WARNING findings exist but no BLOCKERs
   - **PASS** — if only INFO findings or no findings at all

**Report format:**

```
## Pre-Commit Review — {VERDICT}

**Summary**: {N} BLOCKER, {N} WARNING, {N} INFO across {N} changed files

### Changed Files
- {language}: {file1}, {file2}, ...

### Findings

#### BLOCKERs
- [{severity}] {file}:{line} — {message}

#### WARNINGs
- [{severity}] {file}:{line} — {message}

#### INFO
- [{severity}] {file}:{line} — {message}

### Security
Scanners run: {list or "none available"}

### Recommendation
- FAIL: "Fix the BLOCKER issues above before committing."
- WARN: "Consider addressing WARNING items. You may proceed with the commit."
- PASS: "All checks passed. Ready to commit."
```

## Specific Techniques

These techniques refine the six-step workflow above when the change set is
large or the agent is tempted to compress the review:

- **Use `git diff -U0`** for line-precise scanning rather than re-reading
  whole files; the BLOCKER patterns at lines 65–79 match diff-context-free
  output reliably.
- **Run `ruff check --diff <files>`** to surface formatting failures before
  the developer-side commit; this is the same path the
  `astral-sh/ruff-pre-commit` hook walks (see registered gate
  `pre-commit:ruff`).
- **Cross-reference findings with the active WI's acceptance criteria**
  via `mle wi validate --work-item <id>` so the review aligns with the
  rubric-threshold gate that gates merges (`wi-validator:rubric-threshold`).
- **Capture the BLOCKER table's gate id** (`mle-pre-commit-review:blocker-found`)
  in the verdict output so downstream `mle skill validate --check-gates`
  can detect if the canonical table drifts.
- **Process all affected files in one pass** — the rubric's coverage
  dimension penalises sampling, and incremental scans on large change sets
  miss cross-file consistency issues.

## Common Rationalizations

| The agent thinks…                                                                                                                 | Actually…                                                                                                                                                                                                                           | Gate                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| "I'll skip the new regression test — the migrated test on the bugfix branch already implicitly covers the contract" (corpus R001) | Migrated tests typically prove the happy path only; bidirectional contracts need explicit coverage. A future refactor can let the migrated test pass while silently re-introducing the defect.                                      | wi-validator:rubric-threshold       |
| "Decision: SKIP — a unit-level rev assertion would be brittle and fight every routine autoupdate cycle" (corpus R002)             | The skip is defensible only when alternatives are enumerated and an integration mechanism (for example `pre-commit run --all-files`) gives equivalent regression signal. Without that, the skip is indistinguishable from laziness. | wi-validator:rubric-threshold       |
| "Add `--force` to 8 test invocations — the flag is the documented bypass for the rubric gate" (corpus R005)                       | Adding `--force` to tests trains the suite to accept the bypass as default; future agents read the corpus and conclude `--force` is canonical. Mocks should have descriptions long enough to score above 4.0.                       | wi-validator:rubric-threshold       |
| "Patched `_validate_wi_body_or_abort` at the test boundary; production is untouched" (corpus R006)                                | Patching the validator at the test boundary to suppress its abort is functionally identical to silencing it. A test that mocks the abort away cannot prove the production gate works.                                               | wi-validator:rubric-threshold       |
| "Ruff warnings on tests don't matter — production code is what counts"                                                            | The pre-commit ruff hook runs against every staged file; a warning on a test still blocks the commit and the developer's IDE-side `ruff format` will reformat the file behind the agent's back.                                     | pre-commit:ruff                     |
| "The BLOCKER table doesn't apply because the secret is in a comment"                                                              | The BLOCKER pattern table (this skill's own canonical source) matches by regex; comments and code are scanned identically. A registered drift gate (mle-pre-commit-review:blocker-found) flags any silent rewording.                | mle-pre-commit-review:blocker-found |

## Red Flags

- Verdict declared without running `ruff check` or the project's test
  command at least once on the affected paths.
- BLOCKER findings explained away with "context-aware" reasoning when the
  pattern table at lines 65–79 says BLOCKER unconditionally.
- Sampling — reviewing only the first N changed files or only the largest
  diff hunks — is always a Red Flag; severity is final per the Rules
  section.
- "PASS" emitted while `git diff --cached --name-only` still shows files
  the verdict does not enumerate.
- Recommendation rewritten from FAIL to WARN because the developer is
  "almost ready to commit" — severity is not negotiable per the Rules.

## Verification

```bash
# Cross-check the table-of-record was scanned end-to-end.
git diff --cached --name-only | sort > /tmp/changed.txt
grep "files_scanned:" /tmp/precommit-verdict.yaml | sort > /tmp/scanned.txt
diff /tmp/changed.txt /tmp/scanned.txt   # expected: empty
```

Expected outcomes per verdict:

- **FAIL** — `mle skill validate --check-gates` exits 0 with no new
  warnings; the verdict body cites BLOCKER findings with backticked file
  paths; the developer's next `git commit` is refused by the
  conventional-pre-commit hook until the BLOCKER lines are removed.
- **WARN** — the verdict cites WARNING findings only; `ruff check` exits 0
  on every cited file; the developer may proceed with `git commit`.
- **PASS** — `ruff check --quiet` exits 0 across all scanned files; the
  project's test command (typically `pytest -q` per the project's
  pyproject.toml) exits 0; the BLOCKER pattern grep produces no matches.

The skill itself is validated by `mle skill validate
src/mle/data/skills/mle-pre-commit-review/SKILL.md` — exit code 0 with
PASS verdict and overall score ≥ 4.0 per ADR-046 D3.

## Rules

- **Always run all 6 steps** — never skip build or test execution
- **Process ALL changed files** — never truncate or sample
- **Diff-only analysis** — scan only new/modified lines in Step 2 to avoid flagging pre-existing issues
- **All affected tests** — run tests for ALL affected modules, not just directly modified test files
- **No timeout flags** — do not add `--timeout` to pytest or any test runner commands
- **British English** — use British English in all findings and messages (e.g. "colour", "analyse")
- **Severity is final** — BLOCKER always means FAIL, no override
- **Report everything** — report ALL findings, not just the first one found
- **Graceful degradation** — if a tool is missing (ruff, tsc, security scanner), note it as INFO and continue
- **Context-aware patterns** — test imports flagged only in production code paths (src/), not in tests/
- **Exit early if no changes** — if Step 1 finds no reviewable files, deliver PASS immediately
- **Deterministic verdict** — same changes always produce the same verdict
- **Do NOT auto-fix** — report findings only, let the developer decide
- **This skill is the Claude Code equivalent of a pre-commit hook**

## Telemetry

After delivering the verdict, record one gate-event so the OQ-6
effectiveness loop can measure how often the BLOCKER gate fires (Story
#2875). Invoke the helper from a single bash line, passing the BLOCKER
count and a comma-separated list of severities encountered:

```bash
python3 -m mle.skill.pre_commit_review --count <N> --severities critical,high
```

- `<N>` is the count of BLOCKER findings (zero on PASS or WARN).
- `--severities` is a bounded vocabulary; omit when `<N>` is zero.

The helper writes one NDJSON line to `~/.mle/telemetry/gate-events.ndjson`
and never raises. Operators can opt out with
`MLE_TELEMETRY_ENABLED=false` or `[telemetry] enabled = false` in
`~/.mle/config.toml`.
