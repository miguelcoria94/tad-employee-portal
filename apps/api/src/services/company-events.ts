import { asc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type {
  CreateCompanyEventInput,
  UpdateCompanyEventInput,
} from "@tadhealth/shared";
import { notify } from "./notifications.js";

export async function listCompanyEvents(opts: { upcomingOnly?: boolean }) {
  const db = getDb();
  const where = opts.upcomingOnly
    ? gte(schema.companyEvents.startsAt, sql`now()`)
    : undefined;
  return db
    .select()
    .from(schema.companyEvents)
    .where(where)
    .orderBy(asc(schema.companyEvents.startsAt));
}

function toRow(input: CreateCompanyEventInput) {
  return {
    title: input.title,
    description: input.description,
    location: input.location ?? null,
    url: input.url ?? null,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  };
}

export async function createCompanyEvent(
  input: CreateCompanyEventInput,
  opts: { actorId?: string } = {},
) {
  const db = getDb();
  const [row] = await db
    .insert(schema.companyEvents)
    .values(toRow(input))
    .returning();
  if (row) {
    await notify({
      kind: "new_event",
      title: "New event scheduled",
      body: row.title,
      link: "/company-updates",
      entityType: "company_event",
      entityId: row.id,
      audience: { kind: "all" },
      excludeUserId: opts.actorId,
    });
  }
  return row;
}

export async function updateCompanyEvent(
  id: string,
  input: UpdateCompanyEventInput,
) {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.location !== undefined) patch.location = input.location ?? null;
  if (input.url !== undefined) patch.url = input.url ?? null;
  if (input.startsAt !== undefined) patch.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined)
    patch.endsAt = input.endsAt ? new Date(input.endsAt) : null;

  const [row] = await db
    .update(schema.companyEvents)
    .set(patch)
    .where(eq(schema.companyEvents.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCompanyEvent(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(schema.companyEvents)
    .where(eq(schema.companyEvents.id, id))
    .returning({ id: schema.companyEvents.id });
  return row ?? null;
}
