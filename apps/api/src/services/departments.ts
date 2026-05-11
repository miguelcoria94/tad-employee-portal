import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@tadhealth/shared";

export async function listDepartments() {
  const db = getDb();
  return db
    .select()
    .from(schema.departments)
    .orderBy(asc(schema.departments.name));
}

export async function createDepartment(input: CreateDepartmentInput) {
  const db = getDb();
  const [row] = await db
    .insert(schema.departments)
    .values(input)
    .returning();
  return row;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
) {
  const db = getDb();
  const [row] = await db
    .update(schema.departments)
    .set({ ...input, updatedAt: sql`now()` })
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
