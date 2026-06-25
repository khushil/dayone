---
name: mle-impact
description: 'Impact analysis and risk register — assess change impact from git diff and aggregate project risks from all phase engines.'
type: flexible
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'impact analysis'
  - 'risk register'
  - "what's affected"
  - 'change impact'
  - 'assess risk'
  - 'risk summary'
  - 'mle impact'
  - 'mle risk'
intent_patterns:
  - "(analyse|assess|check)\\s+(the\\s+)?(impact|risk)"
  - "(build|generate|update)\\s+(a\\s+)?risk\\s+register"
  - "what('s|\\s+is)\\s+affected"
---

# MLE Impact Analysis

Analyse the impact of code changes on downstream artefacts (tests, docs, security, APIs) and build a consolidated risk register from all phase engine outputs.

## When to Use

- Before committing significant changes
- When the user says "impact analysis", "what's affected", "risk register", "assess risk", or "/mle-impact"
- During sprint retrospectives
- Before release decisions

## Workflow

1. **Change impact**: `mle impact analyse` — analyse impact of recent changes
2. **Risk register**: `mle risk register --stories <path> --security-report <path>` — build risk register
3. **Risk summary**: `mle risk summary` — high-level risk overview
4. **Risk impact**: `mle risk impact --story <ID>` — impact of a specific story

## Rules

- Analyse ALL changed files, not a sample
- Risk scores use likelihood x impact (1-5 each)
- Aggregate risks from ALL provided phase engine outputs
- Trend comparison against previous register when available
