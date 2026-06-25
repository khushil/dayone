# Living Seeds

**Path scope**: `**`

Living Seeds is MLE's project-aware seed evolution subsystem (ADR-022). Each
project gets a per-project seed pool at `.mle/seed-pool.yaml` that records
every planting, fitness score, and per-project override.

## Workflow

| Stage    | Command                                       | Effect                                             |
| -------- | --------------------------------------------- | -------------------------------------------------- |
| Discover | `mle evolve`                                  | Combined maturity + seed recommendations           |
| Plant    | `mle seed plant SEED_NAME`                    | Records planting in pool                           |
| Inspect  | `mle seed pool show`                          | Rich-rendered effective rules + history            |
| Override | `mle seed pool override SEED_NAME key=value`  | Per-project rule pin                               |
| Suppress | `mle seed pool override SEED_NAME --suppress` | Hide from recommendations                          |
| Distill  | `mle seed distill SEED_NAME`                  | Propose upstream variant when 3+ projects converge |
| Passive  | `mle watcher start`                           | 600s evaluation + auto-fitness on PR merge         |

## Pool schema

`.mle/seed-pool.yaml` (committed to project repo):

```yaml
version: 1
last_evaluated_at: '2026-05-07T12:00:00Z'
seeds:
  error-handling-audit:
    tracked: true
    plantings:
      - planting_id: <uuid4>
        seed_name: error-handling-audit
        params: { branch: feature/foo }
        planted_at: '2026-05-07T12:00:00Z'
        branch: feature/foo
        work_item_id: 1234
        pull_request_id: 5678
    fitness:
      - planting_id: <uuid4>
        score: 0.85
        recorded_at: '2026-05-07T13:00:00Z'
        signal: pr_merged
    suppression:
      suppressed: false
    overrides:
      default_fitness_threshold: 0.6
    plantings_archive_count: 0
```

## Backward-compat invariants

1. Existing `seed.yaml` files without `signals_match` keep working (never auto-suggested).
2. `mle seed plant` works without an existing `.mle/seed-pool.yaml` (lazy-create).
3. `mle evolve --skip-seeds` reproduces v0 behaviour byte-identically.
4. `EvolutionReport` is a strict superset of v0 (new `seed_recommendations` and `seed_actions_taken` fields).
5. `core/seeds.py` public APIs unchanged in signature.

## Configuration

`~/.mle/config.toml`:

```toml
[seeds]
share_pool = false                  # Cross-project pool aggregation (privacy)
fitness_signal = "pr_merged"        # or "user_confirm"
distiller = "mechanical"            # or "llm" (stub in v1)
suppression_threshold = 2
distill_min_projects = 3
watcher_cadence_seconds = 600
recommendations_cap_per_run = 5
pool_max_plantings_per_seed = 50
```

## DON'Ts

- Don't hand-edit `.mle/seed-pool.yaml` — use `mle seed pool override`
- Don't enable `share_pool` without considering the privacy implications
- Don't expect end-to-end recommendations until the seed-bed migration (ADR-022 / Feature 6) lands `signals_match` fields on the canonical seeds

## See also

- `docs/seeds/living-seeds.md` — full operator guide
- `docs/adr/ADR-022-living-seeds.md` — architecture
- `docs/adr/ADR-022-appendix-pins.yaml` — machine-readable thresholds
