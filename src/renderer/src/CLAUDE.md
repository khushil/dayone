# src/renderer/src — React UI

React 19 + TypeScript + Tailwind v4. Components are PascalCase files with named exports.

## State & data

- One **Zustand** store (`store.ts`). Components never call `window.api` directly — all IPC goes through the `useSectorData()` hook.
- All range-dependent values come from `lib/` (pure functions). Components render; they don't compute returns/breadth inline.

## Styling

- Use **design tokens**, never raw hex: `bg-ink`, `bg-surface`, `text-text`, `text-muted`, `text-gain`, `text-loss`, `text-accent`, `font-display/sans/mono`. Tokens live in `assets/main.css` and swap for light/dark + colorblind (CVD) modes.
- Every number uses the `tabular` utility and is formatted via `lib/format.ts` (signed %, `Mon YYYY`) — never inline `toFixed`.

## Accessibility (FR-12) & semantics

- Keyboard-navigable with visible focus; respect `prefers-reduced-motion`; semantic roles for the rail/matrix; AA contrast.
- **Gain/loss is never color-only** — pair with `+`/`−` sign and ▲/▼; honor the CVD toggle.

## Charts

- ECharts (tree-shaken) only for the performance chart; the Returns Matrix heatmap and rail sparklines are hand-rolled SVG/CSS. Keep ECharts out of value-asserting tests (mock `echarts-for-react`).
