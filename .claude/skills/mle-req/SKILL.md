---
name: mle-req
description: 'Requirements generation and analysis — generate user stories from PRDs, validate INVEST quality, extract domain entities, generate NFRs.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'generate stories'
  - 'analyse requirements'
  - 'generate NFRs'
  - 'requirements from PRD'
  - 'INVEST score'
  - 'validate stories'
  - 'domain entities'
  - 'mle req'
intent_patterns:
  - "(generate|create|analyse)\\s+(stories|requirements|NFRs|user stories)"
  - "(INVEST|invest)\\s+(score|validate|check)"
  - "(extract|identify)\\s+domain\\s+entities"
---

# MLE Requirements

Generate and analyse requirements from Product Requirements Documents (PRDs). Produces INVEST-scored user stories, domain entities, non-functional requirements, and estimation data.

## When to Use

- When starting a new feature and you have a PRD document
- When the user says "generate stories", "analyse requirements", "generate NFRs", or "/mle-req"
- When you need to validate requirement quality with INVEST scoring
- Before design phase — requirements must exist first

## Workflow

1. **Generate stories**: `mle req generate <prd-file>` — produces user stories from a PRD
2. **Validate quality**: `mle req validate --stories <stories.yaml>` — runs INVEST scoring
3. **Extract entities**: `mle req entities --stories <stories.yaml>` — discovers domain entities
4. **Generate NFRs**: `mle req nfrs --stories <stories.yaml>` — produces non-functional requirements
5. **Analyse overall**: `mle req analyse --epic <ID> --project <name>` — full requirements analysis
6. **Estimate effort**: `mle req estimate --stories <stories.yaml>` — estimate story points

## Specific Techniques

| Situation                                                                    | Technique                                                                                                                                            | Reference                                         |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Acceptance criteria mention function names or class names                    | Rewrite each criterion in user-observable terms (input, action, observable outcome); the PRD parser flags implementation-leak phrases by lemma match | `.claude/rules/work-item-standards.md`            |
| INVEST score returned >= 3.0 but the Story description is a single paragraph | Re-run `mle req validate --stories <file> --strict`; strict mode raises the criteria floor and reveals the missing AC                                | `mle-wi-author`                                   |
| PRD glossary terms missing from `mle req entities` output                    | Re-run with `--glossary <path>` flag; the entity extractor seeds the lexicon from the explicit list rather than only the body text                   | `src/<pkg>/core/requirements.py:extract_entities` |
| Stories tagged `performance` or `security` lack NFRs                         | Run `mle req nfrs --stories <file> --tag-derive`; the NFR generator emits latency/throughput/threat NFRs keyed on the tag set                        | `templates/nfr-skeleton.yaml`                     |
| Story body has accidental American spellings                                 | Pipe the description through `python -m mle.scripts.british_grep` before `az boards work-item update`                                                | `rubrics/prompt-engineering-rubric.md`            |
| Acceptance criteria copy-pasted across stories (boilerplate)                 | The validator's boilerplate detector flips at trigram repetition >= 0.8; rewrite each criterion against the Story's specific behaviour               | gate registry                                     |

## Common Rationalizations

| The agent thinks…                                                                         | Actually…                                                                                                                                                                                                                                                                 | Gate                                  | Corpus |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| "Acceptance criteria can describe the implementation — engineers will read them anyway."  | When the AC names a function path instead of the observable behaviour, the WI rubric flags it as untestable and `mle wi validate` drops below 4.0. The criterion must be verifiable by black-box observation — input, action, outcome — not by inspecting the call graph. | `wi-validator:rubric-threshold`       |        |
| "Single-paragraph Story bodies are fine for small stories — INVEST score is high enough." | The validator's structural-completeness dimension requires explicit acceptance-criteria rows; a paragraph that hides them as prose scores 2-3 on rubric. The threshold-pin pre-commit hook fails the Story before it lands.                                               | `wi-validator:rubric-threshold`       |        |
| "NFRs are aspirational — skipping them on small features keeps velocity."                 | Stories tagged `performance` or `security` without NFRs surface as zero coverage in `mle design coverage`, which then blocks the design quality gate. The pre-commit review skill explicitly flags missing NFRs on tagged stories as a blocker.                           | `mle-pre-commit-review:blocker-found` |        |

## Red Flags

- Story acceptance criteria reference internal module paths rather than user-observable inputs and outputs
- `mle req validate` reports INVEST score >= 3.0 but the WI body has fewer than three bullet-formatted acceptance criteria
- `mle req entities --stories <file>` output omits a term that appears verbatim in the PRD glossary file
- Story tagged with `performance` or `security` and `mle req nfrs --stories <file> --skill` returns an empty `nfrs` array
- `az boards work-item show --id <id> --query 'fields."System.Description"'` returns text flagged by `python -m mle.scripts.british_grep` (the canonical American-spelling list)

## Verification

```bash
# --skill JSON parses and carries the expected envelope
mle req generate path/to/prd.md --skill --output /tmp/stories.json
python -c 'import json; d=json.load(open("/tmp/stories.json")); \
  assert "stories" in d and len(d["stories"]) > 0, d'

# Every story has at least one acceptance criterion
python -c 'import json; d=json.load(open("/tmp/stories.json")); \
  assert all(s.get("acceptance_criteria") for s in d["stories"]), d'

# INVEST score per story present and >= 3.0
mle req validate --stories /tmp/stories.json --skill --output /tmp/invest.json
python -c 'import json; r=json.load(open("/tmp/invest.json")); \
  assert all(s["invest_score"] >= 3.0 for s in r["stories"]), r'

# Story body in ADO reflects the rubric pass
az boards work-item show --id <story-id> \
  --query 'fields."System.Description"' -o tsv | grep -c '<h[2-4]>'   # expect > 0
```

Observable evidence:

- `/tmp/stories.json` parses as JSON with a `stories: [...]` non-empty array
- Every entry in `stories[]` has `acceptance_criteria` as a non-empty list
- `invest_score` is present and >= 3.0 on every story in the validate JSON
- `System.Description` on the ADO WI contains HTML heading tags matching the rubric template, not a single `<p>` paragraph
- `mle req entities --skill` JSON contains every glossary term from the source PRD (audit by intersect with `glossary.yaml`)

## Rules

- Always start with story generation before validation
- INVEST scoring is mandatory before proceeding to design
- Process ALL stories — never sample or skip
- British English throughout
