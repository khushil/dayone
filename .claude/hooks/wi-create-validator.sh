#!/bin/bash
# =============================================================================
# Claude Code Hook -- WI Create Validator
# =============================================================================
# !!MLE-MANAGED!! wi-create-validator@v1 (Story #2260, ref Feature #2255)
# Intercepts raw `mcp__azure-devops__wit_create_work_item` tool calls and
# routes the proposed body through `mle wi validate` against
# `rubrics/work-item-authoring-rubric.md`. Below-threshold or critical-finding
# bodies are denied; the validator output is written to stderr so the caller
# sees exactly which dimension failed.
#
# Companion artefacts (multi-tier scaffold, Story #2260):
#   - .claude/hooks/wi-create-validator.json  (PreToolUse descriptor)
#   - .claude/skills/mle-wi-create/SKILL.md   (gated workflow skill)
#   - .claude/agents/wi-create-gate.md        (orchestrator agent)
#
# Claude Code hook protocol:
#   exit 0          -> allow (silent)
#   exit 2 + stderr -> block with reason
#   any other exit  -> non-blocking hook error
#
# Threshold cascade (mirrors `mle wi create`):
#   --threshold flag > MLE_WI_VALIDATOR_THRESHOLD env > config.toml > 4.00
# =============================================================================

set -u

INPUT=$(cat)

# Only act on the ADO MCP create-work-item tool. Any other tool short-circuits.
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
if [[ "$TOOL_NAME" != "mcp__azure-devops__wit_create_work_item" ]]; then
    exit 0
fi

# Honour the same opt-out used elsewhere in the WI authoring toolchain.
if [[ "${MLE_DISABLE_WI_CREATE_GATE:-0}" == "1" ]]; then
    exit 0
fi

# Extract the System.Description value and the workItemType.
BODY=$(echo "$INPUT" \
    | jq -r '.tool_input.fields[]? | select(.name == "System.Description") | .value // empty' \
    2>/dev/null)
WI_TYPE=$(echo "$INPUT" | jq -r '.tool_input.workItemType // empty' 2>/dev/null)

# Empty body is itself a rubric failure -- block before reaching the validator
# so the user gets a clear message rather than a generic completeness finding.
if [[ -z "$BODY" ]]; then
    echo "BLOCKED: wit_create_work_item submitted without System.Description. Use \`mle wi create\` (the gated workflow) instead -- it produces a rubric-compliant body and validates it before submission. See .claude/skills/mle-wi-create/SKILL.md." >&2
    exit 2
fi

# Map the ADO display name to the rubric type key.
case "${WI_TYPE,,}" in
    epic) TYPE_KEY="epic" ;;
    feature) TYPE_KEY="feature" ;;
    "user story"|userstory|story) TYPE_KEY="story" ;;
    "product backlog item"|productbacklogitem|pbi) TYPE_KEY="pbi" ;;
    task) TYPE_KEY="task" ;;
    bug) TYPE_KEY="bug" ;;
    spike) TYPE_KEY="spike" ;;
    refactor) TYPE_KEY="refactor" ;;
    documentation|doc) TYPE_KEY="doc" ;;
    "security/compliance"|"security compliance"|security) TYPE_KEY="security" ;;
    "test case"|testcase|test) TYPE_KEY="test" ;;
    impediment|issue) TYPE_KEY="impediment" ;;
    *)
        # Unknown type -- allow (the gate is only as strict as the rubric is
        # broad). The rubric does not score types it does not know about.
        exit 0
        ;;
esac

# Materialise the body to a temp file so `mle wi validate --body-file` can
# read it. Avoid leaking the body to disk for longer than necessary.
TMP_BODY=$(mktemp -t mle-wi-create-validator.XXXXXX) || exit 0
trap 'rm -f "$TMP_BODY"' EXIT
printf '%s' "$BODY" > "$TMP_BODY"

# Resolve threshold via the same cascade as `mle wi create`. The validator
# itself reads MLE_WI_VALIDATOR_THRESHOLD + config.toml internally, so we
# only forward an explicit flag when the env var is set; otherwise we let the
# CLI pick up its own default (currently 4.00).
THRESHOLD_FLAG=()
if [[ -n "${MLE_WI_VALIDATOR_THRESHOLD:-}" ]]; then
    THRESHOLD_FLAG+=(--threshold "$MLE_WI_VALIDATOR_THRESHOLD")
fi

# Run the validator. If `mle` is unavailable (older install, broken venv),
# emit a non-blocking warning and exit 0 -- the hook must not crash creation
# in the absence of MLE itself.
if ! command -v mle >/dev/null 2>&1; then
    echo "wi-create-validator: \`mle\` binary not found on PATH; skipping pre-create gate. Install via \`pipx install mle\` or upgrade with \`pipx upgrade mle\`." >&2
    exit 0
fi

VALIDATOR_OUT=$(mle wi validate --body-file "$TMP_BODY" --type "$TYPE_KEY" "${THRESHOLD_FLAG[@]}" 2>&1)
VALIDATOR_RC=$?

if [[ $VALIDATOR_RC -ne 0 ]]; then
    echo "BLOCKED: rubric validator FAIL for ${WI_TYPE} (${TYPE_KEY}). Submit through \`mle wi create\` (the gate runs the same validator and refuses below-threshold bodies). See .claude/skills/mle-wi-create/SKILL.md and rubrics/work-item-authoring-rubric.md." >&2
    echo "" >&2
    echo "$VALIDATOR_OUT" >&2
    exit 2
fi

# Validator PASS -- allow the tool call.
exit 0
