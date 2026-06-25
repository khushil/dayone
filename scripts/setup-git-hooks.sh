#!/bin/bash
# =============================================================================
# Git Hooks Setup for MLE
# =============================================================================
# Sets core.hooksPath to .githooks/, makes hook scripts executable, and warns
# when the installed git version is older than 2.28 (the version that
# introduced the reference-transaction hook).
#
# Idempotent — safe to run repeatedly.
#
# Usage:
#   bash scripts/setup-git-hooks.sh
#
# Called automatically by scripts/setup-dev-environment.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$REPO_ROOT"

# Verify we're in a git working tree (handles both regular repos and worktrees,
# where .git is a file pointing at the parent's gitdir).
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "Error: not in a git repository"
    exit 1
fi

# Set core.hooksPath to use .githooks/ directory
git config core.hooksPath .githooks
echo -e "  ${GREEN}[ok]${NC}      core.hooksPath set to .githooks/"

# Make hook scripts executable. reference-transaction (US #2195) is included
# alongside the existing trio so the workspace guard fires at the git layer.
for hook in commit-msg pre-commit pre-push reference-transaction; do
    if [[ -f ".githooks/$hook" ]]; then
        chmod +x ".githooks/$hook"
    fi
done
echo -e "  ${GREEN}[ok]${NC}      hook scripts made executable"

# -----------------------------------------------------------------------------
# Git version detection
# -----------------------------------------------------------------------------
# `reference-transaction` (the workspace-guard git hook) was introduced in
# Git 2.28. Older versions silently IGNORE the hook -- the file remains on
# disk, but git never invokes it. The Claude Code branch-guard.sh layer still
# fires for tool-driven branching, but direct human `git checkout -b` from a
# pre-2.28 shell will NOT be blocked. This warning surfaces that gap; it is
# NOT fatal because the Claude layer + escape hatches preserve usability.
git_version_raw=$(git --version 2>/dev/null | awk '{print $3}' || true)
git_major=$(echo "$git_version_raw" | cut -d. -f1)
git_minor=$(echo "$git_version_raw" | cut -d. -f2)
# Default the parts to 0 if version parsing failed, so the comparison is safe.
git_major=${git_major:-0}
git_minor=${git_minor:-0}
if [[ "$git_major" -lt 2 ]] || { [[ "$git_major" -eq 2 ]] && [[ "$git_minor" -lt 28 ]]; }; then
    echo ""
    echo -e "  ${YELLOW}WARNING: git ${git_version_raw:-?} predates 2.28.${NC}"
    echo -e "  ${YELLOW}The reference-transaction hook is silently ignored on this"
    echo -e "  version (see hook header). Claude Code branch-guard.sh still"
    echo -e "  fires for tool-driven branching; direct human git use is not"
    echo -e "  blocked at the git layer until git is upgraded to 2.28+.${NC}"
fi

# Verify pre-commit framework is available
if command -v pre-commit &>/dev/null; then
    if [[ -f ".pre-commit-config.yaml" ]]; then
        echo -e "  ${GREEN}[ok]${NC}      pre-commit framework available (.githooks/pre-commit wrapper)"
    else
        echo -e "  ${YELLOW}[skip]${NC}    .pre-commit-config.yaml not found"
    fi
else
    echo -e "  ${YELLOW}[skip]${NC}    pre-commit not installed (run scripts/setup-dev-environment.sh)"
fi

echo ""
echo -e "  ${GREEN}Git hooks configured successfully.${NC}"
echo "  Pushes to main will be blocked — use feature branches + PRs."

# Lightweight git identity check
GIT_NAME=$(git config user.name 2>/dev/null || true)
GIT_EMAIL=$(git config user.email 2>/dev/null || true)

if [[ -z "$GIT_NAME" || -z "$GIT_EMAIL" ]]; then
    echo ""
    echo -e "  ${YELLOW}WARNING: Git identity not configured.${NC}"
    echo -e "  ${YELLOW}Commits will fail or be attributed incorrectly.${NC}"
    echo -e "  Run:  git config --global user.name \"Your Name\""
    echo -e "        git config --global user.email \"your.email@capgemini.com\""
fi
