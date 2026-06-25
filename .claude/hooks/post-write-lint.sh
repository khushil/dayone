#!/usr/bin/env bash
# Post-write hook: informational ruff lint check after writing .py files
# Non-blocking — provides feedback but does not prevent writes
set -euo pipefail

# Only check Python files
FILE="${CLAUDE_TOOL_ARG_FILE_PATH:-}"
if [[ -z "$FILE" || "$FILE" != *.py ]]; then
    exit 0
fi

# Skip if file doesn't exist (deleted)
if [[ ! -f "$FILE" ]]; then
    exit 0
fi

# Find ruff — prefer venv, then system
if [[ -f ".venv/bin/ruff" ]]; then
    RUFF_CMD=".venv/bin/ruff"
elif command -v ruff &>/dev/null; then
    RUFF_CMD="ruff"
else
    exit 0
fi

OUTPUT=$($RUFF_CMD check "$FILE" 2>&1) || true
if [[ -n "$OUTPUT" ]]; then
    echo "━━━ Ruff Lint ━━━"
    echo "$OUTPUT"
    echo "━━━━━━━━━━━━━━━━━"
fi

exit 0
