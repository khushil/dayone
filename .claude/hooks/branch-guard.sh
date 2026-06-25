#!/bin/bash
# =============================================================================
# Claude Code PreToolUse hook (Bash) — protected-branch guard
# =============================================================================
# Blocks direct commits/pushes/merges to a protected branch (main/master/v2).
# GitHub branch protection is the authoritative gate; this is the local,
# agent-level guard. No work-item/location guards — feature branches are free.
#
# Protocol: exit 0 = allow (silent); exit 2 + stderr = block.
# =============================================================================
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ "$TOOL" = "Bash" ] || exit 0
[ -n "$CMD" ] || exit 0

# Block: push to a protected branch — handles flags, `<remote> <branch>`,
# and `<remote> <src>:<branch>` forms.
if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+push([[:space:]]+\S+)*[[:space:]]+(\S+:)?(main|master|v2)([[:space:]]|$)'; then
  echo "BLOCKED: direct push to a protected branch (main/master/v2). Open a pull request instead." >&2
  exit 2
fi

# Block: commit while checked out on a protected branch.
if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+commit'; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  case "$branch" in
    main | master | v2)
      echo "BLOCKED: committing on '$branch'. Create a feature branch first: git checkout -b feature/<name>" >&2
      exit 2
      ;;
  esac
fi

# Block: local merge into a protected branch.
if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+(checkout|switch)[[:space:]]+(main|master|v2)[[:space:]]*&&[[:space:]]*git[[:space:]]+merge'; then
  echo "BLOCKED: merging into a protected branch locally. Use a pull request." >&2
  exit 2
fi

exit 0
