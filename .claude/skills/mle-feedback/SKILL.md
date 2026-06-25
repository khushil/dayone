---
name: mle-feedback
description: 'Feedback loop engine — classify root causes of downstream failures and generate upstream remediation tasks.'
type: flexible
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'analyse feedback'
  - 'root cause'
  - 'why did this fail'
  - 'remediation tasks'
  - 'feedback loop'
  - 'upstream fix'
  - 'mle feedback'
intent_patterns:
  - "(analyse|classify)\\s+(root\\s+)?cause"
  - "(generate|create)\\s+remediation\\s+tasks"
  - "why\\s+(did|does)\\s+(this|it)\\s+(fail|break)"
---

# MLE Feedback Loops

Analyse findings from security scans, design reviews, test results, and INVEST scoring to classify root causes and generate remediation tasks targeting the upstream phase responsible for each defect.

## When to Use

- After any quality gate failure
- When the user says "analyse feedback", "root cause", "why did this fail", "remediation", or "/mle-feedback"
- During retrospectives to identify systemic issues
- When the same type of defect keeps recurring

## Workflow

1. **Analyse feedback**: `mle feedback analyse --security-report <path>` — classify root causes
2. **Generate tasks**: `mle feedback analyse --create-tasks --epic <ID>` — create ADO remediation tasks
3. **Review classifications**: Check the root-cause breakdown and upstream phase targeting

## Rules

- Five root cause categories: code_bug, requirement_ambiguity, design_flaw, test_gap, security_vulnerability
- Remediation tasks target the ROOT CAUSE phase, not the detection phase
- AI classification with rule-based fallback
- Process ALL findings from all provided sources

## See Also

- `mle-feedback-methodology` — paired methodology twin; audit classifier verdicts, route upstream remediation, prove the loop closed (ADR-046 Amendment 3 paired-twin design)
