# Security Standards

**Path scope**: `**`

## Secrets

- Never hardcode secrets/tokens/keys. Provider API keys go through the main-process
  **SecureStore** (Electron `safeStorage`), never the renderer or committed files.
- Git-ignore `.env`, `*.pem`, `*.key`. Never log secrets — even at debug level.

## Electron hardening (non-negotiable)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  `webSecurity: true`. Strict CSP; the renderer makes no network calls
  (`connect-src 'none'`). Preload exposes a minimal `contextBridge` surface — never
  raw `ipcRenderer` or Node globals.
- Validate every IPC input with Zod before use; return failures as data
  (`RefreshResult`), never trust the renderer.

## Input & dependencies

- Validate external/file input: schema-check via Zod; reject non-finite/≤0; resolve and
  bound file paths (no traversal).
- Pin dependencies; run `npm audit` in CI; review new dependencies (maintenance,
  licence, CVEs). Prefer the platform/stdlib over a new dependency.

## DON'Ts

- No `eval` / `new Function` on untrusted input; no `dangerouslySetInnerHTML` without
  sanitisation; never disable TLS verification or CSP; no `shell: true` with
  user-supplied arguments.

## See also

- `code-standards.md`, `architecture-standards.md`, `src/main/CLAUDE.md`
