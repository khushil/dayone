# Workspace Strategy

**Path scope**: `**`

The Workspace Strategy Engine (`core/strategy.py`) decides whether to create a clone or worktree each time you start work. It runs automatically via `mle work` or `mle create --workspace auto`.

## Clone vs Worktree

| Aspect            | Clone                     | Worktree                                            |
| ----------------- | ------------------------- | --------------------------------------------------- |
| Creation          | Full `git clone` (slower) | `git worktree add` (4.5x faster)                    |
| Disk usage        | Full `.git/objects` copy  | Shares objects with home repo (85% saving)          |
| Isolation         | Fully independent         | Linked to home repository                           |
| Submodule support | Full                      | Not recommended (vetoed automatically)              |
| Branch constraint | None                      | Cannot check out branch already in another worktree |

## 7-Factor Decision

| Factor            | What is measured                   | Nudges toward                                             |
| ----------------- | ---------------------------------- | --------------------------------------------------------- |
| Repository size   | `.git/objects` in MB               | Worktree (large repos share more)                         |
| Disk pressure     | Free disk in GB                    | Worktree (saves duplication)                              |
| Active workspaces | Count of existing workspaces       | Worktree (compounding savings)                            |
| Worktree ratio    | Proportion already using worktrees | Worktree (follow existing pattern)                        |
| LFS complexity    | `.git/lfs/objects` in MB           | Clone (LFS has worktree edge cases)                       |
| User preference   | `~/.mle/config.toml` setting       | Configurable (`auto`, `clone-only`, `worktree-preferred`) |
| QuintGov patterns | Is this a QuintGov project?        | Worktree (shared pattern library benefits)                |

Factors are weighted and summed. Score above threshold (default 0.3) selects worktree; at or below selects clone.

## Hard Vetoes

These short-circuit scoring and force clone immediately:

- User config set to `clone-only`
- Remote resume with no local home repo
- Repository has `.gitmodules` (submodules)
- Target branch already checked out in another worktree

## Key Commands

| Command                              | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `mle work <ID>`                      | Create workspace (Strategy Engine decides type) |
| `mle work <ID> --workspace worktree` | Force worktree (bypass engine)                  |
| `mle work <ID> --workspace clone`    | Force clone (bypass engine)                     |
| `mle strategy`                       | Show what the engine would decide               |
| `mle strategy --explain`             | Factor-by-factor score breakdown                |
| `mle doctor`                         | Health check all workspaces                     |
| `mle abandon`                        | Remove a workspace cleanly                      |

## Terminology

- **Workspace** — generic term for any task directory (clone or worktree)
- **Clone** — full git clone with independent `.git/` directory
- **Worktree** — linked working directory sharing the home repo's object store
- **Home repository** — the original cloned repo from which workspaces derive

## Directory Layout

```
~/src/project/                  # home repository
~/src/project-clones/           # full git clones
~/src/project-worktrees/        # linked git worktrees
```
