# Changelog

This file is maintained automatically by [release-please](https://github.com/googleapis/release-please) from Conventional Commits. Do not edit by hand.

## [2.1.0](https://github.com/khushil/dayone/compare/v2.0.1...v2.1.0) (2026-06-25)


### Features

* add DataProvider abstraction, registry, and Yahoo adapter ([#14](https://github.com/khushil/dayone/issues/14)) ([fe74b14](https://github.com/khushil/dayone/commit/fe74b14fd86a5f23bc6268ab7f4e9439341f0114))
* add hardened SecureStore for provider API keys ([#15](https://github.com/khushil/dayone/issues/15)) ([7fd4149](https://github.com/khushil/dayone/commit/7fd4149579664f536c774699984e4fa0434c2ddb))
* add key-management IPC backed by SecureStore ([#16](https://github.com/khushil/dayone/issues/16)) ([3c12f4d](https://github.com/khushil/dayone/commit/3c12f4d0e667cd9dfe47e33fa23f2a3097e1008d))
* add ProviderSettings drawer for API key management ([#17](https://github.com/khushil/dayone/issues/17)) ([f574389](https://github.com/khushil/dayone/commit/f5743896f920e323a1c70b61fca1204ffb77b9f6))


### Bug Fixes

* migrate cached data from the legacy SectorScope userData dir ([#12](https://github.com/khushil/dayone/issues/12)) ([71a7dcf](https://github.com/khushil/dayone/commit/71a7dcf193b67dca67f1755daddfb160d069204e))

## [2.0.1](https://github.com/khushil/dayone/compare/v2.0.0...v2.0.1) (2026-06-25)

### Bug Fixes

- **release:** use plain vX.Y.Z tags and a robust version guard ([#10](https://github.com/khushil/dayone/issues/10)) ([c44819a](https://github.com/khushil/dayone/commit/c44819ac49c6ea77e96fe8e7bd2c7b375faeb779))

## [2.0.0](https://github.com/khushil/dayone/compare/dayone-v1.0.3...dayone-v2.0.0) (2026-06-25)

### ⚠ BREAKING CHANGES

- the app identity (appId/productName) changes, so the install identity changes and the userData directory moves from …/SectorScope to …/DayONE. Existing SectorScope installs must install DayONE once; auto-update continues from there. (userData migration lands next.)

### Features

- rename SectorScope to DayONE ([#8](https://github.com/khushil/dayone/issues/8)) ([b989bc8](https://github.com/khushil/dayone/commit/b989bc8d838bab8cfc01420bd5d7bddca050a935))

## [1.0.3] — baseline

Releases up to and including 1.0.3 (SectorScope) predate automated versioning. See the GitHub Releases for their notes. From 2.0.0 (DayONE) onward, entries here are generated.
