import { and, desc, eq, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { getDb, schema } from "@tadhealth/db";
import { notify } from "./notifications.js";

async function getEmployeeForUser(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      employeeId: schema.profiles.employeeId,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      avatarUrl: schema.employees.avatarUrl,
      title: schema.employees.title,
    })
    .from(schema.profiles)
    .leftJoin(
      schema.employees,
      eq(schema.profiles.employeeId, schema.employees.id),
    )
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return row ?? null;
}

export async function listConversations(userId: string) {
  const db = getDb();

  const rows = await db
    .select()
    .from(schema.dmConversations)
    .where(
      or(
        eq(schema.dmConversations.participant1Id, userId),
        eq(schema.dmConversations.participant2Id, userId),
      ),
    )
    .orderBy(desc(schema.dmConversations.lastMessageAt));

  const enriched = await Promise.all(
    rows.map(async (conv) => {
      const otherUserId =
        conv.participant1Id === userId
          ? conv.participant2Id
          : conv.participant1Id;
      const other = await getEmployeeForUser(otherUserId);

      const [unreadRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.dmMessages)
        .where(
          and(
            eq(schema.dmMessages.conversationId, conv.id),
            eq(schema.dmMessages.senderUserId, otherUserId),
            isNull(schema.dmMessages.readAt),
          ),
        );

      return {
        ...conv,
        otherParticipant: {
          userId: otherUserId,
          firstName: other?.firstName ?? null,
          lastName: other?.lastName ?? null,
          avatarUrl: other?.avatarUrl ?? null,
          title: other?.title ?? null,
        },
        unreadCount: unreadRow?.count ?? 0,
      };
    }),
  );

  return enriched;
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
) {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(schema.dmConversations)
    .where(
      or(
        and(
          eq(schema.dmConversations.participant1Id, userId),
          eq(schema.dmConversations.participant2Id, otherUserId),
        ),
        and(
          eq(schema.dmConversations.participant1Id, otherUserId),
          eq(schema.dmConversations.participant2Id, userId),
        ),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(schema.dmConversations)
    .values({
      participant1Id: userId,
      participant2Id: otherUserId,
    })
    .returning();

  return created!;
}

export async function listMessages(
  userId: string,
  conversationId: string,
  opts?: { limit?: number; before?: string; q?: string },
) {
  const db = getDb();

  const [conv] = await db
    .select()
    .from(schema.dmConversations)
    .where(
      and(
        eq(schema.dmConversations.id, conversationId),
        or(
          eq(schema.dmConversations.participant1Id, userId),
          eq(schema.dmConversations.participant2Id, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) return null;

  const limit = Math.min(opts?.limit ?? 50, 100);

  const conditions = [eq(schema.dmMessages.conversationId, conversationId)];
  if (opts?.before) {
    conditions.push(lt(schema.dmMessages.createdAt, new Date(opts.before)));
  }
  // Free-text search within a conversation. When present we ignore the
  // `before` cursor and return the most recent matches.
  const q = opts?.q?.trim();
  if (q) {
    conditions.push(ilike(schema.dmMessages.body, `%${q}%`));
  }

  const messages = await db
    .select()
    .from(schema.dmMessages)
    .where(and(...conditions))
    .orderBy(desc(schema.dmMessages.createdAt))
    .limit(limit);

  return messages;
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string,
) {
  const db = getDb();

  const [conv] = await db
    .select()
    .from(schema.dmConversations)
    .where(
      and(
        eq(schema.dmConversations.id, conversationId),
        or(
          eq(schema.dmConversations.participant1Id, userId),
          eq(schema.dmConversations.participant2Id, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) return null;

  const [message] = await db
    .insert(schema.dmMessages)
    .values({
      conversationId,
      senderUserId: userId,
      body,
    })
    .returning();

  await db
    .update(schema.dmConversations)
    .set({ lastMessageAt: sql`now()` })
    .where(eq(schema.dmConversations.id, conversationId));

  // Notify the recipient (best-effort — never block/fail the send on it).
  const recipientUserId =
    conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
  try {
    const sender = await getEmployeeForUser(userId);
    const senderName =
      [sender?.firstName, sender?.lastName].filter(Boolean).join(" ") ||
      "Someone";
    const preview = body.length > 120 ? `${body.slice(0, 117)}…` : body;
    await notify({
      kind: "new_dm",
      title: `New message from ${senderName}`,
      body: preview,
      link: `/dms?c=${conversationId}`,
      entityType: "dm_conversation",
      entityId: conversationId,
      actorName: senderName,
      audience: { kind: "users", ids: [recipientUserId] },
      excludeUserId: userId,
    });
  } catch {
    // Notification failures must not surface as a failed message send.
  }

  return message!;
}

export async function markConversationRead(
  userId: string,
  conversationId: string,
) {
  const db = getDb();

  const [conv] = await db
    .select()
    .from(schema.dmConversations)
    .where(
      and(
        eq(schema.dmConversations.id, conversationId),
        or(
          eq(schema.dmConversations.participant1Id, userId),
          eq(schema.dmConversations.participant2Id, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) return null;

  const otherUserId =
    conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

  const result = await db
    .update(schema.dmMessages)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(schema.dmMessages.conversationId, conversationId),
        eq(schema.dmMessages.senderUserId, otherUserId),
        isNull(schema.dmMessages.readAt),
      ),
    )
    .returning({ id: schema.dmMessages.id });

  return { markedRead: result.length };
}
