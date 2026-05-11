import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateDepartmentResourceInput,
  ResourceKind,
  UpdateDepartmentResourceInput,
} from "@tadhealth/shared";

function nullableDate(s: string | null | undefined) {
  if (!s) return null;
  // Accept either YYYY-MM-DD or a full ISO; both parse cleanly.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return s.length === 10 ? s : d.toISOString().slice(0, 10);
}

export async function listResourcesForDepartment(departmentName: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.departmentResources)
    .where(eq(schema.departmentResources.departmentName, departmentName))
    .orderBy(
      asc(schema.departmentResources.kind),
      asc(schema.departmentResources.sortOrder),
      asc(schema.departmentResources.title),
    );
}

export async function listResourcesByKind(
  departmentName: string,
  kind: ResourceKind,
) {
  const db = getDb();
  return db
    .select()
    .from(schema.departmentResources)
    .where(
      and(
        eq(schema.departmentResources.departmentName, departmentName),
        eq(schema.departmentResources.kind, kind),
      ),
    )
    .orderBy(
      asc(schema.departmentResources.sortOrder),
      asc(schema.departmentResources.title),
    );
}

export async function createDepartmentResource(
  input: CreateDepartmentResourceInput,
) {
  const db = getDb();
  const [row] = await db
    .insert(schema.departmentResources)
    .values({
      departmentName: input.departmentName,
      kind: input.kind,
      title: input.title,
      url: input.url ?? null,
      linkLabel: input.linkLabel ?? "Link",
      category: input.category ?? null,
      documentDate: nullableDate(input.documentDate),
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return row ?? null;
}

export async function updateDepartmentResource(
  id: string,
  input: UpdateDepartmentResourceInput,
) {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.departmentName !== undefined)
    patch.departmentName = input.departmentName;
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.title !== undefined) patch.title = input.title;
  if (input.url !== undefined) patch.url = input.url ?? null;
  if (input.linkLabel !== undefined) patch.linkLabel = input.linkLabel;
  if (input.category !== undefined) patch.category = input.category ?? null;
  if (input.documentDate !== undefined)
    patch.documentDate = nullableDate(input.documentDate);
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  const [row] = await db
    .update(schema.departmentResources)
    .set(patch)
    .where(eq(schema.departmentResources.id, id))
    .returning();
  return row ?? null;
}

export async function deleteDepartmentResource(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.departmentResources)
    .where(eq(schema.departmentResources.id, id))
    .returning({ id: schema.departmentResources.id });
  return row ?? null;
}
