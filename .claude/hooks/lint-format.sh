#!/usr/bin/env bash
#
# PostToolUse hook — after Claude edits a file, auto-format it (Prettier) and
# auto-fix lint (ESLint/Stylelint) to the Google TypeScript Style Guide, then
# surface any residual, non-auto-fixable violations back to Claude so it can
# self-correct. Auto-fixing keeps the loop smooth; only genuine problems block.
#
set -euo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

# Only touch files we own and can format.
case "$file" in
  *.ts | *.tsx | *.mjs | *.cjs | *.js | *.jsx | *.css | *.json | *.md | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

npx --no-install prettier --write "$file" >/dev/null 2>&1 || true

case "$file" in
  *.ts | *.tsx | *.mjs | *.cjs | *.js | *.jsx)
    npx --no-install eslint --fix "$file" >/dev/null 2>&1 || true
    if ! residual="$(npx --no-install eslint "$file" 2>&1)"; then
      {
        echo "Google-style violations remain in ${file} (not auto-fixable):"
        echo "${residual}"
        echo "Please fix them to keep the build green."
      } >&2
      exit 2
    fi
    ;;
  *.css)
    npx --no-install stylelint --fix "$file" >/dev/null 2>&1 || true
    if ! residual="$(npx --no-install stylelint "$file" 2>&1)"; then
      { echo "Stylelint violations remain in ${file}:"; echo "${residual}"; } >&2
      exit 2
    fi
    ;;
esac

exit 0
