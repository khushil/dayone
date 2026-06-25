# API Design

**Path scope**: `src/**/*.py`

## Function Signatures

- Functions with more than 2 parameters: use keyword-only arguments after `*`
- Boolean flags must always be keyword-only: `def process(data, *, verbose: bool = False)`
- Default mutable arguments: use `field(default_factory=list)` in dataclasses, never `def f(x=[])`

## Return Types

| Pattern      | When to Use                                         |
| ------------ | --------------------------------------------------- |
| Dataclass    | Structured results with named fields (preferred)    |
| `NamedTuple` | Lightweight immutable results                       |
| `dict`       | Only for JSON serialisation boundaries              |
| `None`       | Side-effect-only functions (file writes, API calls) |
| `T \| None`  | When absence is a valid, expected outcome           |

- Never return bare tuples — use dataclass or NamedTuple for clarity
- Never return `dict` for internal APIs — use typed dataclasses

## Error Handling

- Raise domain-specific exceptions (e.g. `CloneError`, `ConfigError`), not bare `ValueError`
- Catch specific exceptions, never bare `except:` or `except Exception:`
- Use `try/except/else` pattern: happy path in `else`, cleanup in `finally`
- Return `None` for expected absence; raise for unexpected failures

## Naming Conventions

| Element      | Pattern                | Examples                                    |
| ------------ | ---------------------- | ------------------------------------------- |
| Functions    | `verb_noun`            | `get_user`, `create_clone`, `sync_workitem` |
| Classes      | `NounPhrase`           | `CloneResult`, `TaskManager`, `InitResult`  |
| Constants    | `UPPER_SNAKE`          | `MAX_RETRIES`, `DEFAULT_BRANCH`             |
| Private      | `_prefixed`            | `_parse_remote`, `_validate_config`         |
| Boolean args | `is_`/`has_`/`should_` | `is_valid`, `has_remote`, `should_update`   |
