#!/usr/bin/env bash
# Blocks if uncommitted changes exist when a teammate goes idle
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -n "$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null)" ]]; then
    echo "WARNING: Uncommitted changes detected. Consider committing before going idle."
    # Non-blocking warning — exit 0 to allow idle
fi

exit 0
