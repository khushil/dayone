# Memory & Knowledge Subsystem

**Path scope**: `src/**/memory_*.py`, `docs/memory/**`, `tests/**/test_memory_*.py`

The Memory Subsystem records, indexes, and recalls structured project memories —
decisions, bugs, conventions, vocabulary — for Claude Code agents. It is
**connect-only** (ADR-060): MLE connects to an externally-managed PostgreSQL 18
cluster and provisions a per-project database on it — it does not embed a
database process. Install with `pip install mle[memory]`; point it at a cluster
via `[memory.postgres].cluster_dsn`. Pins: PostgreSQL 18 / Apache AGE 1.7.0 /
pgvector 0.8.2 (the CVE-2026-3172 security floor) / pg_cron 1.6 / pgcrypto /
pg_trgm. The operator cluster build and configuration steps live in
`docs/memory/postgres-18-server-requirements.md` (pg_cron must be pre-loaded via
`shared_preload_libraries='pg_cron'`).

## Boundary with Claude Code MEMORY.md

| Dimension    | CC MEMORY.md                                      | MLE Memory Subsystem                                   |
| ------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Purpose      | Personal preferences and session-continuity notes | Index, recall, and reason over project knowledge       |
| Scope        | Per-machine, per-project; not shared              | Team-shareable via signed federation (F8)              |
| Persistence  | Plain Markdown file                               | Postgres rows with configurable retention              |
| Queryability | Loaded in full at session start                   | Vector + FTS + graph retrieval via `mle memory recall` |
| Trust model  | All content implicitly trusted                    | Three-value enum: `trusted`, `user`, `external`        |
| Audit        | No audit log                                      | Every write logged in `memory_audit`                   |

MLE **reads** CC MEMORY.md at session start (`source_trust=user`, `source_type=cc_memory`).
MLE **never writes** to MEMORY.md. The relationship is strictly one-way.

See [`docs/memory/cc-boundary.md`](../docs/memory/cc-boundary.md) for the full comparison.

## Trust Taxonomy

Every `memory_records` row carries `source_trust` (ADR-020 Decision 6):

| Value      | Meaning                                                | May enter system prompt |
| ---------- | ------------------------------------------------------ | ----------------------- |
| `trusted`  | MLE-authored: decisions, ADRs, code-owned content      | Yes                     |
| `user`     | Direct `mle capture` prose or CC MEMORY.md content     | Yes                     |
| `external` | ADO descriptions, PR comments, third-party tool output | **No**                  |

Trust is enforced at the **SQL level** in every recall lane — not as an application
filter. Default recall uses `trust_levels=("trusted", "user")`. Passing `"external"`
requires an explicit `--trust external` flag.

## Key CLI Commands

| Command                        | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `mle memory migrate`           | Apply schema migrations (run once after install or upgrade)   |
| `mle memory verify`            | Check capability floor against ADR-020 version pins           |
| `mle memory recall QUERY`      | Hybrid four-lane RRF retrieval                                |
| `mle memory list`              | Paginated listing sorted by capture date                      |
| `mle memory inspect RECORD_ID` | Full detail for a single record                               |
| `mle memory stats`             | Corpus health snapshot (tier counts, source breakdown)        |
| `mle memory inject-context`    | Build a `<mle-memory-context>` block for a prompt             |
| `mle doctor`                   | Includes memory server status, schema version, and pool stats |

Add `--skill` to any subcommand for JSON output consumed by Claude Code agents.

## Recall Modes

The `--mode` flag selects which retrieval lanes run:

| Mode               | Lanes                          | Use when                             |
| ------------------ | ------------------------------ | ------------------------------------ |
| `hybrid` (default) | Vector + FTS + recency + graph | General purpose — prefer this        |
| `vector`           | Dense semantic only            | Debugging embedding quality          |
| `fts`              | Sparse full-text only          | Exact phrase matching                |
| `recency`          | Capture date DESC              | "What happened recently?"            |
| `graph`            | Fact-neighbour expansion       | Exploring topically adjacent records |

## Configuration Reference (`[memory]` in `~/.mle/config.toml`)

| Sub-section           | Purpose                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[memory]`            | `enabled = false` disables all memory operations silently                                                                                                              |
| `[memory.recall]`     | `top_k`, RRF weights, trust-filter defaults                                                                                                                            |
| `[memory.postgres]`   | Connect-only cluster settings — `cluster_dsn`, `host`/`port`/`user`/`sslmode`, `database_prefix`, pool size, and the per-project-database `byo_url` override (ADR-060) |
| `[memory.cron]`       | pg_cron retention-sweep scheduling — `enabled`, `home_db`, `retention_schedule` (ADR-060)                                                                              |
| `[memory.retention]`  | Hot / working / archive tier thresholds (F7)                                                                                                                           |
| `[memory.memify]`     | Pattern-surfacing schedule and confidence threshold (F5)                                                                                                               |
| `[memory.autodream]`  | Background sampling schedule and batch size (F5)                                                                                                                       |
| `[memory.federation]` | Ed25519 signing and key rotation (F8)                                                                                                                                  |

See [`docs/memory/example-config.toml`](../docs/memory/example-config.toml) for the annotated full reference.

## Opt-in / Opt-out

```bash
pip install mle[memory]               # install extras (psycopg etc.)
# point at the cluster: set [memory.postgres].cluster_dsn in ~/.mle/config.toml
pip uninstall mle[memory]             # remove client; the per-project database on the cluster persists
```

The subsystem stays dormant until a cluster is configured under
`[memory.postgres]`. Set `[memory].enabled = false` to disable without
uninstalling. The watcher skips all memory operations; `mle doctor` renders
"Memory subsystem: disabled". Per-project data lives in the `<database_prefix>
<project-hash>` database on the cluster (drop it on the cluster to purge); MLE
does not store Postgres data files locally.

## DON'Ts

- Don't place `external`-trust content in a system prompt — the SQL layer prevents
  this, but don't work around it in application logic
- Don't write to MEMORY.md from any MLE code — MLE is a read-only consumer
- Don't call `recall()` directly for production context injection — use
  `inject_context()` so compression and trust-defence apply consistently
- Don't bypass migration gating — always run `mle memory migrate` after upgrade
- Don't assume MLE manages the database server — the PostgreSQL 18 cluster is
  externally managed; MLE only connects and provisions its per-project database

## See Also

- `docs/memory/CLAUDE.md` — documentation hub and navigation
- `docs/memory/architecture.md` — stack, modules, data flow
- `docs/memory/recall-api.md` — recall function, four lanes, CLI reference
- `docs/memory/cc-boundary.md` — CC MEMORY.md vs MLE Memory deep-dive
- `docs/memory/postgres-18-server-requirements.md` — operator cluster build & configuration (PG 18, extensions, pg_cron pre-load, TLS)
- `docs/adr/ADR-020-memory-subsystem.md` — nine architectural decisions (binding spec)
- `docs/adr/ADR-060-system-postgres-18-connect-only.md` — connect-only PostgreSQL 18 amendment (pins PG 18 / AGE 1.7.0 / pgvector 0.8.2 / pg_cron 1.6)
- `docs/adr/ADR-CMP-005-acon-strategy-parameter.md` — opt-in `strategy=` parameter on ACON `compress()` (supplements ADR-020; default behaviour preserved)
