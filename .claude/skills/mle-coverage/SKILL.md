---
name: mle-coverage
description: 'Design coverage analysis for DayONE — assess how well the design artefacts and tests address each requirement, with a per-requirement coverage table, gaps, and recommendations.'
---

# Design Coverage

Assess how completely the **design artefacts** (ADRs, architecture sketch, Zod contracts,
threat model) and **planned tests** address every requirement. The output is a
per-requirement coverage table that flags gaps before implementation starts.

## When to use

- After design artefacts exist (see `/mle-design`) and before implementation.
- The user says "design coverage", "are the requirements covered", "design readiness", or
  "/mle-coverage".
- As a quality gate at the design → implementation boundary.

## Method

1. **List every requirement** — each user story, acceptance criterion, and NFR from
   `/mle-req`. These are the rows of the matrix; process **all** of them, never a sample.
2. **Map artefacts to each requirement** across four dimensions:
   - **Decision** — is there an ADR (or an explicit "no decision needed") covering it?
   - **Contract** — is the data it touches modelled in a `src/shared` Zod schema?
   - **Component** — does the architecture sketch name where it is implemented (main /
     preload / shared / renderer / lib)?
   - **Test** — is there a planned Vitest assertion or Cucumber scenario that proves it?
3. **Score each requirement** — **Covered** (all relevant dimensions addressed),
   **Partial** (some addressed, named gap), or **Gap/blocker** (a relevant dimension is
   missing, e.g. an NFR with no test or contract).
4. **Recommend remediation** per gap — author the missing ADR, add the Zod schema, name the
   component, or write the test plan. Security/accessibility NFRs with no mitigation or no
   test are blockers, not partials.

## Output — coverage table

| Requirement  | Decision       | Contract        | Component | Test          | Status              | Gap / action |
| ------------ | -------------- | --------------- | --------- | ------------- | ------------------- | ------------ |
| Story/AC/NFR | ADR-NNN / n.a. | schema name / — | layer     | test name / — | Covered/Partial/Gap | …            |

Close with a one-line readiness call: design is ready when every requirement is **Covered**
and no blocker remains.

## Quality bar & red flags

- Every requirement appears as a row — coverage of a subset is not coverage.
- A dimension is only "covered" when the artefact genuinely addresses _that_ requirement,
  not merely exists somewhere.
- 🚩 An overall "looks fine" that hides a single requirement with no test or no contract.
- 🚩 A security/accessibility NFR marked Partial when its mitigation or test is absent —
  that is a blocker.

## Verify

- Row count equals the requirement count from `/mle-req`.
- Each Gap row names a concrete remediation action and which skill produces it.
- Test-column claims reconcile with what `/mle-test-gen` would actually generate.
- Named contracts exist (or are listed to be added) in `src/shared`; `npm run typecheck` stays green.
