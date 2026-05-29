import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type { UpdateMyProfileInput } from "@tadhealth/shared";
import { notify } from "./notifications.js";

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

  // If the profile already existed but wasn't linked to an employee (e.g.
  // because the user signed up before the directory row was added), backfill
  // the link the next time we see them. Only touches rows where employee_id
  // is still null so we never overwrite an intentional unlink.
  if (employeeId) {
    await db
      .update(schema.profiles)
      .set({ employeeId, updatedAt: sql`now()` })
      .where(
        and(
          eq(schema.profiles.id, userId),
          isNull(schema.profiles.employeeId),
        ),
      );
  }
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

  // Pull manager for the /me response so the profile page can render it
  // without a separate round trip.
  let manager: {
    id: string;
    firstName: string;
    lastName: string | null;
    title: string;
  } | null = null;
  if (row.employee?.managerId) {
    const [m] = await db
      .select({
        id: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        title: schema.employees.title,
      })
      .from(schema.employees)
      .where(eq(schema.employees.id, row.employee.managerId))
      .limit(1);
    manager = m ?? null;
  }

  return { profile: row.profile, employee: row.employee, manager };
}

/**
 * Employee updates their own profile (location, phone, bio). Returns the
 * updated employee row and a short summary string of what changed so the
 * caller can fan out a notification to admins. Returns null if the caller
 * has no linked employee row.
 */
export async function updateMyProfile(
  userId: string,
  input: UpdateMyProfileInput,
) {
  const db = getDb();
  const [profile] = await db
    .select({ employeeId: schema.profiles.employeeId })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  if (!profile?.employeeId) return null;

  const [before] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.id, profile.employeeId))
    .limit(1);
  if (!before) return null;

  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  const changes: string[] = [];
  if (input.location !== undefined && (input.location ?? null) !== before.location) {
    patch.location = input.location ?? null;
    changes.push("location");
  }
  if (input.phone !== undefined && (input.phone ?? null) !== before.phone) {
    patch.phone = input.phone ?? null;
    changes.push("phone");
  }
  if (input.bio !== undefined && (input.bio ?? null) !== before.bio) {
    patch.bio = input.bio ?? null;
    changes.push("bio");
  }
  if (
    input.birthday !== undefined &&
    (input.birthday ?? null) !== before.birthday
  ) {
    patch.birthday = input.birthday ?? null;
    changes.push("birthday");
  }
  if (
    input.startDate !== undefined &&
    (input.startDate ?? null) !== before.startDate
  ) {
    patch.startDate = input.startDate ?? null;
    changes.push("start date");
  }

  if (changes.length === 0) {
    return { employee: before, changes };
  }

  const [updated] = await db
    .update(schema.employees)
    .set(patch)
    .where(eq(schema.employees.id, before.id))
    .returning();

  const name = before.lastName
    ? `${before.firstName} ${before.lastName}`
    : before.firstName;

  await notify({
    kind: "profile_update",
    title: "Profile update",
    body: `${name} updated their ${changes.join(", ")}`,
    link: "/admin/employees",
    entityType: "employee",
    entityId: before.id,
    actorName: name,
    audience: { kind: "admins" },
    excludeUserId: userId,
  });

  return { employee: updated ?? before, changes };
}