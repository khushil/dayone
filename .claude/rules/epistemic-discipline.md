# Epistemic Discipline

**Path scope**: `**`

This rule loads the sustained-interrogation discipline into every session. The five paragraphs ED-1..ED-5 below are lifted verbatim from `docs/adr/ADR-050-plan-epistemic-discipline.md` (the doctrine anchor). When the discipline triggers, it surfaces assumptions before execution and grounds termination in observable convergence rather than iteration counts.

### ED-1 — Trigger surface (plan-mode authoring + forge sub-agent fan-out)

The discipline activates at two surfaces only. Surface one: any plan-mode authoring session writing to a `.claude/plans/*.md` file or producing an ADO work-item body via `mle wi author`. Surface two: any forge that opts in via its `<parameters>` block declaring `sustained_interrogation_required = true`. Outside these two surfaces the discipline does not load — it is opt-in by surface, not always-on.

Rationale: assumption-surfacing has cost; mandatory invocation on every Edit/Write would tax low-leverage edits (typo fixes, doc tweaks) without justification. The two named surfaces are where premature commitment carries the highest cost — plan-mode is the upstream authoring step that every downstream Story inherits, and forge fan-out is the multi-agent dispatch point where a single weak assumption cascades.

### ED-2 — Convergence-driven termination, not iteration-counted

The challenger has no hard recursion cap. Termination is driven by eight observable convergence criteria (enumerated below); the run terminates when all eight are satisfied OR when the operator explicitly opts out via env var. Iteration counts are recorded in telemetry but never gate termination.

Rationale: iteration caps invent arbitrary thresholds that operators cannot defend at review time. A convergence contract grounds termination in observable evidence — when each criterion has a recorded answer in the findings file, the discipline has done its job regardless of how many rounds were needed.

### ED-3 — Two-stage rollout (WARN default → ABORT after stability window)

The gate `sustained-interrogation:findings-exist` ships in `gate_mode = "warn"` default. A 30-day stability window observes false-positive rate, operator opt-out rate, and findings-quality signal. After the window, the gate transitions to `gate_mode = "abort"` via a config flip (`[sustained_interrogation] gate_mode = "abort"` in `~/.mle/config.toml` per ADR-046 D3 precedence). The transition is operator-driven, not auto-promoted — the 30-day window is a _minimum_ observation period, not a deadline.

Rationale: in-flight forges authored before F13 lands would face abort-storms on day one if the gate shipped in ABORT mode. WARN mode lets the discipline accumulate calibration data without breaking running workflows. The two-stage rollout matches the pattern documented in `ADR-046 §"gate-mode default"` for high-leverage mechanical gates.

### ED-4 — Env-var opt-out (`SUSTAINED_INTERROGATION_OPT_OUT=1`), not a `--force` flag

The discipline ships with one documented opt-out: the environment variable `SUSTAINED_INTERROGATION_OPT_OUT=1`. When set, the gate logs the opt-out and skips the findings-exist check. The opt-out is **not** a `--force` flag per the bypass-flag discipline — the env-var form forces operators to authorise the opt-out at session scope rather than per-command, and the gate body surfaces the opt-out in failure messages so the discipline is discoverable.

Rationale: a per-command `--force` flag trains agents to attach the bypass reflexively. An env-var opt-out at session scope makes the bypass visible to the operator and audit-loggable; the operator must consciously set it and unset it.

### ED-5 — MLE-native attribution; no external skill-library references

The discipline is authored in MLE-native voice. References to external skill libraries that inspired the design pattern are forbidden in all artefacts produced under this doctrine. The discipline stands on its own merits as MLE policy.

Rationale: external library names rot — projects move, repositories disappear, attribution becomes a dangling pointer. MLE-native phrasing is durable.

## Convergence-criteria contract — eight named criteria

The challenger run terminates when ALL eight criteria are satisfied. Each criterion is observable; the findings file records the answer per criterion.

1. Every assumption with confidence below "High" has been named in the findings file and labelled with a calibration tag (`assumed`, `inferred`, `verified`, `refuted`).
2. Every claim that depends on external state (file existence, ADO state, command output) has been verified by reading the source rather than inferring from prior context.
3. Every alternative interpretation of the brief has been surfaced (at least two for any ambiguous ask); the chosen interpretation is named in the findings file with the rationale for choosing it.
4. Every reversible decision is tagged with its reversal cost (`cheap`, `moderate`, `expensive`) and the consequence of reversal.
5. Every gate that downstream work depends on has been verified to exist and to be in the expected state (registered, enforced, in WARN/ABORT mode as configured).
6. Every falsifiable claim in the plan has at least one falsifier recorded — a command, query, or inspection whose output would refute the claim if it were wrong.
7. The findings file contains no `TBD`, `<placeholder>`, or weak-verb success criteria ("make it work", "tidy up"); all are resolved or escalated.
8. The operator has been given a single yes/no decision question or a small set of named options when ambiguity exceeds the agent's authority; the question is not deferred ("I will figure it out as I go").

## See Also

- `docs/adr/ADR-050-plan-epistemic-discipline.md` — authoritative doctrine source (the verbatim ED paragraphs are lifted from this ADR)
- `goal-structure.md` — sibling discipline landing per-step verification (composes at the planning boundary)
- `code-standards.md` — type and architecture rules
- `review-standards.md` — Review Checklist row for plan structure
