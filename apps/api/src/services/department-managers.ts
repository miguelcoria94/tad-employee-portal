import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";

export async function listManagedDepartmentIds(
  userId: string,
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.departmentManagers.departmentId })
    .from(schema.departmentManagers)
    .where(eq(schema.departmentManagers.userId, userId));
  return rows.map((r) => r.id);
}

export async function isDepartmentManagerByName(
  userId: string,
  departmentName: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.departments.id })
    .from(schema.departmentManagers)
    .innerJoin(
      schema.departments,
      eq(schema.departmentManagers.departmentId, schema.departments.id),
    )
    .where(
      and(
        eq(schema.departmentManagers.userId, userId),
        eq(schema.departments.name, departmentName),
      ),
    )
    .limit(1);
  return !!row;
}

export async function listManagersForDepartment(departmentId: string) {
  const db = getDb();
  const rows = await db
    .select({
      userId: schema.departmentManagers.userId,
      employeeId: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      title: schema.employees.title,
      email: schema.employees.email,
      avatarUrl: schema.employees.avatarUrl,
    })
    .from(schema.departmentManagers)
    .leftJoin(
      schema.profiles,
      eq(schema.departmentManagers.userId, schema.profiles.id),
    )
    .leftJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.departmentManagers.departmentId, departmentId))
    .orderBy(asc(schema.employees.firstName));

  return rows.map((r) => ({
    userId: r.userId,
    employeeId: r.employeeId ?? null,
    firstName: r.firstName ?? "Unknown",
    lastName: r.lastName ?? null,
    title: r.title ?? null,
    email: r.email ?? "",
    avatarUrl: r.avatarUrl ?? null,
  }));
}

/**
 * Resolve an employee row to a profile (auth user) id. Returns null if the
 * employee has never signed in (so no profile exists linked to them).
 */
async function resolveEmployeeToUserId(
  employeeId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.employeeId, employeeId))
    .limit(1);
  return row?.id ?? null;
}

export async function addManager(departmentId: string, employeeId: string) {
  const db = getDb();
  const userId = await resolveEmployeeToUserId(employeeId);
  if (!userId) {
    throw Object.assign(
      new Error("That employee hasn't signed in yet — ask them to log in once before assigning."),
      { statusCode: 400 },
    );
  }
  const [dept] = await db
    .select({ id: schema.departments.id })
    .from(schema.departments)
    .where(eq(schema.departments.id, departmentId))
    .limit(1);
  if (!dept) {
    throw Object.assign(new Error("Department not found"), { statusCode: 404 });
  }
  await db
    .insert(schema.departmentManagers)
    .values({ departmentId, userId })
    .onConflictDoNothing({
      target: [
        schema.departmentManagers.departmentId,
        schema.departmentManagers.userId,
      ],
    });
  return { departmentId, userId };
}

export async function removeManager(departmentId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.departmentManagers)
    .where(
      and(
        eq(schema.departmentManagers.departmentId, departmentId),
        eq(schema.departmentManagers.userId, userId),
      ),
    )
    .returning({ userId: schema.departmentManagers.userId });
  return row ?? null;
}

/**
 * Bulk-load employees who have a profile (i.e. have signed in at least once)
 * — used as the picker pool in the admin UI.
 */
export async function listAssignableEmployees() {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      title: schema.employees.title,
      email: schema.employees.email,
      department: schema.employees.department,
      avatarUrl: schema.employees.avatarUrl,
    })
    .from(schema.profiles)
    .innerJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .orderBy(asc(schema.employees.firstName));
  return rows;
}

export async function departmentIdsByNames(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select({ id: schema.departments.id })
    .from(schema.departments)
    .where(inArray(schema.departments.name, names));
  return rows.map((r) => r.id);
}
