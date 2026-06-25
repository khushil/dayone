---
name: mle-harden-async
description: 'Audit async code for unhandled task exceptions, missing cancellation, blocking calls, and resource leaks.'
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'harden async'
  - 'async audit'
  - 'check async'
  - 'async safety'
  - 'task leak'
  - 'fire and forget'
  - 'async hardening'
  - 'mle harden-async'
intent_patterns:
  - "(harden|audit|review|check)\\s+(async|asyncio|concurrent)\\s+(code|safety)?"
  - "(find|detect)\\s+(async|task)\\s+(leak|bug|issue)"
---

# Harden Async

Review all async code for safety pitfalls: fire-and-forget tasks, swallowed cancellation, blocking calls in coroutines, and leaked resources.

## When to Use

- When reviewing async code (asyncio, Textual workers, background daemons)
- When the user says "check async", "harden async", "find async bugs", or "/mle-harden-async"
- After adding new async tasks or background workers
- When investigating hangs, deadlocks, or resource leaks

## Workflow

### Step 1: Discover

Find all async functions, coroutines, and task-creating calls in scope. Build an inventory grouped by file. Report: "Found N async sites across M files."

### Step 2: Classify

Categorise each site by pattern type: task creation (`create_task`, `ensure_future`, `TaskGroup`), context manager (`async with`, `__aenter__`), event handler (`on_event`, signal handlers), worker (Textual `run_worker`, `@work`, background loops), gather (`asyncio.gather`, `asyncio.wait`), or server (`serve_forever`, listener loops).

### Step 3: Analyse

Check each site against the async safety pattern table.

| Pattern                                                                    | Severity | Message                                              |
| -------------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `create_task()` without exception handling                                 | BLOCKER  | Fire-and-forget — unhandled exceptions silently lost |
| Bare `try/except` swallows `CancelledError`                                | BLOCKER  | Swallowed cancellation prevents graceful shutdown    |
| Blocking call (`time.sleep`, `open()`, `subprocess.run`) in async function | BLOCKER  | Blocking call freezes the event loop                 |
| Async context manager without `async with`                                 | WARNING  | Resource may leak without proper cleanup             |
| No timeout on `await` to external services                                 | WARNING  | Unbounded await may hang indefinitely                |
| `asyncio.gather()` without `return_exceptions=True`                        | WARNING  | First exception cancels remaining tasks              |
| Task created but never awaited or stored                                   | WARNING  | Orphaned task may be garbage-collected               |
| No graceful shutdown for background tasks                                  | INFO     | No cancellation path for long-running task           |
| `threading.Lock` in async context                                          | INFO     | Sync lock in async code — use `asyncio.Lock`         |

### Step 4: Cross-Reference

For every long-running task or background loop: verify a cancellation handler exists, verify `CancelledError` is re-raised (not swallowed), and verify cleanup runs in a `finally` block.

### Step 5: Report

```
## Async Hardening Report

**Async Health**: {SCORE}/10
**Sites audited**: {N} across {M} files

### Inventory
- Task creation: {n}  - Context managers: {n}  - Workers: {n}
- Event handlers: {n}  - Gather calls: {n}  - Servers: {n}

### Findings
| Severity | File | Line | Pattern | Message | Fix |
|----------|------|------|---------|---------|-----|

### Top 3 Hardening Recommendations
1. ...
```

Scoring: start at 10, subtract 2 per BLOCKER, 1 per WARNING, 0.5 per INFO (minimum 0).

## Specific Techniques

| Situation                                                                       | Technique                                                                                                                                                                      | Reference                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Audit must enumerate every `async def` and task-creating call                   | Walk the AST with `ast.parse`; record every `AsyncFunctionDef`, `Call(func=Attribute(attr="create_task"))`, `Call(func=Attribute(attr="ensure_future"))`, and `AsyncWith` node | `<your-repo>/src/<your-package>/` |
| `asyncio.create_task(coro)` without a strong reference is GC-collectable        | Match `Expr(value=Call(...create_task...))` where the result is not assigned to a name held by `self` or a module-level set                                                    | Python docs on `create_task`      |
| `time.sleep()` or `requests.get()` inside an `async def` blocks the event loop  | Inspect every `Call` inside an `AsyncFunctionDef` body; flag identifiers from a blocking-API allowlist (`time.sleep`, `requests.*`, `subprocess.run`, `open(...).read`)        | Project error-handling guidelines |
| `asyncio.shield(coro)` swallows cancellation when not re-checked                | Detect `Call(func=Attribute(attr="shield"))` and verify the enclosing function re-raises `CancelledError` on its own cancellation path                                         | Python `asyncio.shield` docs      |
| Textual `@work` decorator without `exclusive=True` may stack workers            | Find `FunctionDef` nodes decorated with `@work(...)`; flag when the keyword `exclusive` is absent                                                                              | Textual workers documentation     |
| `loop.run_in_executor(None, blocking_fn)` returns a Future that must be awaited | Walk every `run_in_executor` call; flag when the return value is discarded or not awaited within the same scope                                                                | asyncio executor docs             |

## Common Rationalizations

| The agent thinks…                                                                                        | Actually…                                                                                                                                                                                                                                                                                                    | Gate                            | Corpus |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------ |
| "Blocking call is short — won't show on the P95 latency graph."                                          | Short-blocking calls compound. Three short sync calls per request multiply at concurrency; what's invisible at P95 single-user is severe at P95 with twenty concurrent requests. The discipline is to never block in async paths, not to argue how short is short enough.                                    | `wi-validator:rubric-threshold` |        |
| "Cancellation handling is paranoid for a 100 ms task — it'll have completed before the cancel can fire." | Race conditions are not size-bounded. The 100 ms task can be in flight when a parent cancellation arrives; without explicit cancellation handling the task leaks its resources and the parent's exception swallows quietly. Cancellation-awareness is a contract, not a paranoia.                            | `merge-check:pr-completed`      |        |
| "Default timeout is sensible — an explicit timeout on this call would just be noise."                    | Defaults vary by library and version; relying on them couples your code to whatever the library's maintainer decides next release. An explicit timeout is documentation as much as behaviour — it makes the upper bound visible at the call site. Ruff's S110 family flags this pattern for the same reason. | `pre-commit:ruff`               |        |

## Red Flags

- Audit run on an async codebase reports zero unawaited coroutines, yet `python -W error::RuntimeWarning -m pytest` surfaces "coroutine was never awaited" warnings
- `asyncio.create_task(...)` calls exist where the return value is discarded, but the audit classifies them as INFO rather than WARNING
- `time.sleep(...)` appears inside an `async def` body and the audit reports no BLOCKER finding
- Cancellation pathways through `asyncio.shield` are not flagged when the enclosing function lacks a `CancelledError` handler
- Audit re-run on the same SHA produces a different `BLOCKER` count

## Verification

```bash
# Audit run with structured output
<your-tool> harden-async --skill | jq '.findings[] | select(.severity == "BLOCKER")'

# Audit surface matches the codebase's async footprint
grep -rnE 'asyncio\.create_task|loop\.run_in_executor|async def' src/ | wc -l
<your-tool> harden-async --skill | jq '.metrics.async_sites_scanned'
# Both numbers must align (audit count >= grep count)

# Cross-check against pytest runtime warnings
python -W error::RuntimeWarning -m pytest tests/ -q 2>&1 | grep -E "coroutine was never awaited" | wc -l
```

Observable evidence:

- `<your-tool> harden-async --skill` exits with code 0 and emits JSON with `findings`, `metrics`, and `inventory` keys
- Each BLOCKER row carries `file`, `line`, and `pattern_id` fields
- `metrics.async_sites_scanned` is at least equal to `grep -c 'async def' src/`
- The inventory categories sum to the total site count
- Re-running on the same SHA produces a byte-identical JSON report

## Rules

- **Process ALL async code** — never sample or truncate; audit every async site in scope
- **Framework-aware** — distinguish between asyncio, Textual, and other async frameworks
- **Skip test code** — do not flag patterns in `tests/` (tests may intentionally test failure paths)
- **British English** — use British English in all findings (e.g. "analyse", "behaviour")
- **No auto-fix** — report findings and recommendations only; let the developer decide
- **Deterministic** — same codebase always produces the same report and score
