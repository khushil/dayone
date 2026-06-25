# DayONE

A cross-platform (Windows 11 + macOS) desktop utility that visualizes **12-month stock performance by market sector**. Electron + React 19 + TypeScript. Built as a live demonstration of an AI-assisted SDLC: requirements → BDD/TDD → enforced standards → review → CI.

## Architecture map

Directory-specific conventions live in nested `CLAUDE.md` files that load automatically when you work in each folder — read them before editing there.

- `src/main` — Electron main: window, security hardening, IPC. → `src/main/CLAUDE.md`
- `src/preload` — the typed `contextBridge` surface. → `src/preload/CLAUDE.md`
- `src/shared` — Zod contracts shared by all processes. → `src/shared/CLAUDE.md`
- `src/renderer/src` — React UI (Tailwind v4, Zustand). → `src/renderer/src/CLAUDE.md`
- `src/renderer/src/lib` — **pure** domain logic (the testable core). → `src/renderer/src/lib/CLAUDE.md`
- `tests` + `features` — Vitest + Cucumber. → `tests/CLAUDE.md`
- `scripts` — the data pipeline. → `scripts/CLAUDE.md`

Data flows: `data/sectors.json` (committed snapshot, canonical/offline) → main loads & validates → IPC → renderer store → `lib/` computes everything range-dependent → components render.

## Coding standards (apply everywhere)

We follow the **Google TypeScript Style Guide** — full detail and the two documented deviations in `docs/CODING_STANDARDS.md`. Essentials: `const`/`===`, **named exports only** in `src/**`, prefer `unknown` over `any`, `interface` for object shapes, `/** JSDoc */` on exported API. Formatting is Prettier's job — don't hand-format. A `PostToolUse` hook auto-fixes and lints every file you edit; keep the build green.

## Commits & versioning — Conventional Commits + SemVer

Every commit and **PR title** follows [Conventional Commits](https://www.conventionalcommits.org): `feat:`/`fix:`/`docs:`/`refactor:`/`test:`/`ci:`/`chore:`; a breaking change is `feat!:` or a `BREAKING CHANGE:` footer. **Versions are derived, never hand-edited** — `release-please` bumps `package.json` + `CHANGELOG.md` and cuts the release; do not run `npm version` or push `v*` tags. `commitlint` (CI on the PR title, local `lefthook` hook) enforces the format. PRs are **squash-merged**, so write the PR title as the release-worthy summary.

## Cross-cutting invariants

- **Frozen fixture**: value-asserting tests read `tests/fixtures/sectors.fixture.json`; nothing in the app or fetch path ever writes there, so refreshing data can't turn tests red.
- **No live network** in the app or the demo — the committed snapshot is the guaranteed path.
- **Gain/loss is never color-only** — always pair with sign + ▲/▼; a colorblind-safe mode swaps the diverging scale.

## Commands

```bash
npm run dev          # launch the app (needs a display)
npm run build        # typecheck + bundle
npm run test         # Vitest (unit + component)
npm run test:watch   # live red→green→refactor
npm run bdd          # Cucumber acceptance scenarios
npm run lint         # ESLint + Stylelint
npm run fix          # auto-fix lint + format
npm run typecheck    # tsc --noEmit (node + web)
npm run fetch-data   # refresh data/sectors.json (best-effort, never in tests)
```
