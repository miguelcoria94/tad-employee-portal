import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
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
    where.push(
      or(
        ilike(schema.employees.firstName, like),
        ilike(schema.employees.lastName, like),
        ilike(schema.employees.email, like),
        ilike(schema.employees.title, like),
        ilike(schema.employees.department, like),
      )!,
    );
  }

  return db
    .select()
    .from(schema.employees)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(schema.employees.sortOrder), asc(schema.employees.firstName));
}

export async function getEmployee(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.employees)
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