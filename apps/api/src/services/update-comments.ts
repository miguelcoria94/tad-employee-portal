import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import { notify } from "./notifications.js";

async function viewerName(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
    })
    .from(schema.profiles)
    .leftJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  if (!row?.firstName) return "Someone";
  return row.lastName ? `${row.firstName} ${row.lastName}` : row.firstName;
}

export async function listComments(updateId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.updateComments)
    .where(eq(schema.updateComments.updateId, updateId))
    .orderBy(asc(schema.updateComments.createdAt));
}

export async function createComment(
  userId: string,
  updateId: string,
  body: string,
) {
  const db = getDb();
  const [exists] = await db
    .select({ id: schema.companyUpdates.id, title: schema.companyUpdates.title })
    .from(schema.companyUpdates)
    .where(eq(schema.companyUpdates.id, updateId))
    .limit(1);
  if (!exists) {
    throw Object.assign(new Error("Update not found"), { statusCode: 404 });
  }
  const name = await viewerName(userId);
  const [row] = await db
    .insert(schema.updateComments)
    .values({
      updateId,
      authorUserId: userId,
      authorName: name,
      body,
    })
    .returning();
  if (!row) throw new Error("Failed to insert comment");

  await notify({
    kind: "update_comment",
    title: "New comment on an update",
    body: `${name} on "${exists.title}": ${body.slice(0, 120)}${body.length > 120 ? "…" : ""}`,
    link: `/company-updates/${updateId}`,
    entityType: "update_comment",
    entityId: row.id,
    actorName: name,
    audience: { kind: "admins" },
    excludeUserId: userId,
  });

  return row;
}

export async function editOwnComment(
  userId: string,
  commentId: string,
  body: string,
) {
  const db = getDb();
  const [row] = await db
    .update(schema.updateComments)
    .set({ body, updatedAt: sql`now()` })
    .where(
      and(
        eq(schema.updateComments.id, commentId),
        eq(schema.updateComments.authorUserId, userId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function deleteComment(
  userId: string,
  isAdmin: boolean,
  commentId: string,
) {
  const db = getDb();
  const where = isAdmin
    ? eq(schema.updateComments.id, commentId)
    : and(
        eq(schema.updateComments.id, commentId),
        eq(schema.updateComments.authorUserId, userId),
      );
  const [row] = await db
    .delete(schema.updateComments)
    .where(where)
    .returning({ id: schema.updateComments.id });
  return row ?? null;
}
