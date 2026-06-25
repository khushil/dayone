# Review Standards

**Path scope**: `**`

## Pull Request Size

- Maximum: **500 lines changed** (excluding auto-generated files, lock files, snapshots)
- If a PR exceeds 500 lines, split into stacked PRs with clear dependency order
- Generated files (migrations, lock files) do not count towards the limit

## Review Checklist

Every reviewer must verify:

| Check                 | Description                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests present         | New logic has corresponding test coverage                                                                                                                        |
| Tests pass            | CI pipeline is green; no skipped tests without justification                                                                                                     |
| No secrets            | No hardcoded tokens, passwords, or API keys                                                                                                                      |
| Backward compatible   | Existing APIs not broken without migration path                                                                                                                  |
| Conventional commits  | All commits follow `type(scope): description` format                                                                                                             |
| Documentation updated | Changed APIs have updated docstrings; README if needed                                                                                                           |
| No TODOs              | No `TODO`, `FIXME`, or `HACK` comments without linked issue                                                                                                      |
| Goal structure        | Plan follows `.claude/rules/goal-structure.md` — per-step verifiers present; bug fixes lead with a reproducing test; refactors record before/after test evidence |

## Approval Criteria

- Minimum 1 approving review required before merge
- Creator can approve their own PR (for solo development phases)
- All review comments must be resolved before merge
- CI must pass — no overriding failed checks

## Breaking Changes

- Breaking changes require explicit documentation in the PR description
- Use `BREAKING CHANGE:` footer in the commit message per conventional commits spec
- Provide migration guidance for any changed public API signatures

## See Also

- `.claude/rules/goal-structure.md` — per-step verification discipline; the Review Checklist Goal-structure row evaluates against this rule
