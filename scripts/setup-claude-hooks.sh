#!/bin/bash
# =============================================================================
# Claude Code Hooks Setup for MLE -- Workspace Guard
# =============================================================================
# Idempotently merges the workspace-guard PreToolUse -> Bash hook entry into
# .claude/settings.json. Pre-existing unrelated PreToolUse entries (from other
# tools) are preserved.
#
# The MLE-managed hook entry carries a sentinel field
# `_mle_managed: "branch-guard@v2"` so future installer runs and Story #2198's
# `mle doctor` check can identify it without ambiguity.
#
# Idempotency: re-running this script on a project that is already configured
# produces no diff in .claude/settings.json.
#
# Usage:
#   bash scripts/setup-claude-hooks.sh [target-project-root]
#
# When called from scripts/setup-dev-environment.sh, target-project-root
# defaults to the repository root containing this script's parent.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET="${1:-$DEFAULT_ROOT}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [[ ! -d "$TARGET" ]]; then
    echo -e "  ${RED}[fail]${NC}    target directory not found: $TARGET"
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo -e "  ${RED}[fail]${NC}    python3 required for JSON merge but not on PATH"
    exit 1
fi

CLAUDE_DIR="$TARGET/.claude"
SETTINGS_PATH="$CLAUDE_DIR/settings.json"
HOOK_PATH="$CLAUDE_DIR/hooks/branch-guard.sh"

mkdir -p "$CLAUDE_DIR"

# Warn (non-fatal) if branch-guard.sh isn't on disk -- mle init normally
# deploys it via the scaffold copy. The settings entry still gets registered
# so a later `mle init` / `mle init --update` can drop the script in place.
if [[ ! -f "$HOOK_PATH" ]]; then
    echo -e "  ${YELLOW}[warn]${NC}    $HOOK_PATH not found"
    echo -e "  ${YELLOW}            Run \`mle init\` (or \`mle init --update\`) to deploy it.${NC}"
fi

# Run the JSON merge in-process via python3. The merge:
#   1. Loads existing settings.json (creates {} if absent or unparseable).
#   2. Looks up settings.hooks.PreToolUse (list of group dicts).
#   3. Finds an MLE-managed entry by sentinel `_mle_managed`. If present,
#      ensures its command + timeout + matcher are current (idempotent).
#   4. If no sentinel found, looks for any pre-existing branch-guard.sh
#      reference and claims it (adds sentinel) so we don't duplicate entries.
#   5. Otherwise appends a new MLE-managed group, preserving every other
#      PreToolUse entry untouched.
#   6. Writes atomically (temp + rename) only if the serialised JSON differs.
SENTINEL_VALUE="branch-guard@v2"
# Intentional literal -- Claude Code expands $CLAUDE_PROJECT_DIR at hook
# invocation time, so we must NOT expand it in bash.
# shellcheck disable=SC2016
HOOK_COMMAND='$CLAUDE_PROJECT_DIR/.claude/hooks/branch-guard.sh'
HOOK_TIMEOUT_MS="5000"

python3 - "$SETTINGS_PATH" "$SENTINEL_VALUE" "$HOOK_COMMAND" "$HOOK_TIMEOUT_MS" <<'PY'
import json
import os
import sys
import tempfile
from pathlib import Path

settings_path = Path(sys.argv[1])
sentinel_value = sys.argv[2]
hook_command = sys.argv[3]
hook_timeout_ms = int(sys.argv[4])

SENTINEL_KEY = "_mle_managed"
HOOK_BASENAME = "branch-guard.sh"

if settings_path.is_file():
    try:
        settings = json.loads(settings_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(
            f"  [fail]    {settings_path} is not valid JSON: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)
else:
    settings = {}

if not isinstance(settings, dict):
    print(
        f"  [fail]    {settings_path} root must be a JSON object",
        file=sys.stderr,
    )
    sys.exit(1)

before = json.dumps(settings, indent=2, ensure_ascii=False, sort_keys=True)

hooks_section = settings.setdefault("hooks", {})
if not isinstance(hooks_section, dict):
    print("  [fail]    settings.hooks must be an object", file=sys.stderr)
    sys.exit(1)

pre_tool_use = hooks_section.setdefault("PreToolUse", [])
if not isinstance(pre_tool_use, list):
    print("  [fail]    settings.hooks.PreToolUse must be an array", file=sys.stderr)
    sys.exit(1)


def _matches_branch_guard(cmd: object) -> bool:
    return isinstance(cmd, str) and HOOK_BASENAME in cmd


def _claim_or_create() -> str:
    """Return one of: 'noop', 'updated', 'claimed', 'appended'."""
    # Pass 1 -- find an MLE-managed entry by sentinel.
    for group in pre_tool_use:
        if not isinstance(group, dict):
            continue
        for hook in group.get("hooks", []) or []:
            if not isinstance(hook, dict):
                continue
            if hook.get(SENTINEL_KEY) == sentinel_value:
                changed = False
                if hook.get("command") != hook_command:
                    hook["command"] = hook_command
                    changed = True
                if hook.get("type") != "command":
                    hook["type"] = "command"
                    changed = True
                if hook.get("timeout") != hook_timeout_ms:
                    hook["timeout"] = hook_timeout_ms
                    changed = True
                if group.get("matcher") != "Bash":
                    group["matcher"] = "Bash"
                    changed = True
                return "updated" if changed else "noop"

    # Pass 2 -- claim any existing branch-guard.sh entry that lacks the sentinel.
    for group in pre_tool_use:
        if not isinstance(group, dict):
            continue
        for hook in group.get("hooks", []) or []:
            if not isinstance(hook, dict):
                continue
            if _matches_branch_guard(hook.get("command")):
                hook[SENTINEL_KEY] = sentinel_value
                hook["command"] = hook_command
                hook["type"] = "command"
                hook["timeout"] = hook_timeout_ms
                if group.get("matcher") != "Bash":
                    group["matcher"] = "Bash"
                return "claimed"

    # Pass 3 -- append a fresh MLE-managed group.
    pre_tool_use.append(
        {
            "matcher": "Bash",
            "hooks": [
                {
                    "type": "command",
                    "command": hook_command,
                    "timeout": hook_timeout_ms,
                    SENTINEL_KEY: sentinel_value,
                }
            ],
        }
    )
    return "appended"


outcome = _claim_or_create()
after = json.dumps(settings, indent=2, ensure_ascii=False, sort_keys=True)

# Serialise the on-disk form (preserve insertion order, trailing newline).
serialised = json.dumps(settings, indent=2, ensure_ascii=False) + "\n"

if before == after and settings_path.is_file():
    print(f"  [ok]      branch-guard already wired -- no changes ({outcome})")
    sys.exit(0)

# Atomic write -- temp file in same directory, then rename.
fd, tmp_name = tempfile.mkstemp(
    prefix=".settings.", suffix=".json.tmp", dir=str(settings_path.parent)
)
try:
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(serialised)
    os.replace(tmp_name, settings_path)
except Exception:
    if os.path.exists(tmp_name):
        os.unlink(tmp_name)
    raise

action_label = {
    "appended": "registered new entry",
    "claimed":  "claimed existing entry",
    "updated":  "refreshed entry",
}[outcome]
print(f"  [ok]      {action_label} for branch-guard.sh in {settings_path}")
PY

echo -e "  ${GREEN}Claude Code hooks configured successfully.${NC}"
