#!/bin/bash
# =============================================================================
# Claude Code Hook — MLE Auto Doctor
# =============================================================================
# UserPromptSubmit hook that runs a lightweight health check when a Claude Code
# session starts inside a task clone. Runs once per session (flag file in /tmp).
#
# Non-blocking — emits warnings as system message, does not block the prompt.
# =============================================================================

# Only run once per session
SESSION_FLAG="/tmp/.mle-doctor-${CLAUDE_SESSION_ID:-$$}"
if [[ -f "$SESSION_FLAG" ]]; then
    exit 0
fi
touch "$SESSION_FLAG"

# Read stdin (required by UserPromptSubmit hooks)
cat > /dev/null

# Determine project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Only activate inside a task clone (*-clones/ in path)
case "$PROJECT_DIR" in
    *-clones/*) ;; # proceed
    *) exit 0 ;;   # not a task clone, skip
esac

# Quick checks (keep under 3 seconds)
ISSUES=""

# Check 1: Unpushed commits
BRANCH="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
TRACKING="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref "@{upstream}" 2>/dev/null || true)"
if [[ -n "$TRACKING" ]]; then
    UNPUSHED="$(git -C "$PROJECT_DIR" rev-list "$TRACKING..HEAD" --count 2>/dev/null || echo "0")"
    if [[ "$UNPUSHED" -gt 0 ]]; then
        ISSUES="${ISSUES}  - $UNPUSHED unpushed commit(s) on $BRANCH (run /mle-sync to push)\n"
    fi
fi

# Check 2: On main branch (should never happen in a task clone)
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
    ISSUES="${ISSUES}  - WARNING: On $BRANCH branch in a task clone directory\n"
fi

# Check 3: Staleness (no commits in >7 days)
LAST_EPOCH="$(git -C "$PROJECT_DIR" log -1 --format="%ct" 2>/dev/null || echo "0")"
NOW_EPOCH="$(date +%s)"
DAYS_AGO=$(( (NOW_EPOCH - LAST_EPOCH) / 86400 ))
if [[ "$DAYS_AGO" -gt 7 ]]; then
    ISSUES="${ISSUES}  - Stale clone: last commit was ${DAYS_AGO} days ago\n"
fi

# Emit system message if issues found
if [[ -n "$ISSUES" ]]; then
    printf "MLE HEALTH CHECK (clone: %s, branch: %s):\n" "$(basename "$PROJECT_DIR")" "$BRANCH"
    printf "$ISSUES"
    printf "\nRun /mle-doctor for a full health report.\n"
fi
