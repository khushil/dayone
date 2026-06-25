# Domain Modelling

**Path scope**: `src/**/*.py`

## Dataclasses

| Variant                   | When to Use                                               |
| ------------------------- | --------------------------------------------------------- |
| `@dataclass` (mutable)    | Builder pattern, accumulating results (e.g. `InitResult`) |
| `@dataclass(frozen=True)` | Value objects, config snapshots, API responses            |
| `@dataclass(slots=True)`  | Performance-sensitive objects created in bulk             |

- Always add type hints to all fields
- Use `field(default_factory=list)` for mutable defaults, never `list()` or `[]`
- Prefer `__post_init__` for validation over external validator functions

## Enums

- Use `StrEnum` (Python 3.11+) for string-valued finite sets
- Never use magic strings for status, mode, or type discriminators
- Example: `class TaskState(StrEnum): ACTIVE = "active"; CLOSED = "closed"`
- Enums belong in the same module as the domain concept they describe

## Type Aliases

- Use `type` statement (Python 3.12+) for complex types: `type PathMap = dict[str, Path]`
- Prefer `X | Y` union syntax over `Union[X, Y]` or `Optional[X]`

## Module Organisation

- One primary domain concept per module (e.g. `clone.py` for clone operations)
- Related types (dataclasses, enums, exceptions) live alongside their functions
- Cross-module imports flow inward: `cli -> core`, never `core -> cli`
- Keep modules under 500 lines; split at natural domain boundaries
