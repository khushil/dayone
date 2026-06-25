---
name: mle-config-audit
description: 'Audit configuration consistency — find drift between config files, env vars, CLI defaults, and documentation.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'config audit'
  - 'audit config'
  - 'configuration drift'
  - 'config consistency'
  - 'check config'
  - 'config documentation'
  - 'mle config-audit'
  - 'config mismatch'
intent_patterns:
  - "(audit|review|check)\\s+(config|configuration)\\s*(consistency|drift)?"
  - "(config|configuration)\\s+(drift|mismatch|inconsistenc)"
---

# Config Audit

Scans all MLE configuration sources to identify drift between where settings are defined, used, and documented.

## When to Use

- After adding a new configuration option to ensure it is documented and has a consistent default
- When the user says "audit config", "check config consistency", "config drift", or "/mle-config-audit"
- Before a documentation release to verify config docs match the implementation
- When investigating "works locally but not in CI" issues caused by undocumented environment variable overrides

## Workflow

### Step 1: Inventory Configuration Sources

Collect all configuration sources without sampling:

```bash
# User-level MLE config
ls ~/.mle/auth/config.toml ~/.mle/watcher.toml ~/.mle/pricing.json 2>/dev/null

# Per-project verification config
ls .mle/verify-config.toml pyproject.toml .claude/settings.json 2>/dev/null

# Code-defined defaults
grep -r "DEFAULTS" src/mle/watcher/config.py src/mle/core/config.py
```

Read each file in full. Never truncate or sample.

### Step 2: Map Configuration Settings

Build a configuration map with every setting found across all sources:

| Setting             | Source                    | Default        | Code Reference                   | Documented |
| ------------------- | ------------------------- | -------------- | -------------------------------- | ---------- |
| `org`               | `~/.mle/auth/config.toml` | `project-troy` | `core/config.py:DEFAULT_ADO_ORG` | Yes        |
| `enabled` (watcher) | `~/.mle/watcher.toml`     | `true`         | `watcher/config.py:DEFAULTS`     | Yes        |
| `AZURE_DEVOPS_PAT`  | env var                   | —              | `ado/auth.py`                    | Yes        |
| ...                 | ...                       | ...            | ...                              | ...        |

For each setting record: name, source file, default value, the code location that reads it, and whether it appears in `docs/reference/configuration.md`.

### Step 3: Detect Drift

Compare the configuration map against documentation and code defaults:

| Drift type                                     | Severity | Detection method                                    |
| ---------------------------------------------- | -------- | --------------------------------------------------- |
| Setting in code, absent from docs              | WARNING  | Map entry has Documented = No                       |
| Setting in docs, absent from code              | BLOCKER  | Docs reference without matching code read           |
| Default value differs between code and docs    | WARNING  | Compare `DEFAULTS` dict to documentation tables     |
| Env var override undocumented                  | INFO     | `os.environ.get("MLE_*")` calls without docs entry  |
| Deprecated setting still referenced            | WARNING  | Setting removed from DEFAULTS but mentioned in docs |
| Section in docs, section missing from DEFAULTS | WARNING  | Structural mismatch between doc headings and code   |

### Step 4: Validate Schemas

For each TOML file present on disk, verify the keys match what the code expects:

```bash
# Compare watcher.toml keys against DEFAULTS in watcher/config.py
python3 -c "
import tomllib, pathlib
cfg = tomllib.loads(pathlib.Path('~/.mle/watcher.toml').expanduser().read_text())
print(list(cfg.keys()))
"
```

Report any key present in the file but not in DEFAULTS (unknown key — WARNING) or required by code but absent from the file (missing key — INFO, as DEFAULTS fill the gap).

### Step 5: Report

Produce the configuration health report:

```
## Config Audit Report

**Sources scanned**: N files, N environment variables
**Documentation coverage**: N% (N of N settings documented)

### Drift Findings

| Severity | Setting | Source | Issue |
|----------|---------|--------|-------|
| BLOCKER  | ... | ... | Setting documented but not implemented |
| WARNING  | ... | ... | Setting in code, missing from docs |
| INFO     | ... | ... | Env var override not documented |

### Recommendations
- ...
```

## Specific Techniques

| Situation                                                                                           | Technique                                                                                                                                 | Reference                                                               |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Audit must include user-level and per-project config                                                | Enumerate every TOML file under `~/.<your-tool>/` and the project root; never skip user-level config because "the user knows their setup" | `<your-repo>/src/<your-tool>/core/config.py` reads both layers          |
| Documented CLI default in `docs/cli-reference.md` diverges from the option default declared in code | Parse the option default at runtime and diff against the markdown table cell                                                              | `<your-repo>/docs/cli-reference.md`, `<your-repo>/src/<your-tool>/cli/` |
| Environment variable override silently masks the config-file value                                  | Add a row tagged `env-override`; emit a WARNING when the env var is set at audit time but not listed in user-facing config docs           | `<your-repo>/src/<your-tool>/core/config.py`                            |
| Same config key appears in two TOML files with different schemas                                    | Capture the schema per file as `(key, type, default)`; raise BLOCKER when the tuples diverge                                              | `tomllib.loads` per file, compared structurally                         |
| Deprecated key removed from `DEFAULTS` but still documented in user-facing markdown                 | Diff `DEFAULTS.keys()` against headings under `## Config Reference` in `<your-repo>/docs/configuration.md`; orphans become WARNING rows   | `<your-repo>/src/<your-tool>/core/config.py::DEFAULTS`                  |
| Audit re-run yields a different report on the same commit                                           | Sort the inventory by `(source, setting)` before rendering; record the `git rev-parse HEAD` SHA in the report header                      | git SHA pinning                                                         |

## Common Rationalizations

| The agent thinks…                                                                                  | Actually…                                                                                                                                                                                                                                                                         | Gate                             | Corpus |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| "The env-var override is operational state, not config — it doesn't belong in the audit report."   | Operational state IS configuration when it shadows a documented default. Reading `os.environ.get("<YOUR_TOOL>_ORG")` at startup determines runtime behaviour identically to reading the TOML file; omitting it makes the audit a documentation review, not a configuration audit. | `wi-validator:rubric-threshold`  |        |
| "Docs reference a setting that's gone from `DEFAULTS` — the docs are merely stale, not a BLOCKER." | A documented setting that no longer exists in code is an active misdirection: users will edit it, restart, and find no change. The BLOCKER tier exists for misleading documentation precisely because it costs more debugging time than missing documentation.                    | `pre-commit:ruff`                |        |
| "Config-file values match code defaults — that means there's no drift to report."                  | Matching values prove only momentary alignment; drift detection includes the documentation surface. A `<your-repo>/docs/configuration.md` table whose default column lags behind the code is drift, even when no user-visible behaviour has changed yet.                          | `branch-policy:wi-link-required` |        |

## Red Flags

- Audit completed but the report header lists zero environment variables — `os.environ` was not enumerated for project-relevant keys
- User-facing configuration documentation references a setting absent from the code, yet the audit verdict is PASS rather than FAIL
- A config file has a key the code reads, but the inventory column "Code Reference" is empty for that row
- Same audit run twice on the same commit produces different finding counts — output is non-deterministic
- BLOCKER finding count exceeds zero but the verdict line reads `PASS` or `WARN`

## Verification

```bash
# Audit run with structured output
<your-tool> config-audit --skill | jq '.findings[] | select(.severity == "BLOCKER")'

# Inventory includes user-level and project-level sources
<your-tool> config-audit --skill | jq '.sources_scanned' | grep -E '\.<your-tool>/.+\.toml'

# Determinism: same commit, same report
<your-tool> config-audit --skill > /tmp/run1.json
<your-tool> config-audit --skill > /tmp/run2.json
diff /tmp/run1.json /tmp/run2.json   # exit code 0 expected
```

Observable evidence:

- `<your-tool> config-audit --skill` exits with code 0 and emits JSON containing a `findings` array
- The `sources_scanned` list contains at least one entry per source kind (config-file, env-var, CLI-default, doc-page)
- Documentation-coverage percentage is computed from `documented_count / total_count` and appears in the report header
- The header line shows `commit: <git SHA>` matching `git rev-parse HEAD`
- Re-running on the same SHA produces a byte-identical JSON report

## Rules

- **Process ALL sources** — never sample; read every config file in full
- **Cross-reference docs** — compare against `docs/reference/configuration.md`, not just code
- **BLOCKER for misleading docs** — a setting documented but absent from code misleads users; always flag as BLOCKER
- **Report coverage percentage** — divide documented settings by total discovered settings
- **British English** — use British English in all findings (e.g. "behaviour", "recognised", "organisation")
- **Read-only** — never modify any configuration file during audit
- **No assumptions** — if a file is absent, note it as INFO (not an error); defaults apply

## Output Format

```
## Config Audit — {PASS | WARN | FAIL}

**Summary**: {N} BLOCKER, {N} WARNING, {N} INFO across {N} settings in {N} sources

### Configuration Inventory
{table: setting, source, default, documented}

### Drift Findings
{table: severity, setting, source, issue}

### Documentation Coverage
{N}% — {N} of {N} settings have a matching entry in docs/reference/configuration.md

### Recommendations
- {actionable fix per BLOCKER/WARNING}
```

Verdict: **FAIL** if any BLOCKER; **WARN** if only WARNINGs; **PASS** if INFO only or no findings.
