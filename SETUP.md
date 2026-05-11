# Setup Walkthrough

End-to-end steps to take this from a fresh clone to a running portal. Read [`plan.md`](./plan.md) first.

## 1. Local prerequisites

- Node 22+, pnpm 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- A Supabase project (https://supabase.com → New project)

## 2. Install

```bash
pnpm install
```

## 3. Supabase project setup

In the Supabase dashboard, grab from **Project Settings → API**:

- **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
- **anon (public) key** → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- **service_role (secret) key** → `SUPABASE_SERVICE_ROLE_KEY` (backend only)

> JWT verification: the API fetches signing keys at runtime from
> `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, so no JWT secret env var is
> required. This works whether your project uses the new asymmetric
> (ECC P-256 / RS256) keys or the legacy HS256 shared secret — both are
> published in the JWKS during key rotation.

From **Project Settings → Database → Connection pooling** (Transaction mode, port 6543), grab the connection string → `DATABASE_URL`.

Then in **Authentication → Providers**, enable **Email** (password). Optional but recommended: turn on "Confirm email" so signups have to verify.

## 4. Wire env files

```bash
# apps/api/.env.local — already stubbed; fill in the blanks
# apps/web/.env.local — already wired with the keys you provided
```

Make sure `.env.local` files are NOT committed (`.gitignore` already covers them).

## 5. Push schema + policies + seed

```bash
pnpm db:generate    # one-time, creates the migration in packages/db/drizzle
pnpm db:migrate     # applies migrations + RLS policies + the auth trigger
pnpm db:seed        # seeds 45 employees + 6 department cards
```

Trigger note: `005_profile_trigger.sql` auto-creates a `profiles` row when anyone signs up, and flags `ben@tadhealth.com` and `claire@tadhealth.com` as admins.

## 6. Run locally

```bash
pnpm dev
# web: http://localhost:5173
# api: http://localhost:3001
```

Sign up with an email, check the inbox to confirm, then sign in. Ben and Claire automatically see the **Admin** link in the header.

## 7. Deploy

### Frontend → Vercel

1. New project → import this repo.
2. Set **Root Directory** to `apps/web`.
3. Framework preset auto-detects Vite. Override **Install Command** to `cd ../.. && pnpm install`.
4. Set env vars from `apps/web/.env.local` in Vercel project settings.

### Backend → Railway

1. New project → deploy from this repo.
2. Railway picks up `railway.toml` and builds `apps/api/Dockerfile`.
3. Set env vars from `apps/api/.env.local` in Railway service settings (especially `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and the **pooled** `DATABASE_URL`).
4. Add the deployed Vercel domain (and any preview domains) to `ALLOWED_ORIGINS`.
5. Update `VITE_API_URL` in Vercel to the Railway public URL.

## 8. Adding admins later

Run a one-line update against the database:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'someone@tadhealth.com');
```

Or call it via the Supabase SQL editor.