# Architecture Standards

**Path scope**: `src/**`

## Module Dependency Direction

Dependencies flow inward. Outer layers depend on inner layers, never the reverse:

| Module        | May Import                            | Must NOT Import                |
| ------------- | ------------------------------------- | ------------------------------ |
| `core/`       | Standard library only                 | cli, ado, watcher, skill       |
| `ado/`        | core/, standard library, azure-devops | cli, watcher                   |
| `watcher/`    | core/, ado/                           | cli                            |
| `skill/`      | core/                                 | cli, ado, watcher              |
| `cli.py`      | core/, ado/, Click, Rich              | (entry point — may import all) |
| `statusline/` | core/, standard library               | cli, ado                       |

## New Module Guidelines

- Module names: singular nouns for domain (`clone`, `config`, `metadata`)
- CLI command names: verbs (`init`, `sync`, `complete`, `abandon`)
- New modules must declare their allowed imports in this table before merge
- No circular dependencies — if A imports B, B must not import A

## Configuration

- All configurable values live in `~/.mle/config.toml` — never hardcode paths, URLs, or thresholds
- Read config via `mle.core.config` module — never read TOML directly in other modules
- Defaults must be sensible: a fresh `mle init` must work without any config file
- Environment variables override config.toml for CI/CD contexts

## Extension Points

- New SDLC phases: add to `core/`, expose via `cli.py`
- New ADO integrations: add to `ado/`, consume from `core/` via dependency injection
- New watcher plugins: add to `watcher/plugins/`, register in watcher config
