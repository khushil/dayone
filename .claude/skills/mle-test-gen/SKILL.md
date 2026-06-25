---
name: mle-test-gen
description: 'Generate Vitest unit/component tests and Cucumber.js BDD scenarios for DayONE from a story, spec, or source file.'
keywords:
  - 'generate tests'
  - 'create tests'
  - 'add test coverage'
  - 'test generation'
  - 'unit tests'
  - 'component tests'
  - 'BDD tests'
intent_patterns:
  - "(generate|create|add|write)\\s+(unit\\s+|component\\s+|BDD\\s+)?tests"
  - "(increase|improve|add)\\s+(test\\s+)?coverage"
---

# Test Generation

Generate tests from a GitHub issue/story, a written spec, or an existing source
file. DayONE uses **Vitest** (jsdom) for unit + component tests, co-located as
`*.test.ts(x)` beside the code, and **Cucumber.js** for BDD acceptance
(`features/*.feature` + `tests/steps/*.steps.ts` + `tests/support/`).

## When to Use

- After implementing logic in `src/renderer/src/lib/` or a component
- When the user says "generate tests", "add coverage", or "/mle-test-gen"
- Before opening a PR, to close coverage gaps

## Workflow

1. **Identify the unit under test** — read the source (or the story's acceptance
   criteria) and list the observable behaviours and their boundaries.
2. **Pure logic → Vitest unit test** beside the module (`returns.test.ts` next to
   `returns.ts`). Assert on **values**, not just types. `lib/` is built
   test-first: write the failing test, then the implementation.
3. **Component → Vitest + Testing Library** (`@testing-library/react`,
   `@testing-library/jest-dom`). **Mock `echarts-for-react`** in value-asserting
   tests so assertions target the computed data, not the chart. Add an
   accessibility check with `vitest-axe` where the component renders UI.
4. **User-visible behaviour → BDD**. Add/extend a `features/*.feature` in domain
   language; implement thin steps in `tests/steps/*.steps.ts` that delegate to
   `lib/`. Import `lib/` via **relative paths** (not the `@` alias) to dodge
   tsx/ESM alias issues. Use `Scenario Outline` + `Examples` for parameterised
   cases and `Background` for shared preconditions.

## Invariants

- **Frozen fixture**: value-asserting tests read only
  `tests/fixtures/sectors.fixture.json`. Never write to it from a test; never
  assert specific returns against the live `data/sectors.json` (structure-only
  there: 11 sectors, ascending dates).
- **No live network** — use the committed snapshot or the stubs in
  `tests/support/*Stub.ts`.
- **Numeric edge cases are mandatory** for `lib/`: non-finite inputs, divisors
  ≤ 0, empty and single-point slices, and `-0`. The guard must reject these,
  never emit `NaN`/`Infinity`.

## Red Flags

- The only assertion is a type check (`typeof`, `instanceof`) — no value bound
- A `Scenario Outline` has no `Examples` table — the outline is unbound
- A value test renders the real ECharts component instead of mocking it
- A step file duplicates logic that belongs in `lib/`
- New `lib/` code ships with no edge-case test for non-finite / ≤0 / empty input

## Verification

```bash
npm run test         # Vitest unit + component — exits 0, new tests pass
npm run bdd          # Cucumber scenarios pass
npm run typecheck    # tests are type-clean
npm run lint         # ESLint + Stylelint clean
```

Observable evidence: the new `*.test.ts(x)` files exist beside their source and
pass; new `.feature` scenarios pass under `npm run bdd`; edge-case tests fail
against a deliberately broken guard and pass against the real one.
