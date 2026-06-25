# Code Standards

**Path scope**: `src/**/*.ts`, `src/**/*.tsx`

DayONE follows the **Google TypeScript Style Guide**. The authoritative,
enforcement-wired spec is [`docs/CODING_STANDARDS.md`](../../docs/CODING_STANDARDS.md)
(plus its two documented deviations). This rule is the working digest — when in
doubt, defer to that document and the nested `src/**/CLAUDE.md` files.

## Language & runtime

- TypeScript 5.9 (strict), React 19, Electron 39, Node 22 — use modern syntax.
- Prefer `unknown` over `any`; never widen to `any` to silence the checker.
- `const` by default, never `var`; strict equality `===`/`!==` (null check exempt).

## Enforced by ESLint (flat config) + Prettier — keep the build green

- **Named exports only** in `src/**` (`import/no-default-export`); config/entry
  files (e.g. `*.config.ts`) may `export default`.
- `interface` for object shapes; `type` for unions and aliases.
- Naming: `UpperCamelCase` types, `lowerCamelCase` values/functions,
  `UPPER_SNAKE` module constants, `PascalCase` React components.
- Prettier owns all formatting (single quotes, semicolons, 80 cols, trailing
  commas, Tailwind class order). Never hand-format — the PostToolUse hook
  auto-fixes on every edit.

## Convention (reviewed, not all auto-checked)

- `/** TSDoc */` on every exported function, type, and module.
- Small, single-purpose functions; no dead code; names describe intent.

## Domain modelling & contracts

- Cross-process data is defined once as **Zod** schemas in `src/shared`; derive
  TS types with `z.infer` — never hand-maintain a parallel `interface`.
- IPC results travel as a discriminated union (`RefreshResult`:
  `{ ok: true; data } | { ok: false; reason }`) so failures are data, not throws.
- `lib/` is pure: same input → same output; no `Date.now()`/`window`/IO inside;
  range-dependent functions take an explicit `asOf`/anchor argument.
- Guard numerics: reject non-finite/≤0 divisors; never emit `NaN`/`Infinity`.

## See also

- `docs/CODING_STANDARDS.md` — canonical spec + deviations
- `src/shared/CLAUDE.md`, `src/renderer/src/lib/CLAUDE.md` — module conventions
- `testing-standards.md`, `architecture-standards.md`
