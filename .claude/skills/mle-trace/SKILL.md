---
name: mle-trace
description: 'Traceability matrix — link requirements to design, implementation, and test artefacts with coverage scoring.'
type: flexible
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'traceability matrix'
  - 'trace requirements'
  - 'requirement coverage'
  - 'traceability'
  - 'link requirements'
  - 'mle trace'
intent_patterns:
  - "(generate|create|build)\\s+(a\\s+)?traceability\\s+matrix"
  - "(trace|link|map)\\s+requirements"
---

# MLE Traceability

Generate bidirectional traceability matrices linking requirements to design artefacts, implementation files, and test cases. Uses ADO hierarchy traversal and AI semantic matching.

## When to Use

- To verify all requirements are covered by downstream artefacts
- When the user says "trace requirements", "traceability matrix", "coverage check", or "/mle-trace"
- As a quality gate before phase transitions
- When auditing requirement fulfilment

## Workflow

1. **Generate matrix**: `mle req trace --epic <ID> --project <name>` — generate traceability matrix
2. **Validate coverage**: `mle req trace --epic <ID> --project <name> --min-coverage 80` — validate threshold
3. **Output report**: `mle req trace --epic <ID> --project <name> --output trace-report.md` — write report

## Rules

- Process ALL child items under the Epic
- Three discovery strategies: explicit (ADO links), implicit (naming), inferred (AI)
- Coverage must meet threshold for phase gate to pass
- Exit non-zero when coverage fails — this is a CI gate

## See Also

- `mle-trace-methodology` — paired methodology twin; choose discovery strategy, classify coverage gaps, route remediation (ADR-046 Amendment 3 paired-twin design)
