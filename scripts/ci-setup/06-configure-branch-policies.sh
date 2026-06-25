#!/bin/bash
# mle:keep-local — PROJECT + REPO_ID are resolved per-project (PROJECT auto-
# patched from `git remote get-url origin` by `mle init`; REPO_ID is filled
# in by the operator from the ADO UUID after first install). Do NOT overwrite
# on `mle init --update`. See docs/reference/scaffold-customisation.md.
# =============================================================================
# Configure Azure DevOps Branch Policies for MLE
# =============================================================================
# Applies server-side branch policies to the main branch, matching the
# policies on the p4y-ngen repository.
#
# Policies configured:
#   1. Minimum 1 reviewer (creator can approve, reset on source push)
#   2. Comment resolution required
#   3. Merge strategy: squash only
#   4. Work item linking required
#
# Prerequisites:
#   - Azure CLI with azure-devops extension
#   - Authenticated: az devops login or AZURE_DEVOPS_PAT env var
#
# Usage:
#   bash scripts/ci-setup/06-configure-branch-policies.sh
#   bash scripts/ci-setup/06-configure-branch-policies.sh --project ai-sdlc-tooling
#   bash scripts/ci-setup/06-configure-branch-policies.sh --check-only
#
# =============================================================================

set -euo pipefail

# =============================================================================
# DEFAULTS
# =============================================================================

ORG="https://dev.azure.com/project-troy"
PROJECT="CHANGE_ME"
REPO_ID="CHANGE_ME"
BRANCH="main"
CHECK_ONLY=false

# =============================================================================
# OPTIONS
# =============================================================================

while [[ $# -gt 0 ]]; do
    case "$1" in
        --org)          ORG="$2"; shift 2 ;;
        --project)      PROJECT="$2"; shift 2 ;;
        --repository-id) REPO_ID="$2"; shift 2 ;;
        --branch)       BRANCH="$2"; shift 2 ;;
        --check-only)   CHECK_ONLY=true; shift ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --org URL              Azure DevOps org URL (default: $ORG)"
            echo "  --project NAME         Project name (default: $PROJECT)"
            echo "  --repository-id ID     Repository GUID (default: $REPO_ID)"
            echo "  --branch NAME          Branch to protect (default: $BRANCH)"
            echo "  --check-only           Report policy status without creating"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# =============================================================================
# COLOURS
# =============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()      { echo -e "  ${GREEN}[ok]${NC}      $1"; }
skip()    { echo -e "  ${YELLOW}[exists]${NC}  $1"; }
created() { echo -e "  ${GREEN}[created]${NC} $1"; }
fail()    { echo -e "  ${RED}[fail]${NC}    $1"; }

# =============================================================================
# AUTH CHECK
# =============================================================================

echo ""
echo -e "${BOLD}Configuring branch policies for ${PROJECT}/${BRANCH}${NC}"
echo ""

# Authenticate with PAT if available and not already logged in
if [[ -n "${AZURE_DEVOPS_PAT:-}" ]]; then
    echo "$AZURE_DEVOPS_PAT" | az devops login --org "$ORG" 2>/dev/null || true
fi

# Verify authentication works
if ! az repos policy list --repository-id "$REPO_ID" --project "$PROJECT" --branch "$BRANCH" --org "$ORG" --output none 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to Azure DevOps. Run 'az devops login' or set AZURE_DEVOPS_PAT.${NC}"
    exit 1
fi

# =============================================================================
# FETCH EXISTING POLICIES
# =============================================================================

EXISTING=$(az repos policy list \
    --repository-id "$REPO_ID" \
    --project "$PROJECT" \
    --branch "$BRANCH" \
    --org "$ORG" \
    --output json 2>/dev/null)

has_policy() {
    local display_name="$1"
    echo "$EXISTING" | python3 -c "
import json, sys
policies = json.load(sys.stdin)
for p in policies:
    if p.get('type', {}).get('displayName') == '$display_name' and not p.get('isDeleted', False):
        sys.exit(0)
sys.exit(1)
" 2>/dev/null
}

# =============================================================================
# POLICY CREATION
# =============================================================================

CREATED=0
SKIPPED=0

# Policy 1: Minimum number of reviewers
if has_policy "Minimum number of reviewers"; then
    skip "Minimum number of reviewers (1, creator can approve)"
    SKIPPED=$((SKIPPED + 1))
elif [[ "$CHECK_ONLY" == "true" ]]; then
    fail "Minimum number of reviewers — not configured"
else
    az repos policy approver-count create \
        --allow-downvotes false \
        --blocking true \
        --branch "$BRANCH" \
        --creator-vote-counts true \
        --enabled true \
        --minimum-approver-count 1 \
        --repository-id "$REPO_ID" \
        --reset-on-source-push true \
        --project "$PROJECT" \
        --org "$ORG" \
        --output none 2>/dev/null
    created "Minimum number of reviewers (1, creator can approve)"
    CREATED=$((CREATED + 1))
fi

# Policy 2: Comment resolution required
if has_policy "Comment requirements"; then
    skip "Comment resolution required"
    SKIPPED=$((SKIPPED + 1))
elif [[ "$CHECK_ONLY" == "true" ]]; then
    fail "Comment resolution required — not configured"
else
    az repos policy comment-required create \
        --blocking true \
        --branch "$BRANCH" \
        --enabled true \
        --repository-id "$REPO_ID" \
        --project "$PROJECT" \
        --org "$ORG" \
        --output none 2>/dev/null
    created "Comment resolution required"
    CREATED=$((CREATED + 1))
fi

# Policy 3: Merge strategy (squash only)
if has_policy "Require a merge strategy"; then
    skip "Merge strategy (squash only)"
    SKIPPED=$((SKIPPED + 1))
elif [[ "$CHECK_ONLY" == "true" ]]; then
    fail "Merge strategy — not configured"
else
    az repos policy merge-strategy create \
        --blocking true \
        --branch "$BRANCH" \
        --enabled true \
        --repository-id "$REPO_ID" \
        --allow-squash true \
        --allow-no-fast-forward false \
        --allow-rebase false \
        --allow-rebase-merge false \
        --project "$PROJECT" \
        --org "$ORG" \
        --output none 2>/dev/null
    created "Merge strategy (squash only)"
    CREATED=$((CREATED + 1))
fi

# Policy 4: Work item linking
if has_policy "Work item linking"; then
    skip "Work item linking required"
    SKIPPED=$((SKIPPED + 1))
elif [[ "$CHECK_ONLY" == "true" ]]; then
    fail "Work item linking — not configured"
else
    az repos policy work-item-linking create \
        --blocking true \
        --branch "$BRANCH" \
        --enabled true \
        --repository-id "$REPO_ID" \
        --project "$PROJECT" \
        --org "$ORG" \
        --output none 2>/dev/null
    created "Work item linking required"
    CREATED=$((CREATED + 1))
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo -e "${BOLD}Summary:${NC} $CREATED created, $SKIPPED already existed"
echo ""

if [[ "$CHECK_ONLY" == "true" && $((CREATED + SKIPPED)) -lt 4 ]]; then
    echo -e "${RED}Some policies are missing. Run without --check-only to create them.${NC}"
    exit 1
fi
