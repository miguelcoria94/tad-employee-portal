import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import type { NotificationKind } from "@tadhealth/shared";

export type Audience =
  | { kind: "all" }
  | { kind: "admins" }
  | { kind: "departments"; names: string[] }
  | { kind: "users"; ids: string[] };

type NotifyArgs = {
  kind: NotificationKind;
  title: string;
  body?: string;
  link: string;
  entityType: string;
  entityId?: string | null;
  actorName?: string | null;
  audience: Audience;
  excludeUserId?: string;
};

async function recipientUserIds(audience: Audience): Promise<string[]> {
  const db = getDb();

  if (audience.kind === "users") {
    return audience.ids;
  }

  if (audience.kind === "all") {
    const rows = await db
      .select({ id: schema.profiles.id })
      .from(schema.profiles);
    return rows.map((r) => r.id);
  }

  if (audience.kind === "admins") {
    const rows = await db
      .select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(eq(schema.profiles.isAdmin, true));
    return rows.map((r) => r.id);
  }

  // departments
  if (audience.names.length === 0) return [];
  const rows = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .innerJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(
      or(
        inArray(schema.employees.department, audience.names),
        inArray(schema.employees.subDepartment, audience.names),
      ),
    );
  // Dedupe — multiple matches possible across department + sub_department.
  return [...new Set(rows.map((r) => r.id))];
}

export async function notify(args: NotifyArgs) {
  const db = getDb();
  let userIds = await recipientUserIds(args.audience);
  if (args.excludeUserId) {
    userIds = userIds.filter((id) => id !== args.excludeUserId);
  }
  if (userIds.length === 0) return;

  await db.insert(schema.notifications).values(
    userIds.map((userId) => ({
      userId,
      kind: args.kind,
      title: args.title,
      body: args.body ?? "",
      link: args.link,
      entityType: args.entityType,
      entityId: args.entityId ?? null,
      actorName: args.actorName ?? null,
    })),
  );
}

export async function listNotifications(
  userId: string,
  opts: { limit?: number; onlyUnread?: boolean } = {},
) {
  const db = getDb();
  const limit = Math.min(opts.limit ?? 50, 200);

  const baseWhere = opts.onlyUnread
    ? and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      )
    : eq(schema.notifications.userId, userId);

  return db
    .select()
    .from(schema.notifications)
    .where(baseWhere)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
}

export async function markRead(userId: string, id: string) {
  const db = getDb();
  await db
    .update(schema.notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId),
      ),
    );
}

export async function markAllRead(userId: string) {
  const db = getDb();
  await db
    .update(schema.notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );
}

export async function unreadCount(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );
  return row?.count ?? 0;
}
