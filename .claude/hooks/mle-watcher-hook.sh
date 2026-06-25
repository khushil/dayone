#!/usr/bin/env bash
# MLE Watcher Hook (UserPromptSubmit)
# Sends event to watcher daemon via Unix domain socket.
# Falls back silently if daemon is not running.
#
# Installed by: mle init (--update replaces old capture hook)
# Trigger: UserPromptSubmit
# Target: < 500ms wall time

set -euo pipefail

SOCK="${HOME}/.mle/watcher.sock"

# Quick exit if daemon not running (no socket file)
[ -S "$SOCK" ] || exit 0

# Read hook input from stdin
INPUT=$(cat)

# Extract prompt text (truncate to 500 chars)
PROMPT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('prompt', '')[:500])
except Exception:
    pass
" 2>/dev/null || echo "")

[ -z "$PROMPT" ] && exit 0

# Build JSON event and send to daemon socket (fire-and-forget in background)
python3 -c "
import json, socket, sys, os
from datetime import datetime, timezone

event = json.dumps({
    'event_type': 'user_prompt',
    'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'prompt_text': sys.argv[1],
    'metadata': {'cwd': os.getcwd()}
})

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.settimeout(0.3)
try:
    sock.connect(sys.argv[2])
    sock.sendall(event.encode('utf-8'))
    sock.shutdown(socket.SHUT_WR)
except Exception:
    pass
finally:
    sock.close()
" "$PROMPT" "$SOCK" &
disown

exit 0
