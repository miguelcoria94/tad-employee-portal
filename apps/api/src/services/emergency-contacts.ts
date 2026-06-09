import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from "@tadhealth/shared";

async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ employeeId: schema.profiles.employeeId })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return row?.employeeId ?? null;
}

export async function listMyContacts(userId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return [];

  return db
    .select()
    .from(schema.emergencyContacts)
    .where(eq(schema.emergencyContacts.employeeId, employeeId))
    .orderBy(schema.emergencyContacts.createdAt);
}

export async function addContact(
  userId: string,
  input: Omit<CreateEmergencyContactInput, "employeeId">,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) {
    throw Object.assign(new Error("No linked employee profile"), {
      statusCode: 400,
    });
  }

  const [inserted] = await db
    .insert(schema.emergencyContacts)
    .values({
      employeeId,
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email ?? null,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return inserted!;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: UpdateEmergencyContactInput,
) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return null;

  const [row] = await db
    .update(schema.emergencyContacts)
    .set({ ...input, updatedAt: sql`now()` })
    .where(
      and(
        eq(schema.emergencyContacts.id, contactId),
        eq(schema.emergencyContacts.employeeId, employeeId),
      ),
    )
    .returning();

  return row ?? null;
}

export async function deleteContact(userId: string, contactId: string) {
  const db = getDb();
  const employeeId = await getEmployeeIdForUser(userId);
  if (!employeeId) return null;

  const [row] = await db
    .delete(schema.emergencyContacts)
    .where(
      and(
        eq(schema.emergencyContacts.id, contactId),
        eq(schema.emergencyContacts.employeeId, employeeId),
      ),
    )
    .returning();

  return row ?? null;
}

export async function listContactsForEmployee(employeeId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.emergencyContacts)
    .where(eq(schema.emergencyContacts.employeeId, employeeId))
    .orderBy(schema.emergencyContacts.createdAt);
}
