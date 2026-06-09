import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  getOrCreateConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "../services/dms.js";

const idParam = z.object({ id: z.string().uuid() });

const messagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime({ offset: true }).optional(),
  q: z.string().max(200).optional(),
});

const createConversationBody = z.object({
  recipientUserId: z.string().uuid(),
});

const sendMessageBody = z.object({
  body: z.string().min(1).max(10_000),
});

export const dmRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dms", { preHandler: [app.requireAuth] }, async (req) => {
    const conversations = await listConversations(req.user!.sub);
    return { conversations };
  });

  app.post(
    "/dms",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { recipientUserId } = createConversationBody.parse(req.body);
      const conversation = await getOrCreateConversation(
        req.user!.sub,
        recipientUserId,
      );
      reply.status(201);
      return { conversation };
    },
  );

  app.get(
    "/dms/:id/messages",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const { limit, before, q } = messagesQuery.parse(req.query);
      const messages = await listMessages(req.user!.sub, id, {
        limit,
        before,
        q,
      });
      if (messages === null)
        throw app.httpErrors.notFound("Conversation not found or not yours");
      return { messages };
    },
  );

  app.post(
    "/dms/:id/messages",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const { body } = sendMessageBody.parse(req.body);
      const message = await sendMessage(req.user!.sub, id, body);
      if (!message)
        throw app.httpErrors.notFound("Conversation not found or not yours");
      reply.status(201);
      return { message };
    },
  );

  app.post(
    "/dms/:id/read",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const result = await markConversationRead(req.user!.sub, id);
      if (!result)
        throw app.httpErrors.notFound("Conversation not found or not yours");
      return result;
    },
  );
};
