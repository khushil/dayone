---
name: mle-harden-async
description: 'Audit TypeScript async code — find missing awaits, floating promises, unhandled rejections, race conditions, missing cancellation/cleanup, and main/renderer-thread blocking.'
keywords:
  - 'harden async'
  - 'async audit'
  - 'check async'
  - 'floating promise'
  - 'unhandled rejection'
intent_patterns:
  - "(harden|audit|review|check)\\s+(async|promise|concurrent)\\s+(code|safety)?"
  - "(find|detect)\\s+(async|promise)\\s+(leak|bug|issue|rejection)"
---

# Harden Async

Review DayONE's async code for safety pitfalls: floating promises, missing
awaits, unhandled rejections, races, missing cancellation/cleanup, and work that
blocks the Electron main or renderer thread. Report only.

## When to Use

- After adding async IPC handlers, data-fetch logic, or React effects.
- When the user says "check async", "harden async", or "/mle-harden-async".
- When investigating hangs, stale state, or unhandled-rejection warnings.

## Workflow

1. **Discover** — inventory every `async` function, `await`, `.then(`/`.catch(`,
   `Promise.all`/`allSettled`/`race`, `useEffect`, and `AbortController` site in
   scope (default `src/`, skip `*.test.ts(x)`). Report "Found N async sites."
2. **Classify** — group by kind: promise-producing call, React effect, IPC
   handler, event/listener, aggregation (`Promise.all`).
3. **Analyse** — score each against the table below.
4. **Cross-reference** — for every long-lived listener, timer, or fetch: confirm
   a cancellation path (`AbortController`, effect cleanup return, `removeListener`)
   and that cleanup runs on unmount/teardown.
5. **Report** — health score out of 10; start at 10, −2 per BLOCKER, −1 per
   WARNING, −0.5 per INFO (floor 0).

## Pattern Table

| Pattern                                                                 | Severity | Message                                                                      |
| ----------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Promise-returning call with no `await`/`void`/`.then` (floating)        | BLOCKER  | Floating promise — rejection is unobserved; `await` it or mark `void`        |
| `async` passed where a sync callback is expected (e.g. effect body)     | BLOCKER  | Returned promise is ignored — wrap an inner async fn; effects can't be async |
| `await` missing before a promise whose result is then used              | BLOCKER  | Missing await — downstream reads a Promise, not its value                    |
| `useEffect` starting async work with no cleanup/cancellation            | BLOCKER  | Effect leaks — return cleanup; abort in-flight work with AbortController     |
| State set after `await` without checking the component is still mounted | WARNING  | Possible set-after-unmount race — guard with an abort/mounted flag           |
| `Promise.all` where one rejection should not cancel the rest            | WARNING  | Use `Promise.allSettled` when partial results are acceptable                 |
| Long CPU loop / sync IO on main or renderer thread                      | WARNING  | Blocks the event loop / UI — offload or chunk the work                       |
| Unawaited `Promise.all`/`race` result                                   | WARNING  | Aggregate promise floats — await or handle it                                |
| `await` inside a loop where calls are independent                       | INFO     | Serialised awaits — consider `Promise.all` for concurrency                   |
| No timeout/abort on an awaited external operation                       | INFO     | Unbounded await may hang — add an AbortSignal or timeout                     |

IPC failures must surface as a discriminated `RefreshResult`, not a rejected
promise crossing the process boundary (see mle-error-audit).

## Report Format

```
## Async Hardening — {score}/10
**Sites audited**: N across M files

### Inventory
- Promises: n  - Effects: n  - IPC handlers: n  - Aggregations: n

### Findings
| Severity | File:Line | Pattern | Fix |
|----------|-----------|---------|-----|

### Top 3 Hardening Recommendations
1. …
```

## Red Flags

- A floating promise exists but the audit reports zero BLOCKERs.
- `useEffect(async () => …)` flagged as INFO rather than BLOCKER.
- An effect starts a fetch with no `AbortController` and no cleanup return.
- Re-run on the same tree yields a different BLOCKER count.

## Verification

```bash
ast-grep run -p 'useEffect(async () => { $$$ })' src/        # async effect bodies
rg -n "\.then\(|Promise\.all\(|Promise\.race\(" src/         # aggregation sites
npm run lint && npm run typecheck                            # @typescript-eslint/no-floating-promises
```

## Rules

- **Process ALL async sites** in scope — never sample.
- **Skip tests** — `*.test.ts(x)` may exercise failure/race paths deliberately.
- **British English** in findings ("analyse", "behaviour").
- **No auto-fix** — report findings and recommendations only.
- **Deterministic** — the same tree yields the same report and score.
