import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createCompanyEventSchema,
  updateCompanyEventSchema,
} from "@tadhealth/shared";
import {
  createCompanyEvent,
  deleteCompanyEvent,
  listCompanyEvents,
  updateCompanyEvent,
} from "../services/company-events.js";

const idParam = z.object({ id: z.string().uuid() });
const listQuery = z.object({
  upcoming: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) =>
      typeof v === "string" ? v === "true" || v === "1" : !!v,
    ),
});

export const companyEventRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/company-events",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { upcoming } = listQuery.parse(req.query);
      const events = await listCompanyEvents({ upcomingOnly: upcoming });
      return { events };
    },
  );

  app.post(
    "/admin/company-events",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createCompanyEventSchema.parse(req.body);
      const row = await createCompanyEvent(input);
      return { event: row };
    },
  );

  app.patch(
    "/admin/company-events/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateCompanyEventSchema.parse(req.body);
      const row = await updateCompanyEvent(id, input);
      if (!row) throw app.httpErrors.notFound("Event not found");
      return { event: row };
    },
  );

  app.delete(
    "/admin/company-events/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteCompanyEvent(id);
      if (!row) throw app.httpErrors.notFound("Event not found");
      return { id: row.id };
    },
  );
};
