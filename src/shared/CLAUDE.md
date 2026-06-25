# src/shared — cross-process contracts

Imported by main, preload, and renderer. Keep it **dependency-free except `zod`**, and free of any process-specific code (no Electron, no DOM, no React).

- Zod schemas are the **single validator**, used at both data load and refresh. Derive TypeScript types with `z.infer` so types and runtime validation never drift.
- The data model stores only **raw monthly adjusted closes**; everything derived (rebased series, returns, breadth) is computed in `lib/`, not stored here.
- `RefreshResult` is a discriminated union so IPC failures travel as data, not exceptions.
- `parseSectorData` is the one entry point that turns `unknown` into validated `SectorData` (throws `DataError`).
