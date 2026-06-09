import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import {
  COMPANY_RESOURCE_SCOPE,
  type CreateDepartmentResourceInput,
  type ResourceKind,
  type UpdateDepartmentResourceInput,
  slugifyDepartment,
} from "@tadhealth/shared";
import { sanitizeRichText } from "../lib/sanitize.js";
import { notify } from "./notifications.js";

function cleanContent(content: string | null | undefined): string | null {
  if (content === undefined) return null;
  if (content === null) return null;
  const sanitized = sanitizeRichText(content);
  return sanitized ? sanitized : null;
}

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

/** Company-wide resources visible to every employee (the handbook/benefits). */
export async function listCompanyResources() {
  return listResourcesForDepartment(COMPANY_RESOURCE_SCOPE);
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
  opts: { actorId?: string } = {},
) {
  const db = getDb();
  const [row] = await db
    .insert(schema.departmentResources)
    .values({
      departmentName: input.departmentName,
      kind: input.kind,
      title: input.title,
      url: input.url ?? null,
      content: cleanContent(input.content),
      linkLabel: input.linkLabel ?? "Link",
      category: input.category ?? null,
      documentDate: nullableDate(input.documentDate),
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  // Company-wide resources have no department roster to notify, so skip the
  // per-department announcement for them.
  if (row && input.departmentName !== COMPANY_RESOURCE_SCOPE) {
    await notify({
      kind: "new_resource",
      title: `New ${row.kind === "tool" ? "tool" : "document"} for ${input.departmentName}`,
      body: row.title,
      link: `/departments/${slugifyDepartment(input.departmentName)}`,
      entityType: "department_resource",
      entityId: row.id,
      audience: { kind: "departments", names: [input.departmentName] },
      excludeUserId: opts.actorId,
    });
  }
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
  if (input.content !== undefined) patch.content = cleanContent(input.content);
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

export async function getResourceById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.departmentResources)
    .where(eq(schema.departmentResources.id, id))
    .limit(1);
  return row ?? null;
}

/** All resources across every department + company-wide, for assistant search. */
export async function listAllResources() {
  const db = getDb();
  return db
    .select()
    .from(schema.departmentResources)
    .orderBy(
      asc(schema.departmentResources.departmentName),
      asc(schema.departmentResources.kind),
      asc(schema.departmentResources.sortOrder),
      asc(schema.departmentResources.title),
    );
}

export async function deleteDepartmentResource(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.departmentResources)
    .where(eq(schema.departmentResources.id, id))
    .returning({ id: schema.departmentResources.id });
  return row ?? null;
}
