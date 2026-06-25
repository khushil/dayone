---
name: mle-req
description: 'Requirements analysis for DayONE — turn a brief or PRD into INVEST-scored user stories, testable acceptance criteria, non-functional requirements, and domain entities, ready for test-first implementation.'
---

# Requirements

Turn a feature brief or PRD into the artefacts the rest of the lifecycle consumes:
**user stories**, **acceptance criteria**, **non-functional requirements (NFRs)**, and
**domain entities**. The goal is requirements an agent can implement test-first against
DayONE's tooling (Vitest, Cucumber.js) without going back to the author.

## When to use

- Starting a feature and you have a brief, PRD, or GitHub Issue to decompose.
- The user says "generate stories", "analyse requirements", "extract entities", or "/mle-req".
- Before design — requirements must exist and be testable first.

## Method

1. **Read the source** — brief, PRD, or Issue. List every distinct capability and constraint.
2. **Write user stories** — `As a <role>, I want <capability>, so that <benefit>`. One
   deliverable per story (1–5 days). Capture each as a GitHub Issue or a checklist row.
3. **Score against INVEST** — Independent, Negotiable, Valuable, Estimable, Small, Testable.
   Split or merge until each story passes. Flag any story that fails a letter.
4. **Write acceptance criteria** — Given/When/Then or bullet form. Each criterion is
   **black-box observable** (input → action → observable outcome), phrased so it maps to a
   Vitest assertion or a Cucumber scenario. Never name a function, file, or component.
5. **Derive NFRs** — for stories touching performance, security, accessibility, or offline
   behaviour, state a measurable target (e.g. "first chart paint < 1 s on the committed
   snapshot", "gain/loss never colour-only", "no network call in app or tests").
6. **Extract domain entities** — name the nouns the feature manipulates (Sector, DataPoint,
   DateRange, Return). These become Zod schemas in `src/shared`; flag any not yet modelled.

## Quality bar

- Acceptance criteria describe user-observable behaviour, not implementation.
- Every story has ≥ 1 acceptance criterion that a test could assert directly.
- Stories tagged performance/security/accessibility carry at least one measurable NFR.
- Entities reconcile with the glossary in the brief — no term silently dropped.
- British English throughout user-facing text.

## Red flags

- A criterion references a module path, hook, or component name instead of behaviour.
- A "story" bundles several deliverables — it is an epic; split it.
- A performance/security story with no NFR — the constraint is unstated, not absent.
- Acceptance criteria copy-pasted across stories — each must reflect its own behaviour.

## Verify

- Each story reads as a single, independently shippable deliverable.
- Read the criteria back as test names: each should suggest a `it('…')` or `Scenario`.
- New entities have (or get) a Zod schema in `src/shared`; run `npm run typecheck`.
- Hand the stories to `/mle-estimate` and `/mle-design` without further clarification.
