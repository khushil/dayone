---
name: capture-to-issue
description: 'Capture an important decision or milestone to a GitHub issue or PR as a comment. Use on demand when the user says "capture this", "record this decision", or you reach a significant milestone worth preserving in the tracker.'
---

# Capture to Issue

Record a significant decision, milestone, or rationale to the project's GitHub tracker
so it survives outside the chat. **On-demand only** — invoke when the user asks, or when
a genuinely consequential decision is made; never on every turn.

## Steps

1. **Find the target.** Prefer the issue/PR tied to the current branch:
   - `gh pr view --json number,title 2>/dev/null` (if a PR exists for the branch), or
   - `gh issue list --state open` and ask which issue, or the issue referenced in the
     branch name / recent commits.
2. **Draft a concise note** (British English): what was decided, the rationale, and any
   follow-up. Keep it to a short paragraph or a few bullets — a durable record, not a
   transcript.
3. **Confirm the target and text with the user** (this writes to GitHub — outward-facing).
4. **Post it:**
   - To a PR/issue: `gh issue comment <N> --body "<note>"` (works for PRs too), or
   - If no suitable issue exists and the user wants one: `gh issue create --title "<t>"
--body "<note>" --label decision`.
5. **Report** the issue/PR number and URL.

## Notes

- Never include secrets, tokens, or credentials in the captured text.
- If there is no open issue/PR and the user doesn't want to create one, summarise the
  decision in the chat instead — don't fabricate a target.

## See also

- `.claude/rules/work-item-standards.md` (issue/PR conventions), `github-workflow` agent
