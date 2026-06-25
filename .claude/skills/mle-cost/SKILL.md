---
name: mle-cost
description: Show token usage and cost attribution for work items. Use when the user asks about costs, token usage, spending, or budget. Also handles backfill of historical sessions.
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
keywords:
  - 'token usage'
  - 'cost attribution'
  - 'spending'
  - 'budget'
  - 'mle cost'
  - 'token cost'
intent_patterns:
  - "(token|cost|spending|budget)\\s+(usage|attribution|summary|report)"
  - "how\\s+much\\s+(did|do|does)\\s+(this|it|the).*cost"
---

# MLE Cost

Show token usage, cost attribution, and spending summaries across work items and sessions.

## When to Use

- When the user asks "how much have I spent?" or "what are the token costs?"
- When the user wants to see costs for a specific work item
- When the user asks to backfill historical token data
- When the user asks about budget or spending trends
- When operators audit the cost JSONL flush cadence after a forge run

## Workflow

Follow the same three-step pattern for every cost question:

1. Determine the scope — current session, single WI, recent window, or backfill.
2. Run the appropriate `mle cost` subcommand with `--skill` for structured JSON output.
3. Present the totals (input tokens, output tokens, USD cost, breakdown by WI or model).

The detailed mechanics live in the Instructions section below.

## Instructions

1. **Determine the scope** — is the user asking about:
   - Current session → `mle cost session --skill`
   - Specific work item → `mle cost --work-item <ID> --skill`
   - All recent costs → `mle cost --days 7 --skill`
   - Historical backfill → `mle cost backfill --skill`

2. **Run the appropriate command**:

```bash
# Current session
mle cost session --skill

# By work item
mle cost --work-item 42 --skill

# Last N days
mle cost --days 7 --skill

# Backfill historical data
mle cost backfill --skill
```

3. **Present the results** in a clear summary:
   - Total tokens (input + output)
   - Total cost in USD
   - Breakdown by work item or model if available

## Examples

User: "How much has this task cost so far?"
→ Run: `mle cost --work-item <current-WI> --skill`
→ Present: "Work item #42 has used 1.2M tokens ($4.83) across 3 sessions."

User: "Show me this week's spending"
→ Run: `mle cost --days 7 --skill`
→ Present summary table.

User: "Backfill my old sessions"
→ Run: `mle cost backfill --skill`
→ Present: "Backfilled 47 sessions, 12.4M tokens, $38.21 total."

## Output Formats

| Flag             | Output                          |
| ---------------- | ------------------------------- |
| `--format table` | Rich formatted table (default)  |
| `--format json`  | Raw JSON                        |
| `--format csv`   | CSV for spreadsheet import      |
| `--skill`        | Structured JSON for Claude Code |

## Specific Techniques

These techniques sharpen the three-step workflow when the cost numbers
look anomalous or the JSONL session log is incomplete:

| Technique                                                                              | When to apply                                                          | Mechanical signal                                                                                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Compare `mle cost session` against Claude Code's `lastCost` from the latest JSONL file | Spot-check the model price table against the authoritative session log | A divergence indicates schema drift in the JSONL or a missing model entry in the price table                             |
| Pass `--by-wi --skill` and pipe through `python3 -m json.tool`                         | Aggregating across many WIs                                            | JSON envelope surfaces un-attributed sessions as `work_item_id: 0`; a non-zero count indicates capture-layer gaps        |
| Run `mle cost backfill --rate-limit <N>` for large historical sweeps                   | First backfill on a long-running operator account                      | Without rate-limiting, the upstream billing API returns 429s mid-sweep and partial state lands in the cost ledger        |
| Normalise model names against the canonical price table before display                 | New model variant in the JSONL                                         | The cost report otherwise lists the variants as separate rows; the price-table lookup also fails for un-normalised names |
| Diff `find ~/.claude/sessions -name '\*.jsonl'                                         | wc -l` against the report's session count                              | Confirming JSONL ingestion completeness                                                                                  | A mismatch points to flushed-but-unread sessions or backfill skipping a date range |
| Capture cost JSON for the run via `mle cost --days <N> --skill > <path>`               | End-of-run audit, post-run reporting                                   | Structured artefact carries the totals; later auditors do not re-query the billing API                                   |

## Common Rationalizations

| The agent thinks…                                                                                                                | Actually…                                                                                                                                                                                                                                  | Gate                            |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| "The cost report is missing the latest session — probably just a render delay; the totals look right."                           | The JSONL flush is asynchronous; a missing session indicates the watcher has not picked up the file. Re-running the report without forcing a flush reproduces the gap. The totals only "look right" because the missing session was small. | `wi-validator:rubric-threshold` |
| "Un-attributed sessions (`work_item_id: 0`) are a known artefact of the capture layer — I'll just exclude them from the totals." | Excluding un-attributed sessions hides a capture-layer defect. The right action is to surface the count and file a Bug against the WI-attribution path, not to suppress the row in the operator-facing report.                             | `wi-validator:rubric-threshold` |
| "Two model variants are similar enough that the price difference rounds out — I'll skip the normalisation step."                 | Per-model pricing differences compound across millions of tokens; "rounding out" produces an under-reported cost number that operators trust until the monthly bill arrives. Normalisation is mechanical and cheap.                        | `wi-validator:rubric-threshold` |

## Red Flags

- Cost report omits the most recent session in `~/.claude/sessions/` — the JSONL has not been flushed or the ingestion pipeline has stalled.
- `--by-wi` aggregation shows a non-zero count of sessions assigned to `work_item_id: 0` — un-attributed sessions indicate a capture-layer gap.
- Model name column lists the same model under multiple variants — normalisation step skipped or the canonical price table is stale.
- Historical backfill rate exceeds the upstream billing API's published guidance — 429 responses mid-sweep produce partial state in the cost ledger.
- `mle cost --by-wi` total diverges from the sum of per-WI totals — float-precision rounding or a missing session breaks the conservation invariant.

## Verification

```bash
# Confirm the per-WI cost report aggregates without un-attributed sessions.
mle cost --by-wi --skill > /tmp/cost.json
cat /tmp/cost.json | python3 -m json.tool

# Cross-check session count against the JSONL files on disk.
JSONL_COUNT=$(find ~/.claude/sessions -name '*.jsonl' | wc -l)
REPORT_COUNT=$(cat /tmp/cost.json | python3 -c "import json,sys; print(json.load(sys.stdin)['session_count'])")
echo "jsonl=${JSONL_COUNT} report=${REPORT_COUNT}"  # expected: equal

# Inspect the most recent session and compare totals.
mle cost session --skill | python3 -m json.tool
```

Observable evidence:

- `/tmp/cost.json` carries a top-level `total_cost_usd` and a `work_items[]` array; every entry has a non-zero `work_item_id` (or the `unattributed_count` is explicitly surfaced).
- The on-disk JSONL count matches the report's `session_count` field exactly.
- The current-session report lists the active model and a positive `input_tokens` + `output_tokens` pair when the agent has emitted any messages.
- `mle cost backfill --rate-limit <N>` exits 0 and the post-backfill `mle cost --days 30 --skill` total is monotonically non-decreasing relative to the pre-backfill total.
