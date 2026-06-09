import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createFeedbackRequestSchema,
  createFeedbackTemplateSchema,
  submitFeedbackResponseSchema,
} from "@tadhealth/shared";
import {
  canRequestAboutOthers,
  createFeedbackTemplate,
  declineFeedback,
  deleteFeedbackTemplate,
  listAllFeedback,
  listFeedbackAboutMe,
  listFeedbackIRequested,
  listFeedbackTemplates,
  listMyPendingFeedback,
  requestFeedback,
  submitFeedback,
} from "../services/feedback.js";

const idParam = z.object({ id: z.string().uuid() });

export const feedbackRoutes: FastifyPluginAsync = async (app) => {
  // Capability flag so the UI can show the right request flow.
  app.get(
    "/feedback/capabilities",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const canAboutOthers = await canRequestAboutOthers(req.user!.sub);
      return { canRequestAboutOthers: canAboutOthers };
    },
  );

  app.post(
    "/feedback/request",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const input = createFeedbackRequestSchema.parse(req.body);
      try {
        const requests = await requestFeedback(req.user!.sub, input);
        reply.status(201);
        return { requests };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.get(
    "/feedback/pending",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const feedbackRequests = await listMyPendingFeedback(req.user!.sub);
      return { feedbackRequests };
    },
  );

  app.get(
    "/feedback/requested",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const feedbackRequests = await listFeedbackIRequested(req.user!.sub);
      return { feedbackRequests };
    },
  );

  app.get(
    "/feedback/about-me",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const feedback = await listFeedbackAboutMe(req.user!.sub);
      return { feedback };
    },
  );

  app.post(
    "/feedback/:id/respond",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const input = submitFeedbackResponseSchema.parse(req.body);
      try {
        const response = await submitFeedback(req.user!.sub, id, input);
        reply.status(201);
        return { response };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.post(
    "/feedback/:id/decline",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await declineFeedback(req.user!.sub, id);
      if (!row)
        throw app.httpErrors.notFound(
          "Request not found, not yours, or already completed",
        );
      return { request: row };
    },
  );

  // ─── Templates ────────────────────────────────────────────────────────────

  app.get(
    "/feedback/templates",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const templates = await listFeedbackTemplates(req.user!.sub);
      return { templates };
    },
  );

  app.post(
    "/feedback/templates",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const input = createFeedbackTemplateSchema.parse(req.body);
      const template = await createFeedbackTemplate(req.user!.sub, input);
      reply.status(201);
      return { template };
    },
  );

  app.delete(
    "/feedback/templates/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteFeedbackTemplate(req.user!.sub, id);
      if (!row) throw app.httpErrors.notFound("Template not found");
      return { id: row.id };
    },
  );

  app.get(
    "/admin/feedback",
    { preHandler: [app.requireAdmin] },
    async () => {
      const requests = await listAllFeedback();
      return { requests };
    },
  );
};
