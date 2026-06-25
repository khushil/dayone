---
name: mle-security-scan
description: 'Security scanning — run SAST, dependency vulnerability checks, secret detection, and SBOM generation.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'security scan'
  - 'vulnerability check'
  - 'SBOM'
  - 'generate SBOM'
  - 'check for vulnerabilities'
  - 'secret detection'
  - 'mle security'
intent_patterns:
  - "(run|perform|execute)\\s+(a\\s+)?security\\s+scan"
  - "(check|scan)\\s+for\\s+(vulnerabilities|secrets|CVEs)"
  - "generate\\s+(an?\\s+)?SBOM"
---

# MLE Security Scanning

Run comprehensive security scans using available tools (semgrep, bandit, trivy, gitleaks, safety, checkov). Generate Software Bill of Materials (SBOM) in CycloneDX or SPDX format.

## When to Use

- Before committing security-sensitive changes
- When the user says "security scan", "check for vulnerabilities", "generate SBOM", or "/mle-security-scan"
- As a quality gate before pull requests
- Periodically to check for new CVEs

## Workflow

1. **Full scan**: `mle security scan` — run all available scanners
2. **Diff scan**: `mle security scan --diff` — scan only changed files
3. **Gate check**: `mle security scan --gate` — exit non-zero if thresholds exceeded
4. **Available tools**: `mle security tools` — show installed and missing scanners
5. **Generate SBOM**: `mle security sbom --format cyclonedx -o sbom.json` — produce SBOM

## Subprocess Audit

Audit all subprocess and shell-invocation calls in the codebase for injection
risks, missing timeouts, and unchecked return codes.

### Step 1: Discover

Find all subprocess-related imports and calls across the target scope. Include
`subprocess.run`, `subprocess.Popen`, `subprocess.call`, `subprocess.check_output`,
and `os.system`. Report: "Found N subprocess call sites across M files."

### Step 2: Classify

For each call site, record the file, line number, the function used, whether
`shell=True` is present, whether a `timeout=` argument is supplied, and
whether the return code is checked (`check=True` or explicit `returncode`
inspection).

### Step 3: Analyse

Check each site against the subprocess safety pattern table.

| Pattern                                                           | Severity | Message                                                                     |
| ----------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `subprocess.run(..., shell=True)` with variable input             | CRITICAL | Shell injection risk — use list form without `shell=True`                   |
| `os.system(`                                                      | CRITICAL | `os.system()` is inherently unsafe — use `subprocess.run()`                 |
| `subprocess.Popen(..., shell=True)`                               | HIGH     | `shell=True` in `Popen` — prefer list form                                  |
| `subprocess.run()` without `timeout=`                             | MEDIUM   | No timeout on subprocess — add `timeout=` parameter                         |
| `subprocess.run()` without `check=True`                           | MEDIUM   | Unchecked subprocess return code — add `check=True` or inspect `returncode` |
| `subprocess.run(..., capture_output=True)` without error handling | LOW      | Captured output but no error path — check `returncode`                      |

### Step 4: Verify

For each CRITICAL finding, confirm whether the argument list or string contains
any interpolated variable. Literal-only `shell=True` calls are LOW risk;
variable-interpolated calls are CRITICAL. Distinguish these in the report.

### Step 5: Report

Produce findings sorted by severity, with the file path, line number, pattern
matched, and a one-line fix recommendation for each site.

```
## Subprocess Audit Report
**Summary**: N CRITICAL, N HIGH, N MEDIUM, N LOW across N files (M call sites)

### CRITICAL
- [CRITICAL] src/mle/foo.py:42 — shell=True with variable input — use list form

### HIGH
- [HIGH] src/mle/bar.py:17 — Popen with shell=True — prefer list form

### MEDIUM
- [MEDIUM] src/mle/baz.py:99 — No timeout — add timeout=30

### LOW
- [LOW] src/mle/qux.py:55 — Captured output, no returncode check
```

## Specific Techniques

| Situation                                                                   | Technique                                                                                                                                                                       | Reference                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Scan a security-sensitive change before commit                              | `<your-tool> security scan --diff` runs all installed scanners only on the staged diff; emit the JSON report and inspect with `jq '.findings[].severity'`                       | Project security module           |
| Generate a CycloneDX SBOM that includes transitive dependencies             | `<your-tool> security sbom --format cyclonedx -o sbom.json` invokes the bundled SBOM generator and writes a file with `components[]` populated from the lockfile                | Project security module           |
| Confirm bandit is installed and usable before relying on `--gate`           | `<your-tool> security tools` lists installed scanners with version; non-zero exit when a critical scanner is missing                                                            | Project security module           |
| Detect interpolated-string `shell=True` calls vs literal-string ones        | Walk the AST; identify `Call(func=Attribute(attr="run"))` with `keyword(arg="shell", value=Constant(True))` AND a positional arg that is `JoinedStr` or `BinOp` (string concat) | `bandit B602`, `bandit B605`      |
| Pre-commit hook secret detection caught no leaks but `gitleaks detect` does | Run `gitleaks detect --no-git --source src/` independently and diff against the skill's scanner output; investigate scanner-config drift                                        | `gitleaks` CLI docs               |
| Compare scan output across two SHAs to find newly introduced findings       | `<your-tool> security scan --diff HEAD~1..HEAD --skill > new.json`; diff `new.json` against the prior run's archived JSON                                                       | Project security module diff mode |

## Common Rationalizations

| The agent thinks…                                                                                  | Actually…                                                                                                                                                                                                                                                                                                              | Gate                            | Corpus |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| "A scan already ran in a sibling PR — we're inside the temporal coverage window."                  | Temporal-coverage windows are operational shortcuts, not gate substitutes. A sibling PR's scan covered its diff at its time; new code in this PR is uncovered until it scans. Inheriting a scan result is the audit-bypass pattern of trust-the-upstream-gate-did-the-work.                                            | `merge-check:pr-completed`      |        |
| "SAST findings are HIGH not CRITICAL — won't block the gate, so I'll address them in a follow-up." | Severity-class deferrals accumulate. HIGH findings batch into release-blockers if they're never picked up; the gate enforces a CRITICAL-only block precisely because the team committed to closing HIGH proactively, not letting them queue.                                                                           | `wi-validator:rubric-threshold` |        |
| "The secret is in a fixture file, not real config — the scanner shouldn't be flagging fixtures."   | Secret scanners match by regex over the whole tree; they don't distinguish fixture from production. A regex match in a fixture still flags as a finding because exfiltration paths frequently begin with developer-curated test data. The discipline is to use placeholder-shaped data, not to argue with the scanner. | `pre-commit:ruff`               |        |

## Red Flags

- Scan exits with PASS verdict, but `bandit -r src/` produces high-severity findings the scan never reported — scanner not installed or scope mis-set
- `pip-audit` output is filtered by severity threshold, yet the threshold itself is absent from the report header
- Secret-detection report omits keys committed before the configured scan window (`--since` truncates without warning)
- SBOM `components[]` entries lack a `licenses` field for direct dependencies declared in `pyproject.toml`
- Scan exit code is 0 while the JSON report contains at least one CRITICAL finding

## Verification

```bash
# Full scan with structured output
<your-tool> security scan --skill | jq '.sast, .deps, .secrets, .sbom | length'

# SBOM file produced and parseable
<your-tool> security sbom --format cyclonedx -o sbom.json
test -f sbom.json && jq '.bomFormat == "CycloneDX"' sbom.json    # exit 0 expected

# Scanner versions reachable
bandit --version
pip-audit --version
gitleaks version

# Cross-check bandit independently for high-severity drift
bandit -r src/ -ll -f json | jq '.results | length'
<your-tool> security scan --skill | jq '.sast.findings | map(select(.severity == "HIGH")) | length'
```

Observable evidence:

- `<your-tool> security scan --skill` exits non-zero when any CRITICAL finding exists; exits 0 otherwise
- The JSON report has top-level `sast`, `deps`, `secrets`, and `sbom` keys, each with a `findings` array
- `sbom.json` parses as CycloneDX and contains `components[]` entries equal to the count in `pip list --format json`
- Independent bandit invocation produces an HIGH count within +/-1 of the scan's HIGH count
- The report header records the `threshold_critical` and `threshold_high` values applied to the gate

## Rules

- **Scan ALL files** — never sample; audit every subprocess call site in scope
- **Report findings sorted by severity** (critical first)
- **Gate thresholds**: 0 critical, 5 high by default
- **SBOM must include ALL dependencies**
- **Graceful degradation** if a scanner is not installed
- **Variable vs. literal** — distinguish `shell=True` with literals (LOW) from `shell=True` with interpolated variables (CRITICAL)
- **No auto-fix** — report findings only; let the developer decide how to remediate
- **British English** — use British English in all findings (e.g. "analyse", "behaviour")
