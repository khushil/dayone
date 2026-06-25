# Testing Standards

**Path scope**: `tests/**`, `src/**/*.test.ts`, `src/**/*.test.tsx`, `features/**`

## Frameworks

- **Vitest** (jsdom) for unit + component tests; co-located `*.test.ts(x)`.
  Run `npm run test` (CI) or `npm run test:watch` (red→green→refactor).
- **Cucumber.js** for BDD acceptance: `features/*.feature` +
  `tests/steps/*.steps.ts` + `tests/support/`. Run `npm run bdd`.
- `@testing-library/react` + `@testing-library/jest-dom`; `axe-core` / `vitest-axe`
  for accessibility. Coverage via `@vitest/coverage-v8`.

## Cross-cutting invariants

- **Frozen fixture**: value-asserting tests read only
  `tests/fixtures/sectors.fixture.json`. Nothing in the app or fetch path ever
  writes there, so refreshing data can't turn tests red. `scripts/make-fixture.mjs`
  is its only writer (deterministic — no randomness, no wall-clock).
- **No live network** in the app or tests — use the committed snapshot or the
  stubs in `tests/support/*Stub.ts`.
- Structure-only tests on the real `data/sectors.json` assert schema (11 sectors,
  ascending dates), never specific returns.

## Conventions

- Test behaviour, not implementation; mock `echarts-for-react` in value tests.
- Cover the edge cases the domain guards against (non-finite, ≤0, empty / 1-point
  slices, `-0`). New logic ships with tests; `lib/` is built test-first.
- BDD steps import `lib/` via relative paths (not the `@` alias) to dodge tsx/ESM
  alias issues.

## See also

- `tests/CLAUDE.md`, `src/renderer/src/lib/CLAUDE.md`, `bdd-conventions.md`
