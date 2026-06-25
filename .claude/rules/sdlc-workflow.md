# SDLC Workflow

**Path scope**: `src/**`, `tests/**`, `features/**`, `docs/adr/**`

DayONE's lifecycle is GitHub-native and test-first. Each phase has an invokable,
standalone skill (no `mle` CLI). Phases are advisory, not hard gates.

| #   | Phase          | Skill / agent                                       | Output                                    |
| --- | -------------- | --------------------------------------------------- | ----------------------------------------- |
| 1   | Requirements   | `/mle-req`                                          | INVEST stories, acceptance criteria, NFRs |
| 2   | Estimation     | `/mle-estimate`                                     | relative sizing, named risks              |
| 3   | Design         | `/mle-design`                                       | ADRs, IPC/Zod contracts, threat model     |
| 4   | Coverage       | `/mle-coverage`                                     | requirement → design/test coverage        |
| 5   | Implementation | `ts-developer`                                      | source, test-first                        |
| 6   | Testing        | `/mle-test-gen`                                     | Vitest + Cucumber.js                      |
| 7   | Security       | `/mle-security-scan`                                | npm audit, secrets, Electron checks       |
| 8   | Traceability   | `/mle-trace`                                        | requirements ↔ code ↔ tests matrix        |
| 9   | Impact / risk  | `/mle-impact`                                       | diff impact, risk register                |
| 10  | Review & merge | `style-reviewer`, `/code-review`, `github-workflow` | green CI, squash PR, release-please       |

When a later phase reveals an upstream gap, `/mle-feedback` classifies the root cause and
proposes remediation. Verification at every phase: `npm run lint && typecheck && test &&
bdd && build`.

## See also

- `git-policy.md`, `testing-standards.md`, `review-standards.md`, `mle-overview.md`
