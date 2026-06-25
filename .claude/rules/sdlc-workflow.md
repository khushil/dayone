# SDLC Workflow

**Path scope**: `docs/adr/**`, `tests/Features/**`, `src/**`

MLE provides 10 SDLC phase engines, each with a dedicated skill, structured inputs/outputs, and quality gates enforced by maturity level.

## Phase Sequence

| #   | Phase           | Skill                | Input                     | Output                         | Quality Gate           |
| --- | --------------- | -------------------- | ------------------------- | ------------------------------ | ---------------------- |
| 1   | Requirements    | `/mle-req`           | PRD, domain docs          | User stories, NFRs, entities   | INVEST score >= 3.0    |
| 2   | Estimation      | `/mle-estimate`      | User stories              | Story points, complexity       | Confidence >= 0.6      |
| 3   | Design          | `/mle-design`        | Stories, NFRs             | ADRs, API specs, threat models | Design coverage >= 70% |
| 4   | Design Coverage | `/mle-coverage`      | Design artefacts, stories | Coverage report                | No blockers            |
| 5   | Implementation  | —                    | Design artefacts          | Source code                    | Security scan passes   |
| 6   | Testing         | `/mle-test-gen`      | Stories, source code      | Unit, integration, BDD tests   | Coverage >= 80%        |
| 7   | Security        | `/mle-security-scan` | Source code               | SAST, SBOM, secret detection   | 0 critical findings    |
| 8   | Traceability    | `/mle-trace`         | All artefacts             | Traceability matrix            | Coverage >= 70%        |
| 9   | Impact/Risk     | `/mle-impact`        | Git diff, phase outputs   | Impact analysis, risk register | 0 critical risks       |
| 10  | Evolution       | `/mle-evolve`        | Codebase investigation    | Maturity upgrade proposal      | Conditions met         |

## Phase Gate Enforcement

| Maturity | Enforcement    | Behaviour                                  |
| -------- | -------------- | ------------------------------------------ |
| L1-L2    | Advisory       | Failures reported as warnings, never block |
| L3-L4    | Soft-mandatory | Failures block unless `--force` is used    |
| L5       | Hard-mandatory | Failures always block, no override         |

Run phase gates with `mle verify --phase <phase>` or `mle verify --all-phases`.

## Feedback Loops

When a later phase fails (e.g., testing finds insufficient coverage), the feedback engine (`/mle-feedback`) classifies the root cause and generates upstream remediation tasks. This creates a closed loop: implementation failures trace back to design gaps, design gaps trace back to requirement ambiguity.

```
Requirements --> Design --> Implementation --> Testing --> Traceability
     ^              ^              ^                |            |
     |              |              |                v            v
     +--------------+--------------+----------- Feedback -------+
```

## End-to-End Flow

1. **`mle init`** — scaffold project with rules, skills, hooks at chosen maturity level
2. **`mle work <ID>`** — create workspace linked to ADO work item
3. **Phase engines** — run `/mle-req`, `/mle-design`, `/mle-test-gen`, etc. through SDLC phases
4. **`mle verify --phase <phase>`** — validate quality gates at each phase boundary
5. **`mle sync -m "msg"`** — commit and push work
6. **`mle pr create`** — create pull request with auto-generated description
7. **`mle complete`** — verify merge, clean up workspace, update ADO

## Seeds

Seeds are reusable specification templates from the Seed Catalogue (`escalus-seed-bed` repository). Phase engines use seeds to generate structured AI outputs. Discover available seeds with `mle seed list` and search with `mle seed find "query"`. Nine categories: analyse, debug, design, document, generate, requirements, review, security, test.

## Verification Thresholds by Maturity

| Threshold               | L2  | L3  | L4  | L5  |
| ----------------------- | --- | --- | --- | --- |
| Test coverage minimum   | 50% | 80% | 85% | 90% |
| Design coverage minimum | —   | 70% | 80% | 90% |
| Traceability coverage   | 50% | 70% | 80% | 90% |
| Security max critical   | —   | 0   | 0   | 0   |
| Security max high       | —   | 5   | 3   | 0   |
