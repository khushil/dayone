# Epistemic Discipline

**Path scope**: `**`

Before committing to a non-trivial plan or fanning out subagents, surface assumptions
and ground termination in observable convergence rather than iteration counts. The
invokable companion is the `/mle-sustained-interrogation` skill.

## When it applies

Plan authoring for a non-trivial change, and any multi-subagent fan-out — the points
where a single weak assumption cascades. Skip it for typo fixes and doc tweaks.

## Convergence criteria — terminate when ALL hold

1. Every assumption below "high" confidence is named and tagged (`assumed`,
   `inferred`, `verified`, `refuted`).
2. Every claim that depends on external state (file / command / API output) is verified
   by reading the source, not inferred from prior context.
3. Every alternative interpretation of an ambiguous brief is surfaced (≥ 2); the chosen
   one is named with its rationale.
4. Every reversible decision is tagged with its reversal cost (`cheap` / `moderate` /
   `expensive`) and the consequence of reversing it.
5. Every falsifiable claim has a recorded falsifier — a command, query, or inspection
   whose output would refute it if wrong.
6. No `TBD` / placeholder / weak-verb success criteria ("make it work", "tidy up")
   remain — all are resolved or escalated.
7. Where ambiguity exceeds the agent's authority, the operator has been given a single
   yes/no question or a small set of named options — not a deferred "I'll figure it out".

## See also

- `goal-structure.md`, `review-standards.md`, `.claude/skills/mle-sustained-interrogation`
