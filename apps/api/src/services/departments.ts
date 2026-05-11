import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@tadhealth/shared";

/**
 * Look up the viewer's admin flag and which departments they belong to so
 * we can decide which private departments they're allowed to see.
 */
async function getViewerContext(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      isAdmin: schema.profiles.isAdmin,
      department: schema.employees.department,
      subDepartment: schema.employees.subDepartment,
    })
    .from(schema.profiles)
    .leftJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return {
    isAdmin: row?.isAdmin ?? false,
    departments: [row?.department, row?.subDepartment].filter(
      (d): d is string => typeof d === "string" && d.length > 0,
    ),
  };
}

export async function listDepartmentsForUser(userId: string) {
  const db = getDb();
  const ctx = await getViewerContext(userId);

  const all = await db
    .select()
    .from(schema.departments)
    .orderBy(asc(schema.departments.name));

  // Admins see every department. Everyone else only sees public departments
  // plus the ones they are a member of (department or sub_department match).
  return all.filter(
    (d) => ctx.isAdmin || !d.isPrivate || ctx.departments.includes(d.name),
  );
}

export async function createDepartment(input: CreateDepartmentInput) {
  const db = getDb();
  const [row] = await db
    .insert(schema.departments)
    .values({
      name: input.name,
      description: input.description,
      isPrivate: input.isPrivate ?? false,
    })
    .returning();
  return row;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
) {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.isPrivate !== undefined) patch.isPrivate = input.isPrivate;

  const [row] = await db
    .update(schema.departments)
    .set(patch)
    .where(eq(schema.departments.id, id))
    .returning();
  return row ?? null;
}

export async function deleteDepartment(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.departments)
    .where(eq(schema.departments.id, id))
    .returning({ id: schema.departments.id });
  return row ?? null;
}
