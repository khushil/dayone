# BDD Conventions

**Path scope**: `features/**`, `tests/steps/**`, `tests/support/**`

DayONE uses **Cucumber.js** (run `npm run bdd`). Features live in
`features/*.feature`; step definitions in `tests/steps/*.steps.ts`; the shared
world and stubs in `tests/support/`.

## Gherkin style

- Write features in **domain language**, not technical detail. One Feature per file.
- **Given** = precondition, **When** = action, **Then** = expected outcome;
  **And** / **But** extend the previous step. Use `Scenario Outline` + `Examples`
  for data-driven cases and `Background` for shared preconditions.

## Step definitions

- Keep steps thin — delegate to `lib/` and helpers; no duplicated step code.
- Import `lib/` via **relative paths** (not the `@` alias) to avoid tsx/ESM alias
  issues at run time.
- Acceptance scenarios read the frozen fixture via `tests/support`; never the
  network.

## Quality checks

- Scenarios are readable by non-technical stakeholders; no implementation detail
  leaks into Gherkin; Examples cover boundary conditions.

## See also

- `tests/CLAUDE.md`, `testing-standards.md`
