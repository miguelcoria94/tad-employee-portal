import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateCompanyUpdateInput,
  UpdateCompanyUpdateInput,
} from "@tadhealth/shared";
import { notify } from "./notifications.js";

export async function listCompanyUpdates() {
  const db = getDb();
  return db
    .select()
    .from(schema.companyUpdates)
    .orderBy(desc(schema.companyUpdates.publishedAt));
}

export async function getCompanyUpdate(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.companyUpdates)
    .where(eq(schema.companyUpdates.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCompanyUpdate(
  input: CreateCompanyUpdateInput,
  opts: { actorId?: string } = {},
) {
  const db = getDb();
  const values = {
    title: input.title,
    body: input.body,
    ...(input.publishedAt ? { publishedAt: new Date(input.publishedAt) } : {}),
  };
  const [row] = await db
    .insert(schema.companyUpdates)
    .values(values)
    .returning();
  if (row) {
    await notify({
      kind: "new_update",
      title: "New company update",
      body: row.title,
      link: `/company-updates/${row.id}`,
      entityType: "company_update",
      entityId: row.id,
      audience: { kind: "all" },
      excludeUserId: opts.actorId,
    });
  }
  return row;
}

export async function updateCompanyUpdate(
  id: string,
  input: UpdateCompanyUpdateInput,
) {
  const db = getDb();
  const patch: Record<string, unknown> = { ...input, updatedAt: sql`now()` };
  if (input.publishedAt) {
    patch.publishedAt = new Date(input.publishedAt);
  }
  const [row] = await db
    .update(schema.companyUpdates)
    .set(patch)
    .where(eq(schema.companyUpdates.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCompanyUpdate(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.companyUpdates)
    .where(eq(schema.companyUpdates.id, id))
    .returning({ id: schema.companyUpdates.id });
  return row ?? null;
}
