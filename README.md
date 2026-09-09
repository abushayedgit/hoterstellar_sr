# Hoterstellar — Backend API

Hotel & restaurant management backend for the **Hoterstellar** platform: a Node.js/Express/MongoDB REST API that powers food ordering, table and event bookings, reviews, content management (notices/billboard), visitor analytics, and admin operations, plus a companion background-worker process for email, analytics rollups, and media cleanup.

> **Simple explanation:** This is the "brain" behind a restaurant's website and admin dashboard — it stores the menu, takes food orders, manages table/event reservations, sends emails, and gives admins a control panel to run the business.
>
> **Technical explanation:** It is a modular Express 5 REST API (`/api/v1`) backed by MongoDB (Mongoose), with optional Redis caching (Upstash REST), BullMQ-based background jobs (Upstash native Redis), Socket.IO real-time admin notifications, Brevo transactional email, and ImageKit media storage.

## Project At a Glance

| Area               | Details                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Project            | Hoterstellar — Hotel & Restaurant Management Backend API (`hoterstellar-server`, `package.json` name)                       |
| Repository         | [`abushayedgit/hoterstellar_sr`](https://github.com/abushayedgit/hoterstellar_sr.git)                                       |
| Owner              | [abushayedgit](https://github.com/abushayedgit)                                                                             |
| Contributor        | [heyAbdullahBruh](https://github.com/heyAbdullahBruh)                                                                       |
| Backend (deployed) | https://api-hoterstellar.onrender.com                                                                                       |
| Main frontend      | https://hoterstellar.vercel.app _(not present in this repository — see [Frontend Integration](#frontend-integration))_      |
| Admin dashboard    | https://dash-hoterstellar.vercel.app _(not present in this repository — see [Frontend Integration](#frontend-integration))_ |
| Runtime            | Node.js ≥ 22 (`package.json engines`), ESM (`"type": "module"`)                                                             |
| Web framework      | Express 5.2                                                                                                                 |
| Database           | MongoDB via Mongoose 9                                                                                                      |
| Cache              | Upstash Redis (REST client, `@upstash/redis`) — optional, degrades gracefully                                               |
| Queue / Workers    | BullMQ 6 over a separate native Upstash Redis (ioredis) connection — optional                                               |
| Realtime           | Socket.IO 4 (`/admin` namespace only)                                                                                       |
| Email              | Brevo (Sendinblue) transactional email API                                                                                  |
| Media storage      | ImageKit                                                                                                                    |
| Deployment         | Render (`render.yaml`: one `web` service + one `worker` service)                                                            |
| CI/CD              | GitHub Actions — CI, CD, CodeQL, Dependency Review, Dependabot                                                              |
| Repo layout        | Single Node.js API service (`server/` root of this document) — no frontend/dashboard source in this repository              |

All statements below are derived from the actual source in `abushayedgit/hoterstellar_sr` (inspected directly). Where something could not be confirmed from the code, it is explicitly marked **Unknown** or **Not verifiable from this repository**.

---

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [User Types and System Actors](#user-types-and-system-actors)
3. [Feature Catalog](#feature-catalog)
4. [System Architecture](#system-architecture)
5. [Application Architecture](#application-architecture)
6. [Backend Startup Flow](#backend-startup-flow)
7. [Request Lifecycle](#request-lifecycle)
8. [Directory Structure](#directory-structure)
9. [Module Architecture Pattern](#module-architecture-pattern)
10. [Module-by-Module Documentation](#module-by-module-documentation)
11. [API Reference](#api-reference)
12. [API Access Matrix](#api-access-matrix)
13. [Authentication Architecture](#authentication-architecture)
14. [Authorization / RBAC](#authorization--rbac)
15. [Security Architecture](#security-architecture)
16. [Database Architecture](#database-architecture)
17. [Caching (Redis)](#caching-redis)
18. [Queues and Background Workers](#queues-and-background-workers)
19. [Email System](#email-system)
20. [File Uploads and Media Storage](#file-uploads-and-media-storage)
21. [Realtime (Socket.IO)](#realtime-socketio)
22. [Health Checks and Readiness](#health-checks-and-readiness)
23. [Error Handling](#error-handling)
24. [Environment Variables](#environment-variables)
25. [Local Development Setup](#local-development-setup)
26. [Development Commands](#development-commands)
27. [Docker](#docker)
28. [Deployment](#deployment)
29. [CI/CD](#cicd)
30. [Frontend Integration](#frontend-integration)
31. [Business Workflows](#business-workflows)
32. [Destructive Operations](#destructive-operations)
33. [Troubleshooting](#troubleshooting)
34. [Security Operations for Contributors](#security-operations-for-contributors)
35. [Contribution Guide](#contribution-guide)
36. [Maintainer Guide — "Where Do I Look?"](#maintainer-guide--where-do-i-look)
37. [Architectural Decisions](#architectural-decisions)
38. [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies)
39. [System Limitations / Known Unknowns](#system-limitations--known-unknowns)
40. [Technology Stack](#technology-stack)

---

## What This Project Does

Hoterstellar's backend is the API that a hotel/restaurant business uses to run its digital operations:

- **Customers** (public visitors or registered users) can browse the food menu by category, add items to a cart, place orders (pickup, delivery, or dine-in), book a table, request an event booking (weddings, corporate events, etc.), leave reviews on food/table/event experiences, and contact the business.
- **Admins/managers** use a separate authenticated surface to manage the menu (foods/categories), process and update order status, manage bookings, moderate and respond to reviews, publish notices, manage the homepage billboard/carousel/popup, and view analytics (orders, foods, bookings, reviews, income, visitors).
- **Background workers** (a separate Node.js process) send transactional emails, roll up analytics, and clean up orphaned uploaded images — asynchronously, off the request path.

At a technical level, the system is a **layered, modular Express API**: routes → middleware (auth/validation/rate-limiting) → controllers → services (business logic) → repositories (data access, on some modules) → Mongoose models → MongoDB. Optional infrastructure (Redis cache, BullMQ queues, Socket.IO, Brevo email, ImageKit storage) is designed to **degrade gracefully** — the API keeps running even if Redis, email, or image storage are unavailable.

---

## User Types and System Actors

Derived from `src/constants/roles.js`, the auth middlewares, and route definitions.

| Actor                                                                 | Authentication                                   | Capabilities                                                                                                                                                                             | Notes                                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Guest / unauthenticated visitor**                                   | None                                             | Browse foods/categories, view public billboard/notices, submit a table or event booking, submit a contact message, leave a "helpful" vote on a review, be tracked as a visitor/page-view | Some booking/review routes use `optionalAuthMiddleware`, so a guest and a logged-in user hit the _same_ endpoint with different behavior                           |
| **User** (`ROLES.USER`, constant only — not enforced via role checks) | JWT (`USER_JWT_SECRET`), email+OTP signup/signin | Manage own cart, place/view/cancel own orders, view/cancel own bookings, submit reviews for own completed transactions, manage own profile                                               | Authenticated via `user.auth.routes.js` / `createAuthMiddleware` bound to the `User` model                                                                         |
| **Manager** (`ROLES.MANAGER`)                                         | Admin JWT (`ADMIN_JWT_SECRET`)                   | Read/update orders, read/update bookings, read analytics                                                                                                                                 | Per `ROLE_PERMISSIONS` in `src/constants/permissions.js` — the _most restricted_ of the three admin-side roles                                                     |
| **Admin** (`ROLES.ADMIN`)                                             | Admin JWT                                        | Everything a Manager can do, plus manage users (read/delete), foods, categories, reviews (moderate), notices, billboard                                                                  | Cannot manage other admins or delete analytics — that is `ADMINS_MANAGE` / `ANALYTICS_DELETE`, granted only to `super_admin`                                       |
| **Super Admin** (`ROLES.SUPER_ADMIN`)                                 | Admin JWT                                        | Everything Admin can do, plus create/update/deactivate/**delete** admin accounts and delete analytics data                                                                               | The only role with `ADMINS_MANAGE` and `ANALYTICS_DELETE`; admin _deletion_ additionally requires `requireRoles([ROLES.SUPER_ADMIN])`, not just a permission check |
| **Background worker process**                                         | N/A (internal, no HTTP auth)                     | Consumes BullMQ jobs: sends queued emails, runs analytics rollups, cleans up orphaned ImageKit files                                                                                     | Runs as a separate process/deployment (`worker.js`), shares the same MongoDB and Redis as the API                                                                  |

`src/constants/roles.js` also defines a `GUEST` role string and an `ADMIN_ROLES` array (`[super_admin, admin, manager]`), but no route in the inspected code checks against `ROLES.GUEST` or `ROLES.USER` directly — user-facing routes are simply gated by "is this a valid User JWT" rather than a role check, while admin-facing routes use the `PERMISSIONS`/`ROLE_PERMISSIONS` system below.

---

## Feature Catalog

Grouped by domain, with confirmed route file, primary model(s), and admin permission (where applicable). "Public" means no authentication middleware is applied to that route.

### Authentication

| Feature                      | Routes file                               | Auth                                                                                                           |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Admin login                  | `modules/auth/admin/admin.auth.routes.js` | Public (rate-limited)                                                                                          |
| Admin refresh / logout       | same                                      | Public + CSRF-protected refresh                                                                                |
| Admin change password        | same                                      | Admin JWT                                                                                                      |
| Admin create (invite)        | same                                      | Admin JWT + `ADMINS_MANAGE`                                                                                    |
| Admin request/reset password | same                                      | Public (rate-limited) — **reset is not functional, see [Known Unknowns](#system-limitations--known-unknowns)** |
| User signup (email + OTP)    | `modules/auth/user/user.auth.routes.js`   | Public (rate-limited)                                                                                          |
| User signup verify (OTP)     | same                                      | Public (rate-limited)                                                                                          |
| User signin (email + OTP)    | same                                      | Public (rate-limited)                                                                                          |
| User signin verify (OTP)     | same                                      | Public (rate-limited)                                                                                          |
| User refresh / logout        | same                                      | Public + CSRF-protected refresh                                                                                |
| User profile get/update      | same                                      | User JWT                                                                                                       |

### Admin Management

| Feature                   | Notes                                                        |
| ------------------------- | ------------------------------------------------------------ |
| List/get admins           | `USERS_READ` permission                                      |
| Update admin              | `ADMINS_MANAGE`                                              |
| Activate/deactivate admin | `ADMINS_MANAGE`                                              |
| Delete admin              | `super_admin` role only + destructive rate limit + audit log |

### Users (customer accounts, admin-managed)

| Feature                  | Notes                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| List/get users           | `USERS_READ`                                                                 |
| Soft-delete user         | `USERS_DELETE` + destructive rate limit (sets `deletedAt`)                   |
| Activate/deactivate user | `USERS_DELETE` permission (same permission is reused for activation toggles) |

### Catalog (Food / Category)

| Feature                       | Notes                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| List/get categories           | Public, cached                                                                                    |
| Create/update/delete category | `CATEGORIES_MANAGE`, single image upload                                                          |
| List/get foods                | Public, cached, supports filters (category, availability, vegetarian, spicy, search, price range) |
| Create/update food            | `FOODS_CREATE` / `FOODS_UPDATE`, multi-image upload (max 8)                                       |
| Delete food                   | `FOODS_DELETE` + destructive rate limit                                                           |

### Commerce (Cart / Orders)

| Feature                            | Notes                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| View/add/update/remove cart items  | User JWT required for all cart routes                                                                   |
| Clear cart                         | User JWT                                                                                                |
| Merge guest cart into account cart | User JWT (`POST /cart/merge`)                                                                           |
| Create order (from cart)           | User JWT — snapshots food price/discount at order time, computes 5% tax, clears cart, emits `order:new` |
| View own orders / order by id      | User JWT                                                                                                |
| Cancel own order                   | User JWT — only from `pending`/`confirmed`                                                              |
| List all orders (admin)            | `ORDERS_READ_ALL`                                                                                       |
| Update order status (admin)        | `ORDERS_UPDATE_STATUS` — enforced state machine (see [Business Workflows](#business-workflows))         |

### Bookings (Table / Event)

| Feature                        | Notes                                       |
| ------------------------------ | ------------------------------------------- |
| Create table/event booking     | Public (optional auth) + reCAPTCHA required |
| View own bookings              | User JWT                                    |
| Get booking by id              | Public (optional auth)                      |
| Cancel own booking             | User JWT                                    |
| List all bookings (admin)      | `BOOKINGS_READ_ALL`                         |
| Update / update status (admin) | `BOOKINGS_UPDATE`                           |

### Reviews

| Feature                             | Notes                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Public reviews for a food           | Public                                                                                     |
| Mark review helpful                 | Public                                                                                     |
| Eligible orders/bookings for review | User JWT (`GET /reviews/eligible-orders`)                                                  |
| Submit food/table/event review      | User JWT — one review per user per food/booking (enforced by partial unique Mongo indexes) |
| Update/delete own review            | User JWT                                                                                   |
| List all reviews (admin)            | `REVIEWS_MODERATE`                                                                         |
| Moderate (approve/reject) review    | `REVIEWS_MODERATE` + audit log                                                             |
| Respond to review (admin)           | `REVIEWS_MODERATE` + audit log                                                             |

### Content Management

| Feature                                               | Notes                                 |
| ----------------------------------------------------- | ------------------------------------- |
| Public billboard (hero + carousel + popup)            | Public, cached                        |
| Manage billboard, carousels, popup image              | `BILLBOARD_MANAGE`, image upload      |
| Published notices (public list + by slug)             | Public, cached                        |
| Manage notices (create/update/delete/publish/archive) | `NOTICES_MANAGE`, single image upload |

### Visitor Tracking & Analytics

| Feature                                            | Notes                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Track visitor / page view                          | Public (page-view supports optional auth to associate a logged-in user) |
| List visitors / page views                         | `ANALYTICS_READ`                                                        |
| Visitor stats                                      | `ANALYTICS_READ`                                                        |
| Order / food / booking / review / income analytics | `ANALYTICS_READ`                                                        |
| Request analytics deletion                         | `ANALYTICS_DELETE` (two-step: request, then confirm)                    |
| Delete analytics                                   | `ANALYTICS_DELETE` + destructive rate limit + audit log                 |

### Contact

| Feature                   | Notes                                   |
| ------------------------- | --------------------------------------- |
| Submit contact message    | Public, mutation-rate-limited           |
| List/get contact messages | `USERS_READ`                            |
| Update contact status     | `USERS_READ`                            |
| Delete contact message    | `USERS_DELETE` + destructive rate limit |

---

## System Architecture

```text
                         ┌────────────────────────────┐        ┌──────────────────────────────┐
                         │   Public Frontend (Next.js  │        │  Admin Dashboard (Next.js,    │
                         │   assumed — not in this     │        │  assumed — not in this repo)  │
                         │   repo) hoterstellar.vercel │        │  dash-hoterstellar.vercel.app │
                         │   .app                      │        │                                │
                         └───────────────┬─────────────┘        └───────────────┬───────────────┘
                                         │ HTTPS (REST + Socket.IO for admin)     │
                                         ▼                                        ▼
                         ┌──────────────────────────────────────────────────────────────┐
                         │           Express API  (server.js → src/app/app.js)          │
                         │  helmet → security headers → CORS → request-id → logger →    │
                         │  json/urlencoded → sanitize → global rate limit →            │
                         │  /api/v1 router → 404 handler → error handler → CSRF (refresh)│
                         └───────────────┬───────────────────────────┬────────────────┘
                                         │                            │
                     ┌───────────────────┼────────────────────────────┼──────────────────────┐
                     ▼                   ▼                            ▼                       ▼
            Auth (Admin/User JWT) Business modules            Socket.IO (/admin namespace)   Rate limiters
            + RBAC middleware     (18 domain modules)          — admin JWT auth, emits         (global, auth,
                     │             controller→service→          live events on mutations       mutation, admin-
                     │             (repository)→model                                          destructive)
                     ▼                   │
             MongoDB (Mongoose)  ◄───────┘
                     │
        ┌────────────┼─────────────────────┬───────────────────────┬─────────────────────┐
        ▼                                  ▼                       ▼                      ▼
  Upstash Redis (REST)              Upstash Redis (native)     Brevo Email API       ImageKit (media)
  — response/query cache            — BullMQ connection for    — verified at         — image upload/
  — optional; API runs with          Email / AnalyticsRollup   startup; disabled       delete for foods,
    caching disabled if down         / MediaCleanup queues       if unconfigured        categories, notices,
                                            │                                            billboard
                                            ▼
                              ┌───────────────────────────────┐
                              │  Worker process (worker.js)    │
                              │  connects to MongoDB + Redis,  │
                              │  runs: emailProcessor,         │
                              │  analyticsRollupProcessor,     │
                              │  mediaCleanupProcessor         │
                              └───────────────────────────────┘
```

**Verified:** the frontend/dashboard URLs are supplied deployment metadata; their source code is **not** part of this repository, so their internal architecture cannot be documented from this codebase (see [Frontend Integration](#frontend-integration)).

---

## Application Architecture

This repository contains **two runtime applications** built from the same codebase and `package.json`:

| Application           | Entry point | Responsibility                                                                                                                                                       | Deployment (per `render.yaml`)                                                                  |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **API server**        | `server.js` | Boots Express app, connects MongoDB, verifies Brevo, connects Redis + initializes BullMQ queues, attaches Socket.IO, starts HTTP listener, handles graceful shutdown | Render `web` service `hoterstellar-api`, `startCommand: node server.js`, health check `/health` |
| **Background worker** | `worker.js` | Connects MongoDB + Redis, starts three BullMQ workers (email, analyticsRollup, mediaCleanup), handles graceful shutdown                                              | Render `worker` service `hoterstellar-worker`, `startCommand: node worker.js`                   |

Both applications import the same `src/config/*`, `src/models/*`, and `src/modules/*/*.model.js` files, and both connect independently to MongoDB and Redis — they are **separate OS processes**, not threads of the same process, and are meant to scale/restart independently.

A third, largely redundant worker entry point exists at `src/jobs/worker.js` — see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies).

---

## Backend Startup Flow

Traced from `server.js` (the file actually invoked by `npm start` / `node server.js` and by `render.yaml`):

```text
node server.js
  1. validateProductionConfig()          — src/config/production.js: in NODE_ENV=production,
                                             exits the process if MONGODB_URI, ADMIN_JWT_SECRET,
                                             USER_JWT_SECRET, or the three UPSTASH_REDIS_* vars
                                             are missing
  2. connectDB()                          — src/config/database.js: mongoose.connect() with
                                             connection-event logging and up to 5 retries
                                             (5s apart); process.exit(1) if it ultimately fails
                                             — MongoDB is a HARD requirement to boot
  3. verifyBrevoOnStartup()               — src/config/brevo.js: pings Brevo's /v3/account API;
                                             logs a warning and continues if not configured or
                                             unreachable — email is NOT a hard requirement
  4. connectRedis() + getQueue(...) x3    — src/config/redis.js connects the Upstash REST client;
                                             src/config/queue.js lazily creates the three BullMQ
                                             queues over a separate native Redis connection.
                                             If Redis is unavailable, the server logs a warning
                                             and continues with caching/queues disabled
  5. http.createServer(app) +
     initializeSocket(server)             — src/config/socket.js attaches a Socket.IO server to
                                             the same HTTP server/port, with a JWT-authenticated
                                             /admin namespace
  6. server.listen(env.PORT)              — starts accepting HTTP + WebSocket connections;
                                             registers SIGTERM/SIGINT graceful-shutdown handlers
                                             (closes Socket.IO, then MongoDB, 10s force-exit timeout)
```

`app` itself (`src/app/app.js`) is built and exported as a ready-made Express instance at import time (not via a factory function) and is imported directly by `server.js`.

---

## Request Lifecycle

Derived directly from the middleware registration order in `src/app/app.js`:

```text
Incoming HTTP request
  │
  ▼
helmet()                          — sets a broad set of secure HTTP headers
  ▼
securityHeadersMiddleware         — adds X-Content-Type-Options, HSTS (prod only),
                                     X-Frame-Options: DENY, and a Content-Security-Policy
  ▼
cors()                            — origin allow-list from CORS_ORIGINS, credentials: true
  ▼
requestIdMiddleware               — assigns/propagates x-request-id, stores it in
                                     AsyncLocalStorage (req.requestId)
  ▼
requestLoggerMiddleware           — logs method/url/status/duration on response finish
  ▼
express.json() / urlencoded()     — body parsing, 1MB limit
  ▼
sanitizeRequestMiddleware         — strips null bytes / control characters from
                                     body, query, params
  ▼
globalRateLimiter                 — 500 requests / 15 minutes per IP (express-rate-limit)
  ▼
/api/v1 router (src/app/routes.js)
  │    ├─ per-module rate limiters (auth, mutation, admin-destructive) where declared
  │    ├─ authentication middleware (admin/user JWT, or optionalAuthMiddleware)
  │    ├─ authorization middleware (requirePermission / requireRoles) on admin routes
  │    ├─ validateBody / validateQuery / validateObjectIdParam (Zod + custom)
  │    ├─ upload middleware (multer, memory storage) where a route accepts images
  │    ├─ auditLog middleware on mutating admin actions
  │    └─ controller → service → (repository) → Mongoose model → MongoDB
  ▼
/health and /ready handlers        — registered after the API router, before the 404 handler
  ▼
404 handler                        — catch-all for unmatched routes
  ▼
errorHandlerMiddleware             — normalizes AppError subclasses, Mongoose
                                      ValidationError/CastError, and duplicate-key (11000)
                                      errors into a consistent JSON error shape
  ▼
setCsrfCookie / csrfProtection     — registered at the END of app.js, applied only to
                                      /api/v1/auth/admin/refresh and /api/v1/auth/user/refresh
```

> ⚠️ **Implementation note:** `setCsrfCookie` and the two `csrfProtection` mounts are registered **after** the 404 handler and the error handler in `app.js`, i.e. after Express has already found and dispatched to a matching route. Because Express middleware runs in registration order regardless of where it sits relative to routes that were already matched by an earlier `app.use('/api/v1', apiRoutes)` call, this ordering is unusual and worth reviewing if CSRF protection on the refresh endpoints is not behaving as expected. See [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies).

---

## Directory Structure

```text
server/
├── .github/                      # CI/CD workflows, CODEOWNERS, Dependabot config
├── Dockerfile                    # API server container image
├── Dockerfile.worker             # Background worker container image
├── render.yaml                   # Render deployment manifest (web + worker services)
├── server.js                     # API process entry point
├── worker.js                     # Background worker process entry point
├── src/
│   ├── app/
│   │   ├── app.js                # Express app: middleware stack, routing, health/ready
│   │   ├── bootstrap.js          # Alternate async bootstrap helper — NOT used by server.js (see Inconsistencies)
│   │   └── routes.js             # Mounts all 15 domain routers under /api/v1
│   ├── config/                   # External-service and runtime configuration
│   │   ├── brevo.js              #   Brevo transactional email client + startup verification
│   │   ├── database.js           #   MongoDB connection lifecycle (connect/disconnect, retries)
│   │   ├── env.js                #   Zod-validated environment variable schema (fails fast)
│   │   ├── production.js         #   Hard-fails boot if required prod env vars are missing
│   │   ├── queue.js               #   BullMQ queue/worker factory over native Redis
│   │   ├── redis.js               #   Upstash REST Redis client (cache layer)
│   │   ├── socket.js              #   Socket.IO server + /admin namespace JWT auth
│   │   └── storage.js             #   ImageKit client + upload/delete helpers
│   ├── constants/                 # Shared enums/lookup tables
│   │   ├── cacheKeys.js           #   Canonical cache key builders (see Inconsistencies — not all used)
│   │   ├── permissions.js         #   PERMISSIONS + ROLE_PERMISSIONS (the RBAC matrix)
│   │   ├── roles.js               #   ROLES enum + ADMIN_ROLES
│   │   ├── security.js            #   Bcrypt rounds, OTP length/expiry, token lifetimes
│   │   └── socketEvents.js        #   SOCKET_EVENTS emitted to the /admin namespace
│   ├── emails/templates/          # Plain-string HTML email templates (10 templates + shared layout)
│   ├── errors/                    # AppError + 8 typed subclasses (400/401/403/404/409/429/500/502)
│   ├── infrastructure/
│   │   ├── emailService.js        #   sendEmail + enqueueEmail + per-event email helpers
│   │   └── recaptchaProvider.js   #   Google reCAPTCHA v2/v3 server-side verification
│   ├── jobs/                      # BullMQ job processors, grouped by domain
│   │   ├── analytics/analyticsRollup.worker.js
│   │   ├── email/email.worker.js
│   │   ├── media/mediaCleanup.worker.js
│   │   └── worker.js              #   A second, largely duplicate worker entry point (see Inconsistencies)
│   ├── middlewares/                # HTTP middleware (auth, authz, validation, rate limiting, security)
│   ├── models/                     # Shared, cross-module models (Counter, base schema options/plugin)
│   ├── modules/                    # 15 domain modules — see below
│   ├── scripts/seed.js             # CLI entry point: seeds super-admin + dev data
│   ├── seeders/                    # superAdmin.seeder.js, devData.seeder.js
│   └── utils/                      # ApiResponse, cache, cookies, logger, objectId, HTML sanitize, slug,
│                                    # Socket.IO emitter, time/timezone, JWT/OTP token utilities
```

`src/modules/` contains one directory per business domain: `admin`, `analytics`, `auth/admin`, `auth/user`, `billboard`, `booking/table`, `booking/event`, `cart`, `category`, `contact`, `food`, `notice`, `order`, `review`, `user`, `visitor` — 16 module directories in total (including the two `auth` and two `booking` sub-modules).

---

## Module Architecture Pattern

Most modules follow a consistent five/six-file layered pattern inside `src/modules/<name>/`:

```text
<name>/
├── <name>.routes.js         # Express Router: wires middleware + controller per endpoint
├── <name>.controller.js     # Thin HTTP layer: reads req, calls service, shapes ApiResponse
├── <name>.service.js        # Business logic: validation rules, side effects, orchestration
├── <name>.repository.js     # (most, not all, modules) Data-access layer wrapping the Mongoose model
├── <name>.model.js          # Mongoose schema/model definition
└── <name>.validator.js      # Zod schemas used by validateBody/validateQuery middleware
```

**Layer responsibilities (verified from code):**

- **Routes** — declare the HTTP method/path and compose the middleware chain (auth → authorize → validate → upload → auditLog → controller). No business logic here.
- **Controllers** — extract request data, call the corresponding service function, and return a response via `ApiResponse` or a raw `res.json`. Controllers do not talk to Mongoose directly.
- **Services** — contain the actual business rules (e.g. order status transition table, cart total recalculation, cache population/invalidation, audit-relevant side effects like emitting Socket.IO events or enqueuing email jobs).
- **Repositories** — present in `admin`, `billboard`, `booking/*`, `cart`, `category`, `contact`, `food` _(routes reference it but no repository file was found for `food` — see note)_, `notice`, `order` — wrap Mongoose queries so services aren't calling `Model.find()` directly. **Not present** in `analytics`, `auth/admin`, `auth/user`, `review`, `user`, `visitor` — those services query their Mongoose models directly.
- **Validators** — Zod schemas (`z.object({...})`) consumed by `validateBody`/`validateQuery` middleware; failures are normalized into a `ValidationError` (HTTP 400) with a `details` array of `{ field, message }`.

`src/modules/user/` is an exception: it has `user.controller.js`, `user.routes.js`, `user.service.js` but no dedicated `user.model.js` or `user.validator.js` — it manages `Admin`-facing operations on the `User` model defined in `modules/auth/user/user.model.js`, and reuses `userQuerySchema` from `auth/user/user.auth.validator.js`.

---

## Module-by-Module Documentation

For each module: purpose, key files, auth requirements, and notable business rules. Full endpoint-level detail is in [API Reference](#api-reference).

### `auth/admin` — Admin Authentication

- **Purpose:** Login, session (refresh-token) management, and password lifecycle for `Admin` accounts.
- **Files:** `admin.auth.routes.js`, `admin.auth.controller.js`, `admin.auth.service.js`, `admin.auth.validator.js`, `admin.model.js`, `adminSession.model.js`.
- **Auth:** Login/refresh/logout/reset routes are public (rate-limited); change-password and admin-creation require a valid admin JWT.
- **Business logic:** Passwords are bcrypt-hashed (`SECURITY.BCRYPT_SALT_ROUNDS = 12`) via a Mongoose `pre('save')` hook. Login issues a short-lived JWT access token (`ADMIN_ACCESS_TOKEN_EXPIRES_IN`, default 15m) plus an opaque refresh token whose **SHA-256 hash** is stored in `AdminSession` (7-day TTL via a MongoDB TTL index on `expiresAt`). Refresh **rotates** the token: the old session is marked `revokedAt`, linked via `replacedBySessionId` to a new session. `createAdmin` generates a random temporary password and emails it, forcing `mustChangePassword: true`.
- **Side effects:** Emits `ADMIN_CREATED` to the `/admin` Socket.IO namespace; sends a welcome email (inline HTML via Brevo directly, not through the queued `infrastructure/emailService.js` path).
- **Known gap:** `resetPassword` always throws `BadRequestError("Password reset not fully implemented yet")` — the request-reset endpoint emails a reset link, but the corresponding reset step has no working implementation (no token store was wired up). See [Known Unknowns](#system-limitations--known-unknowns).

### `auth/user` — User Authentication

- **Purpose:** Passwordless, OTP-based signup/signin and profile access for `User` accounts.
- **Files:** `user.auth.routes.js`, `user.auth.controller.js`, `user.auth.service.js`, `user.auth.validator.js`, `user.model.js`, `userAuthChallenge.model.js`, `userSession.model.js`.
- **Auth:** Signup/signin/verify/refresh/logout are public (rate-limited); profile get/update require a user JWT.
- **Business logic:** A 6-digit numeric OTP (`generateOTP`) is generated, SHA-256 hashed, and stored in `UserAuthChallenge` with a 5-minute TTL (`SECURITY.OTP_EXPIRY_MINUTES`) and a max-attempts guard (`SECURITY.OTP_MAX_ATTEMPTS = 5`). Signup stores the full pending registration payload (`pendingUserData`) on the challenge document and only creates the `User` once the OTP is verified. Signin/signup responses intentionally return success even for a non-existent or inactive email, to avoid user enumeration. Sessions follow the same hashed-refresh-token + rotation pattern as admin auth (`UserSession`, 7-day TTL).
- **Side effects:** Emits `USER_NEW` to the admin Socket.IO namespace on successful signup verification.

### `admin` — Admin Account Management

- **Purpose:** CRUD/lifecycle operations on `Admin` accounts, performed _by_ other admins.
- **Files:** `admin.controller.js`, `admin.repository.js`, `admin.routes.js`, `admin.service.js`, `admin.validator.js`.
- **Auth:** All routes require an admin JWT; further gated by `USERS_READ` (list/get) or `ADMINS_MANAGE` (update/activate/deactivate); **delete requires the `super_admin` role explicitly**, not just a permission.
- **Side effects:** All mutating routes are wrapped in `auditLog(...)`. Delete is additionally protected by `adminDestructiveRateLimiter` (10 requests / 5 minutes).

### `user` — Customer Account Management (admin-facing)

- **Purpose:** Admin-side listing, soft-deletion, and activation toggling of customer (`User`) accounts.
- **Auth:** All routes require an admin JWT + `USERS_READ` (list/get) or `USERS_DELETE` (delete/activate/deactivate).
- **Business logic:** Delete is a **soft delete** (`deletedAt` timestamp on the `User` document, per `user.model.js`'s `isDeleted()` method) — not a hard Mongo deletion. Destructive rate limit applies to the delete route only.

### `category` — Food Categories

- **Purpose:** Menu category taxonomy (e.g. "Appetizers", "Desserts").
- **Auth:** List/get are public; create/update/delete require `CATEGORIES_MANAGE`.
- **Business logic:** Slug auto-generated from `name` on save if not already set. A single image upload (`uploadSingle`) is accepted on create/update, stored via ImageKit.
- **Caching:** List and detail responses are cached (10-minute TTL observed in code) under ad-hoc `cache:categories:*` keys and invalidated on any mutation.

### `food` — Menu Items

- **Purpose:** The restaurant's food catalog: pricing, availability, images, dietary flags, ratings.
- **Auth:** List/get public; create/update require `FOODS_CREATE`/`FOODS_UPDATE`; delete requires `FOODS_DELETE` + destructive rate limit.
- **Business logic:** Requires at least one image on create (`uploadMultiple`, up to 8). Slug auto-generated. Supports filtering by category, availability, vegetarian/spicy flags, free-text search (Mongo text index across name/description/ingredients/tags), and price range.
- **Caching:** List (60s TTL) and detail (300s TTL) responses cached; all food caches invalidated together via a tracked-key `Set` on mutation.

### `cart` — Shopping Cart

- **Purpose:** Per-user, single-document cart that snapshots food name/price/discount at add-time.
- **Auth:** All routes require a user JWT.
- **Business logic:** One `Cart` document per `userId` (unique index). `recalculateTotals()` recomputes subtotal/discount/total on every mutation. `merge` combines a guest-session cart into the authenticated user's cart (see `cart.validator.js` for the exact merge payload shape — not deeply inspected here).

### `order` — Orders

- **Purpose:** Converts a user's cart into a persisted, trackable order.
- **Auth:** Create/view own/cancel require a user JWT; list-all/update-status require an admin JWT + `ORDERS_READ_ALL`/`ORDERS_UPDATE_STATUS`.
- **Business logic:** `createOrder` re-validates food availability and re-reads current price/discount from the `Food` collection at order time (not trusting cart-cached prices), computes a flat 5% tax (`TAX_RATE`) on the discounted subtotal, generates a human-readable order number (`ORD-<year>-<6-digit sequence>` via the shared `Counter` model), clears the cart, and enforces a **finite state machine** for status transitions (`VALID_TRANSITIONS` in `order.service.js`) — e.g. `pending → confirmed|cancelled`, terminal states `completed`/`cancelled` accept no further transitions. Cancellation is only allowed from `pending`/`confirmed`.
- **Side effects:** Emits `order:new` / `order:confirmed` / `order:cancelled` to the admin Socket.IO namespace; sends an order-confirmation email **directly via Brevo inside `order.service.js`** (a separate, non-queued implementation from `infrastructure/emailService.js`'s `sendOrderConfirmationEmail` — see [Inconsistencies](#implementation-notes--inconsistencies)).

### `booking/table` and `booking/event` — Reservations

- **Purpose:** Table reservations and larger event bookings (weddings, corporate, etc.), each as an independent domain with its own model/status lifecycle.
- **Auth:** Creation is public but requires `recaptchaMiddleware` (server-verified reCAPTCHA token) and uses `optionalAuthMiddleware` so a logged-in user's booking is linked to their account while a guest's is not. Viewing/cancelling own bookings requires a user JWT. Admin list/update/status-update require `BOOKINGS_READ_ALL`/`BOOKINGS_UPDATE`.
- **Business logic:** `TableBooking` enforces a **partial unique MongoDB index** on `{date, time}` scoped to active statuses (`pending`/`confirmed`/`seated`) to prevent double-booking the same slot. `EventBooking` has a richer status lifecycle including `under_review`, `quotation_sent`, and `deposit_paid`, plus optional `quotationAmount`/`depositAmount` fields for admin-driven quoting.

### `review` — Reviews

- **Purpose:** Post-transaction reviews for foods, table bookings, or event bookings, with admin moderation and responses.
- **Auth:** Public read (`/food/:foodId`) and "mark helpful"; user JWT for creating/editing/deleting own reviews and listing "eligible orders"; admin JWT + `REVIEWS_MODERATE` for listing all, moderating, and responding.
- **Business logic:** One review per user per food/table-booking/event-booking, enforced by three separate **partial unique compound indexes** on the `Review` collection (scoped by `type`). `isApproved` defaults to `true` (reviews are visible immediately unless an admin moderates them out — not a pre-moderation queue by default, per the model default).

### `notice` — Notices / Announcements

- **Purpose:** CMS-style announcements (news, closures, etc.) with a draft/published/archived lifecycle.
- **Auth:** Published list + by-slug are public (cached); everything else requires admin JWT + `NOTICES_MANAGE`.
- **Business logic:** Slug auto-generated from title. Explicit `publish`/`archive` endpoints toggle `status` and set `publishedAt`.

### `billboard` — Homepage Billboard / Carousel / Popup

- **Purpose:** Manages the single "hero" billboard image, a carousel of up to 5 promotional items, and a popup image — modeled as a **singleton document** (`Billboard.getSingleton()` creates it on first read if missing).
- **Auth:** `/public` is public and cached; everything else requires admin JWT + `BILLBOARD_MANAGE`.
- **Business logic:** Carousel items are capped at 5 by a schema-level validator. Individual carousel items and the popup image each accept a single image upload.

### `visitor` — Visitor & Page-View Tracking

- **Purpose:** Lightweight, cookie/guestId-based visitor and page-view analytics capture, plus explicit consent tracking.
- **Auth:** Tracking endpoints (`/track`, `/page-view`) are public; `/page-view` uses `optionalAuthMiddleware` to associate a `userId` when available. Listing/stats require admin JWT + `ANALYTICS_READ`.
- **Models:** `Visitor` (session-level, includes geo/device fields and a `consentStatus` enum) and `PageTracking` (per-page-view).

### `analytics` — Reporting

- **Purpose:** Aggregated read-only reporting across orders, foods, bookings, reviews, and income, plus a guarded deletion flow for analytics-adjacent data.
- **Auth:** All routes require admin JWT + `ANALYTICS_READ`; deletion additionally requires `ANALYTICS_DELETE`.
- **Business logic:** Deletion is a **two-step confirmation flow** — `POST /request-deletion` then `DELETE /` — backed by the `AnalyticsDeletionConfirmation` model (password-verification timestamp, hashed confirmation code, 5-attempt cap, TTL-expiring). The `DELETE /` route is further protected by `adminDestructiveRateLimiter` and `auditLog`.

### `contact` — Contact Form

- **Purpose:** Public "contact us" message intake with spam/abuse controls and admin triage.
- **Auth:** Submission is public (`mutationRateLimiter`); everything else requires admin JWT + `USERS_READ` (read/status) or `USERS_DELETE` (delete).
- **Business logic:** Captures `ip`, `userAgent`, `referrer`; `status` lifecycle is `new → read → responded/archived`; an `isSpam` flag exists on the model (spam-detection logic itself was not located in the inspected controller/service — likely intended for future or manual use).

---

## API Reference

**Base URL:** `https://api-hoterstellar.onrender.com/api/v1` (production, per the supplied deployment URL and the app's `/api/v1` mount point in `src/app/routes.js`). Locally, this is `http://localhost:<PORT>/api/v1` (default `PORT=5000`, or `10000` per `.env.example`/`render.yaml`).

All success responses share the shape produced by `ApiResponse`/manual `res.json()` calls across controllers:

```json
{ "success": true, "statusCode": 200, "code": "OK", "message": "...", "data": {} }
```

All error responses share the shape produced by `errorHandlerMiddleware`:

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "...",
  "details": [{ "field": "...", "message": "..." }]
}
```

### Meta

| Method | Endpoint       | Access | Purpose                                                                                                         |
| ------ | -------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/ping` | Public | Basic API connectivity check, returns `{ message: "Pong" }`                                                     |
| GET    | `/health`      | Public | Process liveness (uptime, timestamp) — no dependency checks                                                     |
| GET    | `/ready`       | Public | Dependency readiness — checks MongoDB `readyState` and calls `checkRedis()`; **503** if MongoDB is disconnected |

### Auth — Admin (`/api/v1/auth/admin`)

| Method | Endpoint                  | Access                      | Purpose                                                      |
| ------ | ------------------------- | --------------------------- | ------------------------------------------------------------ |
| POST   | `/login`                  | Public, rate-limited        | Admin login → access + refresh token                         |
| POST   | `/refresh`                | Public, CSRF-protected      | Rotates refresh token → new access + refresh token           |
| POST   | `/logout`                 | Public                      | Revokes the current refresh-token session                    |
| POST   | `/request-reset-password` | Public, rate-limited        | Emails a password-reset link (enumeration-safe)              |
| POST   | `/reset-password`         | Public, rate-limited        | **Not functional** — always returns 400 (see Known Unknowns) |
| POST   | `/change-password`        | Admin JWT                   | Changes own password, revokes all sessions                   |
| POST   | `/create`                 | Admin JWT + `ADMINS_MANAGE` | Creates a new admin with a temp password, emails it          |

### Auth — User (`/api/v1/auth/user`)

| Method | Endpoint         | Access                 | Purpose                                                |
| ------ | ---------------- | ---------------------- | ------------------------------------------------------ |
| POST   | `/signup`        | Public, rate-limited   | Starts signup, emails a 6-digit OTP                    |
| POST   | `/signup/verify` | Public, rate-limited   | Confirms OTP, creates the `User`, returns tokens       |
| POST   | `/signin`        | Public, rate-limited   | Starts signin, emails a 6-digit OTP (enumeration-safe) |
| POST   | `/signin/verify` | Public, rate-limited   | Confirms OTP, returns tokens                           |
| POST   | `/refresh`       | Public, CSRF-protected | Rotates refresh token                                  |
| POST   | `/logout`        | Public                 | Revokes the current refresh-token session              |
| GET    | `/profile`       | User JWT               | Returns the authenticated user's profile               |
| PUT    | `/profile`       | User JWT               | Updates the authenticated user's profile               |

### Admin Accounts (`/api/v1/admin`) — all routes require admin JWT

| Method | Endpoint          | Permission                                  | Purpose          |
| ------ | ----------------- | ------------------------------------------- | ---------------- |
| GET    | `/`               | `USERS_READ`                                | List admins      |
| GET    | `/:id`            | `USERS_READ`                                | Get one admin    |
| PUT    | `/:id`            | `ADMINS_MANAGE`                             | Update admin     |
| PATCH  | `/:id/deactivate` | `ADMINS_MANAGE`                             | Deactivate admin |
| PATCH  | `/:id/activate`   | `ADMINS_MANAGE`                             | Activate admin   |
| DELETE | `/:id`            | `super_admin` role + destructive rate limit | **Delete admin** |

### Customer Accounts (`/api/v1/users`) — all routes require admin JWT

| Method | Endpoint          | Permission                              | Purpose              |
| ------ | ----------------- | --------------------------------------- | -------------------- |
| GET    | `/`               | `USERS_READ`                            | List users           |
| GET    | `/:id`            | `USERS_READ`                            | Get one user         |
| DELETE | `/:id`            | `USERS_DELETE` + destructive rate limit | **Soft-delete user** |
| PATCH  | `/:id/deactivate` | `USERS_DELETE`                          | Deactivate user      |
| PATCH  | `/:id/activate`   | `USERS_DELETE`                          | Activate user        |

### Categories (`/api/v1/categories`)

| Method | Endpoint | Access                                               | Purpose                        |
| ------ | -------- | ---------------------------------------------------- | ------------------------------ |
| GET    | `/`      | Public, cached                                       | List categories                |
| GET    | `/:id`   | Public                                               | Get one category               |
| POST   | `/`      | Admin + `CATEGORIES_MANAGE`                          | Create category (image upload) |
| PUT    | `/:id`   | Admin + `CATEGORIES_MANAGE`                          | Update category                |
| DELETE | `/:id`   | Admin + `CATEGORIES_MANAGE` + destructive rate limit | **Delete category**            |

### Foods (`/api/v1/foods`)

| Method | Endpoint | Access                                          | Purpose                          |
| ------ | -------- | ----------------------------------------------- | -------------------------------- |
| GET    | `/`      | Public, cached                                  | List/search/filter foods         |
| GET    | `/:id`   | Public                                          | Get one food                     |
| POST   | `/`      | Admin + `FOODS_CREATE`                          | Create food (multi-image upload) |
| PUT    | `/:id`   | Admin + `FOODS_UPDATE`                          | Update food                      |
| DELETE | `/:id`   | Admin + `FOODS_DELETE` + destructive rate limit | **Delete food**                  |

### Cart (`/api/v1/cart`) — all routes require user JWT

| Method | Endpoint         | Purpose                                  |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/`              | Get current cart                         |
| POST   | `/items`         | Add item                                 |
| PUT    | `/items/:foodId` | Update item quantity/instructions        |
| DELETE | `/items/:foodId` | Remove item                              |
| DELETE | `/`              | Clear cart                               |
| POST   | `/merge`         | Merge a guest cart into the account cart |

### Orders (`/api/v1/orders`)

| Method | Endpoint      | Access                         | Purpose                                          |
| ------ | ------------- | ------------------------------ | ------------------------------------------------ |
| POST   | `/`           | User JWT                       | Create order from cart                           |
| GET    | `/my-orders`  | User JWT                       | List own orders                                  |
| GET    | `/:id`        | User JWT                       | Get own order                                    |
| POST   | `/:id/cancel` | User JWT                       | Cancel own order                                 |
| GET    | `/`           | Admin + `ORDERS_READ_ALL`      | List all orders                                  |
| PATCH  | `/:id/status` | Admin + `ORDERS_UPDATE_STATUS` | **Update order status** (state-machine enforced) |

### Table Bookings (`/api/v1/bookings/table`)

| Method | Endpoint       | Access                             | Purpose               |
| ------ | -------------- | ---------------------------------- | --------------------- |
| POST   | `/`            | Public (optional auth) + reCAPTCHA | Create table booking  |
| GET    | `/my-bookings` | User JWT                           | List own bookings     |
| GET    | `/:id`         | Public (optional auth)             | Get booking by id     |
| POST   | `/:id/cancel`  | User JWT                           | Cancel own booking    |
| GET    | `/`            | Admin + `BOOKINGS_READ_ALL`        | List all bookings     |
| PUT    | `/:id`         | Admin + `BOOKINGS_UPDATE`          | Update booking        |
| PATCH  | `/:id/status`  | Admin + `BOOKINGS_UPDATE`          | Update booking status |

### Event Bookings (`/api/v1/bookings/event`)

Identical route shape to Table Bookings (same access pattern), operating on `EventBooking`.

### Reviews (`/api/v1/reviews`)

| Method | Endpoint                        | Access                     | Purpose                             |
| ------ | ------------------------------- | -------------------------- | ----------------------------------- |
| GET    | `/food/:foodId`                 | Public                     | Public approved reviews for a food  |
| POST   | `/:id/helpful`                  | Public                     | Mark a review helpful               |
| GET    | `/eligible-orders`              | User JWT                   | Orders/bookings eligible for review |
| GET    | `/my-reviews`                   | User JWT                   | List own reviews                    |
| POST   | `/food` \| `/table` \| `/event` | User JWT                   | Submit a review                     |
| PUT    | `/:id`                          | User JWT                   | Update own review                   |
| DELETE | `/:id`                          | User JWT                   | Delete own review                   |
| GET    | `/`                             | Admin + `REVIEWS_MODERATE` | List all reviews                    |
| PATCH  | `/:id/moderate`                 | Admin + `REVIEWS_MODERATE` | Approve/reject review               |
| POST   | `/:id/respond`                  | Admin + `REVIEWS_MODERATE` | Post an admin response              |

### Notices (`/api/v1/notices`)

| Method | Endpoint       | Access                                            | Purpose                      |
| ------ | -------------- | ------------------------------------------------- | ---------------------------- |
| GET    | `/published`   | Public, cached                                    | List published notices       |
| GET    | `/slug/:slug`  | Public                                            | Get notice by slug           |
| GET    | `/`            | Admin + `NOTICES_MANAGE`                          | List all notices             |
| POST   | `/`            | Admin + `NOTICES_MANAGE`                          | Create notice (image upload) |
| GET    | `/:id`         | Admin + `NOTICES_MANAGE`                          | Get notice by id             |
| PUT    | `/:id`         | Admin + `NOTICES_MANAGE`                          | Update notice                |
| DELETE | `/:id`         | Admin + `NOTICES_MANAGE` + destructive rate limit | **Delete notice**            |
| PATCH  | `/:id/publish` | Admin + `NOTICES_MANAGE`                          | Publish notice               |
| PATCH  | `/:id/archive` | Admin + `NOTICES_MANAGE`                          | Archive notice               |

### Billboards (`/api/v1/billboards`)

| Method | Endpoint             | Access                     | Purpose                              |
| ------ | -------------------- | -------------------------- | ------------------------------------ |
| GET    | `/public`            | Public, cached             | Public billboard/carousel/popup data |
| GET    | `/`                  | Admin + `BILLBOARD_MANAGE` | Get raw billboard document           |
| PUT    | `/`                  | Admin + `BILLBOARD_MANAGE` | Update billboard hero image          |
| POST   | `/carousels`         | Admin + `BILLBOARD_MANAGE` | Add a carousel item (image upload)   |
| PUT    | `/carousels/:imgId`  | Admin + `BILLBOARD_MANAGE` | Update a carousel item               |
| DELETE | `/carousels/:imgId`  | Admin + `BILLBOARD_MANAGE` | Remove a carousel item               |
| PUT    | `/carousels/reorder` | Admin + `BILLBOARD_MANAGE` | Reorder carousel items               |
| PUT    | `/popup`             | Admin + `BILLBOARD_MANAGE` | Update popup image                   |

### Visitors (`/api/v1/visitors`)

| Method | Endpoint      | Access                   | Purpose                     |
| ------ | ------------- | ------------------------ | --------------------------- |
| POST   | `/track`      | Public                   | Track a new visitor session |
| POST   | `/page-view`  | Public (optional auth)   | Track a page view           |
| GET    | `/`           | Admin + `ANALYTICS_READ` | List visitors               |
| GET    | `/page-views` | Admin + `ANALYTICS_READ` | List page views             |
| GET    | `/stats`      | Admin + `ANALYTICS_READ` | Visitor statistics          |

### Analytics (`/api/v1/analytics`) — all routes require admin JWT + `ANALYTICS_READ`

| Method | Endpoint            | Extra permission                            | Purpose                           |
| ------ | ------------------- | ------------------------------------------- | --------------------------------- |
| GET    | `/orders`           | —                                           | Order analytics                   |
| GET    | `/foods`            | —                                           | Food analytics                    |
| GET    | `/bookings`         | —                                           | Booking analytics                 |
| GET    | `/reviews`          | —                                           | Review analytics                  |
| GET    | `/income`           | —                                           | Income analytics                  |
| POST   | `/request-deletion` | `ANALYTICS_DELETE`                          | Step 1 of guarded deletion        |
| DELETE | `/`                 | `ANALYTICS_DELETE` + destructive rate limit | **Step 2: delete analytics data** |

### Contact (`/api/v1/contact`)

| Method | Endpoint      | Access                                          | Purpose                |
| ------ | ------------- | ----------------------------------------------- | ---------------------- |
| POST   | `/`           | Public, mutation-rate-limited                   | Submit contact message |
| GET    | `/`           | Admin + `USERS_READ`                            | List messages          |
| GET    | `/:id`        | Admin + `USERS_READ`                            | Get message            |
| PATCH  | `/:id/status` | Admin + `USERS_READ`                            | Update status          |
| DELETE | `/:id`        | Admin + `USERS_DELETE` + destructive rate limit | **Delete message**     |

---

## API Access Matrix

### Fully public endpoints (no auth token needed)

`GET /ping`, `GET /health`, `GET /ready`, admin/user login-flow endpoints (`login`, `signup`, `signin`, `*/verify`, `refresh`, `logout`, `request-reset-password`, `reset-password`), `GET /categories`, `GET /categories/:id`, `GET /foods`, `GET /foods/:id`, `POST /bookings/table`, `POST /bookings/event`, `GET /bookings/table/:id`, `GET /bookings/event/:id`, `GET /reviews/food/:foodId`, `POST /reviews/:id/helpful`, `GET /notices/published`, `GET /notices/slug/:slug`, `GET /billboards/public`, `POST /visitors/track`, `POST /visitors/page-view`, `POST /contact`.

### User-authenticated endpoints

All `/cart/*`, `/orders` (create/own/cancel), `/bookings/{table,event}/my-bookings` and `/:id/cancel`, `/reviews` (create/own/eligible-orders), `/auth/user/profile` (GET/PUT).

### Admin-authenticated endpoints (any admin role)

All routes under `/admin`, `/users`, and admin-side routes on `categories`, `foods`, `cart`-adjacent `orders` listing, `bookings/*` listing/update, `reviews` moderation, `notices` management, `billboards` management, `visitors` listing/stats, `analytics` read, `contact` management — each additionally gated by the specific `PERMISSIONS` value shown in the API Reference tables above (Manager/Admin/Super Admin differ by which permissions their role includes).

### Permission-restricted / destructive endpoints (require `super_admin` role specifically, not just a permission)

`DELETE /admin/:id` — the only route in the codebase gated by `requireRoles([ROLES.SUPER_ADMIN])` rather than a `PERMISSIONS` check.

### Rate-limit-hardened destructive endpoints (`adminDestructiveRateLimiter`, 10 req / 5 min)

`DELETE /admin/:id`, `DELETE /categories/:id`, `DELETE /foods/:id`, `DELETE /notices/:id`, `DELETE /users/:id`, `DELETE /contact/:id`, `DELETE /analytics`.

---

## Authentication Architecture

> **Simple:** Admins and customers log in separately and get a short-lived "access pass" (JWT) plus a longer-lived "renewal ticket" (refresh token) so they don't have to log in again every 15 minutes.
>
> **Technical:** The system runs **two entirely independent JWT authentication tracks** — Admin and User — with separate secrets (`ADMIN_JWT_SECRET`/`USER_JWT_SECRET`), separate session collections (`AdminSession`/`UserSession`), and separate `createAuthMiddleware(secret, getUserById)` instances per module.

**Access tokens:** signed with `jsonwebtoken`, default 15-minute expiry (`ADMIN_ACCESS_TOKEN_EXPIRES_IN` / `USER_ACCESS_TOKEN_EXPIRES_IN`), carried via `Authorization: Bearer <token>` header. Payload includes `sub`, `adminId`/`userId`, `role` (admin only), and `type`.

**Refresh tokens:** a 48-byte random hex string (`generateRandomToken(48)`), returned to the client in the JSON response body (not solely via a cookie in the inspected controller flow — though `cookie.utils.js` provides helper functions for setting a refresh-token cookie, and a CSRF cookie/protection layer is wired to the refresh endpoints, implying a cookie-based flow is intended). Only the **SHA-256 hash** of the refresh token is stored server-side (`AdminSession.refreshTokenHash` / `UserSession.refreshTokenHash`, both `select: false` fields). Refresh **rotates**: every `/refresh` call revokes the old session and issues a brand-new one, linked via `replacedBySessionId` — this gives you refresh-token reuse detection potential (an already-revoked token being presented again is a signal of theft), though no explicit reuse-detection _response_ (e.g. revoking all sessions) was found in the inspected code.

**Sessions expire** via native MongoDB TTL indexes (`expireAfterSeconds: 0` on `expiresAt`) — 7 days (`SECURITY.REFRESH_TOKEN_EXPIRY_DAYS`).

**Logout** revokes the session matching the presented refresh token (sets `revokedAt`); a missing/absent refresh token on logout is treated as a no-op success.

**User signup/signin have no password** — they use a 6-digit, SHA-256-hashed, time-boxed, attempt-limited OTP delivered by email (`UserAuthChallenge`). Admin accounts use bcrypt-hashed passwords.

**Authentication vs. Authorization:** `createAuthMiddleware` (in `auth.base.middleware.js`) handles _authentication_ — it verifies the JWT, loads the corresponding `Admin`/`User` document, rejects deactivated accounts, and attaches `req.auth = { ...payload, user }`. `requirePermission` / `requireRoles` (in `authorize.middleware.js`) handle _authorization_ — they read `req.auth.user.role` and check it against the `ROLE_PERMISSIONS` map or an explicit role allow-list. Authentication always runs first in the route's middleware chain.

**CSRF protection** (`csrf.middleware.js`) is a double-submit-cookie scheme (`csrf_token` httpOnly cookie + `x-csrf-token` header/body field, compared for equality) applied only to the two refresh endpoints — see the ordering caveat in [Request Lifecycle](#request-lifecycle).

---

## Authorization / RBAC

`src/constants/roles.js` defines the roles; `src/constants/permissions.js` defines the permission catalog and the **role → permissions** map (`ROLE_PERMISSIONS`), which is the single source of truth `requirePermission` middleware consults.

| Permission                                       | Super Admin | Admin | Manager |
| ------------------------------------------------ | ----------: | ----: | ------: |
| `admins.manage`                                  |          ✅ |    ❌ |      ❌ |
| `users.read`                                     |          ✅ |    ✅ |      ❌ |
| `users.delete`                                   |          ✅ |    ✅ |      ❌ |
| `foods.create` / `foods.update` / `foods.delete` |          ✅ |    ✅ |      ❌ |
| `categories.manage`                              |          ✅ |    ✅ |      ❌ |
| `orders.read.all` / `orders.update.status`       |          ✅ |    ✅ |      ✅ |
| `bookings.read.all` / `bookings.update`          |          ✅ |    ✅ |      ✅ |
| `reviews.moderate`                               |          ✅ |    ✅ |      ❌ |
| `notices.manage`                                 |          ✅ |    ✅ |      ❌ |
| `billboard.manage`                               |          ✅ |    ✅ |      ❌ |
| `analytics.read`                                 |          ✅ |    ✅ |      ✅ |
| `analytics.delete`                               |          ✅ |    ❌ |      ❌ |

_(`ORDERS_CANCEL_OWN` and `REVIEWS_CREATE` are declared in `PERMISSIONS` but not referenced by `ROLE_PERMISSIONS` or any route middleware in the inspected code — user-side "own" actions are instead gated purely by JWT ownership checks, not by these permission constants.)_

`requireOwnership(resourceUserIdGetter)` exists in `authorize.middleware.js` as a generic ownership-check helper but was **not found wired into any route** in the inspected codebase — ownership checks for orders/bookings/reviews are instead implemented inline inside each service function (e.g. `order.service.js` compares `order.userId` to the authenticated `userId`).

---

## Security Architecture

| Layer               | Mechanism                                                                                                                                        | Protects against                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| HTTP headers        | `helmet()` + custom `securityHeadersMiddleware` (X-Content-Type-Options, HSTS in prod, X-Frame-Options: DENY, CSP)                               | MIME-sniffing, clickjacking, some XSS/injection vectors, protocol downgrade |
| CORS                | Origin allow-list from `CORS_ORIGINS` env var, credentials enabled                                                                               | Unauthorized cross-origin browser requests                                  |
| Input sanitization  | `sanitizeRequestMiddleware` strips null bytes / control characters from body, query, params                                                      | Null-byte / control-character injection                                     |
| Schema validation   | Zod schemas via `validateBody`/`validateQuery` on nearly every mutating and many read routes                                                     | Malformed/unexpected payloads reaching services                             |
| ObjectId validation | `validateObjectIdParam` middleware on `:id`-style routes                                                                                         | Mongoose `CastError` crashes / injection via malformed ids                  |
| Rate limiting       | Four tiers: global (500/15min), auth (20/5min), mutation (30/10min), admin-destructive (10/5min) — all via `express-rate-limit`                  | Brute force, credential stuffing, API abuse                                 |
| Authentication      | JWT (admin/user), hashed+rotated refresh tokens                                                                                                  | Unauthorized access, token replay after logout                              |
| Authorization       | Permission- and role-based middleware (`requirePermission`, `requireRoles`)                                                                      | Privilege escalation across the three admin roles                           |
| CSRF                | Double-submit cookie on the two refresh endpoints                                                                                                | Cross-site request forgery against session renewal                          |
| reCAPTCHA           | `recaptchaMiddleware` on public table/event booking creation                                                                                     | Automated/bot booking spam                                                  |
| Audit logging       | `auditLog(action)` middleware on essentially every admin mutation                                                                                | Lack of accountability for sensitive admin actions                          |
| Password security   | bcrypt, 12 salt rounds, `select: false` on the field, stripped from every JSON/object output via `base.model.js`'s `toJSON`/`toObject` transform | Password exposure in API responses or logs                                  |
| Upload validation   | `multer` memory storage, MIME allow-list (JPEG/PNG/WebP/GIF), 5MB size cap, file-count caps                                                      | Malicious file upload, resource exhaustion                                  |
| Secret handling     | `.env`-based, Zod-validated at boot (`env.js`), hard-fails in production if critical secrets are missing (`production.js`)                       | Missing/weak configuration reaching production                              |
| Log redaction       | `pino` logger configured to redact `password`, `accessToken`, `refreshToken`, `otp`, `token`, `Authorization`/`Cookie` headers                   | Sensitive data leaking into logs                                            |

The codebase does **not** claim to be "enterprise-grade" or "unhackable" anywhere, and this document avoids that framing too — the above is a description of the mechanisms actually present, not a security guarantee.

---

## Database Architecture

**Technology:** MongoDB via Mongoose 9 (`src/config/database.js`). Connection uses `maxPoolSize: 50`, `minPoolSize: 5`, a 10s server-selection timeout, a 45s socket timeout, IPv4-only (`family: 4`), and `autoIndex` enabled only in development.

**Shared conventions** (`src/models/base.model.js`):

- Every model uses `baseSchemaOptions`: `timestamps: true` (adds `createdAt`/`updatedAt`), and a `toJSON`/`toObject` transform that strips `__v`, `password`, and `refreshTokenHash` from every serialized document.
- `paginatePlugin` adds a reusable `Model.paginate(filter, {page, limit, sort, select})` static, though most modules implement their own inline pagination in the service layer rather than using this plugin (its actual usage across modules was not exhaustively traced).
- `Counter` (`src/models/counter.model.js`) is a shared atomic-sequence collection used to generate order numbers (`ORD-<year>-<seq>`) and could be reused for other sequential identifiers.

**Collections (Mongoose models found):** `Admin`, `AdminSession`, `User`, `UserAuthChallenge`, `UserSession`, `Category`, `Food`, `Cart`, `Order`, `TableBooking`, `EventBooking`, `Review`, `Notice`, `Billboard`, `Visitor`, `PageTracking`, `Contact`, `AnalyticsDeletionConfirmation`, `Counter`.

**Conceptual relationships:**

```text
Admin ──1:N──► AdminSession
Admin ──1:N──► Order.statusHistory[].byAdminId (audit trail, not a hard FK)
User  ──1:N──► UserSession
User  ──1:1──► Cart                      (unique index on userId)
User  ──1:N──► Order, TableBooking*, EventBooking*, Review
Food  ──N:1──► Category
Order.items[] ──N:1──► Food (snapshotted, not a live reference for pricing)
Review ──N:1──► Food | TableBooking | EventBooking (exactly one, by `type`)  ──N:1──► Order (optional, via orderId)
Billboard ── singleton document (one row) with an embedded Carousels[] array
```

`*` TableBooking/EventBooking's `userId` is optional (`default: null`) — guest bookings are supported.

**Indexes of note:** compound/partial-unique indexes enforcing "one active table booking per date/time" and "one review per user per food/booking" are implemented at the MongoDB level (not just application logic), which is a meaningfully stronger guarantee than an app-side check alone.

**Soft delete:** only `User` implements soft delete (`deletedAt` field + `isDeleted()` method). All other "delete" operations found in routes appear to be hard deletes at the Mongoose level (not independently verified for every single service function in this pass — treat as **Derived**, not exhaustively **Verified**, for modules whose service file was not opened in full).

**Transactions:** no use of Mongoose sessions/`withTransaction` was found in the files inspected — multi-document operations (e.g. order creation touching `Cart`, `Food`, `Counter`, and `Order`) are **not wrapped in a MongoDB transaction** in the code paths reviewed.

---

## Caching (Redis)

> **Simple:** Redis is a fast, temporary storage the API uses to avoid re-querying MongoDB for things that don't change often (like the menu). If Redis is down, the API just answers a little slower — it doesn't break.
>
> **Technical:** `src/config/redis.js` wraps the **Upstash Redis REST client** (`@upstash/redis`), used purely as a cache layer. `isRedisReady()` gates every cache read/write in `src/utils/cache.js`, so `getCache`/`setCache`/`deleteCache` are no-ops (returning `null`/undefined) whenever Redis isn't connected — callers never need to branch on Redis availability themselves.

**Cached resources (confirmed by service-file inspection):**
| Resource | TTL | Key pattern actually used | Invalidated on |
|---|---|---|---|
| Foods list | 60s | `cache:foods:list:*` (query-dependent) | Any food create/update/delete |
| Food detail | 300s | `cache:foods:<id>` | That food's update/delete |
| Categories list/detail | 600s | `cache:categories:*` | Any category mutation |
| Notices list/detail | 120s / 300s | `cache:notices:*` | Create/update/delete/publish/archive |
| Public billboard | 300s | a single `BILLBOARD_CACHE_KEY` | Any billboard/carousel/popup mutation |

Cache keys are built ad hoc inside each service file with a `cache:<domain>:*` convention — see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies) regarding the separate, apparently-unused `CACHE_KEYS` constants module.

**Fallback behavior:** on any Redis error (including a completely absent client), cache functions log a warning and return as if the cache were empty — the request falls through to MongoDB. There is no separate "stale-while-revalidate" logic; a cache miss is always a synchronous DB read.

---

## Queues and Background Workers

> **Simple:** Instead of making a customer wait for an email to send, the API drops a "job" in a queue and a separate worker process picks it up and sends the email in the background.
>
> **Technical:** `src/config/queue.js` uses **BullMQ** over a **second, separate native Redis connection** (`ioredis`, `UPSTASH_REDIS_NATIVE_URL`) — distinct from the REST-based cache connection above, because BullMQ requires a persistent TCP Redis connection, not a REST API.

**Queues (`QUEUE_NAMES`):** `email`, `analyticsRollup`, `mediaCleanup`. Each queue is created lazily on first use, with `defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 50, removeOnFail: 200 }`.

**Producers → Workers:**
| Queue | Enqueued from | Processor | Concurrency (per `server.js`/`worker.js`) |
|---|---|---|---|
| `email` | `infrastructure/emailService.js` (`enqueueEmail`) | `src/jobs/email/email.worker.js` → calls `sendEmail` (Brevo) | 5 (per `worker.js`) |
| `analyticsRollup` | Not found invoked from any HTTP route in the inspected code — appears to require manual/external triggering (e.g. a cron job hitting the queue directly, or a scheduler not present in this repo) | `src/jobs/analytics/analyticsRollup.worker.js` (daily/weekly/monthly rollups over `Order`/`Visitor`/`PageTracking`) | 2 |
| `mediaCleanup` | `src/jobs/media/mediaCleanup.worker.js` exports `enqueueMediaCleanup(fileId)`, but no call site for it was found in the inspected controllers/services (image _replacement_ logic wasn't traced exhaustively) | `src/jobs/media/mediaCleanup.worker.js` — checks if a file is still referenced by Food/Category/Notice/Billboard before deleting it from ImageKit | 3 |

**Failure handling:** BullMQ's built-in retry/backoff (3 attempts, exponential). Worker-level `completed`/`failed`/`error` events are logged. If the native Redis connection is unavailable, `getQueue`/`getWorker` return `null` and the caller logs a warning and continues (jobs are effectively dropped rather than queued when Redis is down — there is no local fallback queue).

**API vs. Worker separation:** the API process (`server.js`) also calls `getQueue(...)` at startup to pre-warm the three queues, but only the worker process (`worker.js`) calls `getWorker(...)` to actually _consume_ jobs — so queued jobs sit idle until the separate worker deployment is running.

---

## Email System

> **Simple:** Emails (OTP codes, order confirmations, booking confirmations, admin notifications) are sent through Brevo, a third-party email API — not by directly using SMTP from this server.
>
> **Technical:** `src/config/brevo.js` wraps Brevo's REST API (account verification + `/v3/smtp/email` send). `verifyBrevoOnStartup()` is called once at boot; if `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` are missing or the verification call fails, `isBrevoConfigured()` returns `false` for the life of the process and all email sends become silent no-ops (logged as warnings).

| Event                                      | Recipient                                             | Template / Source                                                                                                       | Trigger                                                                              | Delivery path                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin welcome (new admin created)          | New admin                                             | `adminWelcomeTemplate` (via `emailService.js`) **and** an inline HTML string in `admin.auth.service.js`'s `createAdmin` | `POST /auth/admin/create`                                                            | `admin.auth.service.js` sends inline/direct; `emailService.js`'s `sendAdminWelcomeEmail` (queued) appears to be a parallel, unused implementation — see Inconsistencies |
| Admin password reset link                  | Admin                                                 | Inline HTML in `admin.auth.service.js`                                                                                  | `POST /auth/admin/request-reset-password`                                            | Direct (not queued)                                                                                                                                                     |
| User OTP (signup)                          | User                                                  | Inline HTML in `user.auth.service.js`'s `sendOTPEmail`                                                                  | `POST /auth/user/signup`                                                             | Direct (not queued)                                                                                                                                                     |
| User OTP (signin)                          | User                                                  | Same                                                                                                                    | `POST /auth/user/signin`                                                             | Direct (not queued)                                                                                                                                                     |
| Order confirmation                         | Customer                                              | Inline HTML in `order.service.js`                                                                                       | `POST /orders` (successful creation)                                                 | Direct (not queued) — see Inconsistencies vs. `emailService.js`'s queued equivalent                                                                                     |
| Order status update                        | Customer                                              | `orderStatusUpdateTemplate` (via `emailService.js`)                                                                     | Not found called from `order.service.js`'s `updateOrderStatus` in the inspected code | Would be queued, if wired up                                                                                                                                            |
| Table/event booking confirmation           | Customer                                              | `tableBookingConfirmationTemplate` / `eventBookingConfirmationTemplate` (via `emailService.js`)                         | Not found called from the inspected booking service/controller files                 | Would be queued, if wired up                                                                                                                                            |
| Admin new-order / new-booking notification | `ADMIN_NOTIFICATION_EMAILS` (comma-separated env var) | `adminNewOrderNotificationTemplate` / `adminNewBookingNotificationTemplate` (via `emailService.js`)                     | Not found called from the inspected order/booking services                           | Would be queued, if wired up                                                                                                                                            |

`src/infrastructure/emailService.js` defines a complete, well-structured, **queue-based** email API (`enqueueEmail` + one helper per event, using the templates in `src/emails/templates/`), but several of the individual services (`admin.auth.service.js`, `user.auth.service.js`, `order.service.js`) instead send email **directly and synchronously** via `getBrevoClient()` with hand-written inline HTML, bypassing both the queue and the shared templates. This split is documented under [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies) rather than presented as a single unified pipeline, because the code does not actually behave as one.

---

## File Uploads and Media Storage

**Middleware:** `src/middlewares/upload.middleware.js` — `multer` with **in-memory storage** (files never touch disk on the API server), a 5MB per-file cap, an 8-file cap for multi-upload routes, and a MIME allow-list of `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Three exported middlewares: `uploadSingle` (field name `image`), `uploadMultiple` (field name `images`, up to 8), `uploadFields` (unused by any route in the inspected code).

**Storage provider:** ImageKit (`src/config/storage.js`), via `@imagekit/nodejs`. `uploadToImageKit(buffer, fileName, folder)` base64-encodes the buffer and uploads with `useUniqueFileName: true`; `deleteFromImageKit(fileId)` removes a file.

**Modules using uploads:** `category` (single), `food` (multiple, ≥1 required on create), `notice` (single), `billboard` (single, for carousel items and the popup image).

**Cleanup:** `src/jobs/media/mediaCleanup.worker.js` provides reference-counting cleanup (checks `Food.images.fileId`, `Category.imageId`, `Notice.thumbnailId`, `Billboard`'s embedded image ids before deleting from ImageKit) and an `enqueueMediaCleanup(fileId)` helper — but as noted above, no call site for `enqueueMediaCleanup` was found in the inspected create/update/delete flows, so it's unclear whether old images are actually cleaned up automatically today, or whether this worker is invoked manually/administratively. Treat automatic cleanup-on-replace as **unverified**.

---

## Realtime (Socket.IO)

`src/config/socket.js` attaches a Socket.IO server to the same HTTP server as the REST API (same port). Only one namespace is defined: **`/admin`**, protected by a JWT-verification `use()` middleware that accepts the token via `socket.handshake.auth.token` or an `Authorization: Bearer` header, verified against `ADMIN_JWT_SECRET`. Authenticated admin sockets are auto-joined to a `role:<role>` room. No customer-facing namespace exists in the inspected code.

**Events emitted** (`src/constants/socketEvents.js`, emitted via `src/utils/socketEmitter.js`'s `emitAdminEvent`): order lifecycle (`order:new/confirmed/cancelled`), user signup (`user:new`), table/event booking lifecycle, reviews (`review:new` — constant defined, emission call site not confirmed), admin lifecycle (`admin:created`/`admin:deleted` — deletion emission not confirmed), food/category CRUD events (constants defined; emission call sites for food/category were not exhaustively traced), visitor/consent events, contact/notice events (constants defined; emission not exhaustively traced). Confirmed emission call sites in the files inspected: `ADMIN_CREATED` (admin.auth.service.js), `USER_NEW` (user.auth.service.js), `ORDER_NEW`/`ORDER_CONFIRMED`/`ORDER_CANCELLED` (order.service.js).

---

## Health Checks and Readiness

### `GET /health`

Always returns **200** if the process is running and able to respond — it does **not** check MongoDB, Redis, or any dependency. Body: `{ success: true, data: { uptime, timestamp } }`.

### `GET /ready`

Distinguishes "alive" from "actually able to serve requests":

- Checks `mongoose.connection.readyState === 1` (connected).
- Dynamically imports `checkRedis()` and pings the Upstash REST client.
- **200** only if MongoDB is connected (Redis status is reported but does _not_ gate readiness — the API is considered "ready" even with Redis down, consistent with caching being optional).
- **503** if MongoDB is disconnected, with the same dependency breakdown in the body.
- **503** with `code: "NOT_READY"` if the dependency check itself throws.

### `GET /api/v1/ping`

A trivial API-layer connectivity check (`{ message: "Pong" }`), independent of `/health`/`/ready` — useful for confirming the `/api/v1` router itself is mounted and reachable (e.g. behind a reverse proxy that might mis-route `/health`).

| Endpoint       | Purpose                                               | Expected success                            |
| -------------- | ----------------------------------------------------- | ------------------------------------------- |
| `/health`      | Process liveness                                      | `200`, `code: "OK"`                         |
| `/ready`       | Dependency readiness (Mongo required, Redis optional) | `200` when Mongo connected; `503` otherwise |
| `/api/v1/ping` | API router reachability                               | `200`, `data: null`, `message: "Pong"`      |

`render.yaml` configures `/health` as the platform health-check path for the `web` service.

---

## Error Handling

**Typed error classes** (`src/errors/`), all extending `AppError` (message, statusCode, code, isOperational):

| Class                  | Status | Code                                              |
| ---------------------- | ------ | ------------------------------------------------- |
| `BadRequestError`      | 400    | `BAD_REQUEST`                                     |
| `ValidationError`      | 400    | `VALIDATION_ERROR` (carries a `details[]` array)  |
| `AuthenticationError`  | 401    | `AUTHENTICATION_ERROR`                            |
| `AuthorizationError`   | 403    | `AUTHORIZATION_ERROR`                             |
| `NotFoundError`        | 404    | `NOT_FOUND`                                       |
| `ConflictError`        | 409    | `CONFLICT`                                        |
| `RateLimitError`       | 429    | `RATE_LIMIT`                                      |
| `DatabaseError`        | 500    | `DATABASE_ERROR` (`isOperational: false`)         |
| `ExternalServiceError` | 502    | `EXTERNAL_SERVICE_ERROR` (`isOperational: false`) |

**Central handler** (`errorHandlerMiddleware`, registered last in the middleware chain): normalizes any thrown error, with special-cased translation for Mongoose `ValidationError` (→ 400, field-level `details`), Mongoose `CastError` on an ObjectId (→ 400 `INVALID_ID`), and MongoDB duplicate-key errors (code `11000`, → 409 `DUPLICATE_KEY` with the offending field named). Errors with `statusCode >= 500` are logged at `error` level with the stack trace; a 429 is logged at `warn` level with IP/URL; everything else is not separately logged by the handler (individual services/controllers may log their own info/warn messages beforehand). In `NODE_ENV=development`, 5xx responses additionally include the stack trace in the JSON body.

**Unknown routes** are caught by a catch-all `app.use((req,res) => ...)` returning a plain `404 NOT_FOUND` JSON body, registered _before_ the error handler but _after_ all real routes.

---

## Environment Variables

Grouped from `src/config/env.js` (the authoritative Zod schema — the app **will not boot** if required variables fail validation) and `.env.example`. Real secret values are never shown here.

### Application

| Variable               | Required                                                      | Purpose                                                        | Example                                                   |
| ---------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| `NODE_ENV`             | No (default `development`)                                    | Runtime mode; gates strict production checks                   | `production`                                              |
| `PORT`                 | No (default `5000`; `.env.example`/`render.yaml` use `10000`) | HTTP listen port                                               | `10000`                                                   |
| `CLIENT_PUBLIC_URL`    | No (default `http://localhost:3000`)                          | Public frontend URL, used in startup logs and some email links | `https://hoterstellar.com`                                |
| `CLIENT_DASHBOARD_URL` | No (default `http://localhost:3001`)                          | Admin dashboard URL, used in admin welcome-email login links   | `https://admin.hoterstellar.com`                          |
| `CORS_ORIGINS`         | No (default `http://localhost:3000`)                          | Comma-separated CORS allow-list                                | `https://hoterstellar.com,https://admin.hoterstellar.com` |
| `BUSINESS_TIMEZONE`    | No (default `UTC`)                                            | Used by `utils/time.js` for business-local time formatting     | `Asia/Dhaka`                                              |

### Database

| Variable      | Required | Purpose                   |
| ------------- | -------- | ------------------------- |
| `MONGODB_URI` | **Yes**  | MongoDB connection string |

### JWT / Sessions

| Variable                        | Required                           | Purpose                                                 |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| `ADMIN_JWT_SECRET`              | **Yes**, ≥32 chars                 | Signs admin access tokens                               |
| `ADMIN_ACCESS_TOKEN_EXPIRES_IN` | No (default `15m`)                 | Admin access-token lifetime                             |
| `USER_JWT_SECRET`               | **Yes**, ≥32 chars                 | Signs user access tokens                                |
| `USER_ACCESS_TOKEN_EXPIRES_IN`  | No (default `15m`)                 | User access-token lifetime                              |
| `ADMIN_REFRESH_COOKIE_NAME`     | No (default `admin_refresh_token`) | Cookie name if/when refresh tokens are cookie-delivered |
| `USER_REFRESH_COOKIE_NAME`      | No (default `user_refresh_token`)  | Same, for users                                         |

### Redis

| Variable                   | Required                                                         | Purpose                                    |
| -------------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`   | Optional (required in `NODE_ENV=production` per `production.js`) | Upstash REST endpoint — cache layer        |
| `UPSTASH_REDIS_REST_TOKEN` | Optional (required in production)                                | REST auth token                            |
| `UPSTASH_REDIS_NATIVE_URL` | Optional (required in production)                                | Native `rediss://` URL — BullMQ connection |

### Email (Brevo)

| Variable                    | Required                                                      | Purpose                                            |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `BREVO_API_KEY`             | Optional                                                      | Brevo API key — email disabled if absent           |
| `BREVO_SENDER_EMAIL`        | Optional                                                      | Verified sender address                            |
| `BREVO_SENDER_NAME`         | Optional (default `"Hoterstellar"`)                           | Sender display name                                |
| `ADMIN_NOTIFICATION_EMAILS` | Optional (read via `process.env`, not part of the Zod schema) | Comma-separated list for admin notification emails |

### Storage (ImageKit)

| Variable                | Required | Purpose               |
| ----------------------- | -------- | --------------------- |
| `IMAGEKIT_PUBLIC_KEY`   | Optional | ImageKit public key   |
| `IMAGEKIT_PRIVATE_KEY`  | Optional | ImageKit private key  |
| `IMAGEKIT_URL_ENDPOINT` | Optional | ImageKit URL endpoint |

### reCAPTCHA

| Variable               | Required | Purpose                                                                                                                  |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `RECAPTCHA_SECRET_KEY` | Optional | Server-side verification key — **if unset, `recaptchaMiddleware` treats every token as valid** (development convenience) |
| `RECAPTCHA_SITE_KEY`   | Optional | Client-side site key (documented here for completeness; consumed by the frontend, not this API)                          |

### Seeding

| Variable                                     | Required | Purpose                                                                                               |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`   | Optional | Referenced in `env.js`'s Zod schema                                                                   |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Optional | Referenced in `.env.example` and `src/seeders/superAdmin.seeder.js` (checked _before_ `ADMIN_SEED_*`) |

> ⚠️ Two different variable-name pairs (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` vs `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`) exist for the same purpose across `env.js` and the seeder/`.env.example` — see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies).

---

## Local Development Setup

**Prerequisites:** Node.js ≥ 22, npm ≥ 10, a MongoDB instance (local or Atlas), and — optionally, for full functionality — an Upstash Redis database, a Brevo account, an ImageKit account, and a Google reCAPTCHA site/secret key pair.

```bash
# 1. Clone the repository
git clone https://github.com/abushayedgit/hoterstellar_sr.git
cd hoterstellar_sr

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# then edit .env — at minimum set MONGODB_URI, ADMIN_JWT_SECRET (32+ chars),
# USER_JWT_SECRET (32+ chars); everything else has a safe development default
# or degrades gracefully if left unset

# 4. Start MongoDB
# (run your own local MongoDB, or point MONGODB_URI at an Atlas cluster)

# 5. (Optional) seed a super-admin account + dev data
#    requires SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD (or ADMIN_SEED_EMAIL /
#    ADMIN_SEED_PASSWORD) to be set in .env
npm run seed

# 6. Run the API (auto-restarts on file change)
npm run dev

# 7. (Optional, separate terminal) run the background worker
#    requires UPSTASH_REDIS_NATIVE_URL to actually process jobs
npm run dev:worker
```

The API listens on `PORT` (default `5000` if unset). Visit `http://localhost:5000/health` to confirm it's running, and `http://localhost:5000/api/v1/ping` to confirm the API router is mounted.

---

## Development Commands

All scripts are defined in `package.json`:

| Command              | What it runs                                                             | Purpose                                                                                  |
| -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `npm run dev`        | `nodemon server.js`                                                      | API server with auto-restart                                                             |
| `npm run dev:worker` | `nodemon worker.js`                                                      | Background worker with auto-restart                                                      |
| `npm start`          | `node server.js`                                                         | Production API server                                                                    |
| `npm run worker`     | `node worker.js`                                                         | Production background worker                                                             |
| `npm run seed`       | `node src/scripts/seed.js`                                               | Seeds super-admin + dev data, then exits                                                 |
| `npm run lint`       | `eslint . --config eslint.config.mjs`                                    | Lints the codebase                                                                       |
| `npm run lint:fix`   | `eslint . --fix`                                                         | Lints and auto-fixes                                                                     |
| `npm run format`     | `prettier --write "src/**/*.js" "tests/**/*.js" "server.js" "worker.js"` | Formats source (note: formats a `tests/` glob that does not currently exist in the repo) |

No `test` script is defined in `package.json`, and no `tests/` directory exists in the repository, despite `.github/CODEOWNERS` listing `/tests/` and `dependabot.yml` grouping `jest`/`supertest`/`mongodb-memory-server` as expected dev dependencies — see [Known Unknowns](#system-limitations--known-unknowns).

---

## Docker

Two separate, near-identical single-stage Dockerfiles, both based on `node:22-alpine`:

| File                | Builds           | `CMD`            | Notes                                                                                                   |
| ------------------- | ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `Dockerfile`        | API server image | `node server.js` | `EXPOSE 10000`; installs with `npm install --omit=dev`; runs as a non-root `nodejs` user (uid/gid 1001) |
| `Dockerfile.worker` | Worker image     | `node worker.js` | Same base pattern, no `EXPOSE` (not an HTTP service)                                                    |

Both `COPY package.json ./` then `npm install` — **note:** neither Dockerfile copies `package-lock.json` before installing, so the build does not use `npm ci` and is not guaranteed to be fully lockfile-reproducible (see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies)). `.dockerignore` excludes `node_modules/`, `.env*`, logs, `coverage/`, `package-lock.json`, `.github/`, `tests/`, and — notably — `src/emails/templates/` (the email templates directory is excluded from the Docker build context, which would break email sending in a container build unless this is intentional/templates are inlined elsewhere; treat as a flagged item, not a confirmed bug).

---

## Deployment

Per `render.yaml`, deployment target is **Render**, with two services sharing this one repository:

```text
Public Frontend  ──► Vercel (hoterstellar.vercel.app)          — not in this repo
Admin Dashboard  ──► Vercel (dash-hoterstellar.vercel.app)     — not in this repo
API server       ──► Render "web" service: hoterstellar-api
                        buildCommand: npm install
                        startCommand: node server.js
                        healthCheckPath: /health
                        plan: starter, autoDeploy: true
Worker           ──► Render "worker" service: hoterstellar-worker
                        buildCommand: npm install
                        startCommand: node worker.js
                        plan: starter, autoDeploy: true
Database         ──► MongoDB (provider not specified in-repo — MONGODB_URI is env-injected)
Redis            ──► Upstash (both REST and native URLs are env-injected; provider confirmed by
                        variable naming, not by an explicit provisioning block in render.yaml)
```

Both Render services declare the same core secret environment variables (`sync: false`, meaning they're set manually in the Render dashboard, not committed): `MONGODB_URI`, JWT secrets, the three Upstash variables, Brevo, ImageKit, `CORS_ORIGINS`/client URLs (web service only), `RECAPTCHA_SECRET_KEY`/`SITE_KEY` (web service only), and `ADMIN_NOTIFICATION_EMAILS`. `BUSINESS_TIMEZONE` is hardcoded to `Asia/Dhaka` in `render.yaml` for the web service (not `sync: false`).

The supplied **backend URL** `https://api-hoterstellar.onrender.com` is consistent with a Render-hosted service named `hoterstellar-api`. The CD workflow (see below) instead deploys to `https://api.hoterstellar.com` as its recorded GitHub Environment URL — see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies) for this discrepancy.

---

## CI/CD

Four GitHub Actions workflows under `.github/workflows/`, plus Dependabot and a CODEOWNERS file.

### `ci.yml` — CI

- **Triggers:** push to `main`/`develop`/`feature/**`/`fix/**`/`refactor/**`; all pull requests into `main`/`develop`; manual dispatch.
- **`quality` job:** matrix over Node 20.x/22.x — installs deps, runs `npm run lint` (ESLint); on Node 22.x only, also runs `npm audit --audit-level=high`.
- **`syntax-check` job:** runs `node --check` against `server.js`, `worker.js`, `src/app/app.js`, every file in `src/config/`, `src/middlewares/`, and `src/utils/`; also verifies `.env.example` exists. This is a syntax-only smoke test (no actual execution, no test suite).

### `cd.yml` — CD (Production Deployment)

- **Triggers:** push to `main`; manual dispatch. Uses a `production-deployment` concurrency group (no cancel-in-progress) so deploys queue rather than race.
- **`safety-check` job:** installs deps, runs `npm audit --audit-level=high`, and `node --check` on `server.js`/`worker.js`.
- **`deploy` job:** requires `safety-check`; POSTs to a `PRODUCTION_DEPLOY_HOOK_URL` secret (a Render deploy hook) — fails loudly if that secret isn't configured. Targets a GitHub Environment `production` with URL `https://api.hoterstellar.com`.

### `codeql.yml` — CodeQL Security Analysis

- **Triggers:** push/PR to `main`/`develop`; weekly cron (`30 3 * * 1`); manual dispatch.
- Runs GitHub's CodeQL `javascript-typescript` analysis with the `security-extended` query pack, excluding `*.test.js`/`*.spec.js`/`node_modules`.

### `dependency-review.yml` — Dependency Review

- **Trigger:** pull requests into `main`/`develop`.
- Fails the check on any newly introduced dependency with a **high** severity advisory or a `GPL-3.0`/`AGPL-3.0` license.

### `dependabot.yml`

- Weekly (Monday) automated PRs for both **npm** dependencies (grouped into `production-dependencies`/`development-dependencies` buckets, with `pino` majors ≥11 explicitly ignored) and **GitHub Actions** dependencies, both capped at 10 open PRs.

### `CODEOWNERS`

- `@abushayedgit` is the default and effectively sole owner across every path listed (`/src/`, `/.github/`, `/package.json`, `/.env.example`, `/tests/`, and individually-listed config files) — there is no evidence of a broader review team in this file.

---

## Frontend Integration

The two frontend applications (`hoterstellar.vercel.app`, `dash-hoterstellar.vercel.app`) are **not part of this repository** — their source code, framework, authentication-token handling, and API-client implementation are **not verifiable from this codebase** and are not documented here. What _can_ be said, from the backend's perspective:

- `CORS_ORIGINS` and the explicit `credentials: true` CORS configuration indicate the API expects browser-based clients that send credentials (cookies) cross-origin.
- The CSRF double-submit-cookie mechanism on the refresh endpoints implies the intended frontend integration pattern is cookie-based refresh-token storage, even though the inspected controllers return the refresh token in the JSON body as well (see Inconsistencies).
- The `/admin` Socket.IO namespace expects the dashboard frontend to hold an admin JWT and pass it via `socket.handshake.auth.token` or an `Authorization` header during the WebSocket handshake.
- No OpenAPI/Swagger spec, Postman collection, or generated API client was found in this repository.

---

## Business Workflows

### User signup (OTP-based)

```text
POST /auth/user/signup (email, name, phone, ...)
  → validate payload (Zod)
  → reject if a User with that email already exists
  → reject if an unexpired signup challenge already exists for that email
  → generate 6-digit OTP, hash it, store UserAuthChallenge (5-min TTL,
    pendingUserData = full signup payload)
  → email the OTP (direct Brevo send, not queued)
POST /auth/user/signup/verify (email, code)
  → look up the matching, non-consumed, unexpired challenge
  → compare hashed code; on mismatch, increment attempts and reject
  → on match: mark challenge consumed, create the User from pendingUserData,
    issue access + refresh tokens, create a UserSession
  → emit `user:new` to the admin Socket.IO namespace
```

### Order lifecycle

```text
Customer browses foods (public, cached)
  → adds items to Cart (user JWT; snapshots food name/price/discount)
  → POST /orders
      → re-validates each food still exists and isAvailable
      → re-reads CURRENT price/discount from Food (not the cart's snapshot)
      → computes subtotal, per-item discount, 5% flat tax, totalAmount
      → generates ORD-<year>-<seq> order number via the shared Counter
      → creates the Order (status: pending, statusHistory: [pending])
      → clears the Cart
      → sends an order-confirmation email (direct Brevo send)
      → emits `order:new` to the admin Socket.IO namespace
Admin processes the order
  → PATCH /orders/:id/status { status }
      → enforced state machine: pending→confirmed|cancelled→preparing→
        ready→out_for_delivery/delivered/completed (see order.service.js
        VALID_TRANSITIONS for the exact graph)
      → appends to statusHistory with byAdminId + optional note
      → emits `order:confirmed` or `order:cancelled` on those specific transitions
Customer may cancel
  → POST /orders/:id/cancel — only while status is pending or confirmed
```

### Table booking

```text
POST /bookings/table (public or logged-in; optionalAuthMiddleware)
  → recaptchaMiddleware verifies the reCAPTCHA token server-side
  → Zod validation of date/time/guestCount/etc.
  → MongoDB partial-unique index on {date, time} (scoped to active statuses)
    prevents double-booking the same slot at the database level
  → booking created with status "pending"
Admin manages
  → PATCH /bookings/table/:id/status → statusHistory entries, admin-driven
    transitions through pending → confirmed → seated → completed (or
    cancelled/no_show at various points)
```

### Review workflow

```text
Customer completes an order / table booking / event booking
  → GET /reviews/eligible-orders (user JWT) surfaces what can be reviewed
  → POST /reviews/food | /reviews/table | /reviews/event
      → one review per user per food/booking, enforced by a partial unique
        MongoDB index scoped to `type`
      → isApproved defaults to true (visible immediately)
Admin moderation
  → PATCH /reviews/:id/moderate — admin can flip isApproved
  → POST /reviews/:id/respond — admin posts adminResponse.response
Public
  → GET /reviews/food/:foodId — public list, presumably filtered to
    isApproved:true (filter confirmed conceptually via the "public reviews"
    endpoint naming; exact filter expression not re-verified line-by-line here)
  → POST /reviews/:id/helpful — anyone can increment helpfulVotes
```

---

## Destructive Operations

| Operation              | Auth                                                                     | Rate limit                              | Audit logged                              | Soft vs. hard delete                                    |
| ---------------------- | ------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| Delete admin           | `super_admin` role (explicit, not permission-based)                      | `adminDestructiveRateLimiter` (10/5min) | ✅ `admin.delete`                         | Hard delete (Mongoose model has no soft-delete field)   |
| Soft-delete user       | `USERS_DELETE`                                                           | `adminDestructiveRateLimiter`           | ✅ `user.delete`                          | **Soft** — sets `deletedAt`                             |
| Delete category        | `CATEGORIES_MANAGE`                                                      | `adminDestructiveRateLimiter`           | ✅ `category.delete`                      | Hard delete                                             |
| Delete food            | `FOODS_DELETE`                                                           | `adminDestructiveRateLimiter`           | ✅ `food.delete`                          | Hard delete                                             |
| Delete notice          | `NOTICES_MANAGE`                                                         | `adminDestructiveRateLimiter`           | ✅ `notice.delete`                        | Hard delete                                             |
| Delete contact message | `USERS_DELETE`                                                           | `adminDestructiveRateLimiter`           | ✅ `contact.delete`                       | Hard delete                                             |
| Delete analytics data  | `ANALYTICS_DELETE` + a separate two-step password/code confirmation flow | `adminDestructiveRateLimiter`           | ✅ `analytics.delete`                     | Hard delete, guarded by `AnalyticsDeletionConfirmation` |
| Cancel order (user)    | User JWT, ownership-checked in-service                                   | `globalRateLimiter` only                | Not audit-logged (user action, not admin) | N/A — status transition, not a delete                   |

All destructive **admin** operations validate the target `:id` as a well-formed MongoDB ObjectId (`validateObjectIdParam`) before reaching the controller, and are logged via `auditLog(action)` (actor id/role/ip, resource id, method, url, response status, duration, request id) regardless of whether the operation ultimately succeeds or fails downstream.

---

## Troubleshooting

| Symptom                                                                          | Likely cause                                                                                                                            | Where to look                                                                                                                        |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Server exits immediately on boot with an "Invalid environment variables" message | A required var (`MONGODB_URI`, `ADMIN_JWT_SECRET`, `USER_JWT_SECRET`) is missing, or a JWT secret is under 32 characters                | `src/config/env.js` — the printed `fieldErrors` name the exact variable                                                              |
| Server exits with "Missing required production environment variables"            | Running with `NODE_ENV=production` but Redis/Mongo/JWT vars aren't all set                                                              | `src/config/production.js` — logs the exact missing var names                                                                        |
| Server exits with "Cannot start without MongoDB"                                 | MongoDB unreachable after 5 retries (25s)                                                                                               | Check `MONGODB_URI`, network/firewall/Atlas IP allow-list; `src/config/database.js`                                                  |
| `/ready` returns 503 but `/health` returns 200                                   | MongoDB disconnected while the process itself is alive                                                                                  | Check MongoDB connectivity; the app deliberately keeps running so it can recover/retry                                               |
| Startup log shows "Redis unavailable — Continuing without cache"                 | `UPSTASH_REDIS_REST_URL`/`TOKEN` missing or unreachable                                                                                 | This is a **non-fatal warning** — the API will run with caching disabled; verify Upstash credentials if caching is expected          |
| Emails never arrive, log shows "Brevo not configured"                            | `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` missing, or Brevo account verification failed at boot                                              | `src/config/brevo.js`; check the API key and sender email are verified in the Brevo dashboard                                        |
| CORS errors in the browser                                                       | The frontend's origin isn't in `CORS_ORIGINS`                                                                                           | `CORS_ORIGINS` env var — comma-separated, must match the origin exactly                                                              |
| `401 AUTHENTICATION_ERROR` on every admin/user request                           | Missing/expired/incorrectly-signed `Authorization: Bearer` header, or the account is `isActive: false`                                  | `src/middlewares/auth.base.middleware.js`                                                                                            |
| `403 AUTHORIZATION_ERROR` on an admin route                                      | The authenticated admin's role doesn't include the required permission                                                                  | `src/constants/permissions.js` — check `ROLE_PERMISSIONS[role]`                                                                      |
| `POST /auth/*/refresh` fails with a CSRF error                                   | Missing/mismatched `csrf_token` cookie vs `x-csrf-token` header, or the ordering issue noted in [Request Lifecycle](#request-lifecycle) | `src/middlewares/csrf.middleware.js` and `src/app/app.js`                                                                            |
| `429 RATE_LIMIT`                                                                 | Too many requests within the relevant window (global/auth/mutation/admin-destructive)                                                   | `src/middlewares/rateLimiter.middleware.js` — identify which tier applies to the endpoint hit                                        |
| File upload rejected with `BAD_REQUEST`                                          | Wrong MIME type, file too large (>5MB), or too many files (>8)                                                                          | `src/middlewares/upload.middleware.js`                                                                                               |
| Background jobs never seem to run                                                | The **worker process** isn't deployed/running separately from the API, or `UPSTASH_REDIS_NATIVE_URL` is unset                           | `worker.js` must be running as its own process; `src/config/queue.js` requires the native Redis URL specifically (not the REST URL)  |
| Admin password reset link doesn't work                                           | `POST /auth/admin/reset-password` is not implemented — it always throws                                                                 | `src/modules/auth/admin/admin.auth.service.js`'s `resetPassword` function; see [Known Unknowns](#system-limitations--known-unknowns) |
| Frontend can't reach the API at all                                              | Wrong base URL, API not deployed/awake (Render free/starter plans can spin down), or `/api/v1` prefix omitted                           | Confirm `GET /health` and `GET /api/v1/ping` both respond from the exact base URL being used                                         |

---

## Security Operations for Contributors

- Never commit `.env` — it is already `.gitignore`d; only commit `.env.example` with placeholder values.
- Never weaken or bypass `createAuthMiddleware`, `requirePermission`, or `requireRoles` "to make testing easier" — these are the only authentication/authorization boundary in the app.
- Never remove `validateBody`/`validateQuery`/`validateObjectIdParam` from a route without replacing it with an equivalent check — the error handler and downstream services assume validated input.
- Never remove `auditLog(...)` from an existing admin mutation route without a deliberate, reviewed decision — it is the only accountability trail for sensitive actions.
- Never expose an `/admin/*`, `/users/*`, or any `PERMISSIONS`-gated route without its existing auth+authorize middleware chain.
- Avoid logging raw tokens, passwords, or OTPs — `src/utils/logger.js` already redacts a specific set of field names; don't work around that by logging under a different key.
- Keep the JWT secrets (`ADMIN_JWT_SECRET`, `USER_JWT_SECRET`) at least 32 characters and rotate them independently — they are deliberately separate so a leak of one does not compromise the other actor type.
- If you touch `src/config/production.js`'s required-variable list, keep it in sync with what `bootstrap`/`server.js` actually depend on at runtime.

---

## Contribution Guide

- **Ownership:** `.github/CODEOWNERS` lists `@abushayedgit` as owner of essentially every path in the repository — PRs touching `/src/`, `/.github/`, `package.json`, or `.env.example` will request their review.
- **Branches:** `ci.yml` runs on pushes to `main`, `develop`, and `feature/**`/`fix/**`/`refactor/**` branches, and on PRs into `main`/`develop` — this implies a `feature/`, `fix/`, `refactor/` branch-naming convention feeding into a `develop` branch before `main`.
- **Code style:** ESLint (`eslint.config.mjs`) + Prettier (`.prettierrc.json`) — run `npm run lint` and `npm run format` before opening a PR.
- **Required CI checks:** `ci.yml` (lint on Node 20.x/22.x + `npm audit` on 22.x + syntax verification), `codeql.yml` (security analysis), and `dependency-review.yml` (on PRs) all run automatically.
- **No automated test suite currently exists** in this repository (see [Known Unknowns](#system-limitations--known-unknowns)) — CI's "syntax-check" job is a `node --check` smoke test, not a behavioral test suite. New contributions cannot currently rely on CI to catch logic regressions.
- **Commits:** Dependabot uses a `deps`/`ci` commit-message prefix convention for its own PRs; no equivalent convention document for human contributors was found in the repository.

---

## Maintainer Guide — "Where Do I Look?"

| I need to change...                    | Start here                                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication (admin or user)         | `src/modules/auth/{admin,user}/*.service.js` (logic), `*.routes.js` (endpoints), `src/middlewares/auth.base.middleware.js` (the shared JWT-verification factory)                                                                         |
| Permissions / roles                    | `src/constants/roles.js`, `src/constants/permissions.js` (the `ROLE_PERMISSIONS` map is the single source of truth), `src/middlewares/authorize.middleware.js`                                                                           |
| The food/menu API                      | `src/modules/food/*` (also touches `src/modules/category/*` for the FK relationship, and `src/config/storage.js` for images)                                                                                                             |
| Order logic / status machine           | `src/modules/order/order.service.js` — `VALID_TRANSITIONS` and `TAX_RATE` live here                                                                                                                                                      |
| Booking logic (table/event)            | `src/modules/booking/{table,event}/*` — note these are two fully independent modules, not a shared abstraction                                                                                                                           |
| Emails                                 | `src/emails/templates/*` (templates), `src/infrastructure/emailService.js` (the intended queued API) — **but** check the individual module's service file first, since several modules send email directly instead (see Inconsistencies) |
| Redis caching                          | `src/utils/cache.js` (the get/set/delete wrapper), `src/config/redis.js` (connection), and the calling service file for TTL/key choices — `src/constants/cacheKeys.js` exists but is largely unused (see Inconsistencies)                |
| Background workers / queues            | `src/config/queue.js` (BullMQ setup), `src/jobs/*/*.worker.js` (processors), `worker.js` (the process entry point actually deployed)                                                                                                     |
| File uploads                           | `src/middlewares/upload.middleware.js` (multer config), `src/config/storage.js` (ImageKit), the relevant module's routes file for which upload middleware is applied                                                                     |
| Analytics                              | `src/modules/analytics/*` (reporting + guarded deletion), `src/jobs/analytics/analyticsRollup.worker.js` (rollup jobs), `src/modules/visitor/*` (raw tracking data analytics reads from)                                                 |
| Admin-facing APIs generally            | `src/modules/admin/*` (admin _account_ management) vs. `src/modules/auth/admin/*` (admin _authentication_) — these are two distinct modules, don't confuse them                                                                          |
| Rate limiting                          | `src/middlewares/rateLimiter.middleware.js` — four named limiter exports, applied per-route in each module's routes file                                                                                                                 |
| Security headers / CORS / sanitization | `src/middlewares/security.middleware.js`, `src/app/app.js` (CORS config, `helmet()` call site)                                                                                                                                           |
| Health/readiness behavior              | `src/app/app.js` — the `/health` and `/ready` handlers are defined inline, not in a separate module                                                                                                                                      |
| Deployment configuration               | `render.yaml`, `Dockerfile`/`Dockerfile.worker`                                                                                                                                                                                          |
| CI/CD behavior                         | `.github/workflows/*.yml`                                                                                                                                                                                                                |

---

## Architectural Decisions

The following patterns are clearly visible in the code; where the repository doesn't state the _reason_ explicitly, this section describes what the implementation _does_, not an assumed motive.

- **Controllers are separated from services.** Controllers stay thin (parse request → call service → shape response); services hold all business rules. This separation lets the same business logic (e.g. `createOrder`) be tested or reused independently of the HTTP layer, though no such reuse or test harness currently exists in the repo.
- **A repository layer exists for some, not all, modules.** Where present (`order`, `food`'s routes import a repository that wasn't located as a file — treat cautiously, `booking/*`, `category`, `notice`, `billboard`, `cart`, `contact`, `admin`), it isolates Mongoose query construction from service-level business logic. Where absent (`analytics`, `auth/*`, `review`, `user`, `visitor`), services query Mongoose models directly — the codebase does not apply this layer uniformly.
- **Admin and User JWT secrets are separate.** This means a compromised user-facing secret cannot be used to forge an admin token and vice versa — the two authentication tracks are cryptographically isolated end-to-end, including separate session collections (`AdminSession`/`UserSession`).
- **Redis (both the REST cache client and the native BullMQ connection) is optional at startup.** The implementation checks Redis availability at every read/write (`isRedisReady()`) and falls back to "just hit MongoDB" or "drop the job" rather than crashing — this trades some performance/reliability for the ability to run the API with a minimal dependency set (just MongoDB) in constrained environments.
- **The worker is a separate process/deployment**, not a background thread inside the API server. This allows the two to be scaled and restarted independently (e.g. many API replicas, one worker), and means a worker crash or restart does not affect API request handling — and vice versa.
- **Destructive admin operations get extra layers** (a stricter rate limiter, and — for admin deletion and analytics deletion specifically — extra role/confirmation requirements beyond the standard permission check) that read-only or non-destructive admin operations don't get, reflecting a defense-in-depth stance specifically around irreversible actions.
- **Public GET endpoints cache; admin-facing mutation endpoints (on the same resources) never cache.** Each module's routes.js comments explicitly note "(service handles caching)" on public GETs and "(no cache)" on admin routes — separating the two concerns lets the cache be invalidated precisely on mutation without touching the admin read path at all.
- **Validation happens before controllers**, as Zod-schema middleware mounted directly in the route chain — this guarantees a controller/service never receives an unvalidated `req.body`/`req.query` for any route that declares a schema.

---

## Design Principles Observed

- **Modular, domain-oriented architecture** — one directory per business capability under `src/modules/`, each internally layered.
- **Separation of concerns** — routing, HTTP handling, business logic, and data access are (mostly) distinct layers.
- **Defense in depth** — multiple independent security layers (headers, CORS, sanitization, validation, rate limiting, auth, authz, CSRF, reCAPTCHA) rather than relying on any single mechanism.
- **Least privilege** — a three-tier admin role system with an explicit permission catalog, plus role-only gating for the single most sensitive action (deleting an admin).
- **Explicit, typed error handling** — a small hierarchy of `AppError` subclasses standardizes HTTP status/code mapping instead of ad hoc `res.status(...)` calls scattered through controllers.
- **Graceful degradation** — Redis, email, and (implicitly) image storage are all designed to be optional dependencies that log a warning and continue, rather than hard failures, except where explicitly required in production (`production.js`).
- **Auditability** — sensitive admin mutations are wrapped in a structured audit-log middleware capturing actor, action, resource, and outcome.
- **Asynchronous processing (partially applied)** — a full BullMQ-based job queue exists for email/analytics/media work, though (per the Inconsistencies below) it is not consistently used by every module that could benefit from it.

---

## Implementation Notes / Inconsistencies

Documented rather than silently resolved, per the source material:

1. **`src/app/bootstrap.js` is dead code / broken as written.** It imports `createApp` from `./app.js` and `connectDatabase` from `../config/database.js` — but `app.js` exports a ready-built `app` instance as its **default export** (no `createApp` function exists), and `database.js` exports `connectDB`/`disconnectDatabase`, not `connectDatabase`. `server.js` (the file actually run by `npm start`/`render.yaml`) does **not** import `bootstrap.js` at all — it builds everything inline. `bootstrap.js` appears to be an earlier or alternate startup path that is no longer wired up and would throw on import if invoked.
2. **A duplicate worker entry point exists.** `src/jobs/worker.js` re-implements almost the entire startup/shutdown sequence found in the root-level `worker.js`, with a different concurrency configuration (email: 10 vs. 5; media cleanup: 5 vs. 3) and without awaiting `getWorker(...)` (a likely bug, since `getWorker` is `async`). `package.json`'s `worker`/`dev:worker` scripts point at the **root** `worker.js`, so `src/jobs/worker.js` does not appear to be used by any script in this repository — likely leftover from a refactor.
3. **`src/middlewares/auth.base.middleware.js` uses `require("jsonwebtoken")` inside `verifyAccessToken`**, in a project whose `package.json` declares `"type": "module"` (ESM). Ad hoc `require()` calls are not available in ESM without an explicit `createRequire` shim, which is not present in this file — this would throw a `ReferenceError: require is not defined` if `verifyAccessToken` in _this specific file_ is actually invoked. (A separate, correctly `import`-based `verifyAccessToken` also exists in `src/utils/token.utils.js`; it's not confirmed from route wiring which one — if either — is actually exercised at runtime for the middleware path, since `createAuthMiddleware` in the same file calls the local `verifyAccessToken`.)
4. **Cache key naming is inconsistent.** `src/constants/cacheKeys.js` defines a `CACHE_KEYS` object with `hoterstellar:*`-prefixed key builders (e.g. `hoterstellar:food:${id}`), but the actual cache calls inside `food.service.js`, `category.service.js`, and `notice.service.js` use a different, hand-rolled `cache:<domain>:*` convention that does not reference the `CACHE_KEYS` constants at all. The constants module appears to be unused/aspirational rather than the live convention.
5. **Two parallel email-sending implementations exist for overlapping events.** `src/infrastructure/emailService.js` provides a complete, queued (BullMQ), template-based email API. Several service files (`admin.auth.service.js`, `user.auth.service.js`, `order.service.js`) instead call `getBrevoClient().sendEmail(...)` directly with hand-written inline HTML strings, bypassing both the queue and the shared templates in `src/emails/templates/`. This means several of the templates and queued helper functions in `emailService.js` (e.g. `sendOrderStatusUpdateEmail`, `sendTableBookingConfirmationEmail`, `sendEventBookingConfirmationEmail`, `sendAdminNewOrderNotificationEmail`, `sendAdminNewBookingNotificationEmail`) have **no confirmed call site** in the modules inspected — they may be unused, or invoked from a service file/branch not covered in this inspection pass.
6. **Admin password reset is not implemented.** `POST /auth/admin/request-reset-password` generates a reset token and emails a reset link, but the token is never persisted anywhere (the code comment reads "Store reset token in Redis (will implement in Phase 16)"), and `POST /auth/admin/reset-password` unconditionally throws `BadRequestError("Password reset not fully implemented yet")`. This is a genuine functional gap, not just a documentation gap.
7. **CSRF middleware registration order is unusual.** `setCsrfCookie` and the two `csrfProtection` mounts (`/api/v1/auth/admin/refresh`, `/api/v1/auth/user/refresh`) are registered in `app.js` _after_ `app.use('/api/v1', apiRoutes)`, the 404 handler, and the error handler. Given Express's linear middleware model, this placement is worth verifying against the intended behavior if CSRF enforcement on refresh appears not to trigger as expected.
8. **Seed/env variable naming mismatch.** `src/config/env.js`'s Zod schema defines `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, while `.env.example` and `src/seeders/superAdmin.seeder.js` primarily use `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` (falling back to the `ADMIN_SEED_*` names only if the `SUPER_ADMIN_*` ones are unset). Both pairs work, but the `.env.example` file does not mention `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` at all, which could confuse a new contributor following the example file literally.
9. **Docker builds install without a lockfile.** Both `Dockerfile` and `Dockerfile.worker` `COPY package.json ./` and run `npm install` before copying the rest of the source — `package-lock.json` is never copied into the image (and is explicitly listed in `.dockerignore`), so the container build does not use `npm ci` and is not strictly lockfile-reproducible.
10. **`.dockerignore` excludes `src/emails/templates/`** from the Docker build context. Since `src/infrastructure/emailService.js` imports directly from `../emails/templates/index.js`, excluding that directory from the image would break any code path that relies on the queued/templated email functions inside a container build — unless this exclusion is intentional for a reason not evident from the repository (e.g. templates injected some other way at deploy time, which was not found in the inspected files).
11. **CD workflow's recorded environment URL doesn't match the supplied backend URL.** `cd.yml` declares a GitHub Environment `production` with `url: https://api.hoterstellar.com`, while the backend URL supplied as deployment metadata for this documentation task is `https://api-hoterstellar.onrender.com`. Both may be valid (e.g. a custom domain fronting the Render service), but this could not be confirmed from the repository alone.
12. **`requireOwnership` middleware is defined but not wired into any inspected route.** Ownership checks for orders/bookings/reviews are instead implemented ad hoc inside each service function.
13. **`PERMISSIONS.ORDERS_CANCEL_OWN` and `PERMISSIONS.REVIEWS_CREATE` are declared but never referenced** by `ROLE_PERMISSIONS` or any route middleware.

---

## System Limitations / Known Unknowns

- **No automated test suite exists in this repository** — no `tests/` directory, no `test` script in `package.json`, and none of `jest`/`supertest`/`mongodb-memory-server` are actual dependencies, despite being referenced by name in `dependabot.yml`'s dependency-grouping patterns and `CODEOWNERS`'s path list. CI's "syntax-check" job (`node --check`) is not a substitute for behavioral tests.
- **Admin password reset is non-functional** (see Inconsistency #6 above) — this is a real product gap, not just missing documentation.
- **Frontend and dashboard source code are not part of this repository** — nothing about their internal architecture, state management, or API-client implementation can be verified here (see [Frontend Integration](#frontend-integration)).
- **It is not confirmed from the inspected code** whether `mediaCleanupProcessor`/`enqueueMediaCleanup` is actually invoked when an image is replaced or a record is deleted — no call site was found in the create/update/delete flows reviewed for `food`, `category`, `notice`, or `billboard`. Orphaned ImageKit files may or may not be cleaned up automatically today.
- **It is not confirmed** whether order-status-update, table/event booking confirmation, or admin new-order/new-booking notification emails are actually sent in production — the corresponding `emailService.js` helper functions exist, but no call site was found in the inspected `order`/`booking` service or controller files. Either they are invoked from code not covered in this pass, or these notifications are not currently wired up.
- **`analyticsRollup` queue producer is not confirmed** — no HTTP route or scheduled trigger enqueuing `analyticsRollup` jobs was found in the inspected code; it may rely on an external scheduler (e.g. a cron-triggered webhook, or a Render Cron Job not present in `render.yaml`) not visible in this repository.
- **Database provider for `MONGODB_URI`** (e.g. MongoDB Atlas specifically) is not stated anywhere in the repository — only that it's a standard MongoDB connection string.
- **Exact behavior of `cart.validator.js`'s `mergeCartSchema`** and the precise semantics of guest-cart merging were not traced in full detail in this pass.
- **Not every service file in every module was opened in this inspection pass** (in particular, most `*.validator.js` field-level schemas beyond what's described above, and every controller's exact response shape) — the API Reference above reflects routes, auth/authz, and models with high confidence, but individual request/response field names should be confirmed against the relevant `*.validator.js`/`*.controller.js` file before being treated as a frozen contract.

---

## Technology Stack

| Category         | Technology                                                                                                                                                                    | Verified usage                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Runtime          | Node.js ≥ 22, ESM (`"type": "module"`)                                                                                                                                        | `package.json` engines + `type` field                           |
| Web framework    | Express 5.2                                                                                                                                                                   | `src/app/app.js`                                                |
| Database         | MongoDB via Mongoose 9                                                                                                                                                        | `src/config/database.js`, all `*.model.js` files                |
| Cache            | Upstash Redis (REST), `@upstash/redis`                                                                                                                                        | `src/config/redis.js`, `src/utils/cache.js`                     |
| Queue            | BullMQ 6 + `ioredis` (native Redis)                                                                                                                                           | `src/config/queue.js`                                           |
| Realtime         | Socket.IO 4 (+ `@socket.io/redis-adapter` dependency present, though a Redis-backed Socket.IO adapter was **not** confirmed as actually configured in `src/config/socket.js`) | `src/config/socket.js`                                          |
| Auth             | `jsonwebtoken`, `bcryptjs`                                                                                                                                                    | `src/modules/auth/*`, `src/middlewares/auth.base.middleware.js` |
| Validation       | `zod`, `express-validator` (validator installed and a `runExpressValidation` helper exists, but Zod is the primary validation mechanism actually wired into routes)           | `src/middlewares/validate.middleware.js`                        |
| Security headers | `helmet`                                                                                                                                                                      | `src/app/app.js`                                                |
| Rate limiting    | `express-rate-limit` (+ `rate-limit-redis` dependency present, Redis-backed store not confirmed as configured)                                                                | `src/middlewares/rateLimiter.middleware.js`                     |
| Email            | Brevo (Sendinblue) via `axios`                                                                                                                                                | `src/config/brevo.js`, `src/infrastructure/emailService.js`     |
| Media storage    | ImageKit (`@imagekit/nodejs`)                                                                                                                                                 | `src/config/storage.js`                                         |
| File uploads     | `multer` (memory storage)                                                                                                                                                     | `src/middlewares/upload.middleware.js`                          |
| Logging          | `pino` (+ `pino-pretty` in development), `chalk` for startup console art                                                                                                      | `src/utils/logger.js`, `server.js`, `worker.js`                 |
| Dates            | `dayjs`                                                                                                                                                                       | `server.js` (startup timestamp)                                 |
| IDs              | `uuid` (request IDs)                                                                                                                                                          | `src/middlewares/requestId.middleware.js`                       |
| Env validation   | `zod` + `dotenv`                                                                                                                                                              | `src/config/env.js`                                             |
| Deployment       | Render (`render.yaml`), Docker (`node:22-alpine`)                                                                                                                             | `render.yaml`, `Dockerfile`, `Dockerfile.worker`                |
| CI/CD            | GitHub Actions (CI, CD, CodeQL, Dependency Review), Dependabot                                                                                                                | `.github/workflows/*.yml`, `.github/dependabot.yml`             |
| Lint/format      | ESLint 10 (`eslint.config.mjs`), Prettier (`.prettierrc.json`)                                                                                                                | `package.json` scripts                                          |

---

## Project Maturity / Engineering Surface

Without assigning a quality score, the repository contains meaningful implementation in: authentication (dual-track JWT + OTP), authorization (RBAC with a permission catalog), input validation (Zod-based), a layered security middleware stack, optional caching, asynchronous job processing (BullMQ), transactional email, media storage integration, real-time admin notifications (Socket.IO), audit logging on admin mutations, structured error handling, environment-variable validation, and CI/CD (lint, security scanning, dependency review, automated dependency updates, a production deploy pipeline). It does **not** currently contain an automated test suite, a fully wired admin password-reset flow, or a single, consistently-applied email-sending pipeline (see [Implementation Notes / Inconsistencies](#implementation-notes--inconsistencies) and [Known Unknowns](#system-limitations--known-unknowns) for specifics).
