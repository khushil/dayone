---
name: mle-seed-evolve
description: 'Living Seeds — discover, plant, and evolve project-aware seed recommendations powered by ADR-022.'
type: flexible
archetype: methodology-cli-orchestrating
priority: high
maturity: L2
keywords:
  - 'seed'
  - 'living seed'
  - 'seed evolve'
  - 'plant seed'
  - 'discover seeds'
  - 'mle seed'
intent_patterns:
  - "(plant|discover|evolve|update)\\s+(a\\s+)?seed"
  - "living\\s+seed"
---

# MLE Seed Evolve

Living Seeds is MLE's project-aware seed evolution subsystem. Per ADR-022,
each project gains a per-project seed pool (`.mle/seed-pool.yaml`) that
records every planting, fitness score, and per-project override. `mle evolve`
recommends seeds when project signals warrant. Distillation closes the loop
back to the seed-bed.

## When to use

- After `mle init` — to discover which seeds the seed-bed offers and which apply at your maturity level
- When `mle evolve` surfaces a `## Seed Recommendations` section — to plant the recommended seed
- After a planted seed lands a successful PR — fitness scores update automatically via the watcher
- When you want to debug recommendations — `mle seed pool show` displays effective rules
- When you want to override per-project — `mle seed pool override SEED key=value`
- When 3+ projects converge on similar customisations — `mle seed distill SEED_NAME`

## Workflow

1. **Run `mle evolve`** — combined report shows maturity progression + seed recommendations
2. **Plant a recommended seed**: `mle seed plant SEED_NAME` — automatically registered in the pool
3. **Customise per-project**: `mle seed pool override SEED_NAME key=value` or `--suppress`
4. **Inspect the pool**: `mle seed pool show` — Rich-rendered table of effective state
5. **Watcher (optional)**: `mle watcher start` — passive evaluation every 600s + auto-fitness on PR merge
6. **Distillation (advanced)**: `mle seed distill SEED_NAME` — propose generalised variants upstream when 3+ projects converge

## Architectural contract (ADR-022)

- **Pool is private by default**: `.mle/seed-pool.yaml` stays in the project repo. Cross-project sharing requires explicit opt-in via `[seeds].share_pool = true`
- **Backward compatible**: existing seeds without `signals_match` are never auto-suggested (invariant 1); `mle evolve --skip-seeds` reproduces v0 byte-identically (invariant 3)
- **Daemon-survival guards**: every watcher callback wraps its body in defensive try/except per `error-handling-guidelines.md`
- **Atomic writes**: pool updates use `flock` + tmp+fsync+rename (R3 mitigation)
- **Pluggable components**: `FitnessSignal` and `Distiller` Protocols configurable via `~/.mle/config.toml`

## Specific Techniques

These techniques sharpen the six-step workflow when the seed pool drifts
or the fitness signal looks suspect:

| Technique                                                                              | When to apply                                                | Mechanical signal                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Always route pool writes through `mle seed pool override`                              | Customising a seed per-project                               | Atomic-write + flock invariants hold by construction; direct YAML edits skip them                     |
| Pin the fitness signal explicitly via `[seeds].fitness_signal = "pr_merged"`           | Cross-machine reproducibility (CI, multi-developer projects) | The signal vocabulary is closed in v1; an unrecognised name in the config raises at load              |
| Run `mle seed pool show --skill` and inspect `effective_state`                         | Debugging why a recommendation did or did not fire           | The JSON envelope surfaces planting count, last fitness score, and per-project overrides              |
| Use `mle seed distill --dry-run SEED_NAME` before live distillation                    | Three or more projects converge on similar customisations    | Dry-run enumerates the generalisation candidates without writing to the upstream seed-bed             |
| Cross-check `health_status` from `mle doctor` against the pool's atomic-write counters | Suspect daemon crash mid-write                               | The doctor check is tri-state (GREEN / AMBER / RED); a counter mismatch raises AMBER                  |
| Capture seed-pool diffs across runs via `git diff .mle/seed-pool.yaml`                 | Auditing operator overrides between sprints                  | The repo-resident pool YAML provides a ready audit trail; cross-project diffs require explicit opt-in |

## Common Rationalizations

| The agent thinks…                                                                                                         | Actually…                                                                                                                                                                                                                                   | Gate                            |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| "I'll edit `.mle/seed-pool.yaml` directly — it is faster than calling `mle seed pool override` and the schema is simple." | Direct YAML edits skip the atomic-write protection (`flock` + tmp+fsync+rename, R3 mitigation). A concurrent watcher tick can interleave and produce a corrupt pool. The override CLI is the only safe writer.                              | `wi-validator:rubric-threshold` |
| "Cross-project pool aggregation would be useful here — I'll flip `share_pool = true` on this project for one run."        | `share_pool` defaults to `false` for a reason (privacy invariant 5). One-run flips become defaults; the opt-in lives in `~/.mle/config.toml` and stays there until removed. Explicit ADR-022 opt-in is the only correct path.               | `wi-validator:rubric-threshold` |
| "The fitness signal name is new — I'll add it to the registry as I go."                                                   | The signal vocabulary is closed in v1 (invariant 6 — schema is forward-only but the closed-set members are not extended without an ADR). Adding signals mid-run breaks backward compatibility for older MLE versions reading the same pool. | `wi-validator:rubric-threshold` |

## Red Flags

- `.mle/seed-pool.yaml` modified time advances without a matching `mle seed pool override` invocation in the operator's shell history — direct YAML edit; atomic-write protection skipped.
- A fitness score is reported for a planting but the associated signal name is absent from the closed-set vocabulary — registry drift; older MLE versions will refuse to load the pool.
- Pool aggregator returns non-empty results when `[seeds].share_pool = false` is the canonical default — privacy invariant 5 breached; another project's pool leaked in.
- `mle seed distill` invoked while `[seeds] enabled = false` — the call produces output even though distillation is dormant in that configuration; configuration desync.
- `mle doctor` reports the seeds subsystem RED but `mle seed pool show` exits 0 — the doctor probe is more conservative than the show command; trust the RED status.

## Verification

```bash
# Confirm the per-project pool exists and the show command emits a structured envelope.
test -f .mle/seed-pool.yaml && echo "pool present"

mle seed pool show --skill > /tmp/pool.json
cat /tmp/pool.json | python3 -m json.tool

# Dry-run a distillation candidate enumeration.
mle seed distill --dry-run > /tmp/distill.json
echo "exit=$?"   # expected: 0

# Confirm ADR-022 appendix pins resolve via the memory verify probe.
mle memory verify | grep -E "seeds|ADR-022"
```

Observable evidence:

- `.mle/seed-pool.yaml` is present in the project repo (per ADR-022 invariant 1 — pool is project-local).
- `/tmp/pool.json` carries a top-level `seeds` array; every entry has `name`, `planting_count`, and `fitness_score` fields (or `null` for never-fitness-evaluated plantings).
- `/tmp/distill.json` enumerates distillation candidates only when 3 or more projects converge on similar customisations; otherwise the array is empty.
- `mle doctor` reports the seeds subsystem GREEN when the pool is current; AMBER on counter mismatch; RED on schema drift.

## Configuration (`~/.mle/config.toml`)

```toml
[seeds]
share_pool = false                  # Cross-project pool aggregation (R1)
fitness_signal = "pr_merged"        # or "user_confirm"
distiller = "mechanical"            # or "llm"  (LLM stub in v1)
suppression_threshold = 2           # Consecutive low-fitness plantings → suppress
distill_min_projects = 3            # Min projects before distillation triggers
watcher_cadence_seconds = 600       # Passive evaluation cadence
recommendations_cap_per_run = 5     # mle evolve recommendation cap per run
pool_max_plantings_per_seed = 50    # Archive threshold (R10)
```

## See also

- `docs/adr/ADR-022-living-seeds.md` — architecture, decisions D1-D12, invariants 1-10, risks R1-R12
- `docs/adr/ADR-022-appendix-pins.yaml` — machine-readable thresholds + protocol slots
- `docs/seeds/living-seeds.md` — full operator guide
- `mle evolve --help`, `mle seed pool show --help`, `mle seed distill --help`
