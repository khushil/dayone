---
name: mle-evolve
description: 'Assess codebase health — test coverage, CI, typing strictness, security posture, docs, and accessibility — and propose prioritised improvements.'
keywords:
  - 'codebase health'
  - 'project health'
  - 'maturity assessment'
  - 'improve the project'
  - 'health check'
intent_patterns:
  - "(assess|evaluate|review)\\s+(the\\s+)?(codebase|project)\\s+health"
  - "(what|where)\\s+(can|should)\\s+we\\s+improve"
  - "health\\s+(check|assessment|report)"
---

# Codebase Health Assessment

Evaluate the overall health of DayONE across the dimensions below and propose
targeted, prioritised improvements. This is an advisory review — produce a report
with evidence, not changes. The aim is a short, honest scorecard plus a ranked
backlog of the highest-leverage next steps.

## When to Use

- Periodically, or after a substantive landing, to gauge where the project stands
- When asked to "assess project health", "what should we improve", "health check"
- Before planning a quality-focused iteration, to pick the highest-value work
- When onboarding, to map strengths and gaps quickly

## Dimensions

Score each dimension Strong / Adequate / Weak, with the evidence you used.

| Dimension             | What to inspect                                                                 | Evidence commands                                                                                            |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Test coverage**     | Unit/component (Vitest) + BDD (Cucumber) breadth; coverage of `lib/` pure logic | `npm run test -- --coverage`; `fd -e test.ts -e test.tsx src \| wc -l`; `fd -e feature features`             |
| **CI**                | Workflows present and meaningful: lint, typecheck, test, build, release         | `ls .github/workflows/`; `yq '.jobs \| keys' .github/workflows/ci.yml`                                       |
| **Typing strictness** | `strict` on; `any` usage; `unknown` over `any`; Zod-derived types               | `yq '.compilerOptions.strict' tsconfig*.json`; `rg -n ':\s*any\b\|as any' src \| wc -l`; `npm run typecheck` |
| **Security posture**  | Dependency vulns; Electron hardening; secrets; CSP                              | `npm audit --omit=dev`; see `/mle-security-scan`                                                             |
| **Documentation**     | Root + nested `CLAUDE.md`, `docs/**`, ADRs, TSDoc on exported API               | `fd CLAUDE.md`; `ls docs/adr 2>/dev/null`; `rg -L '^\s*/\*\*' src --files-without-match -g '*.ts'`           |
| **Accessibility**     | Colour-plus-icon for gain/loss; axe checks; colourblind-safe mode               | `rg -n 'axe\|aria-\|role=' src tests`; review chart/legend components                                        |
| **Lint health**       | ESLint/Stylelint clean; no disabled rules masking debt                          | `npm run lint`; `rg -n 'eslint-disable' src \| wc -l`                                                        |
| **Build/release**     | `npm run build` green; electron-builder config; release-please wired            | `npm run build`; `ls electron-builder.* 2>/dev/null`; `ls .github/workflows/release-please.yml`              |

## Workflow

1. **Gather evidence** — run the commands above; capture real numbers, not impressions.
2. **Score each dimension** — Strong / Adequate / Weak, each backed by a metric or file reference.
3. **Identify gaps** — for every Weak/Adequate dimension, name the specific shortfall.
4. **Prioritise** — rank proposed improvements by leverage: impact × ease, blockers first.
5. **Report** — emit the scorecard and a ranked backlog of concrete, verifiable actions.

## Report Format

```
## Health Assessment

### Scorecard
| Dimension | Rating | Evidence |
| --- | --- | --- |
| Test coverage | Adequate | lib/ at 88%, components at 61% |
| ... | ... | ... |

### Top gaps (ranked by leverage)
1. [HIGH] {gap} → {proposed action} → verify: {observable check}
2. [MED]  {gap} → {proposed action} → verify: {observable check}

### Strengths to preserve
- {what is already healthy and worth not regressing}
```

Each proposed action carries an **observable verifier** (a command output, a
coverage number, a file that should exist) — never "tidy up" or "improve quality".

## Red Flags

- A dimension rated Strong with no metric or file cited as evidence
- Coverage claimed without `--coverage` actually being run
- "Improve typing" style recommendations with no count of `any` or failing check
- Proposals that remove capability rather than add it — health work is additive
- A ranked backlog whose ordering ignores stated blockers

## Rules

- **Evidence over impression** — every rating cites a command output or file
- **Prioritise by leverage** — impact × ease; surface blockers first
- **Verifiable proposals only** — each action names its observable success check
- **Advisory** — propose; do not apply changes during the assessment
- **British English** in all output ("prioritise", "behaviour", "analyse")
