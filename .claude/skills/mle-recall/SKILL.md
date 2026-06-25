---
name: mle-recall
description: 'Recall and inject relevant prior decisions, ADRs, and context for the current task. Backed by hybrid four-lane retrieval (vector, FTS, recency, graph) with Reciprocal Rank Fusion.'
type: flexible
archetype: methodology-pure
priority: high
maturity: L2
keywords:
  - 'recall'
  - 'remember'
  - 'prior decisions'
  - 'context'
  - 'mle recall'
  - 'what did we decide'
  - 'prior ADR'
intent_patterns:
  - "(recall|remember|surface)\\s+(prior|past|earlier)\\s+(decision|context|adr)"
  - "what\\s+did\\s+we\\s+(decide|say|agree)"
---

# /mle-recall — Memory Recall Skill

Recall and inject relevant prior decisions, ADRs, and context for the
current task. Backed by hybrid four-lane retrieval (vector, FTS, recency,
graph) with Reciprocal Rank Fusion.

## When to Use

- When the user says "recall the prior ADR", "what did we decide", "surface earlier context", or "/mle-recall".
- Before authoring a new ADR or design document — recall prior decisions so the new artefact references them rather than repeating them.
- Before authoring a WI body whose subject overlaps with prior plantings — `mle memory inject-context` builds the operator-facing context block.
- When `mle doctor` reports the memory subsystem is healthy but recall returns empty — confirm the embedder dimension, FTS index, and AGE / CTE backend are all live.
- For agent consumption — `mle memory recall --skill` returns the JSON envelope keyed by `record_id`, `score`, `trust`, `snippet`.

## Workflow

1. Identify the query — a short natural-language string describing the prior context the operator wants surfaced.
2. Choose the lane mode — default hybrid (RRF across vector + FTS + recency + graph), or single-lane via `--mode <vector|fts|recency|graph>`.
3. Apply trust filtering explicitly — default excludes `external`; opt in via `--trust external` when federation is desired.
4. Inspect the top hits and either present the snippets or fold them into a `<mle-memory-context>` injection block via `mle memory inject-context`.

## Subcommands

| Command                            | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `mle memory recall <query>`        | Rank-ordered retrieval via hybrid four lanes |
| `mle memory list`                  | Filtered listing sorted by capture date      |
| `mle memory inspect <record-id>`   | Full record detail with audit trail          |
| `mle memory stats`                 | Subsystem health snapshot                    |
| `mle memory inject-context <task>` | Build a `<mle-memory-context>` block         |

## Envelope

Schema: `src/mle/skill/memory_schema.json` (version 1.0.0, JSON Schema
draft 2020-12). Semver-stable: minor bump for additive fields, major bump
for breaking changes.

## Trust Markers

| Marker | Trust level | Meaning                          |
| ------ | ----------- | -------------------------------- |
| ✓      | trusted     | MLE-owned or verified content    |
| ·      | user        | User-captured content            |
| !      | external    | Federation; not shown by default |

## Examples

**1. Hybrid recall (default)**

```bash
mle memory recall "authentication flow ADR"
```

**2. Vector lane only with a time window**

```bash
mle memory recall "deployment pipeline" --mode vector --since 2026-01-01
```

**3. Trust filter — trusted only**

```bash
mle memory recall "work item 2022 context" --trust trusted
```

**4. Agent consumption via --skill**

```bash
mle memory recall "memory subsystem design" --limit 5 --skill
```

**5. Build an injection block for a task**

```bash
mle memory inject-context "Implement F4.S5 recall skill CLI" --budget 3000
```

## Usage from Claude Code

```
/mle-recall recall "context for current task"
```

The skill calls `mle memory recall --skill` and parses the JSON envelope.
Hit records include `record_id`, `score`, `trust`, and `snippet` so the
agent can present the most relevant prior context.

## Performance Budgets

| Subcommand       | P95 target |
| ---------------- | ---------- |
| `recall`         | ≤ 400 ms   |
| `list`           | ≤ 200 ms   |
| `inspect`        | ≤ 200 ms   |
| `stats`          | ≤ 200 ms   |
| `inject-context` | ≤ 600 ms   |

## Specific Techniques

These techniques sharpen the four-step workflow when the recall result
looks unexpected or the lane mix needs auditing:

| Technique                                                                             | When to apply                                                                     | Mechanical signal                                                                                                  |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Run `mle memory recall --mode vector --explain` for a known-good query                | Diagnosing why a record fails to surface                                          | The lane-by-lane scoring breakdown identifies whether the failure is in embedding, FTS tokenisation, or RRF fusion |
| Pin `--trust trusted` for any agent that injects recall hits into context             | Operator-facing context blocks heading into downstream prompts                    | Trust filtering at the SQL boundary keeps `external`-trust records out of the LLM's working set by construction    |
| Cross-check `mle memory stats --skill` against the on-disk migration ledger           | After upgrading `pgserver` or rotating the embedder model                         | The ledger surfaces dimension or pin mismatches that recall silently degrades around                               |
| Use `--limit 50 --skill` and post-rank in the calling agent                           | Custom relevance heuristics on top of RRF                                         | The envelope's `score` field is comparable across lanes; the operator-side re-rank carries the audit trail         |
| Force the AGE backend via `[memory].graph_backend = "age"` when graph hits are absent | Suspected fallback to recursive-CTE on a query that benefits from graph traversal | The lane label in `--explain` shows `graph: age` vs `graph: cte`; a silent fallback indicates AGE is not loaded    |
| Pipe `mle memory inject-context --budget <N>` and inspect the truncation summary      | Approaching the agent's context window                                            | The composer reports which lanes contributed to the budget and where ACON compression kicked in                    |

## Common Rationalizations

| The agent thinks…                                                                                                                                       | Actually…                                                                                                                                                                                                                 | Gate                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| "Recall is slow today — I'll bypass the four-phase composer and call `recall()` directly for speed."                                                    | Bypassing `inject_context()` skips the trust filter, the compression budget, and the faithfulness gate. The latency reduction is real but the safety surface evaporates; production callers MUST go through the composer. | `wi-validator:rubric-threshold` |
| "An `external`-trust record is highly relevant — I'll include it without the `--trust external` flag because the user clearly wants federated context." | The default trust filter is the only line of defence against federated injection. Including external content without explicit opt-in lets one untrusted upstream silently steer the agent's reasoning.                    | `wi-validator:rubric-threshold` |
| "The P95 latency budget is breached on this query but the result quality is acceptable — ship it."                                                      | Latency breaches indicate the subsystem is degrading; suppressing the signal trains operators to ignore the next breach. PRD-MEM-001 sets the bound for a reason; raise the issue or tune the lane mix.                   | `wi-validator:rubric-threshold` |

## Red Flags

- Recall returns `external`-trust records when `--trust external` was NOT passed — the SQL trust filter is bypassed and federated content is in the working set.
- `--explain` shows the AGE backend selected at config time but the lane label reports `graph: cte` — silent fallback indicates AGE is not loaded; recall quality degrades.
- Recall P95 latency exceeds 250 ms over a rolling window of 100 queries — PRD-MEM-001 budget breach; tune the lane mix or revisit the embedder.
- `mle memory stats` reports dimension 384 but `pgserver` indexes report a different dimension — the embedder model and the vector index disagree; recall returns nothing.
- `inject-context` truncation summary shows compression kicking in for every query — the budget is too tight or the lane mix surfaces too many low-relevance hits.

## Verification

```bash
# Confirm the hybrid recall returns ranked results with trust filtering applied.
mle memory recall "authentication flow ADR" --limit 10 --skill > /tmp/recall.json
cat /tmp/recall.json | python3 -m json.tool

# Cross-check every hit carries a trust label and an allowed level.
cat /tmp/recall.json | python3 -c "
import json, sys
d = json.load(open('/tmp/recall.json'))
for hit in d.get('hits', []):
    assert 'trust' in hit, f'missing trust on {hit.get(\"record_id\")}'
    assert hit['trust'] in {'trusted', 'user', 'external'}, hit['trust']
print('trust labels valid')
"

# Capability-floor verification — embedder, FTS, AGE / CTE backend.
mle memory verify
echo "exit=$?"   # expected: 0
```

Observable evidence:

- `/tmp/recall.json` carries a `hits` array; every entry has `record_id`, `score`, `trust`, and `snippet`.
- The `lanes` summary in the envelope enumerates every lane that contributed to RRF fusion; the trust filter has run at the SQL boundary.
- `mle memory verify` exits 0 — the capability floor (embedder dimension, FTS index, AGE or CTE backend, migration ledger) is met.
- `mle memory stats --skill` reports the configured embedder model, the dimension matching `pgvector`'s index, and a non-zero `record_count` consistent with prior plantings.

## See Also

`docs/memory/recall-api.md` — full documentation for the retrieval API.
`src/mle/core/memory_recall.py` — F4.S1 hybrid recall implementation.
`src/mle/core/memory_context.py` — F4.S3 four-phase context composer.
`src/mle/skill/memory_schema.json` — JSON Schema for the envelope.
