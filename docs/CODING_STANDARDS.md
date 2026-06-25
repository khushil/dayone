# Coding standards

DayONE follows the **[Google style guides](https://google.github.io/styleguide/)** and enforces them automatically. This document records what is mechanically enforced, what is convention, our two deliberate deviations, and how enforcement is wired into Claude Code.

## Guides we adopt

| Area               | Guide                                                                                | Enforced by                                              |
| ------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| TypeScript / React | [Google TS Style Guide](https://google.github.io/styleguide/tsguide.html)            | ESLint 9 flat config (`eslint.config.mjs`) + Prettier    |
| HTML / CSS         | [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html) | Stylelint (`.stylelintrc.json`) + Prettier               |
| Shell              | [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)      | `shellcheck` (only `.sh` files; we have one hook script) |

> We encode the **Google TypeScript Style Guide** as an ESLint flat config rather than running the `gts` package directly: `gts`'s legacy config and its `project: './tsconfig.json'` typed-lint assumption fight electron-vite's split `tsconfig.node`/`tsconfig.web` layout and ESLint 9 flat config. The rules below are the same guide, applied cleanly to this stack.

## Mechanically enforced (ESLint / Prettier / Stylelint)

These fail `npm run lint` / `npm run format:check`:

- `const` by default, **never `var`** (`no-var`, `prefer-const`).
- Strict equality `===` / `!==` (`eqeqeq`, with `null` exempt to catch `null`/`undefined` together).
- **No default exports** in `src/**` (`import/no-default-export`) — named exports only.
- `interface` (not `type`) for object shapes (`consistent-type-definitions`).
- Naming: `UpperCamelCase` types, `lowerCamelCase` variables/params/functions (PascalCase allowed for React components), `UPPER_CASE` module constants (`naming-convention`).
- Prefer `unknown` over `any` (`no-explicit-any`, warning — narrow it).
- React hooks rules + `jsx-a11y` accessibility rules (renderer only).
- Formatting: single quotes, semicolons, 80-column, trailing commas — owned entirely by **Prettier** (ESLint stylistic rules are disabled via `eslint-config-prettier`, so the two never conflict).
- Tailwind class ordering via `prettier-plugin-tailwindcss`.

## Convention (reviewed, not auto-checked)

The linter cannot judge these — the `style-reviewer` agent and humans do:

- `/** JSDoc */` on exported functions, types, and modules.
- Names describe intent from the reader's side; no Hungarian notation or `opt_` prefixes.
- Small, single-purpose functions; no dead code.

## Documented deviations

1. **PascalCase React component filenames** (`SectorRail.tsx`) instead of Google's `snake_case`. React's ecosystem universally uses PascalCase component files; non-component modules stay `lowerCamelCase` (`returns.ts`, `useSectorData.ts`). Filename casing is not in our lint rule set, so this is a stated convention.
2. **Config/entry files may `export default`.** `electron.vite.config.ts`, `vite.config.ts`, `vitest.config.ts`, and `cucumber.*` require a default export by their toolchains, so `import/no-default-export` is scoped to `src/**` and turned off for those files.

## Commands

```bash
npm run lint          # ESLint + Stylelint (non-mutating)
npm run fix           # eslint --fix + stylelint --fix + prettier --write
npm run format:check  # Prettier check
npm run typecheck     # tsc --noEmit (node + web)
```

## How Claude Code enforces this

1. **Rules** — this file + `CLAUDE.md` (loaded into every session) so generated code is compliant from the first keystroke.
2. **Hook** — `.claude/settings.json` runs `.claude/hooks/lint-format.sh` after every `Edit`/`Write`, auto-fixing the changed file and surfacing any residual violation back to Claude.
3. **Agents**:
   - `.claude/agents/ts-developer.md` — the **builder**: writes/changes TypeScript/React/Electron code test-first, to this guide, leaving lint + typecheck + tests green with proof.
   - `.claude/agents/style-reviewer.md` — the **reviewer**: judges a diff against this guide and reports `file:line` + rule (read-only).
4. **Skill** — `/google-style` runs the full sweep (`lint` + `typecheck` + `format:check`) and can `--fix`.
