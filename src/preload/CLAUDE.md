# src/preload — context bridge

The only place renderer ↔ main talk. Context isolation is always on.

- Expose **only** the minimal, typed `SectorScopeApi` (from `../shared/types`) on `window.api` via `contextBridge.exposeInMainWorld`. Nothing more.
- Never leak Node globals or the raw `ipcRenderer` to the renderer.
- Keep `index.d.ts`'s `Window` augmentation in sync with `SectorScopeApi` so the renderer is fully typed.
- No business logic here — preload only wires channels to the typed API.
