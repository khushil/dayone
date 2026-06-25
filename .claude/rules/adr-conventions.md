# ADR Conventions

## Architecture Decision Records

This project uses Architecture Decision Records (ADRs) in `docs/adr/` to document significant architectural decisions.

### When to Create an ADR

Create a new ADR when:

- Choosing between competing technologies or frameworks
- Defining API contracts or integration patterns
- Establishing data storage or messaging strategies
- Making security architecture decisions
- Changing an existing architectural pattern

### ADR Format

All ADRs follow MADR (Markdown Any Decision Record) format:

- **Context**: The forces at play and constraints
- **Decision**: What was decided (active voice: "We will...")
- **Consequences**: Positive, negative, and neutral impacts
- **Alternatives**: What else was considered and why it was rejected

### ADR Lifecycle

1. Author creates ADR with status "Proposed"
2. Team reviews via pull request
3. On approval, status changes to "Accepted"
4. To reverse a decision, create a new ADR that supersedes the original
5. Never delete or modify an accepted ADR -- create a superseding one instead

### Numbering

- Sequential: ADR-001, ADR-002, ADR-003
- File naming: `ADR-NNN-kebab-case-title.md`
- Update the index in `docs/adr/README.md` when adding new ADRs

### Quality Checks

When reviewing an ADR:

- Context clearly explains the problem and constraints
- Decision uses active voice and is unambiguous
- At least two alternatives were considered
- Consequences include both positive and negative impacts
- References link to relevant documentation or prior art
