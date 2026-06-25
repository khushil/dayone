#!/bin/bash
set -e

cd "$CLAUDE_PROJECT_DIR/.claude/hooks"

# Detect JS runtime: prefer bun, fall back to npx tsx
if command -v bun &>/dev/null; then
    cat | bun run skill-activation-prompt.ts
elif command -v npx &>/dev/null; then
    cat | npx --yes tsx skill-activation-prompt.ts
else
    # Skill activation not available without JS runtime — skip silently
    exit 0
fi
