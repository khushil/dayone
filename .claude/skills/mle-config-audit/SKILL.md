---
name: mle-config-audit
description: 'Audit configuration consistency — find drift between tsconfig, ESLint, Prettier, build, test, CI config, package scripts, and the docs.'
keywords:
  - 'config audit'
  - 'configuration drift'
  - 'config consistency'
  - 'check config'
intent_patterns:
  - "(audit|review|check)\\s+(config|configuration)\\s*(consistency|drift)?"
  - "(config|configuration)\\s+(drift|mismatch|inconsistenc)"
---

# Config Audit

Scan DayONE's configuration surface and find drift — where one config asserts a
setting that another config, a package script, or the documentation contradicts.
This is a read-only audit: report findings, never edit config.

## When to Use

- After adding or changing a build/lint/test option, to confirm everything agrees
- When asked to "audit config", "check config consistency", or "config drift"
- Before a docs release, to verify the documentation matches the implementation
- When investigating "works locally but not in CI" discrepancies

## Workflow

### 1. Inventory the configuration surface

Read each of these in full (note any that are absent — that is itself a finding):

```bash
fd -H -t f \
  'tsconfig.*json|eslint\.config\.mjs|\.prettierrc|\.stylelintrc|electron\.vite\.config\.ts|vitest\.config\.ts|cucumber\.mjs|package\.json|lefthook\.yml' .
ls .github/workflows/
```

Cover: `tsconfig.json` / `tsconfig.node.json` / `tsconfig.web.json`,
`eslint.config.mjs`, `.prettierrc*`, `.stylelintrc*`, `electron.vite.config.ts`,
`vitest.config.ts`, `cucumber.mjs`, `package.json` (scripts + deps), `lefthook.yml`,
every `.github/workflows/*.yml`, and the relevant `docs/**` pages.

### 2. Build a settings map

For every meaningful setting record: name, the file(s) that declare it, its value,
and whether the documentation mentions it.

| Setting                               | Declared in                              | Value | Documented |
| ------------------------------------- | ---------------------------------------- | ----- | ---------- |
| TS `target` / `module`                | `tsconfig.*.json`                        | …     | —          |
| ESLint `parserOptions.project`        | `eslint.config.mjs`                      | …     | —          |
| `print-width`                         | `.prettierrc`                            | …     | —          |
| test `environment`                    | `vitest.config.ts`                       | …     | —          |
| path aliases (`@shared`, `@renderer`) | `tsconfig.*` + `electron.vite.config.ts` | …     | —          |

### 3. Detect drift

| Drift type                                                                         | Severity | How to detect                            |
| ---------------------------------------------------------------------------------- | -------- | ---------------------------------------- |
| Path alias in `tsconfig` not mirrored in `electron.vite.config.ts` (or vice versa) | BLOCKER  | Compare `paths`/`resolve.alias`          |
| A `package.json` script references a file/flag that no longer exists               | BLOCKER  | Resolve each script's targets            |
| ESLint/Prettier/Stylelint rules that contradict each other (e.g. quote style)      | WARNING  | Cross-read formatter configs             |
| `engines.node` / CI `node-version` mismatch                                        | WARNING  | Compare `package.json` to workflow YAML  |
| A command documented in `CLAUDE.md`/`docs` absent from `package.json` scripts      | WARNING  | Diff doc command list against `scripts`  |
| `tsconfig` `include`/`exclude` not covering a real source dir                      | WARNING  | Resolve globs against the tree           |
| Dependency pinned in `package.json` but unused, or used but undeclared             | INFO     | Cross-ref imports against `dependencies` |
| CI job runs a script not present locally (or vice versa)                           | INFO     | Compare workflow steps to `scripts`      |

Use structural reads (`yq`/`jq`) rather than eyeballing where you can:

```bash
yq '.scripts' package.json
yq '.compilerOptions.paths' tsconfig.web.json
yq '.jobs[].steps[].run' .github/workflows/ci.yml
```

### 4. Report

```
## Config Audit — {PASS | WARN | FAIL}
**Summary**: {N} BLOCKER, {N} WARNING, {N} INFO across {N} settings in {N} files

### Settings inventory
{table: setting, declared-in, value, documented}

### Drift findings
{table: severity, setting, files, issue}

### Recommendations
- {actionable fix per BLOCKER/WARNING}
```

Verdict: **FAIL** if any BLOCKER; **WARN** if only WARNINGs; **PASS** otherwise.

## Red Flags

- A path alias resolves in `tsconfig` but not at runtime in the Vite config (or test config)
- A `npm run` script in the docs that errors because the script was renamed/removed
- CI uses a different Node major version than `engines.node` declares
- Audit verdict reads PASS while a BLOCKER finding exists
- Re-running the audit on the same commit yields a different finding count

## Rules

- **Read every config in full** — never sample
- **Cross-reference the docs** (`CLAUDE.md`, `docs/**`), not just config-vs-config
- **BLOCKER for actively misleading state** — a documented command or alias that
  no longer works costs more than a missing one
- **Read-only** — never modify a config file during the audit
- **Absent file = INFO**, not an error (defaults may apply)
- **British English** in all findings ("behaviour", "organised")
