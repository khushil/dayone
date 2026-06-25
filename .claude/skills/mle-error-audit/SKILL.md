---
name: mle-error-audit
description: 'Audit TypeScript error handling — find empty catches, swallowed promise rejections, lost error context, any-typed catches, and inconsistent throw-vs-Result patterns.'
keywords:
  - 'error audit'
  - 'audit errors'
  - 'check error handling'
  - 'swallowed errors'
  - 'error patterns'
intent_patterns:
  - "(audit|review|check|scan)\\s+(error|exception)\\s+(handling|patterns)"
  - "(find|detect)\\s+(empty|swallowed|missing)\\s+(catch|error)"
---

# Error Audit

Audit every error-handling site in DayONE's TypeScript and score each against
the pattern table below, producing a structured health report. Report only —
the developer decides how to remediate.

## When to Use

- Before a release or quality gate, or after reworking error flows.
- When the user says "audit errors", "check error handling", or "/mle-error-audit".
- When investigating unreliable error recovery or silent failures.

## Workflow

1. **Discover** — list every `.ts`/`.tsx` file in scope (default `src/`),
   skipping `*.test.ts(x)`, generated output, and `node_modules`. Report
   "Scanning N files." Use `rg`/`ast-grep` to locate `catch`, `throw`, `.catch(`,
   `.then(`, and `RefreshResult`/discriminated-union sites.
2. **Classify** — record each site as `(file, line, kind)` where kind ∈
   {catch, throw, promise-rejection, result-union}.
3. **Analyse** — score each site against the pattern table.
4. **Correlate** — confirm IPC/main↔renderer failures travel as a discriminated
   `RefreshResult` (`{ ok: true; data } | { ok: false; reason }`), never as a
   thrown error across the process boundary; confirm rethrows preserve the
   original via `{ cause }`.
5. **Report** — findings sorted by severity (BLOCKER first) with a top-5 list.
6. **Summary** — health score `(passing sites / total) × 100`; grade **A** 90+,
   **B** 75–89, **C** 60–74, **D** below 60.

## Pattern Table

| Pattern                                                        | Severity | Message                                                                     |
| -------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Empty `catch {}` / `catch (e) {}` with no handling             | BLOCKER  | Error swallowed silently — log, rethrow, or surface as a Result             |
| `.catch(() => {})` / `.catch(() => undefined)`                 | BLOCKER  | Promise rejection discarded — handle or propagate it                        |
| Rethrow that drops the cause (`throw new Error(msg)` in catch) | BLOCKER  | Lost error context — use `throw new Error(msg, { cause: err })`             |
| IPC/boundary failure thrown instead of returned as a Result    | BLOCKER  | Cross-process failure must be data — return a discriminated `RefreshResult` |
| `catch (e: any)` or untyped catch then `e.message` access      | WARNING  | Catch binding should be `unknown`; narrow before use                        |
| Caught error logged then re-thrown unchanged (double-report)   | WARNING  | Decide once: log-and-recover or rethrow — not both                          |
| Inconsistent throw-vs-Result for the same operation            | WARNING  | Pick one contract per call path; mixing forces callers to guard twice       |
| Floating promise whose rejection is never observed             | WARNING  | Unhandled rejection — `await` it or attach a handler (see mle-harden-async) |
| Broad `catch` where a specific failure is expected             | INFO     | Narrow the handled case; let unexpected errors propagate                    |

A `catch` that immediately logs _and_ recovers, or rethrows with `{ cause }`, is
acceptable — only flag genuine swallowing or context loss.

## Report Format

```
## Error Audit — Grade {A–D} ({score}%)
**Summary**: N BLOCKER, N WARNING, N INFO across N files (M sites)

### BLOCKERs
- [BLOCKER] src/main/ipc.ts:42 — Cross-process failure thrown, not returned as RefreshResult

### WARNINGs / INFO
- …

### Top 5 Recommendations
1. {actionable recommendation}
```

## Red Flags

- Verdict PASS while at least one empty `catch {}` exists in scope.
- A renderer call path that `throw`s on IPC failure rather than returning a Result.
- `catch (e: any)` reported as INFO rather than WARNING.
- Re-run on the same tree produces a different finding count.

## Verification

```bash
rg -n "catch\s*\{\s*\}|\.catch\(\(\)\s*=>\s*\{\}\)" src/   # empty catches
ast-grep run -p 'catch ($E: any) { $$$ }' src/             # any-typed catches
npm run typecheck && npm run lint                          # build stays green
```

## Rules

- **Process ALL files** in scope — never sample or truncate.
- **Skip tests** — `*.test.ts(x)` may exercise failure paths deliberately.
- **British English** in all findings ("analyse", "behaviour").
- **No auto-fix** — report findings only.
- **Deterministic** — the same tree yields the same report and grade.
- **Severity is final** — BLOCKERs always count against the score.
