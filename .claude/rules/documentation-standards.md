# Documentation Standards

**Path scope**: `src/**/*.ts`, `src/**/*.tsx`, `**/*.md`

## TSDoc

- `/** ... */` TSDoc on every exported function, type/interface, React component,
  and module.
- Describe intent and contracts, not the obvious. Document non-trivial params and
  return shapes; note thrown errors (e.g. `DataError`) and invariants. Don't restate
  the name. No `TODO`/`FIXME` in committed docs — open a GitHub issue instead.

```ts
/**
 * Rebase a price series so the first close is 100.
 *
 * @throws {DataError} if the base close is not a positive, finite number.
 */
export function rebaseToHundred(series: readonly number[]): number[] {
  /* … */
}
```

## Components & modules

- Each component file: a one-line TSDoc summary of what it renders and its key props.
- Each `lib/` module: a module-level comment stating its single responsibility.

## Markdown / docs

- `docs/CODING_STANDARDS.md` is the canonical style spec; `docs/` and the nested
  `src/**/CLAUDE.md` files are the architecture source of truth — keep them current
  when an API or the structure changes. British English in prose.

## See also

- `code-standards.md`, `docs/CODING_STANDARDS.md`
