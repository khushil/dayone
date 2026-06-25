---
name: mle-pre-commit-review
description: 'Pre-commit quality gate for DayONE — run lint, typecheck, test, and build; scan changed files for anti-patterns and secrets; verify the Conventional Commit message; emit a PASS/WARN/FAIL verdict.'
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
keywords:
  - 'pre-commit'
  - 'review changes'
  - 'check before commit'
  - 'quality gate'
  - 'ready to commit'
intent_patterns:
  - "(review|check|scan|validate)\\s+(my\\s+)?(changes|code|diff|commit)"
  - "(pre.?commit|quality)\\s+(review|check|gate|scan)"
  - "(ready|about)\\s+to\\s+commit"
---

# Pre-Commit Review

Quality gate over all staged and unstaged changes before commit. Surfaces
secrets, anti-patterns, type/lint/test/build failures, and Conventional Commit
violations, then delivers a structured verdict. This is the Claude Code
equivalent of a pre-commit hook. Report only — do not auto-fix.

## When to Use

- Before every commit, or before opening a PR.
- When the user says "review my changes", "check before commit", or "/mle-pre-commit-review".

## Workflow

### Step 1 — Identify changed files

```bash
git diff --cached --name-only          # staged
git diff --name-only                   # unstaged
git ls-files --others --exclude-standard  # untracked
```

Combine and deduplicate. Filter out binaries (`.png .jpg .gif .ico .woff2 .ttf`),
lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), generated output
(`out/`, `dist/`, `node_modules/`, coverage), and `.mle-metadata.json`. Classify
the rest: TypeScript (`.ts .tsx`), config (`.json .yml .yaml`), docs (`.md`),
styles (`.css`). Report "Reviewing N changed files." **Process ALL of them — never
truncate or sample.** If nothing remains, deliver PASS immediately.

### Step 2 — Anti-pattern & secret scan

Scan only added/modified lines (`git diff HEAD -- <file>`, lines starting `+`).

**Secrets (all files)** — BLOCKER:

| Pattern                                       | Message                      |
| --------------------------------------------- | ---------------------------- |
| `-----BEGIN ... PRIVATE KEY-----`             | Private key in source        |
| `ghp_` + 36 alphanumerics                     | GitHub personal access token |
| `sk-` + 20+ alphanumerics                     | API secret key               |
| `AIza` + 35 chars                             | Google API key               |
| `<<<<<<<`, `>>>>>>>`, `=======` at line start | Merge conflict markers       |

**TypeScript/React:**

| Pattern                                               | Severity | Message                               |
| ----------------------------------------------------- | -------- | ------------------------------------- |
| `password`/`apiKey`/`token` assigned a string literal | BLOCKER  | Hardcoded credential                  |
| `eval(` / `new Function(`                             | BLOCKER  | Code-injection risk                   |
| `debugger` statement                                  | BLOCKER  | Debugger left in code                 |
| Empty `catch {}` or `.catch(() => {})`                | BLOCKER  | Swallowed error (see mle-error-audit) |
| `: any` / `as any`                                    | WARNING  | Prefer `unknown` and narrowing        |
| `@ts-ignore` / `@ts-nocheck`                          | WARNING  | Type suppression — fix the type       |
| `console.log(` / `console.debug(`                     | WARNING  | Remove debug logging or use a logger  |
| Floating promise (un-awaited, see mle-harden-async)   | WARNING  | Unhandled rejection risk              |
| `var ` declaration                                    | WARNING  | Use `const`/`let`                     |
| `export default` under `src/**`                       | WARNING  | Named exports only in src             |
| `// TODO` / `FIXME` / `HACK` / `XXX`                  | INFO     | Marker — review before commit         |

Collect findings as `{severity, file, line, message}`.

### Step 3 — Lint

```bash
npm run lint
```

ESLint (flat config) + Stylelint. Any failure → BLOCKER.

### Step 4 — Typecheck

```bash
npm run typecheck
```

`tsc --noEmit` (node + web). Any error → BLOCKER.

### Step 5 — Test & build

```bash
npm run test     # Vitest (unit + component)
npm run build    # typecheck + bundle
```

Test failure → BLOCKER. If no test covers the changed `lib/`/component code, add a
WARNING ("No test found for changed logic — `lib/` is built test-first"). Build
failure → BLOCKER.

### Step 6 — Dependency & secret hygiene

```bash
npm audit --omit=dev   # high/critical advisories → WARNING (BLOCKER if a secret/RCE in a runtime dep)
```

Also confirm no `.env`, `*.pem`, or `*.key` file appears in the change set
(BLOCKER if so). If `npm audit` is unavailable, note it INFO and continue.

### Step 7 — Conventional Commit check

Read the proposed message (`git log -1 --format=%B` for the last commit, or the
message the user supplied). Verify `type(scope): description` with type ∈
`feat|fix|docs|refactor|test|chore|build|ci|perf`; a breaking change is `feat!:`
or a `BREAKING CHANGE:` footer. Non-conforming → BLOCKER (commitlint will reject
it, and the PR title is the release-please source of truth).

### Step 8 — Verdict

- **FAIL** — any BLOCKER (secret, lint/type/test/build failure, swallowed error,
  bad commit message).
- **WARN** — WARNINGs but no BLOCKER.
- **PASS** — only INFO or nothing.

```
## Pre-Commit Review — {VERDICT}
**Summary**: N BLOCKER, N WARNING, N INFO across N changed files

### Changed Files
- TypeScript: …

### Findings
#### BLOCKERs
- [BLOCKER] src/main/ipc.ts:42 — Swallowed error
#### WARNINGs / INFO
- …

### Gates
lint: {pass/fail}  typecheck: {pass/fail}  test: {pass/fail}  build: {pass/fail}  audit: {clean/N advisories}

### Recommendation
- FAIL: "Fix the BLOCKERs before committing."
- WARN: "Consider addressing the WARNINGs; you may proceed."
- PASS: "All checks passed. Ready to commit."
```

## Red Flags

- Verdict declared without actually running lint, typecheck, and test.
- A BLOCKER explained away as "context-aware" — severity is final.
- PASS emitted while `git diff --name-only` still lists unreviewed files.
- Recommendation softened from FAIL to WARN because the user is "almost ready".

## Rules

- **Run every gate** — never skip lint, typecheck, test, or build.
- **Process ALL changed files** — never truncate or sample.
- **Diff-only scanning** — flag only new/modified lines to avoid false positives.
- **Severity is final** — a BLOCKER always means FAIL, no override.
- **Graceful degradation** — a missing tool is an INFO note, not a silent skip.
- **British English** in all findings ("colour", "analyse").
- **Exit early** — no reviewable changes → immediate PASS.
- **Deterministic** — the same change set yields the same verdict.
- **No auto-fix** — report findings; the developer decides.
