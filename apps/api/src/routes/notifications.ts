import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from "../services/notifications.js";

const idParam = z.object({ id: z.string().uuid() });
const listQuery = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10) || 50, 200) : 50)),
  unread: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) =>
      typeof v === "string" ? v === "true" || v === "1" : !!v,
    ),
});

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/notifications",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { limit, unread } = listQuery.parse(req.query);
      const notifications = await listNotifications(req.user!.sub, {
        limit,
        onlyUnread: unread,
      });
      const unread_count = await unreadCount(req.user!.sub);
      return { notifications, unreadCount: unread_count };
    },
  );

  app.post(
    "/notifications/:id/read",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      await markRead(req.user!.sub, id);
      return { ok: true };
    },
  );

  app.post(
    "/notifications/mark-all-read",
    { preHandler: [app.requireAuth] },
    async (req) => {
      await markAllRead(req.user!.sub);
      return { ok: true };
    },
  );
};
