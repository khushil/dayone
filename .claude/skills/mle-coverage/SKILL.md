---
name: mle-coverage
description: 'Design coverage analysis — measure how well design artefacts address requirements with per-requirement scoring.'
type: flexible
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'design coverage'
  - 'are requirements covered'
  - 'design readiness'
  - 'coverage analysis'
  - 'requirement coverage'
  - 'mle coverage'
intent_patterns:
  - "(check|analyse|measure)\\s+design\\s+coverage"
  - "(are|which)\\s+requirements\\s+covered"
---

# MLE Design Coverage

Analyse how well design artefacts (ADRs, API specs, diagrams, threat models) cover the requirements for an Epic. Produces per-requirement coverage scores and an overall design readiness metric.

## When to Use

- After design artefacts are created
- When the user says "design coverage", "are requirements covered", "design readiness", or "/mle-coverage"
- As a quality gate before implementation
- During design review

## Workflow

1. **Analyse coverage**: `mle design coverage --epic <ID> --project <name>` — full coverage analysis
2. **Check readiness**: Review the design_ready flag and blocker list
3. **Address gaps**: Focus on requirements with readiness < 40% (blockers)

## Rules

- Process ALL requirements under the Epic
- Check functional, NFR, and ADR traceability dimensions
- Design is ready when overall score >= 80% and no requirement below 40%
- Use AI for semantic matching when available
