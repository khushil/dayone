---
name: google-style
description: Check (or fix) the codebase against the Google TypeScript Style Guide. Runs ESLint + Stylelint + tsc and summarizes findings. Use when the user asks to check coding standards, run the style sweep, or "/google-style". Pass "--fix" to auto-apply fixes.
---

# Google style sweep

Enforce the Google TypeScript Style Guide across DayONE. The rules are encoded in `eslint.config.mjs` (ESLint 9 flat config) with formatting owned by Prettier; CSS is checked by Stylelint. See `docs/CODING_STANDARDS.md` for what is mechanically enforced vs guide convention, and the two documented deviations.

## Steps

1. If the user passed `--fix`, run the auto-fixer first:
   ```bash
   npm run fix
   ```
2. Run the full, non-mutating sweep and capture all output:
   ```bash
   npm run lint        # ESLint + Stylelint
   npm run typecheck   # tsc --noEmit (node + web)
   npm run format:check
   ```
3. Summarize for the user:
   - A PASS/FAIL line per tool.
   - Each remaining violation as `path:line — message — rule`.
   - If `--fix` was used, note which files were auto-fixed.
4. If violations remain that the fixer could not resolve, list them with the specific Google rule and a one-line suggestion, but do not edit files unless the user asked you to fix them.

Keep the report tight. The goal is a green `npm run lint && npm run typecheck && npm run format:check`.
