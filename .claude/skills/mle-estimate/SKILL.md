---
name: mle-estimate
description: 'Lightweight estimation for DayONE stories — relative effort/complexity sizing with named risks and unknowns, no heavyweight story-point ceremony.'
---

# Estimation

Size user stories by **relative effort and complexity**, surfacing the risks and unknowns
that actually move the number. The output guides sequencing and flags work to split or
spike — it is not a commitment ritual.

## When to use

- After requirements exist (see `/mle-req`) and before design or scheduling.
- The user says "estimate", "size the stories", "how big is this", or "/mle-estimate".
- When deciding what to tackle next or whether a story needs splitting first.

## Method

1. **Read each story and its acceptance criteria.** Estimate the whole story including
   tests (Vitest + any Cucumber scenarios), not just the happy path.
2. **Assign a relative size** on a coarse scale — **XS / S / M / L / XL** (or a Fibonacci
   1/2/3/5/8 if the team prefers). Sizes are comparative, not hours. Anything ≥ L is a
   candidate to split.
3. **Score the complexity drivers** that justify the size:
   - _Technical_ — touches Electron main/IPC, security hardening, or `echarts` rendering?
   - _Domain_ — new `lib/` pure-function maths (returns, ranges, edge cases)?
   - _Contract_ — new or changed Zod schema in `src/shared` crossing process boundaries?
   - _Surface_ — new React component, Zustand store change, accessibility/colourblind mode?
4. **Name risks and unknowns explicitly** — non-finite/≤0 guards, frozen-fixture impact,
   offline-only constraint, cross-platform (Windows + macOS) behaviour. Each unknown that
   could change the size by a level becomes a one-line note.
5. **Recommend splits or spikes** — if a story is XL or carries an unresolved unknown,
   propose the smaller stories or a timeboxed spike to retire the risk first.

## Quality bar

- Every size is justified by at least one named complexity driver — never a bare number.
- Sizes are internally consistent: two comparable stories get comparable sizes.
- Risks/unknowns are concrete and checkable, not "might be tricky".
- Confidence is stated qualitatively (high/medium/low), and low confidence names _why_.

## Red flags

- A single L/XL story that bundles several deliverables — split before sizing.
- An estimate with no risks listed on work touching IPC, security, or new `lib/` maths.
- Sizes that ignore test effort — test-first is the norm here, so tests are in scope.
- "Medium" used as a default dumping ground for everything unexamined.

## Verify

- Each story has a size, its driving factors, and any risks in one or two lines.
- Stories flagged for splitting have concrete smaller stories proposed.
- A reader can sequence the backlog from the sizes and risks without re-deriving them.
