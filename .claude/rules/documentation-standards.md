# Documentation Standards

**Path scope**: `**/*.py`, `**/*.md`

## Docstrings

- Google-style docstrings on all public functions, classes, and methods
- Required sections: one-line summary, `Args:`, `Returns:`, `Raises:` (when applicable)
- Omit `Args:` for zero-parameter functions; omit `Raises:` if nothing is raised

Example:

```python
def create_clone(task_id: str, *, branch: str = "main") -> CloneResult:
    """Create a task clone from the home repository.

    Args:
        task_id: ADO work item ID (e.g. "1234").
        branch: Base branch to create feature branch from.

    Returns:
        CloneResult with clone path and branch name.

    Raises:
        CloneError: If the home repository is not found.
    """
```

## Module Docstrings

- Every `.py` file must have a module-level docstring on line 1 (after `from __future__`)
- Format: single sentence describing the module's responsibility
- Example: `"""Azure DevOps REST API client for work item operations."""`

## README

| Section      | Required | Content                                         |
| ------------ | -------- | ----------------------------------------------- |
| Purpose      | Yes      | One paragraph explaining what this project does |
| Setup        | Yes      | Steps to install and configure                  |
| Usage        | Yes      | Key commands or API examples                    |
| Contributing | Yes      | Branch model, PR process, test requirements     |
| Architecture | Optional | Module diagram or description                   |

## DON'Ts

- Don't write docstrings that merely restate the function name
- Don't leave `TODO` or `FIXME` in committed docstrings — use issue tracker
- Don't use reStructuredText format — Google style only for consistency

## See Also

- `docs/CLAUDE.md` — documentation hub and navigation (if installed)
- `.claude/rules/code-standards.md` — code-level standards
- `.claude/rules/testing-standards.md` — test standards and coverage
