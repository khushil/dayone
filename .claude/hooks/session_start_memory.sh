#!/usr/bin/env bash
# MLE Memory Subsystem — SessionStart hook (POSIX bash, Linux/macOS/WSL).
#
# Injects a <mle-memory-context> block summarising relevant prior decisions
# for the current session.  Called by Claude Code on SessionStart.
#
# NEVER blocks the session: every failure path exits 0 with a stderr warning
# and a structured log line.  Stdout is the injected block ONLY — no chatter.
#
# Principle 2 (hook failure never blocks), Principle 6 (stdout discipline),
# Principle 7 (observability), ADR-020 §Decision 7 (graceful degradation).

set -u  # NB: deliberately NOT -e; failures are handled explicitly.

REASON="${1:-${CLAUDE_SESSION_START_REASON:-resume}}"
LOG_DIR="${HOME}/.mle/logs/session-hooks"
LOG_FILE="${LOG_DIR}/$(date -u +%Y-%m-%d).log"
TIMEOUT_SEC=2

# Ensure log directory and file exist with correct permissions (0600).
mkdir -p "${LOG_DIR}" 2>/dev/null || true
if [ ! -e "${LOG_FILE}" ]; then
    touch "${LOG_FILE}" 2>/dev/null && chmod 0600 "${LOG_FILE}" 2>/dev/null || true
fi

# High-resolution start time: nanoseconds when available, seconds otherwise.
start_ns=$(date +%s%N 2>/dev/null) || true
if [ -z "${start_ns}" ] || [ "${start_ns}" = "%N" ]; then
    start_ns=$(python3 -c 'import time; print(int(time.time()*1e9))' 2>/dev/null || echo 0)
fi

# Append one structured line to the log — never raises.
_log() {
    local status="$1" bytes="$2" elapsed_ms="$3"
    printf '%s %s elapsed_ms=%s bytes=%s status=%s\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${REASON}" \
        "${elapsed_ms}" "${bytes}" "${status}" \
        >> "${LOG_FILE}" 2>/dev/null || true
}

# Guard: mle must be on PATH.
if ! command -v mle >/dev/null 2>&1; then
    echo "mle: not found on PATH; memory auto-injection skipped" >&2
    _log "missing-mle" 0 0
    exit 0
fi

# Guard: memory subsystem must be enabled.
enabled=$(mle config get memory.enabled 2>/dev/null || echo "true")
if [ "${enabled}" = "false" ]; then
    _log "disabled" 0 0
    exit 0
fi

# Call the context composer via the MLE CLI stub (F4.S5 will extend).
# Stdout is captured cleanly; stderr (including MLE warnings) flows to log.
if command -v timeout >/dev/null 2>&1; then
    block=$(timeout "${TIMEOUT_SEC}" mle memory inject-context \
        --task-description "${REASON}" \
        --token-budget 2000 \
        --skill 2>>"${LOG_FILE}")
    rc=$?
else
    # Fallback on systems without the timeout binary (some macOS installs).
    block=$(mle memory inject-context \
        --task-description "${REASON}" \
        --token-budget 2000 \
        --skill 2>>"${LOG_FILE}")
    rc=$?
fi

# Compute elapsed time in milliseconds.
end_ns=$(date +%s%N 2>/dev/null) || true
if [ -z "${end_ns}" ] || [ "${end_ns}" = "%N" ]; then
    end_ns=$(python3 -c 'import time; print(int(time.time()*1e9))' 2>/dev/null || echo 0)
fi
elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))

# Guard: command must succeed and produce output.
if [ "${rc}" -ne 0 ] || [ -z "${block}" ]; then
    echo "mle memory inject-context failed (rc=${rc}); see ${LOG_FILE}" >&2
    _log "error" 0 "${elapsed_ms}"
    exit 0
fi

# Happy path — emit the block to stdout ONLY, no other output.
printf '%s\n' "${block}"
_log "ok" "${#block}" "${elapsed_ms}"
exit 0
