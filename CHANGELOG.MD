# Changelog

All notable changes to the Hoterstellar backend should be recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows its own deployment cadence rather than strict Semantic Versioning (deploys happen continuously from `main` via `.github/workflows/cd.yml`, per `render.yaml`).

## How to Use This File

- Add an entry under **[Unreleased]** as part of the same PR that makes the change — don't batch it up after the fact.
- When a batch of changes is deployed to production (a push to `main`), move the `[Unreleased]` entries under a new dated heading, e.g. `## [2026-09-09]`.
- Group entries under `Added`, `Changed`, `Fixed`, `Removed`, `Security`, and `Deprecated` as relevant — omit empty groups.
- Security-relevant fixes should also be cross-referenced in `SECURITY.md` if they relate to a previously tracked issue.

---

## [Unreleased]

### Added

- Initial project documentation set: `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, this `CHANGELOG.md`.

### Known Issues (carried over, see `README.md` → _Implementation Notes / Inconsistencies_)

- Admin password reset (`POST /auth/admin/reset-password`) is not functional.
- `src/app/bootstrap.js` references non-existent exports and is not used by the running server.
- `src/middlewares/auth.base.middleware.js` uses CommonJS `require()` inside an ESM module.
- No automated test suite exists.

---

## [Template for Future Entries]

## [YYYY-MM-DD]

### Added

- New features or endpoints.

### Changed

- Changes to existing functionality (e.g. an order status transition rule, a permission mapping).

### Fixed

- Bug fixes.

### Security

- Security-relevant fixes — describe the impact and the fix, without publishing exploit details for a vulnerability that could still affect deployed instances.

### Removed

- Removed features, endpoints, or deprecated code paths.
