# tests — Vitest (TDD) + Cucumber (BDD)

## Frozen fixture invariant (load-bearing)

Every **value-asserting** test reads `tests/fixtures/sectors.fixture.json`. Nothing in the app or fetch path may ever write to `tests/fixtures/` — so `npm run fetch-data` and the in-app Refresh can never turn the suite red. Tests that touch the real `data/sectors.json` assert **structure only** (11 sectors, schema, ascending dates), never specific returns or sector names.

## BDD (Cucumber)

- `features/*.feature` in business language; step definitions in `tests/steps/*.ts`.
- Steps **import `lib/` via relative paths** (not the `@` alias) to dodge the tsx/ESM alias issue.
- `tests/support/world.ts` loads the fixture and holds per-scenario state.

## TDD (Vitest)

- Unit tests co-located with `lib/` modules; component tests as `*.test.tsx` next to components.
- Component tests **mock `echarts-for-react`**; a `window.api` test double is installed in the Vitest setup so FR-9 ("failed refresh keeps last-good") is testable.
- Numeric functions require edge-case tests: `close[0] = 0`, a null mid-series close, empty/1-point slices, non-finite/`-0` formatting.
