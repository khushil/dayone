# Architecture

DayONE is an Electron desktop app — a real-time, multi-provider, BYO-key market
terminal — built on a strict process split with all network and secrets confined
to the main process.

## Processes

| Process                | Responsibility                                                       | May import                           |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `src/main`             | Window, security hardening, IPC, **all network**, secrets, providers | `electron`, Node, `src/shared`       |
| `src/preload`          | The typed `contextBridge` surface (`window.api`)                     | `electron`, `src/shared`             |
| `src/renderer/src`     | React 19 UI (Tailwind v4, Zustand)                                   | `src/shared`, `src/renderer/src/lib` |
| `src/renderer/src/lib` | **Pure** domain logic (the testable core)                            | nothing app-specific                 |
| `src/shared`           | Zod contracts shared by all processes                                | `zod` only                           |

Dependencies flow inward; nothing in `shared`/`lib` imports a process.

## Data flow

```
data/sectors.json (committed snapshot)  ─┐
provider adapters (Yahoo, …) over REST/WS ┤→ main (validate w/ Zod) → IPC → renderer store → lib/ computes → components render
user-supplied keys (SecureStore)         ─┘
```

- **Sector view** (the original SectorScope): `data/sectors.json` is the canonical
  offline path; the renderer computes everything range-dependent in `lib/`.
- **Provider layer**: a `DataProvider` interface (`getQuote`/`getBars`/
  `searchInstruments`/`validateKey` + symbol normalization) behind a
  `ProviderRegistry`. Every provider payload is Zod-validated at the boundary —
  no cast-and-hope. See [Providers](./PROVIDERS.md).

## Security model (non-negotiable)

- `BrowserWindow`: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, `webSecurity: true` — asserted at startup.
- Production CSP via `onHeadersReceived`: `default-src 'self'`, **`connect-src 'none'`**
  (the renderer makes no network calls — main does).
- **Outbound host allowlist** per adapter (`assertAllowedHost`): no symbol or
  payload can redirect a key-bearing request off-host (SSRF / key-misdirection).
- **DevTools off by default in packaged builds** (opt-in `DAYONE_DEBUG=1`) —
  every open path gated, including the crash/load-failure handlers.
- **Keys** live only in main, encrypted by the OS keychain via `SecureStore`;
  on an insecure Linux `basic_text` backend, persistence is refused (memory-only).
  Keys never cross the bridge back and never appear in logs or validation reasons.

## Release pipeline

Conventional Commits → release-please derives the version → draft release →
matrix build (mac/win) uploads installers → single publish. Auto-update in place
via `electron-updater`. See [Releases & auto-update](./RELEASING.md).
