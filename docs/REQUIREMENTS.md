# Requirements

The living specification DayONE is built against. Each requirement has an acceptance criterion that maps to a Vitest unit test and/or a Cucumber scenario. Value-asserting tests read the **frozen fixture** (`tests/fixtures/sectors.fixture.json`), never the refreshable data.

> Fixture facts (by construction, deterministic): **best = Technology** (+23.9%), **worst = Energy** (−7.0%), **breadth = 8 / 11 advancing**.

| ID        | Requirement                       | Acceptance criterion                                                                                                                                           | Verified by                                                      |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **FR-1**  | Sector universe & data load       | Loads exactly 11 sectors through the Zod schema; ascending unique dates; malformed/short/corrupt input → `DataError` + designed error state, never a crash.    | `types.test.ts`, `data.test.ts`                                  |
| **FR-2**  | Rebased performance               | Series rebased to 100 at the period start: `rebased[0] = 100`, `rebased[i] = close[i]/close[0]*100`; `close[0]` finite & > 0 or `DataError`.                   | `returns.test.ts`                                                |
| **FR-3**  | Monthly returns                   | `return[i] = close[i]/close[i-1] − 1`; 13 closes → 12 returns; each divisor finite & > 0.                                                                      | `returns.test.ts`, `returns-matrix.feature`                      |
| **FR-4**  | Best / worst / breadth            | Best = max period return, worst = min; breadth = count of sectors with period return > 0, as "X / 11 advancing".                                               | `summary.test.ts`, `sector-overview.feature`                     |
| **FR-5**  | Time-range filtering              | 1M/3M/6M/YTD/12M slice + re-rebase to 100 at slice start; **YTD anchored to the dataset's `generatedAt`**, not the wall clock; < 2 points → "not enough data". | `ranges.test.ts`, `time-range.feature`                           |
| **FR-6**  | Sector multi-select               | Toggling a sector shows/hides it in chart + matrix; deselect-all → empty state.                                                                                | `SectorRail.test.tsx`, `sector-selection.feature`                |
| **FR-7**  | Gain/loss, colorblind-safe        | `>0→gain`, `<0→loss`, `=0→neutral`; redundant sign + ▲/▼; CVD mode swaps the diverging scale.                                                                  | `format.test.ts`, `StatCards.test.tsx`, `returns-matrix.feature` |
| **FR-8**  | Theme                             | Light/dark toggle flips `data-theme` + ECharts theme; persists across launches; both meet WCAG AA.                                                             | `ThemeToggle.test.tsx`                                           |
| **FR-9**  | Offline-first + resilient refresh | Renders fully offline; Refresh writes only to `userData`, times out, validates, returns a typed result union, keeps last-good on failure.                      | `data-refresh.feature`, main IPC tests                           |
| **FR-10** | Formatting                        | Signed 1-decimal percent, tabular figures; `Mon YYYY`; non-finite/`-0` → `—`.                                                                                  | `format.test.ts`                                                 |
| **FR-11** | Security hardening                | `contextIsolation`/`sandbox`/`nodeIntegration:false`/`webSecurity`; CSP; deny external nav/`window.open`; validate IPC inputs; startup assertion.              | main process review + assertion                                  |
| **FR-12** | Accessibility                     | Keyboard-navigable, visible focus, reduced-motion, semantic roles, AA contrast; axe clean on the main view.                                                    | `jsx-a11y` lint + axe check                                      |

## Workflow

Each requirement is driven: write the failing test/scenario → implement the smallest code in `lib/` (or the component) → green → refactor. The pure domain logic in `src/renderer/src/lib` is the primary TDD subject; UI and IPC are thin shells over it.
