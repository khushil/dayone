# Prompt Engineering

**Path scope**: `prompts/**`

## Prompt Structure

Every implementation prompt MUST include these XML sections in order:

| Section                         | Purpose                                              | Required |
| ------------------------------- | ---------------------------------------------------- | -------- |
| `<context>`                     | Project, role, objective, language                   | Yes      |
| `<foundational_principles>`     | Numbered guiding principles                          | Yes      |
| `<context_compaction_survival>` | Work directory, progress schema, resumption protocol | Yes      |
| `<methodology>`                 | Numbered phases with exact steps                     | Yes      |
| `<output_specifications>`       | Files to create/modify, function signatures          | Yes      |
| `<critical_reminders>`          | Numbered must-not-forget items                       | Yes      |
| `<begin>`                       | Check for progress, then start                       | Yes      |

## Progress Tracking

- Every prompt must define a `.work/` directory for state tracking
- A `progress.yaml` file must be updated after every phase
- The `next_action` field must be specific enough for cold resumption
- Example: "Phase 3 step 3.2 — add \_format_precommit_yaml() after line 245"

## Verification Requirements

- Every implementation prompt must include verification commands:
  - `python3 -m py_compile <file>` for syntax
  - `ruff check <file>` for style
  - `pytest <test_file> -v` for test execution
- Verification commands must be runnable as-is (full paths, correct working directory)

## Language and Naming

- British English in all user-facing text ("authorisation" not "authorization")
- Prompt file names: `SDLC-NNx-verb-noun.md` (e.g. `SDLC-00d-implement-setup-script.md`)
- Forge file names: `SDLC-FORGE-N-short-name.md`

## DON'Ts

- Don't write prompts without a `<begin>` section that checks for existing progress
- Don't omit verification commands — every prompt must prove its output works
- Don't use vague next_action ("continue work") — be specific ("create api-design.md")
- Don't exceed 60 lines in a single methodology step — break into sub-steps
