# Contributing to Hoterstellar Backend

Thanks for working on this project. This guide covers the local workflow, code style, and what CI expects before a pull request can merge. See `README.md` for full architecture, module, and API documentation — this file is about _how to contribute_, not _how the system works_.

## Before You Start

- Read `README.md`, especially **Module Architecture Pattern**, **Module-by-Module Documentation**, and **Implementation Notes / Inconsistencies** — several known gaps (broken admin password reset, dead `bootstrap.js`, split email-sending paths) are already tracked there; don't re-discover them as new bugs.
- Read `SECURITY.md` before touching anything in `src/middlewares/auth.base.middleware.js`, `src/middlewares/authorize.middleware.js`, `src/middlewares/csrf.middleware.js`, or any `*.auth.*` module.

## Local Setup

```bash
git clone https://github.com/abushayedgit/hoterstellar_sr.git
cd hoterstellar_sr
npm install
cp .env.example .env   # fill in MONGODB_URI, ADMIN_JWT_SECRET, USER_JWT_SECRET at minimum
npm run dev             # API on http://localhost:5000 (or PORT from .env)
npm run dev:worker       # optional, separate terminal — needs UPSTASH_REDIS_NATIVE_URL
```

Requires Node.js ≥ 22 and npm ≥ 10 (per `package.json` `engines`).

## Branching

Per `.github/workflows/ci.yml`, CI runs on pushes to `main`, `develop`, and branches matching `feature/**`, `fix/**`, `refactor/**`, and on pull requests into `main`/`develop`. Follow that convention:

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `refactor/<short-description>` — internal restructuring with no behavior change

Open pull requests against **`develop`**, not `main`. `main` is deployed automatically on every push (`.github/workflows/cd.yml`) — treat it as production.

## Code Style

- **Lint:** `npm run lint` (ESLint, config in `eslint.config.mjs`). Fix what you can automatically with `npm run lint:fix`.
- **Format:** `npm run format` (Prettier, config in `.prettierrc.json`).
- Run both before opening a PR — `ci.yml`'s `quality` job runs `npm run lint` on Node 20.x and 22.x and will fail the PR check if it doesn't pass.
- Follow the existing **layered module pattern** (`routes → controller → service → [repository] → model`) described in `README.md`. Don't put business logic in a controller or Mongoose queries directly in a route file.
- New domain modules go under `src/modules/<name>/`, matching the file-naming convention of existing modules (`<name>.routes.js`, `.controller.js`, `.service.js`, `.validator.js`, and `.model.js`/`.repository.js` where applicable).

## Adding or Changing an Endpoint

1. Define/update the Zod schema in the module's `*.validator.js`.
2. Wire the route in `*.routes.js` with the correct middleware chain, in order: authentication → authorization (`requirePermission`/`requireRoles`) → `validateBody`/`validateQuery`/`validateObjectIdParam` → upload middleware (if applicable) → `auditLog(...)` (if it's a mutating admin action) → controller.
3. Implement the logic in `*.service.js` — controllers should stay thin.
4. If the endpoint is admin-only, add the new permission to `src/constants/permissions.js` and assign it to the correct role(s) in `ROLE_PERMISSIONS` rather than hardcoding a role check, unless the action is deliberately restricted to a single role (as `admin.delete` is to `super_admin`).
5. Update `README.md`'s API Reference and Module-by-Module Documentation sections for the new/changed endpoint — the README is meant to stay in sync with the code, not go stale.

## Environment Variables

If you add a new environment variable:

- Add it to `src/config/env.js`'s Zod schema (with a sensible default if it's optional).
- Add a placeholder entry to `.env.example`.
- If it's required in production, add it to `src/config/production.js`'s `requiredVars` list and to the relevant service's `envVars` block in `render.yaml`.
- Document it in `README.md`'s **Environment Variables** section.

## Security-Sensitive Changes

Do not, without explicit review from the repository owner:

- Weaken, bypass, or remove `createAuthMiddleware`, `requirePermission`, or `requireRoles` on an existing route.
- Remove `validateBody`/`validateQuery`/`validateObjectIdParam` from a route without an equivalent replacement.
- Remove `auditLog(...)` from an existing admin mutation.
- Change rate-limit tiers on authentication or destructive-admin endpoints.
- Disable CSRF protection on the refresh endpoints.

See `SECURITY.md` for the full list and how to report a vulnerability instead of silently patching around one.

## Commit Messages

No strict convention is enforced by tooling for human contributors (Dependabot uses `deps:`/`ci:` prefixes for its own automated PRs — see `.github/dependabot.yml`). A short, imperative summary line (`Add table booking cancellation reason field`) followed by more detail in the body if needed is preferred.

## Pull Request Checklist

Before requesting review:

- [ ] `npm run lint` passes
- [ ] `npm run format` has been run
- [ ] `node --check` passes on any new/changed file (this is what `ci.yml`'s `syntax-check` job verifies for core files)
- [ ] `npm audit --audit-level=high` doesn't report new high-severity issues from any dependency you added
- [ ] New/changed environment variables are documented (see above)
- [ ] New/changed endpoints are reflected in `README.md`
- [ ] No secrets, API keys, or real credentials are included in the diff
- [ ] The PR targets `develop`, not `main`

`.github/CODEOWNERS` will request review from `@abushayedgit` automatically on most paths in this repository.

## What CI Checks (and What It Doesn't)

CI (`ci.yml`) currently runs: ESLint, `npm audit`, and `node --check` syntax verification on core files. **There is no automated test suite in this repository** — CI cannot catch logic regressions, only syntax errors and lint/audit issues. Be extra careful with manual testing around authentication, authorization, and payment/order-total calculations until a test suite exists; if you're adding one, it's very welcome.

CodeQL (`codeql.yml`) and Dependency Review (`dependency-review.yml`) also run automatically and can block merges on security findings or high-severity/incompatible-license dependencies.
