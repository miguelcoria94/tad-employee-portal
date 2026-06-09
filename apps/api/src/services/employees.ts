import { and, asc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from "@tadhealth/shared";

export async function listEmployees(query: ListEmployeesQuery) {
  const db = getDb();
  const where = [];

  if (!query.includeInactive) {
    where.push(eq(schema.employees.isActive, true));
  }
  if (query.department) {
    where.push(
      or(
        eq(schema.employees.department, query.department),
        eq(schema.employees.subDepartment, query.department),
      )!,
    );
  }
  if (query.q) {
    const like = `%${query.q}%`;
    // Match the full name too: a query like "Nick Bingaman" must match a row
    // whose first_name="Nick" and last_name="Bingaman", which per-column ilike
    // alone would miss.
    const fullName = sql`(${schema.employees.firstName} || ' ' || coalesce(${schema.employees.lastName}, ''))`;
    where.push(
      or(
        ilike(schema.employees.firstName, like),
        ilike(schema.employees.lastName, like),
        ilike(fullName, like),
        ilike(schema.employees.email, like),
        ilike(schema.employees.title, like),
        ilike(schema.employees.department, like),
        ilike(schema.employees.subDepartment, like),
      )!,
    );
  }

  // Expose the linked auth user id (profiles.id). The employees table has no
  // user column; the link lives on profiles.employeeId. Clients (feedback,
  // DMs, search) need userId to address a person, so surface it here.
  return db
    .select({
      ...getTableColumns(schema.employees),
      userId: schema.profiles.id,
    })
    .from(schema.employees)
    .leftJoin(schema.profiles, eq(schema.profiles.employeeId, schema.employees.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(schema.employees.sortOrder), asc(schema.employees.firstName));
}

export async function getEmployee(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      ...getTableColumns(schema.employees),
      userId: schema.profiles.id,
    })
    .from(schema.employees)
    .leftJoin(schema.profiles, eq(schema.profiles.employeeId, schema.employees.id))
    .where(eq(schema.employees.id, id))
    .limit(1);
  return row ?? null;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const db = getDb();
  const [row] = await db.insert(schema.employees).values(input).returning();
  return row;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const db = getDb();
  const [row] = await db
    .update(schema.employees)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(schema.employees.id, id))
    .returning();
  return row ?? null;
}

export async function deleteEmployee(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.employees)
    .where(eq(schema.employees.id, id))
    .returning({ id: schema.employees.id });
  return row ?? null;
}