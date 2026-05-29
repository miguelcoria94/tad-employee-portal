import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createTimeOffRequestSchema,
  decideTimeOffRequestSchema,
  timeOffStatusSchema,
} from "@tadhealth/shared";
import {
  cancelOwnRequest,
  createRequest,
  decideRequest,
  listAll,
  listMine,
} from "../services/time-off.js";

const idParam = z.object({ id: z.string().uuid() });
const listQuery = z.object({ status: timeOffStatusSchema.optional() });

export const timeOffRoutes: FastifyPluginAsync = async (app) => {
  app.get("/time-off", { preHandler: [app.requireAuth] }, async (req) => {
    const requests = await listMine(req.user!.sub);
    return { requests };
  });

  app.post(
    "/time-off",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const input = createTimeOffRequestSchema.parse(req.body);
      try {
        const row = await createRequest(req.user!.sub, input);
        reply.status(201);
        return { request: row };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.delete(
    "/time-off/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await cancelOwnRequest(req.user!.sub, id);
      if (!row)
        throw app.httpErrors.notFound(
          "Request not found, not yours, or already decided",
        );
      return { request: row };
    },
  );

  app.get(
    "/admin/time-off",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { status } = listQuery.parse(req.query);
      const requests = await listAll({ status: status ?? null });
      return { requests };
    },
  );

  app.patch(
    "/admin/time-off/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = decideTimeOffRequestSchema.parse(req.body);
      const row = await decideRequest(req.user!.sub, id, input);
      if (!row) throw app.httpErrors.notFound("Request not found");
      return { request: row };
    },
  );
};