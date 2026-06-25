# Releases & auto-update

Versions are **derived, never hand-picked**. You ship by merging
Conventional-Commit changes — the pipeline does the rest.

## How a release happens

1. **Conventional Commits** (`feat:`/`fix:`/`feat!:` …) land on `master` via
   squash-merged PRs. `commitlint` enforces the **PR title** in CI; a local
   `lefthook` hook gives fast feedback.
2. **release-please** reads the commits, derives the next SemVer
   (`fix`→patch, `feat`→minor, `feat!`/`BREAKING CHANGE`→major), and opens a
   **release PR** that bumps `package.json` + `CHANGELOG.md`. It keeps **one**
   open release PR that accumulates changes — merge it when you want to ship.
3. Merging the release PR creates the tag (`vX.Y.Z`) + a **draft** GitHub Release.
4. `.github/workflows/release-please.yml` then, gated on `release_created`:
   - a **matrix build** (macOS, Windows) runs electron-builder `--publish never`
     and uploads its own installers + `latest*.yml` to the draft;
   - a single **publish** job flips the draft to published.
     One source of truth, `GITHUB_TOKEN` only, no double-publish.

## One-time repo setup

- **Settings → Actions → General → Workflow permissions**: enable
  _"Allow GitHub Actions to create and approve pull requests"_ — otherwise
  release-please can't open its PR. (Already enabled for this repo.)
- Config: `release-please-config.json` uses `release-type: node`,
  `include-v-in-tag: true`, `include-component-in-tag: false` (plain `vX.Y.Z`
  tags), `draft: true`, `force-tag-creation: true`; bootstrapped from `1.0.3`.

## Auto-update

The app **auto-updates in place** via `electron-updater` — no reinstall. On
launch it checks this repo's Releases, downloads a newer version in the
background, and applies it on restart/next quit. An in-app indicator surfaces
update progress (v2.2).

- **Windows** (NSIS) self-updates for unsigned builds.
- **macOS** auto-update needs a **signed + notarized** app; until then, Mac users
  download the new `.dmg`.

## Don't

- Don't run `npm version` or push `v*` tags by hand — release-please owns versions.
- Don't merge a release PR expecting CI checks on it — release-please PRs are
  authored by `GITHUB_TOKEN`, so workflows don't run on them; they're mechanical
  version+CHANGELOG bumps (CI already passed on the feature PRs).
