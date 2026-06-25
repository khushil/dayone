---
name: mle-refactor-module
description: 'Review TypeScript module size and cohesion — recommend safe decomposition with a named-export, import-rewire, and test-migration plan that keeps the process boundaries and tests green.'
keywords:
  - 'refactor module'
  - 'split module'
  - 'decompose'
  - 'module too big'
  - 'break up module'
intent_patterns:
  - "(split|decompose|refactor|break up)\\s+(this\\s+)?(module|file|component)"
  - "(module|file|component)\\s+(is\\s+)?(too\\s+)?(big|large|long)"
---

# Refactor Module

Analyse a TypeScript/React module for size, cohesion, and coupling, then produce
a safe decomposition plan with import rewiring and test migration. Report only —
the developer executes the split. Behaviour must not change: tests pass before
and after.

## When to Use

- When a file exceeds ~300 lines or exposes more than ~10 public names.
- When the user says "this file is too big", "split this module", or "/mle-refactor-module".
- Before adding features to an already large module or component.

## Workflow

1. **Measure** — count lines, exported functions/components, types, and imports.
   Use `scc <file>` for LOC and `rg -c "^export "` for the public surface.
2. **Analyse cohesion** — group symbols by shared state, shared imports, or
   thematic responsibility. Name the distinct responsibility groups.
3. **Map dependencies** — build the import graph: fan-in (who imports this,
   `rg -l "from '.*<module>'" src/`) and fan-out (what it imports).
4. **Identify seams** — a valid seam: symbols call each other internally but have
   few cross-group calls, the group has a distinct public API, and extraction
   creates no circular import and crosses no process boundary.
5. **Plan migration** — per split: new file path, named-export list, every import
   rewrite (source + co-located tests), and a `git checkout -- <file>` rollback.
6. **Report** — emit the output format below.

## Boundary & Style Constraints

- **Named exports only** in `src/**` — extracted modules export named symbols;
  never introduce a default export (config/entry files excepted).
- **Respect process boundaries** — `src/shared` imports only Zod; `lib/` stays
  pure (`@shared/types` + stdlib, no React/Electron/DOM/`window`); a split must
  not make a layer import inward-only code outward. See architecture-standards.
- **Co-located tests** — `*.test.ts(x)` move with the code they cover; update
  their imports in the same change.
- **Keep `interface` for object shapes, `type` for unions** when relocating types.

## Decomposition Criteria

| Metric                           | Threshold | Recommendation                          |
| -------------------------------- | --------- | --------------------------------------- |
| Lines of code                    | > 300     | RECOMMENDED                             |
| Public exports                   | > 10      | RECOMMENDED                             |
| Responsibility groups            | > 3       | RECOMMENDED                             |
| React component responsibilities | > 1       | RECOMMENDED (extract hook/subcomponent) |
| Import fan-in                    | > 15      | CAUTION — high risk                     |

If no metric exceeds its threshold, report that the module needs no decomposition.

## Output Format

```
## Refactor Module — {module}

### Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Lines  | n     | 300       | OK/OVER |
| Exports| n     | 10        | OK/OVER |
| Fan-in | n     | 15        | OK/CAUTION |

### Proposed Splits
1. **{new file}** — {responsibility}; exports: {named list}; ~{n} lines

### Import Migration
| File | Old import | New import |
|------|-----------|------------|

### Test Migration
| Test file | Change required |
|-----------|-----------------|

### Risk Assessment
- Overall: {LOW/MEDIUM/HIGH} — {explanation}; rollback: `git checkout -- {file}`
```

## Red Flags

- A proposed split introduces a default export in `src/**`.
- An extracted `lib/` module would import React, Electron, DOM, or `window`.
- Source is split but co-located test imports are left pointing at the old path.
- The "split" only moves lines around — no responsibility actually separates.

## Verification

```bash
npm run typecheck    # every new module resolves; no broken imports
npm run lint         # named-exports rule (import/no-default-export) stays green
npm run test         # behaviour unchanged — same suite passes before and after
scc src/<new-file>.ts # confirm each split landed under the size threshold
```

## Rules

- **Never split below ~80 lines** — don't extract a trivially small module.
- **Respect boundaries** — `shared`/`lib` purity and named-exports are non-negotiable.
- **Include rollback** — every split lists a `git checkout` command.
- **Preserve behaviour** — tests green before and after; this is the structural verifier.
- **British English** throughout ("analyse", "behaviour").
- **Report only** — produce the plan; the developer executes it.
