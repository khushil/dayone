#!/bin/bash
# =============================================================================
# Claude Code Hook — Auto Prompt-Polish
# =============================================================================
# UserPromptSubmit hook that injects L1 interference and prompting best-practice
# analysis when the developer has opted in via a flag file.
#
# Opt-in:  touch .prompt-polish-enabled
# Opt-out: rm .prompt-polish-enabled
#
# The flag file is per-developer (.gitignore'd). The hook definition in
# settings.json is shared, but only activates when the flag file exists.
# =============================================================================

FLAG_FILE="${CLAUDE_PROJECT_DIR:-.}/.prompt-polish-enabled"

# Quick exit if not opted in
if [[ ! -f "$FLAG_FILE" ]]; then
    exit 0
fi

# Read the user's prompt from stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

# Skip empty prompts and slash commands (they have their own workflows)
if [[ -z "$PROMPT" || "$PROMPT" == /* ]]; then
    exit 0
fi

# Emit system reminder for Claude
cat <<'HOOK_EOF'
PROMPT-POLISH AUTO-CHECK (opt-in via .prompt-polish-enabled):

Before responding to this prompt, briefly scan it for:
1. L1 interference (Portuguese/Spanish false cognates, pro-drop, adjective placement)
2. Prompting anti-patterns (vague verbs, missing file paths, ambiguous pronouns)

Reference: rubrics/prompt-engineering-rubric.md

If you find CLARITY-level issues (ones that would cause you to misinterpret the request):
- State them briefly at the top of your response in a "Prompt Clarity" note
- Suggest a corrected version of the problematic phrase
- Then proceed to answer the prompt as best you can

If no CLARITY issues are found, proceed normally without comment.
Do NOT run the full /prompt-polish analysis — just flag critical misinterpretation risks.
HOOK_EOF
