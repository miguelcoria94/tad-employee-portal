import { eq } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";

const ADMIN_EMAILS = new Set(["ben@tadhealth.com", "claire@tadhealth.com"]);

export async function getProfile(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return profile ?? null;
}

/**
 * Make sure a profiles row exists for a freshly-authenticated user. Mirrors
 * the SQL trigger in policies/005_profile_trigger.sql — kept here as a
 * fallback in case the trigger isn't installed (some Supabase pooler roles
 * don't have CREATE TRIGGER on auth.users). Idempotent.
 */
export async function ensureProfile(userId: string, email?: string) {
  const db = getDb();
  const isAdmin = email ? ADMIN_EMAILS.has(email.toLowerCase()) : false;

  let employeeId: string | null = null;
  if (email) {
    const [emp] = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(eq(schema.employees.email, email))
      .limit(1);
    employeeId = emp?.id ?? null;
  }

  await db
    .insert(schema.profiles)
    .values({ id: userId, employeeId, isAdmin })
    .onConflictDoNothing({ target: schema.profiles.id });
}

export async function getProfileWithEmployee(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      profile: schema.profiles,
      employee: schema.employees,
    })
    .from(schema.profiles)
    .leftJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  if (!row) return null;
  return { profile: row.profile, employee: row.employee };
}