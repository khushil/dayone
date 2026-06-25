---
name: mle-trace
description: 'Build a requirements → design → implementation → tests traceability matrix for DayONE and flag uncovered requirements.'
keywords:
  - 'traceability matrix'
  - 'trace requirements'
  - 'requirement coverage'
  - 'traceability'
  - 'link requirements'
intent_patterns:
  - "(generate|create|build)\\s+(a\\s+)?traceability\\s+matrix"
  - "(trace|link|map)\\s+requirements"
---

# Traceability

Link every requirement to its design rationale, its implementation, and the
tests that prove it — then surface anything left uncovered. The output is a
Markdown matrix an agent or reviewer can audit before a PR or release.

## When to Use

- To confirm all requirements are covered by downstream artefacts
- When the user says "trace requirements", "traceability matrix", or "/mle-trace"
- As a pre-PR quality check, or when auditing requirement fulfilment

## Inputs

- **Requirements** — acceptance criteria from the relevant GitHub issue(s), or a
  spec/PRD section. Give each a stable ID (e.g. `R1`, `R2`).
- **Design** — ADRs in `docs/adr/` (MADR format) and the architecture map in the
  root and nested `CLAUDE.md` files.
- **Implementation** — source files under `src/` (`main`, `preload`, `shared`,
  `renderer/src`, `renderer/src/lib`).
- **Tests** — `*.test.ts(x)`, `features/*.feature`, `tests/steps/*.steps.ts`.

## Workflow

1. **Enumerate requirements** — one row per requirement with its ID and source
   (issue number, PR, or spec heading).
2. **Link design** — map each requirement to the ADR(s) or documented decision
   that shapes it; note "none" where no formal decision exists.
3. **Link implementation** — cite the `src/**` file(s) (and symbol, where useful)
   that satisfy it. Respect the process boundaries: a renderer requirement should
   trace to `renderer/`, a contract to `src/shared`, IPC to `main`/`preload`.
4. **Link tests** — cite the unit/component test or `.feature` scenario that
   verifies it. A requirement with no test is a coverage gap, not a pass.
5. **Add GitHub references** — link the issue(s) and PR(s) per row (`gh issue
view`, `gh pr list`) so the matrix is navigable from the tracker.
6. **Score & flag** — mark each row Covered / Partial / Uncovered. List every
   Uncovered or test-less requirement explicitly at the end as the action list.

## Matrix Shape

| ID  | Requirement | Design (ADR) | Implementation (file) | Test | GitHub | Status |
| --- | ----------- | ------------ | --------------------- | ---- | ------ | ------ |

## Rules

- Process **all** requirements, not a sample.
- Discovery is explicit (named links) first, then inferred (naming/semantics) —
  label inferred links so a reviewer can confirm them.
- A requirement is **Covered** only when it has both an implementation file and a
  passing test; implementation-without-test is **Partial**.
- Treat any Uncovered requirement as a blocker to report, not to hide.

## Verification

- Every requirement ID appears in exactly one row; no orphan rows.
- Every cited file path exists (`ls`/`rg`) and every cited test runs under
  `npm run test` / `npm run bdd`.
- The closing action list names each Partial/Uncovered requirement.
