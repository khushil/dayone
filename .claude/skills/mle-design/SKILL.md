---
name: mle-design
description: 'Design engine — generate ADRs, architecture diagrams, API specs, threat models, and design reviews from requirements.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'create ADR'
  - 'design API'
  - 'generate diagram'
  - 'review design'
  - 'threat model'
  - 'architecture decision'
  - 'design review'
  - 'mle design'
intent_patterns:
  - "(create|generate|write)\\s+(an?\\s+)?(ADR|design|diagram|API spec)"
  - "(review|check|analyse)\\s+(the\\s+)?design"
  - "(threat|security)\\s+model"
---

# MLE Design

Generate and review design artefacts from requirements. Produces Architecture Decision Records, API specifications, diagrams, threat models, and automated design reviews.

## When to Use

- After requirements are generated and validated
- When the user says "create ADR", "design API", "generate diagram", "review design", or "/mle-design"
- When you need to verify design coverage against requirements
- Before implementation phase

## Workflow

1. **Generate ADR**: `mle design adr --story <ID> --project <name>` — produce an ADR
2. **Generate diagram**: `mle design diagram --story <ID> --project <name>` — produce architecture diagram
3. **Generate API spec**: `mle design api --story <ID> --project <name>` — produce API specification
4. **Design review**: `mle design review <artefact-path>` — automated design quality review
5. **Threat model**: `mle design threat-model --story <ID> --project <name>` — generate threat model
6. **Coverage check**: `mle design coverage --epic <ID> --project <name>` — measure design coverage

## Specific Techniques

| Situation                                                  | Technique                                                                                                                   | Reference                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| ADR seeded from a Story with ambiguous acceptance criteria | Run `mle req validate --stories <file>` first; refuse to author the ADR until INVEST score >= 3.0                           | `mle-req`                             |
| Threat model targets an API surface lacking error schemas  | Author the OpenAPI spec via `mle design api ...` first; STRIDE rows then map onto concrete request/response shapes          | `docs/adr/ADR-NNN-*.md` MADR template |
| Design coverage report flags a requirement at 0%           | Run `mle design coverage --epic <ID> --skill --output coverage.json`; the JSON enumerates uncovered NFRs and ADRs to author | `mle-coverage`                        |
| Existing ADR superseded by new decision                    | Author a new ADR with `Status: Accepted` and a `Supersedes: ADR-NNN` header; never edit the prior accepted ADR              | `.claude/rules/adr-conventions.md`    |
| Architecture diagram outdated after package refactor       | Re-run `mle design diagram` with `--source-scan <package-root>` to regenerate from current package boundaries               | `mle-refactor-module`                 |
| Threat-model row authored without coverage rationale       | Append a `Mitigation:` field citing the gate or code path (e.g. `src/<pkg>/wi_validator.py:DEFAULT_THRESHOLD`)              | gate registry                         |

## Common Rationalizations

| The agent thinks…                                                                | Actually…                                                                                                                                                                                                                                                 | Gate                               | Corpus |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| "ADR can land as Accepted because the team agreed in the design review meeting." | An accepted ADR without a merged PR trail breaks the audit chain — reviewers cannot reconstruct the constraint set from `docs/adr/` alone. The MADR Status field flips from Proposed to Accepted only after PR merge with at least one reviewer recorded. | `branch-policy:reviewer-required`  |        |
| "Skipping the threat model is fine — this feature has no auth surface."          | Threat modelling covers more than authentication: data flow, supply chain, side channels, abuse cases. The STRIDE pass is mandatory at L3+ and absence shows up as zero rows under the security NFRs in `mle design coverage`.                            | `wi-validator:rubric-threshold`    |        |
| "Design coverage at 65% is close enough — implementation can backfill the gap."  | The 70% threshold encodes that backfill rarely happens; ADR-only requirements drift unimplemented and surface six sprints later as scope risk. Raise to threshold before implementation, or file a Spike for the gap.                                     | `skill-validator:rubric-threshold` |        |

## Red Flags

- ADR file lands on `origin/main` with `Status: Accepted` but `az repos pr show --id <pr> --query 'reviewers'` returns an empty array — the merge bypassed the reviewer policy
- Threat-model row cites STRIDE category without a `Mitigation:` field referencing a code path or gate — the dimension is named but not bound to enforcement
- API spec under `docs/api/` lacks a `responses:` block with `4xx`/`5xx` schemas — error contracts went undocumented
- `mle design coverage --epic <ID>` reports overall >= 70% but a single requirement shows readiness < 40% — the average hides a blocker
- ADR uses `Status: Accepted` and `Supersedes: ADR-NNN` but the prior ADR is still `Accepted` in `docs/adr/README.md` index — the supersession was not propagated

## Verification

```bash
# ADR file exists at the canonical path with MADR sections
test -f docs/adr/ADR-NNN-feature-design.md
grep -E '^## (Context|Decision|Consequences|Alternatives)' \
  docs/adr/ADR-NNN-feature-design.md | wc -l   # expect 4

# --skill JSON output is parseable and non-empty
mle design adr --story <story-id> --project <name> --skill \
  --output /tmp/adr.json
test -s /tmp/adr.json && python -c 'import json,sys; json.load(open("/tmp/adr.json"))'

# Coverage report at or above the SDLC gate threshold
mle design coverage --epic <epic-id> --project <name> --skill \
  --output /tmp/cov.json
python -c 'import json; r=json.load(open("/tmp/cov.json")); \
  assert r["overall_score"] >= 0.70, r'

# PR trail exists for every Accepted ADR
az repos pr list --query '[?contains(title, `ADR-`)].pullRequestId' -o tsv
```

Observable evidence:

- `docs/adr/ADR-NNN-*.md` files exist on disk with the four MADR section headings
- `mle design --skill` JSON parses and carries `artefact_path`, `story_id`, `status` fields
- `mle design coverage --skill` reports `overall_score >= 0.70` and no requirement under `0.40`
- Every Accepted ADR has a corresponding merged PR returned by `az repos pr list`
- `docs/adr/README.md` index entry for any superseded ADR shows `~~ADR-NNN~~` strike-through plus the superseding link

## Rules

- Requirements must exist before design
- Every design decision should be recorded as an ADR
- Threat models are mandatory for security-sensitive features
- Design review must pass before implementation
