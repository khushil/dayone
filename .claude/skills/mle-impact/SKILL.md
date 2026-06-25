---
name: mle-impact
description: 'Analyse a git diff for DayONE — identify affected modules, components, and tests, map blast radius across the process boundaries, and build a risk register.'
keywords:
  - 'impact analysis'
  - 'risk register'
  - "what's affected"
  - 'change impact'
  - 'assess risk'
  - 'blast radius'
intent_patterns:
  - "(analyse|assess|check)\\s+(the\\s+)?(impact|risk)"
  - "(build|generate|update)\\s+(a\\s+)?risk\\s+register"
  - "what('s|\\s+is)\\s+affected"
---

# Impact Analysis

From a change set, work out what it touches, how far the effects reach across
DayONE's process boundaries, and which risks need watching before merge.

## When to Use

- Before committing or opening a PR for a non-trivial change
- When the user says "impact analysis", "what's affected", "assess risk", or
  "/mle-impact"
- Before a release decision

## Inputs

- The diff: `git diff master...HEAD` (or `gh pr diff <n>` for a PR).
- The architecture map (root + nested `CLAUDE.md`) for the boundary rules.

## Workflow

1. **List changed files** — `git diff --name-only master...HEAD`. Analyse **all**
   of them, not a sample.
2. **Classify by layer** — bucket each file into `src/shared`, `src/main`,
   `src/preload`, `src/renderer/src`, or `src/renderer/src/lib`.
3. **Trace the blast radius** — dependencies flow inward, so a change ripples
   _outward_ to importers:
   - `src/shared` (Zod contracts) → **everything** downstream; a contract change
     is the widest blast radius and may need a migration path.
   - `src/main` / `src/preload` → IPC surface and the renderer that consumes it.
   - `src/renderer/src/lib` (pure core) → components and BDD steps that call it.
   - `src/renderer/src` components → UI + their co-located tests only.
     Use `rg` to find importers (e.g. `rg -l "from '@shared/...'"`).
4. **Map affected tests** — for each changed module list its co-located
   `*.test.ts(x)` and any `features/*.feature` / `tests/steps` that exercise it.
   Flag changed logic with no covering test.
5. **Build the risk register** — one row per risk: description, likelihood (1–5),
   impact (1–5), score = likelihood × impact, and a mitigation.

## Risk Register Shape

| Risk | Layer | Likelihood | Impact | Score | Mitigation |
| ---- | ----- | ---------- | ------ | ----- | ---------- |

## Watch-Items (raise as risks when touched)

- A `src/shared` schema change without a backward-compatible migration path.
- Security posture in `src/main` (`contextIsolation`, `sandbox`, CSP
  `connect-src 'none'`) — any loosening is high impact.
- Anything that could introduce a live network call — the app is offline-only.
- Gain/loss rendering that drops the sign + ▲/▼ pairing (colour-only signalling).
- A change to `lib/` purity (introducing `Date.now()`, `window`, or IO).

## Verification

```bash
npm run typecheck    # boundary/type breakages surface here
npm run test         # affected unit + component tests pass
npm run bdd          # affected acceptance scenarios pass
npm run build        # full typecheck + bundle is green
```

Observable evidence: every changed file appears in the layer classification;
every High-score risk has a named mitigation; the four commands above pass.
