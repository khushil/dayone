# MLE Memory Subsystem — SessionStart hook (PowerShell 7+, cross-platform).
#
# Injects a <mle-memory-context> block summarising relevant prior decisions
# for the current session.  Called by Claude Code on SessionStart.
#
# NEVER blocks the session: every failure path exits 0 with a stderr warning
# and a structured log line.  Stdout is the injected block ONLY — no chatter.
#
# Behaviour is intentionally parallel to session_start_memory.sh.
# ADR-020 §Decision 7 (graceful degradation), Principle 6 (stdout discipline).
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Reason = $env:CLAUDE_SESSION_START_REASON
)

if ([string]::IsNullOrWhiteSpace($Reason)) { $Reason = 'resume' }

$LogDir  = Join-Path $HOME '.mle' 'logs' 'session-hooks'
$LogDate = (Get-Date -AsUtc -Format 'yyyy-MM-dd')
$LogFile = Join-Path $LogDir ($LogDate + '.log')

# Ensure log directory exists.
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Append one structured line to the log — never raises.
function Write-HookLog {
    param([string]$Status, [int]$Bytes, [int]$ElapsedMs)
    $ts = (Get-Date -AsUtc -Format 'yyyy-MM-ddTHH:mm:ssZ')
    $line = "$ts $Reason elapsed_ms=$ElapsedMs bytes=$Bytes status=$Status"
    try { Add-Content -Path $LogFile -Value $line } catch { <# best-effort #> }
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()

# Guard: mle must be available.
if (-not (Get-Command mle -ErrorAction SilentlyContinue)) {
    [Console]::Error.WriteLine('mle: not found on PATH; memory auto-injection skipped')
    Write-HookLog 'missing-mle' 0 0
    exit 0
}

# Guard: memory subsystem must be enabled.
$enabled = (& mle config get memory.enabled 2>$null)
if ($enabled -eq 'false') {
    Write-HookLog 'disabled' 0 0
    exit 0
}

# Call the context composer via the MLE CLI stub (F4.S5 will extend).
# Stderr flows to the log file; stdout is the injected block.
$block = $null
$rc    = 0
try {
    $block = & mle memory inject-context `
        --task-description "$Reason" `
        --token-budget 2000 `
        --skill 2>>$LogFile
    $rc = $LASTEXITCODE
} catch {
    $rc = 1
    $block = $null
}

$sw.Stop()
$elapsedMs = [int]$sw.ElapsedMilliseconds

# Guard: command must succeed and produce output.
if ($rc -ne 0 -or [string]::IsNullOrWhiteSpace($block)) {
    [Console]::Error.WriteLine("mle memory inject-context failed (rc=$rc); see $LogFile")
    Write-HookLog 'error' 0 $elapsedMs
    exit 0
}

# Happy path — emit the block to stdout ONLY, no other output.
Write-Output $block
Write-HookLog 'ok' $block.Length $elapsedMs
exit 0
