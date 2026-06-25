# SectorScope

A small, polished **cross-platform desktop app** (Windows 11 + macOS) that visualizes **12-month stock performance by market sector** — the 11 GICS sectors via their SPDR sector ETFs. Built with Electron + React 19 + TypeScript.

It doubles as a worked example of an **AI-assisted SDLC**: requirements → BDD/TDD → enforced Google coding standards → adversarial review → CI.

## Highlights

- **Premium "market terminal" UI** — performance lines rebased to 100, a signature sectors × months **returns matrix**, best/worst/breadth cards, and a multi-select sector rail with sparklines.
- **Accessible & colorblind-safe** — gain/loss never relies on color alone (sign + ▲/▼), a CVD palette toggle, keyboard navigation, and a clean `axe` pass.
- **Offline-first** — ships a committed data snapshot; an optional Refresh pulls fresh prices (dividend-adjusted) over IPC and writes only to `userData`, keeping last-good data on any failure.

## Getting started

```bash
npm install
npm run dev      # launches the app (needs a display)
```

## Scripts

| Command                           | What it does                                                         |
| --------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                     | Run the app with hot reload                                          |
| `npm run build`                   | Typecheck + bundle                                                   |
| `npm run test` / `test:watch`     | Vitest unit + component tests                                        |
| `npm run bdd`                     | Cucumber acceptance scenarios                                        |
| `npm run lint` / `fix`            | ESLint + Stylelint (Google TS Style)                                 |
| `npm run typecheck`               | `tsc --noEmit` (main + renderer)                                     |
| `npm run fetch-data`              | Refresh `data/sectors.json` (best-effort; **not** for the live demo) |
| `npm run build:mac` / `build:win` | Package a `.dmg` / `.exe` (run on the target OS)                     |

## How it's built

- **Domain logic is pure** (`src/renderer/src/lib`) — rebasing, returns, ranges (incl. deterministic YTD), breadth — and is the primary TDD subject. UI and Electron IPC are thin shells over it.
- **Testing**: Vitest (TDD) + Cucumber (BDD). Every value-asserting test reads a **frozen fixture** (`tests/fixtures/sectors.fixture.json`); the data-fetch path never writes there, so refreshing prices can't turn the suite red.
- **Standards**: the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), enforced via ESLint + Prettier and a `PostToolUse` hook — see [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md).
- **Requirements** are tracked in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) (FR-1 … FR-12), each mapped to a test.

## Data

Prices come from the Yahoo Finance chart endpoint (no API key, adjusted close). The committed `data/sectors.json` is the **canonical, offline** path; `fetch-data` is best-effort and should be verified from Node on the demo machine beforehand — **don't fetch live during a presentation**.

## Packaging & releases

Cross-OS installers must be built on their target OS (or CI): `build:mac` on macOS, `build:win` on Windows. CI (`.github/workflows/ci.yml`) runs lint + typecheck + tests + BDD + build on Linux, Windows, and macOS. Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds each installer and publishes **one** GitHub Release with the `.dmg` + `.exe`.

## Updates

The app **auto-updates in place** via `electron-updater` — no uninstall/reinstall. On launch it checks the GitHub Releases of this repo, downloads a newer version in the background, and offers to restart (also applying it on the next quit). To ship an update, bump the version and push a new `v*` tag.

> Windows (NSIS) auto-update works for unsigned builds. macOS auto-update requires a **signed + notarized** app, so the unsigned demo build can't self-update on macOS — Mac users download the new `.dmg`.

## License

Apache-2.0.
