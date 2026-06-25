---
name: mle-estimate
description: 'Estimation engine — generate effort estimates, complexity analysis, and planning data from user stories.'
type: flexible
archetype: cli-wrapper-thin
priority: medium
maturity: L2
keywords:
  - 'estimate stories'
  - 'story points'
  - 'effort estimate'
  - 'complexity analysis'
  - 'sizing'
  - 'mle estimate'
intent_patterns:
  - "(estimate|size|score)\\s+(the\\s+)?(stories|backlog|requirements)"
  - "(story\\s+)?point\\s+estimate"
---

# MLE Estimation

Generate effort estimates for user stories using AI analysis of complexity, dependencies, and historical patterns.

## When to Use

- During sprint planning or backlog refinement
- When the user says "estimate stories", "story points", "effort estimate", or "/mle-estimate"
- After requirements are generated and validated
- Before committing to sprint scope

## Workflow

1. **Estimate stories**: `mle req estimate --stories <stories.yaml>` — estimate effort for stories
2. **Complexity analysis**: Analyses technical complexity, dependency count, and domain complexity
3. **Planning output**: Produces story-point estimates with confidence ranges

## Rules

- Use AI for complexity analysis when available
- Fall back to heuristic sizing when AI is unavailable
- Always provide confidence ranges, not point estimates
- Consider dependencies between stories
