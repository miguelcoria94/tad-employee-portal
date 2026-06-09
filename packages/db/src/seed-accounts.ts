/**
 * Provision Supabase auth accounts + linked `profiles` rows for every seeded
 * employee in the directory, so each person becomes a real, addressable user
 * (and shows up in DM "new conversation" search, feedback respondent pickers,
 * etc.).
 *
 * Why this exists: `seed.ts` only seeds the `employees` directory rows. A
 * `profiles` row (the account, keyed by the Supabase `auth.users.id`) is
 * otherwise created lazily on first sign-in via `ensureProfile`. So until a
 * person signs in they have no profile and don't appear in recipient pickers.
 * This script eagerly creates the auth user + profile for all of them.
 *
 * Idempotent: safe to run repeatedly. Existing auth users are reused (matched
 * by email, case-insensitive) and profiles are upserted.
 *
 * Env (loaded from apps/api/.env.local via ./load-env.js):
 *   - SUPABASE_URL                 (required)
 *   - SUPABASE_SERVICE_ROLE_KEY    (required, service-role — bypasses RLS)
 *   - DATABASE_URL                 (required, used by getDb())
 *   - SEED_USER_PASSWORD           (optional) default password for newly
 *                                  created accounts. Falls back to
 *                                  "TadHealth!2026" when unset. Existing
 *                                  accounts are never modified.
 *
 * Run: pnpm --filter @tadhealth/db seed:accounts
 */
import "./load-env.js";
import { sql } from "drizzle-orm";
import { getDb, schema } from "./index.js";

const ADMIN_EMAILS = new Set([
  "ben@tadhealth.com",
  "claire@tadhealth.com",
  "haley@tadhealth.com",
]);

const DEFAULT_PASSWORD = "TadHealth!2026";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (set it in apps/api/.env.local)`);
  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = process.env.SEED_USER_PASSWORD || DEFAULT_PASSWORD;

// We talk to the Supabase Auth Admin REST API directly via fetch instead of
// pulling in @supabase/supabase-js as a dependency of this package — it keeps
// the db package dependency-free of the JS SDK and avoids a lockfile change.
const adminHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

type AuthUser = { id: string; email: string | null };

/**
 * Page through every existing auth user and build an email (lowercased) -> id
 * map so we can detect existing accounts without creating duplicates.
 */
async function loadExistingUsers(): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: adminHeaders },
    );
    if (!res.ok) {
      throw new Error(`listUsers failed (${res.status}): ${await res.text()}`);
    }
    const body = (await res.json()) as { users?: AuthUser[] };
    const users = body.users ?? [];
    for (const user of users) {
      if (user.email) byEmail.set(user.email.toLowerCase(), user.id);
    }
    if (users.length < perPage) break;
  }
  return byEmail;
}

/**
 * Create a confirmed auth user. Returns the new user id, or null if the email
 * is already registered (idempotency — caller re-resolves the existing id).
 */
async function createAuthUser(email: string): Promise<string | null> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (res.ok) {
    const user = (await res.json()) as AuthUser;
    return user.id;
  }

  const text = await res.text();
  const lower = text.toLowerCase();
  if (lower.includes("already") && lower.includes("registered")) {
    return null;
  }
  throw new Error(`createUser failed for ${email} (${res.status}): ${text}`);
}

async function run() {
  const db = getDb();

  const directory = await db
    .select({ id: schema.employees.id, email: schema.employees.email })
    .from(schema.employees);

  console.log(`Found ${directory.length} employees in the directory.`);
  console.log("Loading existing Supabase auth users…");
  const existingByEmail = await loadExistingUsers();
  console.log(`Found ${existingByEmail.size} existing auth users.`);

  let created = 0;
  let reused = 0;
  let linked = 0;
  let skippedNoEmail = 0;

  for (const emp of directory) {
    if (!emp.email) {
      skippedNoEmail++;
      continue;
    }
    const email = emp.email.toLowerCase();

    let authUserId = existingByEmail.get(email);

    if (!authUserId) {
      const newId = await createAuthUser(email);
      if (newId) {
        authUserId = newId;
        existingByEmail.set(email, authUserId);
        created++;
      } else {
        // Already registered but missed by the initial listing — re-resolve.
        const refreshed = await loadExistingUsers();
        authUserId = refreshed.get(email);
        if (!authUserId) {
          throw new Error(`Could not resolve existing auth user for ${email}`);
        }
        existingByEmail.set(email, authUserId);
        reused++;
      }
    } else {
      reused++;
    }

    // Upsert the profile row. onConflictDoUpdate so re-running re-links the
    // employee/admin flags even for profiles created lazily on first sign-in.
    await db
      .insert(schema.profiles)
      .values({
        id: authUserId,
        employeeId: emp.id,
        isAdmin: ADMIN_EMAILS.has(email),
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          employeeId: emp.id,
          isAdmin: ADMIN_EMAILS.has(email),
          updatedAt: sql`now()`,
        },
      });
    linked++;
  }

  const profileRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.profiles);
  const profileCount = profileRows[0]?.count ?? 0;

  console.log("");
  console.log("── Account provisioning summary ─────────────────────────");
  console.log(`  Employees processed:    ${directory.length}`);
  console.log(`  Auth users created:     ${created}`);
  console.log(`  Auth users reused:      ${reused}`);
  console.log(`  Profiles linked/upsert: ${linked}`);
  if (skippedNoEmail > 0) {
    console.log(`  Skipped (no email):     ${skippedNoEmail}`);
  }
  console.log(`  Total profiles in db:   ${profileCount}`);
  console.log(`  Default password:       ${process.env.SEED_USER_PASSWORD ? "(from SEED_USER_PASSWORD)" : DEFAULT_PASSWORD}`);
  console.log("─────────────────────────────────────────────────────────");

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
