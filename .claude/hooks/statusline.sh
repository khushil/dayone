#!/bin/bash
# Claude Code statusline for DayONE — git branch + working-tree state.
# Reads the session JSON on stdin (we only need cwd); prints one line to stdout.
INPUT=$(cat 2>/dev/null)
DIR=$(printf '%s' "$INPUT" | jq -r '.workspace.current_dir // .cwd // empty' 2>/dev/null)
if [ -n "$DIR" ]; then
  cd "$DIR" 2>/dev/null || {
    printf 'dayone'
    exit 0
  }
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$branch" ]; then
  printf 'dayone'
  exit 0
fi

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  state='±dirty'
else
  state='✓clean'
fi
ahead=$(git rev-list --count '@{upstream}..HEAD' 2>/dev/null)
up=""
[ -n "$ahead" ] && [ "$ahead" != "0" ] && up=" ↑${ahead}"

printf 'dayone  %s  %s%s' "$branch" "$state" "$up"
