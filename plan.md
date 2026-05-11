# Project Guide

> Starter doc for AI assistants (Cursor, Claude Code, Copilot, etc.) working on this repo. Read this in full before making changes.

---

## What we're building

A production-grade web application with:

- **Frontend:** React (Vite or Next.js) — user-facing UI
- **Backend:** Node.js API — business logic, third-party integrations, anything that can't live on the client
- **Database & Auth:** Supabase (managed Postgres + auth + storage)

The app should be horizontally scalable, type-safe end-to-end, and deployable with zero-downtime via git push.

---

## Stack decisions (locked in)

| Layer | Choice | Why |
|---|---|---|
| Repo structure | Monorepo with pnpm workspaces | Shared types, atomic PRs, one install |
| Frontend | React + Vite (or Next.js if SSR is needed) | Fast dev loop, mature ecosystem |
| Backend | Fastify + TypeScript | Faster than Express, great schema/TS support |
| ORM | Drizzle | Lightweight, SQL-like, fast |
| Database | Supabase Postgres | Postgres + auth + RLS in one |
| Auth | Supabase Auth (JWT-based) | Built into Supabase, handles refresh |
| Validation | Zod | Shared schemas across frontend/backend |
| Frontend hosting | Vercel | Best-in-class for React |
| Backend hosting | Railway (or Fly.io) | Lowest-friction container hosting |
| Cache/queue (when needed) | Upstash Redis | Serverless Redis, generous free tier |

**Don't swap these without explicit approval.** If a task seems to require a different choice, surface it instead of silently substituting.

---

## Repo layout

```
.
├── apps/
│   ├── web/                    # React frontend (Vercel deploys this)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Node backend (Railway deploys this)
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── lib/
│       │   └── server.ts
│       └── package.json
├── packages/
│   ├── shared/                 # Zod schemas, shared types, constants
│   │   └── src/
│   └── db/                     # Drizzle schema + migrations
│       ├── src/
│       │   ├── schema.ts
│       │   └── client.ts
│       └── drizzle/            # generated migrations
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
└── PROJECT_GUIDE.md            # this file
```

**Path aliases** (set in each app's `tsconfig.json`):
- `@shared/*` → `packages/shared/src/*`
- `@db/*` → `packages/db/src/*`

---

## Conventions (follow these)

### TypeScript
- `strict: true` everywhere. No `any` unless commented with a reason.
- Prefer `type` over `interface` for object shapes.
- Validate all external input (HTTP body, query, env vars) with Zod. Never trust unvalidated data past the boundary.

### Imports
- Absolute imports for cross-package (`@shared/...`), relative for same-package (`./foo`).
- No deep imports across packages — only import from each package's `index.ts`.

### API design
- REST under `/api/v1/...`. Plural nouns. Use HTTP verbs correctly.
- Every endpoint has a Zod schema for body/query/params and the response.
- Errors return `{ error: { code, message } }` with proper status codes. No leaking stack traces in production.
- Auth: every protected route verifies the Supabase JWT. Unauthenticated requests get 401.

### Database
- Drizzle schema is the source of truth. Generate migrations with `drizzle-kit generate`. Never hand-edit migration files.
- Every table has `id` (uuid, default `gen_random_uuid()`), `created_at`, `updated_at`.
- Foreign keys on every relationship. No orphan rows.
- Index columns used in WHERE clauses, joins, and RLS policies.
- Use the **pooled** Supabase connection string (port 6543) in the API. Direct connection (5432) only for migrations.

### Auth flow
1. Frontend uses `@supabase/supabase-js` for signup/login/session.
2. Frontend sends `Authorization: Bearer <jwt>` to the Node API on every request.
3. Node API verifies the JWT using `SUPABASE_JWT_SECRET` and extracts `user.id` from `sub`.
4. **Service role key never leaves the backend.** Never expose it to the frontend, never log it.
5. RLS is enabled on every table as defense-in-depth, even for tables only the backend writes to.

### Security baseline
- All secrets in env vars. Never commit `.env` files (only `.env.example`).
- CORS locked to known origins in production. No `*` for protected endpoints.
- Rate limit public endpoints (`@fastify/rate-limit`).
- Helmet equivalent on by default (`@fastify/helmet`).
- SQL only via Drizzle / parameterized queries. No string concatenation into queries, ever.

### Logging
- Structured JSON logs (Pino, built into Fastify).
- Log level via `LOG_LEVEL` env var. Default `info` in prod, `debug` in dev.
- Never log secrets, full JWTs, passwords, or PII.

### Testing
- Vitest for both apps.
- Unit tests for pure logic (services, validators).
- Integration tests for API routes against a test database (Supabase local or a throwaway schema).
- Don't chase 100% coverage — cover the critical paths.

---

## Environment variables

Keep `.env.example` up to date. Every new env var goes there with a placeholder value and a comment.

**`apps/api/.env.local`:**
```
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # backend only, never ship to frontend
SUPABASE_JWT_SECRET=...            # for verifying JWTs

# Postgres (use the POOLED connection string, port 6543)
DATABASE_URL=postgresql://postgres.xxx:[email protected]:6543/postgres

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

**`apps/web/.env.local`:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001
```

Public-facing vars (anon key, API URL) are fine on the frontend. Anything labeled "service role" or "secret" is backend-only.

---

## Local development

```bash
# Install everything
pnpm install

# Start dev servers (run in separate terminals or via Turborepo)
pnpm --filter web dev      # Vite on :5173
pnpm --filter api dev      # Fastify on :3001

# Database
pnpm --filter db generate  # generate migration from schema changes
pnpm --filter db migrate   # apply migrations to the connected DB

# Lint / typecheck / test
pnpm lint
pnpm typecheck
pnpm test
```

Use the Supabase CLI for a local Supabase stack if you want to develop offline: 
```bash
supabase start    # spins up Postgres + auth + storage in Docker
supabase stop
```

---

## Deployment

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Preview (PR) | Vercel preview URL | Railway PR environment | Supabase staging project |
| Production | Vercel main | Railway main | Supabase prod project |

**Push to main = deploy to prod.** Don't push broken code.

CI must pass (lint, typecheck, test) before merge. PRs get preview deployments automatically on both Vercel and Railway.

---

## Patterns to follow

### Adding a new API endpoint
1. Define Zod request/response schemas in `packages/shared/src/schemas/`.
2. Add the route in `apps/api/src/routes/`.
3. Validate input with the schema. Return validated, typed responses.
4. If it touches the DB, do queries in a service file (`apps/api/src/services/`), not inline in the route.
5. Frontend imports the schema/types from `@shared/...` and uses them in the fetch call.

### Adding a new table
1. Edit `packages/db/src/schema.ts` (Drizzle schema).
2. Run `pnpm --filter db generate` to create the migration.
3. Run `pnpm --filter db migrate` against your dev DB.
4. Add an RLS policy in a SQL file under `packages/db/policies/` (or via Supabase dashboard for now, then export).
5. Index any columns the policy filters on.

### Calling the API from the frontend
- Wrap fetch in a small client that auto-attaches the Supabase JWT and handles 401 by refreshing the session.
- Use TanStack Query (React Query) for server state. No raw `useEffect` + `fetch` in components.

---

## What NOT to do

- ❌ Don't use the Supabase service role key on the frontend, ever.
- ❌ Don't query Postgres directly from the frontend if it requires logic the backend should own (e.g., side effects, third-party calls, auth-sensitive writes).
- ❌ Don't put secrets in code, even temporarily.
- ❌ Don't mix `pnpm`/`npm`/`yarn` — pnpm only.
- ❌ Don't add new top-level dependencies without justifying it.
- ❌ Don't skip validation because "the frontend sends the right shape" — the frontend is untrusted input.
- ❌ Don't use `localStorage` for sensitive tokens. Supabase's client handles session storage correctly; don't override it.
- ❌ Don't introduce a new framework, ORM, or hosting platform without raising it first.
- ❌ Don't disable RLS on a table to "fix" something — fix the policy instead.

---

## When in doubt

- Prefer **boring** over clever. This is a production app, not a playground.
- Prefer **explicit** over magic. Future-you and teammates have to read this code.
- If you're about to do something that feels like it might be wrong (committing a secret, disabling a security control, writing raw SQL with user input), stop and surface it.

---

## Open decisions / TODO

- [ ] Pick Vite or Next.js for `apps/web` (default to Vite unless SSR is needed)
- [ ] Decide on email transactional provider (Resend? Postmark?)
- [ ] Add Sentry for error tracking once we have real users
- [ ] Add structured logging sink (Axiom / Better Stack) when platform logs get noisy
- [ ] Background jobs: BullMQ on Upstash Redis (only when needed)