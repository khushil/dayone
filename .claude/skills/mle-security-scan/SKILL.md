---
name: mle-security-scan
description: 'Security review for the Electron + TypeScript app — dependency vulnerabilities, secret detection, dangerous patterns, Electron hardening, and an SBOM.'
keywords:
  - 'security scan'
  - 'vulnerability check'
  - 'SBOM'
  - 'secret detection'
  - 'electron hardening'
intent_patterns:
  - "(run|perform|execute)\\s+(a\\s+)?security\\s+(scan|review)"
  - "(check|scan)\\s+for\\s+(vulnerabilities|secrets|CVEs)"
  - "generate\\s+(an?\\s+)?SBOM"
---

# Security Review

Review DayONE — an Electron + React 19 + TypeScript desktop app — for security
weaknesses. The app ships offline (`connect-src 'none'`, committed data snapshot),
so the threat model centres on **supply chain**, **renderer hardening**, and
**leaked secrets**, not server-side injection. Report findings; never auto-fix.

## When to Use

- Before a security-sensitive change, or as a gate before a pull request
- When asked to "security scan", "check for vulnerabilities", "generate an SBOM"
- Periodically, to catch newly disclosed CVEs in dependencies

## Workflow

### 1. Dependency vulnerabilities

```bash
npm audit --omit=dev --json | jq '.metadata.vulnerabilities'   # prod severity counts
npm audit --json | jq '[.vulnerabilities[] | select(.severity=="critical" or .severity=="high")]'
npm outdated || true                                            # stale pins feeding CVEs
```

Treat `critical`/`high` in production dependencies as blocking. Prefer `npm audit
fix` proposals over manual bumps, but report — do not apply.

### 2. Secret detection (working tree **and** history)

```bash
rg -nI '(api[_-]?key|secret|token|password|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]{20,})' \
   src/ scripts/ electron.vite.config.ts
git log -p -S 'apiKey' -- src/ | rg -n 'apiKey\s*[:=]'         # leaks in history
```

API keys must reach disk only via Electron `safeStorage`/the SecureStore wrapper —
never committed config, env files, or the renderer bundle. Flag any literal key.

### 3. Dangerous patterns

Scan source for the high-risk constructs below (structural search where it helps):

```bash
ast-grep run -p 'eval($_)' --lang ts src/
rg -n 'dangerouslySetInnerHTML|new Function\(|child_process|shell:\s*true|\.exec\(' src/
```

| Pattern                                                             | Severity | Why it matters                               |
| ------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `webSecurity: false`                                                | CRITICAL | Disables same-origin policy in the renderer  |
| `contextIsolation: false` / `nodeIntegration: true`                 | CRITICAL | Exposes Node to renderer/remote content      |
| `sandbox: false`                                                    | HIGH     | Renderer escapes the OS sandbox              |
| `eval`, `new Function`                                              | HIGH     | Arbitrary code execution                     |
| `dangerouslySetInnerHTML`                                           | HIGH     | DOM-based XSS sink                           |
| `shell: true` / `child_process` with variable input                 | HIGH     | Command injection                            |
| CSP widened beyond `connect-src 'none'` (e.g. `*`, `unsafe-inline`) | MEDIUM   | Re-opens the network/eval surface            |
| `ipcRenderer` exposed raw on `window`                               | MEDIUM   | Bypasses the minimal `contextBridge` surface |

### 4. Electron hardening checklist

Read `src/main/` (window creation) and `src/preload/` and confirm each holds:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- A CSP is set and `connect-src 'none'` (no live network)
- `webSecurity` left at default (`true`); no `allowRunningInsecureContent`
- Preload exposes a **minimal** typed `contextBridge` API — never raw `ipcRenderer`
- `setWindowOpenHandler` denies untrusted `window.open`; no remote URLs loaded
- `will-navigate` blocked or constrained to the local bundle

### 5. SBOM

```bash
npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json
jq '.bomFormat=="CycloneDX" and (.components|length>0)' sbom.json
```

The SBOM must enumerate all dependencies (including transitive) from the lockfile.

### 6. Report

Sort findings by severity (critical first) with `file:line`, the pattern matched,
and a one-line fix. Emit a summary header: `N CRITICAL, N HIGH, N MEDIUM, N LOW`.

## Red Flags

- Verdict reads PASS while `npm audit` reports a critical production vulnerability
- A CSP `meta`/header that includes `unsafe-inline`, `unsafe-eval`, or `connect-src *`
- A secret matched in `git log -p` but absent from the working tree (still leaked)
- SBOM `components[]` count below `npm ls --all --json` dependency count

## Rules

- **Scan all in-scope files** — never sample
- **No auto-fix** — report only; the developer decides remediation
- **Distinguish literal vs variable** in `child_process`/`shell` calls (literal = lower risk)
- **Gate**: 0 critical, ≤5 high by default
- **British English** in all findings ("analyse", "behaviour")
