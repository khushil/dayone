#!/bin/bash
# =============================================================================
# Claude Code Hook -- Branch Guard
# =============================================================================
# !!MLE-MANAGED!! branch-guard@v3 (US #2195 + #2199)
# Prevents Claude Code from committing or pushing directly to main, AND from
# creating new branches that violate either of MLE's two branch guards:
#   1. Link guard (US #2199): branch name must match the canonical convention
#      and the wi-type must be compatible with the prefix. Cheap regex.
#   2. Location guard (US #2195): in-place branch creation in the home repo
#      (i.e. NOT inside a *-clones/ or *-worktrees/ ancestor) is blocked.
# Runs on PreToolUse for Bash tool calls.
#
# Claude Code hook protocol:
#   exit 0          -> allow (silent)
#   exit 2 + stderr -> block with reason
#   any other exit  -> non-blocking hook error
#
# Link-guard escape hatches (independent of the location guard):
#   - MLE_ALLOW_UNLINKED_BRANCH=1            (env var, one-shot)
#   - git config mle.allow-unlinked true     (per-repo, persistent)
#
# Location-guard escape hatches:
#   - MLE_ALLOW_INPLACE_BRANCH=1             (env var, one-shot)
#   - git config mle.allow-inplace true      (per-repo, persistent)
#
# Home-repo detection mirrors src/mle/core/paths.py::is_inside_workspace().
# =============================================================================

INPUT=$(cat)

PARSED=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
except (json.JSONDecodeError, ValueError) as e:
    sys.stderr.write(f'  [branch-guard] JSON parse failed: {e}\\n')
    sys.exit(1)
print(d.get('tool_name', ''))
print(d.get('tool_input', {}).get('command', ''))
") || { echo "  [branch-guard] JSON parse failed" >&2; exit 1; }
TOOL_NAME=$(echo "$PARSED" | sed -n '1p')
COMMAND=$(echo "$PARSED" | sed -n '2p')
if [[ "$TOOL_NAME" != "Bash" ]]; then
    exit 0
fi

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Block: git push to main/master
if echo "$COMMAND" | grep -qE 'git\s+push\s+\S+\s+(main|master|v2)(\s|$)'; then
    echo "BLOCKED: Direct push to main is blocked. Create a feature branch first: git checkout -b feature/<name>" >&2
    exit 2
fi

# Block: git push origin HEAD:main
if echo "$COMMAND" | grep -qE 'git\s+push\s+\S+\s+\S*:(main|master|v2)(\s|$)'; then
    echo "BLOCKED: Direct push to main is blocked. Create a feature branch first: git checkout -b feature/<name>" >&2
    exit 2
fi

# Block: git commit while on main (check current branch)
if echo "$COMMAND" | grep -qE 'git\s+commit'; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
    if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
        echo "BLOCKED: Committing on main is blocked. Create a feature branch first: git checkout -b feature/<name>" >&2
        exit 2
    fi
fi

# Block: local merge into main
if echo "$COMMAND" | grep -qE 'git\s+checkout\s+(main|master|v2)\s*&&\s*git\s+merge'; then
    echo "BLOCKED: Merging into main locally is blocked. Use a pull request in Azure DevOps instead." >&2
    exit 2
fi

# --- Branch-creation detection -----------------------------------------------
# Patterns: `git checkout -b <name>`, `git switch -c <name>`,
# `git branch <new-name>`, `git worktree add ... -b <name>`.
extract_branch_name() {
    local cmd="$1"
    if [[ "$cmd" =~ git[[:space:]]+(checkout|switch)[[:space:]]+(-b|-B|-c|-C)[[:space:]]+([^[:space:]]+) ]]; then
        echo "${BASH_REMATCH[3]}"
        return 0
    fi
    if [[ "$cmd" =~ git[[:space:]]+worktree[[:space:]]+add[[:space:]]+.*[[:space:]](-b|-B)[[:space:]]+([^[:space:]]+) ]]; then
        echo "${BASH_REMATCH[2]}"
        return 0
    fi
    # `git branch <new>` -- first arg is the new branch (skip flag-prefixed args).
    if [[ "$cmd" =~ git[[:space:]]+branch[[:space:]]+([A-Za-z0-9][A-Za-z0-9_/.-]*) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    return 1
}

# Detect whether the create attempt is `git worktree add` (location guard
# allows it because that is the prescribed alternative).
is_worktree_add() {
    [[ "$1" =~ git[[:space:]]+worktree[[:space:]]+add ]]
}

NEW_BRANCH=$(extract_branch_name "$COMMAND" || true)

if [[ -n "$NEW_BRANCH" ]]; then
    # --- Link guard (Layer 1: regex + type compatibility) --------------------
    # Only police branches under the four MLE prefixes. Branches outside that
    # set are blocked by other policy elsewhere (or allowed for ad-hoc work).
    if [[ "${MLE_ALLOW_UNLINKED_BRANCH:-}" != "1" ]] \
       && [[ "$(git config --get mle.allow-unlinked 2>/dev/null || true)" != "true" ]]; then
        if [[ "$NEW_BRANCH" =~ ^(feature|bugfix|hotfix|release)/ ]]; then
            link_ok=0
            link_reason=""
            link_prefix="${NEW_BRANCH%%/*}"
            rest="${NEW_BRANCH#*/}"
            release_version_re='^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'
            link_re='^(refactor|security|feature|story|spike|task|test|bug|doc|pbi|us)-([0-9]+)(-([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9]))?$'
            if [[ "$link_prefix" == "release" && "$rest" =~ $release_version_re ]]; then
                link_ok=1
            elif [[ "$rest" =~ $link_re ]]; then
                wi_type="${BASH_REMATCH[1]}"
                allowed=0
                case "$link_prefix" in
                    feature)
                        case "$wi_type" in
                            feature|story|us|pbi|task|spike|refactor|doc|security|test) allowed=1 ;;
                        esac
                        ;;
                    bugfix|hotfix)
                        [[ "$wi_type" == "bug" ]] && allowed=1
                        ;;
                    release) allowed=1 ;;
                esac
                if [[ $allowed -eq 1 ]]; then
                    link_ok=1
                else
                    link_reason="prefix '${link_prefix}/' does not permit WI type '${wi_type}'"
                fi
            else
                link_reason="branch name does not match <prefix>/<wi-type>-<id>-<slug>"
            fi

            if [[ $link_ok -eq 0 ]]; then
                cat >&2 <<EOF
X  Branch link-guard rejected: $NEW_BRANCH
   Reason: $link_reason
   Convention: <prefix>/<wi-type>-<id>-<slug>
     prefix in  : feature, bugfix, hotfix, release
     wi-type in : feature, story, us, pbi, bug, task, spike,
                  refactor, doc, security, test
   Use:    mle work <ADO-ID>            (canonical workspace + WI link)
   Bypass: MLE_ALLOW_UNLINKED_BRANCH=1 ...   (one-shot)
   Bypass: git config mle.allow-unlinked true   (per-repo, persistent)
EOF
                exit 2
            fi
        fi
    fi

    # --- Location guard (in-place branch creation) ---------------------------
    if [[ "${MLE_ALLOW_INPLACE_BRANCH:-}" != "1" ]] \
       && [[ "$(git config --get mle.allow-inplace 2>/dev/null || true)" != "true" ]]; then
        if ! is_worktree_add "$COMMAND"; then
            toplevel=$(git rev-parse --show-toplevel 2>/dev/null || true)
            if [[ -n "$toplevel" ]]; then
                inside=0
                p="$toplevel"
                while [[ -n "$p" && "$p" != "/" ]]; do
                    base=$(basename "$p")
                    case "$base" in
                        *-clones|*-worktrees) inside=1; break ;;
                    esac
                    p=$(dirname "$p")
                done
                if [[ $inside -eq 0 ]]; then
                    home_repo_name=$(basename "$toplevel")
                    cat >&2 <<EOF
X  In-place branching blocked in home repo: $home_repo_name
  Use:    mle work <ADO-ID>           (creates a workspace + links the work item)
  Or:     mle create <branch-name>    (workspace, --no-link --reason --audit-wi to bypass)
  Bypass: MLE_ALLOW_INPLACE_BRANCH=1 git checkout -b ...   (one-shot)
  Bypass: git config mle.allow-inplace true                 (per-repo, persistent)
EOF
                    exit 2
                fi
            fi
        fi
    fi
fi

exit 0
