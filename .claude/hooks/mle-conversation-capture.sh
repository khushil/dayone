#!/usr/bin/env bash
# MLE Conversation Capture Hook (UserPromptSubmit)
# Automatically captures conversation milestones to ADO work items.
#
# Installed by: mle init
# Trigger: UserPromptSubmit (fires on every user prompt)
#
# Detection modes:
#   - Milestone: user mentions "done", "completed", "merged", "PR created"
#   - Decision: user mentions "decided", "chose", "selected", "trade-off"
#   - Digest: time-based (every 15 min of active work)

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Only run inside MLE task workspaces (check metadata file or env var from mle shell)
if [ ! -f ".mle-metadata.json" ] && [ -z "${MLE_WORK_ITEM:-}" ]; then
    exit 0
fi

# Check mle is available
if ! command -v mle &>/dev/null; then
    exit 0
fi

# Extract user prompt from hook input
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null || echo "")

if [ -z "$PROMPT" ]; then
    exit 0
fi

# State file for tracking digest timing
STATE_FILE="${HOME}/.mle/capture-state-$(pwd | md5sum | cut -d' ' -f1)"

# --- Milestone Detection ---
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

MILESTONE_KEYWORDS="done|completed|finished|merged|pr created|pull request|deployed|released|shipped"
if echo "$PROMPT_LOWER" | grep -qiE "$MILESTONE_KEYWORDS"; then
    mle capture "Milestone detected: ${PROMPT:0:200}" --type milestone 2>/dev/null &
    disown
    exit 0
fi

# --- Decision Detection ---
DECISION_KEYWORDS="decided|chose|selected|trade-off|tradeoff|went with|picked|opted for|approach is"
if echo "$PROMPT_LOWER" | grep -qiE "$DECISION_KEYWORDS"; then
    mle capture "Decision context: ${PROMPT:0:200}" --type decision 2>/dev/null &
    disown
    exit 0
fi

# --- Digest (time-based) ---
NOW=$(date +%s)
LAST_CAPTURE=0
if [ -f "$STATE_FILE" ]; then
    LAST_CAPTURE=$(cat "$STATE_FILE" 2>/dev/null || echo "0")
fi

INTERVAL=$((15 * 60))  # 15 minutes
ELAPSED=$((NOW - LAST_CAPTURE))

if [ "$ELAPSED" -ge "$INTERVAL" ]; then
    echo "$NOW" > "$STATE_FILE"
    mle capture "Periodic digest: Active work in progress. Latest prompt: ${PROMPT:0:150}" --type digest 2>/dev/null &
    disown
fi

exit 0
