# src/renderer/src/lib — pure domain logic (the testable core)

This is the heart of the app and the main TDD subject. **No imports of React, Electron, the DOM, or `window`.** Only `@shared/types` and pure TypeScript.

## Rules

- Built **test-first**: one co-located `*.test.ts` per module; write the failing test before the implementation.
- **Pure functions only** — same input, same output; no hidden state, no `Date.now()`/`new Date()` inside. Range-dependent functions (e.g. YTD) take an explicit `asOf`/anchor argument so they're deterministic.
- **Guard numerics**: reject/raise on a non-finite or `≤ 0` divisor (rebasing, returns); never emit `NaN`/`Infinity`. Display helpers normalize `-0` and non-finite to `—`.
- Invariant: a sector has exactly 13 monthly closes → 12 returns. Validate, don't assume.
- Named exports, `interface` for object shapes, `/** JSDoc */` on every exported function.

## Modules

`returns.ts` (rebaseToHundred, monthlyReturns, periodReturn) · `ranges.ts` (sliceByRange incl. YTD + <2-point) · `summary.ts` (marketBreadth, bestWorstSector) · `format.ts` (signed %, tabular, month labels) · `data.ts` (load + validate via `parseSectorData`).
