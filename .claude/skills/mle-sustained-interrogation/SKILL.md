---
name: mle-sustained-interrogation
description: 'Plan-mode epistemic-discipline methodology — surfaces assumptions, enumerates alternative interpretations, defines falsifiers, and verifies eight named convergence criteria before any execution commitment. Activates in plan-mode authoring and opt-in forge sub-agent fan-out only.'
type: flexible
archetype: methodology-pure
priority: high
maturity: L2
keywords:
  - 'sustained interrogation'
  - 'epistemic discipline'
  - 'surface assumptions'
  - 'challenge plan'
  - 'interrogate plan'
  - 'convergence criteria'
  - 'alternative interpretations'
  - 'falsifier'
  - 'no recursion cap'
  - 'plan-before-execution'
  - 'mle sustained-interrogation'
  - 'mle interrogate plan'
intent_patterns:
  - "(interrogate|challenge|sustain|stress.test)\\s+(my\\s+|the\\s+|this\\s+)?plan"
  - "(surface|state|name)\\s+(my\\s+|the\\s+)?assumptions"
  - "(am\\s+I|are\\s+we)\\s+(rushing|jumping|leaping)\\s+to\\s+(implementation|execution|coding)"
  - "(what\\s+could\\s+go\\s+wrong|what\\s+am\\s+I\\s+missing)\\s+(with|in)\\s+(this|my)\\s+plan"
  - '/mle-sustained-interrogation'
  - '/mle-interrogate'
gate_signatures_reviewed:
  sustained-interrogation:findings-exist: 0000000000000000000000000000000000000000000000000000000000000000
  wi-validator:rubric-threshold: 363408133ef87636565ac9abe14994338dd04175a4aa0261ea06142d23c8ba4a
  pre-commit:ruff: a69c0ad823034e11939a08d973adf4824cc55ac5a00aa65201f2ea17b6e6b0db
---

# Sustained Interrogation

Plan-mode methodology that walks the epistemic-discipline codified in `.claude/rules/epistemic-discipline.md` and `docs/adr/ADR-050-plan-epistemic-discipline.md`. Surfaces assumptions, enumerates alternative interpretations, defines falsifiers, and verifies the eight named convergence criteria before any execution commitment.

## When to Use

- **Plan-mode authoring**: when writing to a `.claude/plans/*.md` file or producing an ADO work-item body via `mle wi author` (per ED-1)
- **Opt-in forge fan-out**: when a forge declares `sustained_interrogation_required = true` in its `<parameters>` block (per ED-1)
- **Explicit invocation**: when the user says `/mle-sustained-interrogation`, `/mle-interrogate`, "interrogate my plan", "surface my assumptions", or asks "what am I missing?"
- **Self-triggered**: when you (the agent) notice you are committing to an interpretation without having surfaced alternatives, or accepting a brief whose verifier is unclear

This is a pre-execution skill — it does NOT run after the code is written. Post-implementation review is owned by `mle-pre-commit-review` and `mle-peer-code-review`. The complementary plan-shape skill is `mle-goal-structure` (per-step verification of _what_ is being built); this skill scopes _whether the plan's premises hold_.

## Workflow

### Step 1 — Trigger check

Confirm the discipline applies. The trigger surface is two-fold (per ED-1):

- Are you in plan-mode authoring (`.claude/plans/*.md` write OR `mle wi author` invocation)?
- Are you a forge sub-agent and the master forge's `<parameters>` declares `sustained_interrogation_required = true`?

If neither holds, the discipline does not load — exit early and proceed without the methodology. Document the exit in the workspace `.work/sustained-interrogation/<run-id>/findings.md` as `trigger: out-of-scope`.

If at least one holds, create the findings file under `.work/sustained-interrogation/<run-id>/findings.md` and proceed to Step 2.

### Step 2 — Brief restatement

Paraphrase the user's ask in your own words. The aim is to surface the assumed-but-unstated success criterion. If the paraphrase reads like the original brief, the rephrasing is doing no work — try again.

Record the original brief and the paraphrase in the findings file. Flag any weak verbs ("make it work", "fix it", "tidy up", "improve readability") for clarification in Step 4.

### Step 3 — Alternative interpretation surfacing

For any brief that admits multiple readings, enumerate at least two interpretations. List each interpretation with its scope, its likely cost, and the evidence (file path, command, prior conversation) that supports or refutes it. Do not pick silently.

If only one interpretation survives scrutiny, record that the brief is unambiguous and proceed. If two or more survive, the brief is ambiguous and the operator must resolve — surface the alternatives as a single decision question (see Convergence criterion 8).

Record each alternative in the findings file with the rationale for choosing or rejecting it.

### Step 4 — Assumption inventory

List every assumption the plan depends on. Tag each with a calibration label:

- `verified` — directly read the source (file, ADO state, command output) within this session
- `inferred` — followed from a verified fact via stated logic
- `assumed` — taken on trust; not directly checked
- `refuted` — known to be false (record the source of the refutation)

Every `assumed` claim that the plan depends on for correctness must be promoted to `verified` (read the source) or `refuted` (and the plan revised) before Step 7. `inferred` claims are acceptable if the inference logic is recorded.

Record the inventory in the findings file under an `## Assumptions` heading.

### Step 5 — Falsifier definition

For every falsifiable claim in the plan, name a falsifier — a command, query, or inspection whose output would refute the claim if it were wrong. Falsifiers are observable: `pytest reports FAIL`, `grep returns 0`, `ls reports missing file`, `mle wi show returns state != Active`.

A claim with no falsifier is not falsifiable — either it is tautological (record and skip) or it is too vague (return to Step 2). Tag tautological claims `untestable-by-design` so reviewers know the omission is deliberate.

Record falsifiers in the findings file alongside their claims.

### Step 6 — Gate dependency check

Enumerate every gate the plan's execution depends on. For each gate:

- Verify the gate is registered (look up in `src/mle/data/scaffold/gate-registry.json` or equivalent)
- Verify the gate is in the expected state (WARN vs ABORT vs disabled)
- Record the gate id, current state, expected state, and the consequence of state mismatch

If any gate is missing or in an unexpected state, surface as a Critical finding requiring operator resolution before execution.

### Step 7 — Convergence verification

Walk the eight convergence criteria from `.claude/rules/epistemic-discipline.md` § "Convergence-criteria contract". For each criterion, record the answer in the findings file:

1. Are all sub-High-confidence assumptions named and calibration-tagged? (per Step 4)
2. Are all external-state claims verified by direct read? (per Step 4)
3. Are alternative interpretations surfaced for ambiguous asks? (per Step 3)
4. Are reversible decisions tagged with reversal cost? (record `cheap`, `moderate`, `expensive`)
5. Are downstream gates verified to exist and be in the expected state? (per Step 6)
6. Are falsifiers recorded for every falsifiable claim? (per Step 5)
7. Are weak-verb success criteria resolved or escalated? (per Step 2)
8. Is the operator given a clear yes/no or named-options decision when ambiguity exceeds the agent's authority? (per Step 3)

The run terminates when ALL eight criteria are answered. There is no recursion cap (per ED-2) — iteration counts are recorded in telemetry via `emit_sustained_interrogation()` but never gate termination.

### Step 8 — Findings file persistence

Persist the findings file at `.work/sustained-interrogation/<run-id>/findings.md` per the audit-trail discipline (Bug #2855 `.work/` cadence). The `<run-id>` is the timestamp `$(date -u +%Y-%m-%dT%H-%M-%SZ)` or, if resuming, the prior run id.

The findings file is the gate-input for `sustained-interrogation:findings-exist` (per ED-3) — its existence + non-empty body satisfies the gate's WARN-mode default. ABORT mode (after the 30-day stability window per ED-3) additionally requires all eight convergence criteria to be answered.

Commit the findings file via `mle sync` so it lands on `origin/main` with the work-item PR. Do not delete or rewrite history of the findings file — superseded findings are appended, not overwritten.

## Specific Techniques

| Situation                                         | Technique                                                                                                                                                                                                                              | Reference                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Brief is a one-liner ("fix the bug")              | Restate with the observable verifier substituted ("write a reproducing test that fails before the fix; the fix's verifier is the same test passing"); if the verifier cannot be substituted, the brief is ambiguous — return to Step 3 | `.claude/rules/goal-structure.md` Bug-Fix Variant                             |
| Multiple work items reference the same plan       | List the brief paraphrase per work item in Step 2; verify scope boundaries in Step 3 (each interpretation maps to one work item)                                                                                                       | `.claude/rules/work-item-standards.md`                                        |
| ADO state claim ("Story #N is Closed")            | Verify via `mle wi show N --format json                                                                                                                                                                                                | jq -r .state` in Step 4; never trust prior conversation context for ADO state | `.claude/rules/work-item-standards.md` |
| Gate state claim ("the WARN gate is registered")  | Verify via `grep <gate-id> src/mle/data/scaffold/gate-registry.json` in Step 6; never trust prior memory for gate state                                                                                                                | `.claude/rules/forge-execution.md`                                            |
| Weak verb in the brief that resists clarification | Surface as Convergence criterion 8 decision question for the operator; never paper over with a silent default                                                                                                                          | `.claude/rules/epistemic-discipline.md` ED-4                                  |

## Common Rationalizations

| The agent thinks…                                                              | Actually…                                                                                                                                                                                                                                                                             | Gate                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| "The brief is clear; I do not need to surface assumptions for a small change"  | "Clear" is a self-report, not a verifier. The discipline activates by surface (plan-mode + opt-in forge), not by perceived clarity. If the trigger surface holds, the methodology runs; the eight criteria scale with complexity but the convergence contract does not.               | `sustained-interrogation:findings-exist` |
| "I can pick one interpretation silently; the user can correct me if I'm wrong" | Silent interpretation transfers the cost of being wrong to the user (re-work, re-review, re-explain). Surfacing alternatives in Step 3 transfers the choice to the user before any cost is incurred. The cost of surfacing is two minutes; the cost of silent error is hours.         | `wi-validator:rubric-threshold`          |
| "The findings file is overhead for a one-PR change"                            | The findings file IS the audit trail. A one-PR change without findings cannot be reviewed against the discipline; future audits cannot verify the discipline ran. Bug #2855 codifies `.work/` content as a deliverable — the cost is one `mle sync`, the benefit is durable evidence. | `sustained-interrogation:findings-exist` |
| "I can verify the assumption later — let me start coding first"                | "Later" is a deferred decision. Step 4's discipline requires verification before Step 7's convergence check; deferring verification breaks the convergence contract. If the assumption matters, verify now; if it does not matter, do not list it.                                    | `pre-commit:ruff`                        |
| "I'll skip the gate dependency check — the gates always work"                  | The gates ARE the safety mechanism. Step 6's discipline catches the case where a gate is registered but in the wrong mode (e.g. ABORT when WARN was expected, or disabled when enforcement was assumed). The gates are observable; observing them is the discipline.                  | `sustained-interrogation:findings-exist` |

## Red Flags

- Beginning Step 4 (assumption inventory) without having completed Step 3 (alternative interpretation)
- An assumption tagged `verified` with no source citation in the findings file
- A claim listed in the plan with no matching falsifier in the findings file
- A `weak verb` (per Step 2) accepted as the success criterion with no Convergence criterion 8 decision question raised
- The findings file is empty or contains only the trigger-check line
- Convergence verification (Step 7) reports any of the eight criteria with answer "to be done later" or "not applicable" without a recorded rationale
- The agent invokes this skill but never invokes `mle sync` to persist the findings file

## Verification

```bash
# Findings file exists per run id
RUN_ID=$(date -u +%Y-%m-%dT%H-%M-%SZ)
test -f .work/sustained-interrogation/${RUN_ID}/findings.md
# Expected: exit 0

# Eight convergence criteria each have a recorded answer
grep -cE '^- \*\*Criterion [1-8]:\*\*' .work/sustained-interrogation/${RUN_ID}/findings.md
# Expected: 8

# Zero un-verified assumptions remain
grep -cE '^- .* \[assumed\]' .work/sustained-interrogation/${RUN_ID}/findings.md
# Expected: 0 (all promoted to verified or refuted; inferred is acceptable)

# Every falsifier is observable (test/command/grep/inspection — not "looks right")
grep -E 'falsifier:.*(pytest|grep|test|mle |ls |az |jq)' .work/sustained-interrogation/${RUN_ID}/findings.md
# Expected: at least one match per falsifiable claim
```

Observable evidence of skill success:

- Findings file exists at `.work/sustained-interrogation/<run-id>/findings.md` and is committed to the workspace's git history
- Eight convergence criteria each carry a recorded answer (not "later" / "not applicable" / "to be decided")
- Zero `assumed` tags remain on assumptions the plan depends on for correctness
- Every falsifiable claim has a matching falsifier whose form is `test`, `command`, `grep`, or `inspection`
- The gate `sustained-interrogation:findings-exist` reads the findings file and emits PASS (WARN mode) or proceeds (ABORT mode)

## Rules

- **Trigger by surface, not by perceived complexity** — the methodology activates in plan-mode authoring or opt-in forge fan-out regardless of how simple the brief appears
- **No recursion cap** — termination is convergence-driven (eight criteria), never iteration-counted; iteration counts go to telemetry only (per ED-2)
- **Findings file is the audit trail** — every run persists `.work/sustained-interrogation/<run-id>/findings.md`; superseded findings are appended, never overwritten
- **Silent interpretation is forbidden** — when the brief admits multiple readings, the agent enumerates at least two and surfaces the decision (per Convergence criterion 3 + 8)
- **Verify before convergence** — every `assumed` tag the plan depends on must be promoted to `verified` (read the source) or `refuted` (and plan revised) before Step 7
- **British English** — use British English in all findings text (e.g. "behaviour", "recognise", "analyse")
- **MLE-native attribution** — no external skill-library references in the findings file (per ED-5)
- **Opt-out is env-var only** — `SUSTAINED_INTERROGATION_OPT_OUT=1` is the documented bypass; never `--force` (per ED-4)
- **Eight criteria is the contract** — the agent records an answer for each numbered criterion; "not applicable" is acceptable only with a documented rationale
- **No iteration cap in the workflow** — Steps 2 to 7 may loop; only Convergence verification (Step 7) terminates the loop
