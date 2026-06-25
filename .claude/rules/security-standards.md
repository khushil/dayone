# Security Standards

**Path scope**: `**`

## Secrets Management

- Never hardcode secrets, tokens, or credentials in source files
- Approved storage: OS keyring (`keyring` library), environment variables, Azure Key Vault
- PATs and API keys: read from `~/.mle/config.toml` or env var, never from committed files
- Git: use `.gitignore` to exclude `.env`, `*.pem`, `*.key`, `credentials.json`

## Input Validation

| Context                | Required Validation                                             |
| ---------------------- | --------------------------------------------------------------- |
| File paths             | Resolve and check within expected directory (no path traversal) |
| User input (CLI)       | Type-check and bound-check before processing                    |
| External API responses | Validate schema before unpacking; handle non-200 gracefully     |
| YAML/JSON/TOML parsing | Wrap in try/except; report file path and line on failure        |

## Dependency Security

- Pin all dependencies in `pyproject.toml` or `requirements.txt`
- Run `pip-audit` or `safety check` in CI before merge
- Review new dependencies: check maintenance status, licence, and known CVEs
- Prefer stdlib over third-party where functionality is equivalent

## DON'Ts

- Don't use `eval()`, `exec()`, or `compile()` on untrusted input
- Don't disable TLS verification (`verify=False` in requests)
- Don't log sensitive data (passwords, tokens, PII) — even at DEBUG level
- Don't commit `.env` files, private keys, or service account JSON
- Don't use `subprocess.run(shell=True)` with user-supplied arguments
