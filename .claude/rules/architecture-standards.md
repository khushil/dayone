# Architecture Standards

**Path scope**: `src/**`

## Process boundaries (dependencies flow inward; never the reverse)

| Layer                  | Responsibility                                | May import                                                              |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `src/shared`           | Zod contracts shared by all processes         | Zod only — no Electron / DOM / React                                    |
| `src/main`             | Electron main: window, security, IPC          | Node, `../shared`                                                       |
| `src/preload`          | Typed `contextBridge` surface on `window.api` | Electron preload, `../shared`                                           |
| `src/renderer/src`     | React 19 UI (Tailwind v4, Zustand)            | React, `@shared`, `@renderer`, `lib/`                                   |
| `src/renderer/src/lib` | **Pure** domain logic (the testable core)     | `@shared/types` + TS stdlib only — no React / Electron / DOM / `window` |

## Invariants

- **Security**: main hardens `BrowserWindow` (`contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`); CSP `connect-src 'none'` — the
  renderer makes no network calls. Preload exposes a minimal `DayoneApi`, never
  raw `ipcRenderer` or Node globals.
- **No live network** anywhere in the app; `data/sectors.json` (committed) is the
  canonical/offline path. Refresh writes only to `userData/sectors.json` (atomic
  temp + rename); `data/sectors.json` is the read-only fallback.
- Components call the `useSectorData()` hook, never `window.api` directly; one
  Zustand store is the single source of truth; range-dependent values come from
  `lib/` pure functions.
- **Gain/loss is never colour-only** — always pair with a sign + ▲/▼; a
  colourblind-safe mode swaps the diverging scale.

## See also

- root `CLAUDE.md` (architecture map) and each `src/**/CLAUDE.md`
- `code-standards.md`, `testing-standards.md`
