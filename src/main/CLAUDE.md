# src/main — Electron main process

Node environment. Owns the window, security, and IPC. No DOM or React here.

## Security (required, non-negotiable — FR-11)

- `BrowserWindow.webPreferences`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
- Production **CSP** via `session.webRequest.onHeadersReceived`: `default-src 'self'`; `connect-src 'none'` (the renderer makes no network calls); `style-src 'self' 'unsafe-inline'` (Tailwind/ECharts). Dev CSP may relax `connect-src` for HMR.
- Deny `window.open` and external navigation (`setWindowOpenHandler` → `deny`, `will-navigate` guard). Deny-all permission handler.
- A startup assertion fails loudly if any of these flags regress.

## IPC

- Validate **every** IPC input in main with the Zod schemas from `../shared/types`.
- Handlers return a `RefreshResult` discriminated union (`{ok:true,data}|{ok:false,reason}`) — never throw across the bridge.
- Refresh writes only to `app.getPath('userData')/sectors.json` (atomic temp-write + rename). The bundled `data/sectors.json` is a read-only seed/fallback — never write into the app bundle (it's read-only when packaged).

## Conventions

- Import shared contracts with a relative path: `import { ... } from '../shared/types'`.
- Named exports; `const`/`===`; JSDoc on exported functions.
