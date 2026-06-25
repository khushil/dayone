---
name: mle-evolve
description: 'Detect maturity progression and propose targeted configuration upgrades.'
type: flexible
archetype: methodology-cli-orchestrating
priority: medium
maturity: L2
keywords:
  - 'maturity'
  - 'evolve'
  - 'level up'
  - 'upgrade maturity'
  - 'mle evolve'
intent_patterns:
  - "(evolve|upgrade|advance)\\s+(the\\s+)?(project\\s+)?maturity"
  - "(level\\s+up|move\\s+to)\\s+L[1-5]"
---

# MLE Evolve

Detect codebase maturity progression and apply incremental configuration upgrades.
Compares the current codebase state against a stored baseline to identify what changed,
whether maturity level increased, and what new capabilities should be installed.

## When to Use

- After a substantive landing (new tests, CI configuration, ADRs) that may shift maturity bands per `suggest_maturity()`
- Quarterly review of `.mle/evolution-baseline.yaml` to catch drift between captured maturity and on-disk reality
- When a developer reports new capabilities are unavailable that the project should have at its current maturity tier
- When `.quintgov/` is added to a previously L4 project and the operator wants the L5 scaffold installed
- Before announcing a release whose changelog claims a maturity-level shift (verify the upgrade has been recorded)

## Workflow

1. **Load baseline**: Read previous InvestigationResult from `.mle/evolution-baseline.yaml`
2. **Investigate**: Run `mle investigate` (or call `investigate_codebase()`) for current snapshot
3. **First-time check**: If no baseline exists, save current state as baseline, report maturity level, and exit
4. **Compute diff**: Call `compute_investigation_diff(previous, current)` to produce EvolutionProposal
5. **Assess maturity**: Compare `suggest_maturity()` results between baseline and current
6. **No change check**: If no meaningful changes and no maturity change, update baseline and exit
7. **Compute delta**: If maturity increased, compute ConfigurationDelta via agent registry
8. **Present proposal**: Display structured change set -- maturity transition, new features, skills to install, scaffold operations. Require explicit developer confirmation
9. **Apply evolution**: Install new skills, update agent.md, log scaffold recommendations. Never remove existing capabilities
10. **Save state**: Write current investigation to baseline, append to evolution log, commit changes

## Specific Techniques

| Situation                                                     | Technique                                                                                                                                                                                | Reference                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Operator unsure whether evolve will modify the project        | Run `mle evolve --dry-run` first; the output lists every scaffold operation that would occur (skills installed, rules added, hooks registered)                                           | `cli/evolve_cmd.py`                             |
| Maturity heuristic produces an unexpected band                | Inspect `mle investigate --skill` output; the eight dimensions feeding `suggest_maturity()` are explicit and can be cross-checked against `core/init.py` thresholds                      | `core/investigation.py::investigate_codebase()` |
| Proposed upgrade requires a feature the project lacks         | The agent registry refuses an L5 upgrade without `.quintgov/` and an L3 upgrade without 50+ commits; surface the missing precondition rather than silently advancing                     | `core/evolve.py::compute_configuration_delta()` |
| Evolution log is needed for an ADR or post-incident review    | Read `.mle/evolution-log.yaml`; each entry carries a timestamp, the maturity transition, and the InvestigationResult diff                                                                | `core/evolve.py::append_evolution_log()`        |
| Two consecutive invocations produce different recommendations | Recompute the diff with `mle evolve --dry-run --no-baseline` against a clean baseline; a true divergence points to non-deterministic codebase scanning rather than to evolve itself      | `core/investigation.py`                         |
| Operator needs to roll back a recent evolution                | The baseline preserves the pre-evolution state in `.mle/evolution-baseline.yaml.bak` (written before each apply); restore the .bak and rerun `mle init` against the prior maturity level | `core/evolve.py::apply_evolution()`             |

## Common Rationalizations

| The agent thinks…                                                                                     | Actually…                                                                                                                                                                                                                                                               | Gate                           | Corpus                         |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------ |
| "The codebase clearly merits L5 even though `.quintgov/` is missing — I'll override the precondition" | The L5 scaffold installs Quint pattern libraries, watcher plugins, and verification hooks that depend on `.quintgov/config.toml` existing. Skipping the precondition leaves the project in a half-installed state where `mle quintgov verify` raises FileNotFoundError. | wi-validator:rubric-threshold  | mle-evolve-rationalisation-001 |
| "I'll skip developer confirmation — auto-confirm is faster"                                           | The L3 to L4 transition installs four agents and edits the agent.md table of contents; a developer who has not seen the proposal cannot review the additions before the next task consumes them. `--auto-confirm` is intended for CI only.                              | branch-policy:wi-link-required | mle-evolve-rationalisation-002 |
| "Evolution is additive so I don't need a backup before applying"                                      | Evolve writes `.claude/skills/<name>/SKILL.md` files. If a previous scaffold sync produced a divergent copy, the new write overwrites the divergence silently. The `.bak` baseline is the only audit trail of the pre-evolve state.                                     | merge-check:pr-completed       | mle-evolve-rationalisation-003 |

## Red Flags

- Proposed upgrade level mismatches `suggest_maturity()` output for the same investigation snapshot
- L5 proposed but `ls .quintgov/config.toml` returns "No such file" — precondition violated
- `.claude/skills/` or `.claude/rules/` modified mid-evolve without a corresponding `.mle/evolution-baseline.yaml.bak` written first
- Two `mle evolve --dry-run` invocations within five minutes produce divergent proposals (indicates non-deterministic detection)
- Evolve reports "no change" but `mle investigate --skill | jq .maturity` reports a band different from `.mle/evolution-baseline.yaml::maturity`

## Verification

```bash
# Dry-run lists every scaffold operation that would occur.
mle evolve --dry-run --skill > /tmp/evolve-proposal.json
python3 -c "import json; d=json.load(open('/tmp/evolve-proposal.json')); print('current:', d.get('current_maturity'), 'proposed:', d.get('proposed_maturity'))"

# Baseline file exists and parses cleanly.
python3 -c "import yaml; b=yaml.safe_load(open('.mle/evolution-baseline.yaml')); print('baseline maturity:', b.get('maturity'))"

# Evolution log is append-only and chronologically ordered.
python3 -c "import yaml; log=yaml.safe_load(open('.mle/evolution-log.yaml')); [print(e['timestamp'], e['transition']) for e in log.get('entries',[])]"
```

Observable evidence:

- `.mle/evolution-baseline.yaml` exists after first invocation; subsequent invocations update its `maturity` field only when the band actually shifts
- Each apply-mode invocation appends exactly one entry to `.mle/evolution-log.yaml::entries[]` with a monotonic timestamp
- `git status .claude/` after `mle evolve --apply` shows only additions (new skills, new rules) and never deletions
- `.mle/evolution-baseline.yaml.bak` exists immediately after every apply-mode invocation

## Rules

- Evolution is strictly additive -- never removes existing capabilities
- Developer confirmation required before applying changes (step 8)
- Use `--auto-confirm` for CI mode (skip confirmation)
- Use `--dry-run` to see proposal without applying
- Partial failures are tolerated -- individual skill install failure does not abort evolution
- First-time run establishes baseline only (no changes applied)
- Baseline is stored at `.mle/evolution-baseline.yaml`
- Evolution log is appended to `.mle/evolution-log.yaml`
- If baseline is corrupt, treats as first-time run (re-establishes baseline)
