import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { isAssistantConfigured, runAssistant } from "../services/assistant/chat.js";

const chatBody = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export const assistantRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/assistant/status",
    { preHandler: [app.requireAuth] },
    async () => ({ configured: isAssistantConfigured() }),
  );

  app.post(
    "/assistant/chat",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { messages } = chatBody.parse(req.body);
      const reply = await runAssistant(req.user!.sub, messages);
      return { reply };
    },
  );
};
