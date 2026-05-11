# TadHealth Employee Portal

Internal portal for TadHealth: directory, department command center, and admin tooling. See [`plan.md`](./plan.md) for the architecture contract — read it before changing anything structural.

## Stack

- **Web** (`apps/web`) — React 19 + Vite + Tailwind v4, deployed to Vercel.
- **API** (`apps/api`) — Fastify + TypeScript, deployed to Railway.
- **DB** (`packages/db`) — Drizzle ORM against Supabase Postgres.
- **Shared** (`packages/shared`) — Zod schemas + types shared by web and api.
- **Auth** — Supabase email auth. Frontend gets a JWT, sends it as `Authorization: Bearer …` to the API; the API verifies it against Supabase's JWKS endpoint (works with both legacy HS256 and asymmetric ES256/RS256 signing keys).

## First-time setup

```bash
# 1. Install
pnpm install

# 2. Wire up env files
cp .env.example apps/api/.env.local      # then fill in SUPABASE_*, DATABASE_URL
cp .env.example apps/web/.env.local      # then keep only the VITE_ block

# 3. Push the Drizzle schema to Supabase + seed the directory
pnpm db:migrate
pnpm db:seed

# 4. Run both apps
pnpm dev          # web on :5173, api on :3001
```

## Brand tokens

| Token     | Hex       | Usage                       |
|-----------|-----------|-----------------------------|
| primary   | `#013F5A` | Headings, nav, CTAs         |
| highlight | `#6ED7D0` | Hovers, active states, tags |
| accent    | `#F89E5D` | Secondary CTAs, callouts    |

## Admin access

Admin pages are gated to `claire@tadhealth.com` and `ben@tadhealth.com` via the `is_admin` flag on `profiles`, enforced both server-side (Fastify guard) and via Supabase RLS.