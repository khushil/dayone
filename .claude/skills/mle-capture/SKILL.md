---
name: mle-capture
description: Capture an important conversation moment to the linked ADO work item. Use when the user says "capture this", "/mle-capture", "record this decision", or when you detect a significant decision or milestone worth preserving.
type: flexible
archetype: methodology-pure
priority: medium
maturity: L2
keywords:
  - 'capture this'
  - 'record decision'
  - 'capture moment'
  - 'mle capture'
  - 'milestone'
intent_patterns:
  - "capture\\s+(this|the\\s+(decision|moment|milestone))"
  - "record\\s+(this\\s+)?(decision|milestone|moment)"
---

# MLE Capture

Capture a conversation moment — decision, milestone, or note — to the linked ADO work item as a structured comment.

## When to Use

- After a significant design decision or architecture choice
- When the user says "capture this" or "record this"
- When a milestone is reached (feature complete, tests passing, PR created)
- When you want to preserve context that would be lost when the session ends

## Workflow

1. **Summarise** the last few exchanges into 2-3 clear sentences
2. **Classify** the capture type:
   - `decision` — a choice was made between alternatives
   - `milestone` — a significant event occurred
   - `note` — general observation worth preserving
3. **Present** the summary to the user: "I'd capture this to the work item: [summary]. Want to edit it?"
4. **Wait** for the user to confirm or edit
5. **Run** the capture command:

```bash
mle capture "The final summary text" --type decision --skill
```

6. **Report** the result to the user

## Specific Techniques

| Situation                                            | Technique                                                                                                                                                                | Reference                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Workspace lacks `.mle-metadata.json` (no linked WI)  | Capture refuses to post; ask the operator whether to link an existing WI via `mle adopt --wi <id>` or abandon the capture                                                | `core/capture.py`                       |
| The same moment was captured 30 seconds ago          | Inspect `~/.mle/capture-history.jsonl`; if the same `(wi_id, payload_sha256)` pair appears within the last 60s, skip and warn rather than post a duplicate audit comment | `core/capture.py::_dedupe()`            |
| The linked WI has been closed mid-task               | `mle capture` re-queries `az boards work-item show --id <wi>` before posting; if `state == Closed` it warns and asks before adding to a closed item                      | `ado/work_items.py::get_state()`        |
| Capture payload exceeds the 32 KiB ADO comment limit | Truncate to 30 KiB and append `... [truncated by mle-capture]`; never let the SDK raise a 400 error mid-batch                                                            | `ado/comments.py`                       |
| Capture needs to record a multi-step session digest  | Use `--type digest`; capture aggregates the last N exchanges per the `[capture].digest_window_minutes` config key into one comment                                       | `core/config_manager.py::CaptureConfig` |
| Operator wants to dry-run the capture before posting | `mle capture --dry-run` prints the resolved payload, the target WI ID, and the trust prefix without calling ADO                                                          | `cli/capture_cmd.py`                    |

## Common Rationalizations

| The agent thinks…                                                                                  | Actually…                                                                                                                                                                                                                                                   | Gate                           | Corpus                          |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------- |
| "I'll capture without the `**MLE**:` prefix because the operator's note is more readable that way" | The audit-trail grep (`az boards work-item show ... 'System.History'` filtered by `**MLE**:`) is the only mechanism the forge orchestrator uses to distinguish automated audit comments from human discussion. Dropping the prefix poisons the audit trail. | branch-policy:wi-link-required | mle-capture-rationalisation-001 |
| "Two captures of the same decision are fine — more audit is better audit"                          | Duplicate captures pollute the work item's CommentCount, make `mle wi validate` harder to score, and signal noise to human reviewers. The 60-second dedupe window is the canonical guard.                                                                   | wi-validator:rubric-threshold  | mle-capture-rationalisation-002 |
| "Capture from outside a workspace is fine if I pass `--wi` explicitly"                             | Without `.mle-metadata.json` the capture has no audit anchor; the comment lands but no `mle complete` will surface it during workspace teardown. Always invoke from inside the workspace whose decision is being recorded.                                  | merge-check:pr-completed       | mle-capture-rationalisation-003 |

## Red Flags

- Capture invoked from outside a workspace — no `.mle-metadata.json` to read; the WI link is guessed rather than authoritative
- Comment posted to ADO without the `**MLE**:` prefix — breaks the audit-trail grep used by forge orchestrators and `mle doctor`
- Same `(wi_id, payload_sha256)` pair captured twice within 60 seconds — duplicate audit noise
- WI link in `.mle-metadata.json` points to a `Closed` state — captures still post but accumulate on a sealed item
- Capture exit code is 0 but the WI's CommentCount field did not increment — silent failure in the ADO SDK

## Verification

```bash
# Capture writes a structured record to local history before posting.
mle capture "test capture" --type note --dry-run --skill > /tmp/capture-out.json
python3 -c "import json; d=json.load(open('/tmp/capture-out.json')); print('wi:', d.get('wi_id'), 'prefix:', d.get('payload','')[:8])"

# Verify the linked WI received the audit comment.
wi=$(python3 -c "import json; print(json.load(open('.mle-metadata.json'))['work_item_id'])")
az boards work-item show --id "$wi" --query 'fields."System.History"' -o tsv | grep -c '\*\*MLE\*\*:'

# Confirm CommentCount incremented by exactly 1 after a single capture.
before=$(az boards work-item show --id "$wi" --query 'fields."System.CommentCount"' -o tsv)
mle capture "verification capture" --type note
after=$(az boards work-item show --id "$wi" --query 'fields."System.CommentCount"' -o tsv)
echo "before=$before after=$after delta=$((after-before))"
```

Observable evidence:

- The linked WI's `System.History` field contains the captured payload prefixed with `**MLE**:` (exact match, no whitespace drift)
- `System.CommentCount` increments by 1 per successful capture invocation
- `~/.mle/capture-history.jsonl` gains exactly one new line per capture, with `wi_id`, `payload_sha256`, `timestamp`
- Duplicate captures within 60 seconds produce a non-zero exit code and no new comment on the WI

## Example

User: "We decided to use GIT_TERMINAL_PROMPT=0 instead of credential helpers"

You: "I'd capture this decision to the work item:

> Chose GIT_TERMINAL_PROMPT=0 over credential helper configuration to prevent LFS authentication hangs. Trade-off: LFS pulls may fail silently without cached credentials, but prevents indefinite hangs in non-interactive environments.

Want me to post this, or would you like to edit it?"

User: "Post it"

You run: `mle capture "Chose GIT_TERMINAL_PROMPT=0 over credential helper configuration to prevent LFS authentication hangs. Trade-off: LFS pulls may fail silently without cached credentials, but prevents indefinite hangs in non-interactive environments." --type decision --skill`

## Capture Types

| Type        | When                    | Example                                             |
| ----------- | ----------------------- | --------------------------------------------------- |
| `decision`  | A choice was made       | "Chose React over Vue for the dashboard"            |
| `milestone` | Something was completed | "All 621 tests pass with 91% coverage"              |
| `digest`    | Periodic summary        | "Last 15 min: fixed branch naming, added spinners"  |
| `note`      | General observation     | "The LFS endpoint uses HTTPS even with SSH remotes" |
