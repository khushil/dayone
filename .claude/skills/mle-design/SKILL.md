---
name: mle-design
description: 'Design for DayONE features — author MADR ADRs, sketch the component architecture, define the IPC/API contract as Zod schemas in src/shared, and run a lightweight STRIDE threat model, respecting the main/preload/shared/renderer/lib boundaries.'
---

# Design

Turn validated requirements into design artefacts: **ADRs** (MADR format), an
**architecture/component sketch**, the **IPC/API contract as Zod schemas**, and a
**lightweight threat model**. Design must respect DayONE's process boundaries and land
before implementation.

## When to use

- After requirements exist and pass INVEST (see `/mle-req`).
- The user says "create an ADR", "design the API/IPC", "threat model", "review the
  design", or "/mle-design".
- Before implementation — significant decisions are recorded first.

## Process boundaries (dependencies flow inward)

`src/shared` (Zod only) ← `src/main` (Electron, Node) · `src/preload` (`contextBridge`) ·
`src/renderer/src` (React/Zustand) ← `src/renderer/src/lib` (**pure** domain logic).
Cross-process data is defined **once** as Zod schemas in `src/shared`; derive TS types with
`z.infer`. IPC results travel as a discriminated union (`{ ok: true; data } | { ok: false;
reason }`) so failures are data, not throws.

## Method

1. **Record decisions as ADRs.** For each significant choice (technology, contract,
   storage, security, or a change to an existing pattern) author a MADR file under
   `docs/adr/ADR-NNN-kebab-title.md` per `.claude/rules/adr-conventions.md`:
   **Context · Decision** (active voice, "We will…") **· Consequences** (positive _and_
   negative) **· Alternatives** (≥ 2, with why-rejected). New ADRs start `Proposed`; flip to
   `Accepted` only on PR merge. Supersede — never edit — an accepted ADR, and update
   `docs/adr/README.md`.
2. **Sketch the architecture.** Name the components and where each lives (main / preload /
   shared / renderer / lib) and how data flows: `data/sectors.json` → main loads & validates
   → IPC → renderer store → `lib/` computes → components render. Keep range-dependent maths
   in pure `lib/` functions that take an explicit `asOf`/anchor argument.
3. **Define the contract as Zod.** Write or extend the `src/shared` schemas for any new
   cross-process payload; express IPC results as the discriminated union above. State the
   `4xx/5xx`-equivalent failure `reason`s as named union members, not thrown errors.
4. **Threat model (STRIDE-lite).** For each new data flow walk Spoofing, Tampering,
   Repudiation, Information disclosure, Denial of service, Elevation of privilege. Each
   relevant row names a concrete **mitigation** tied to a control: `contextIsolation: true`,
   `nodeIntegration: false`, `sandbox: true`, CSP `connect-src 'none'`, minimal preload
   surface, Zod validation at the boundary, atomic temp+rename writes to `userData`.

## Quality bar & red flags

- ADRs have all four MADR sections and ≥ 2 real alternatives — not one strawman.
- No Zod schema lives outside `src/shared`; no parallel hand-maintained `interface`.
- Failure cases are modelled as union members, not exceptions.
- Every relevant STRIDE row cites a mitigation control, not just the category name.
- 🚩 An `Accepted` ADR with no merged PR; a superseded ADR still marked `Accepted` in the
  index; a contract change that bypasses `src/shared`; a network call anywhere in the app.

## Verify

- `ls docs/adr/` shows the new `ADR-NNN-*.md`; each has Context/Decision/Consequences/Alternatives.
- New/changed schemas compile: `npm run typecheck`; lint clean: `npm run lint`.
- The threat model has at least one mitigated row per new data flow.
- Hand the artefacts to `/mle-coverage` to confirm every requirement is addressed.
