import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createCompanyUpdateSchema,
  updateCompanyUpdateSchema,
} from "@tadhealth/shared";
import {
  createCompanyUpdate,
  deleteCompanyUpdate,
  getCompanyUpdate,
  listCompanyUpdates,
  updateCompanyUpdate,
} from "../services/company-updates.js";

const idParam = z.object({ id: z.string().uuid() });

export const companyUpdateRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/company-updates",
    { preHandler: [app.requireAuth] },
    async () => {
      const updates = await listCompanyUpdates();
      return { updates };
    },
  );

  app.get(
    "/company-updates/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const update = await getCompanyUpdate(id);
      if (!update) throw app.httpErrors.notFound("Update not found");
      return { update };
    },
  );

  app.post(
    "/admin/company-updates",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createCompanyUpdateSchema.parse(req.body);
      const row = await createCompanyUpdate(input, { actorId: req.user!.sub });
      return { update: row };
    },
  );

  app.patch(
    "/admin/company-updates/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateCompanyUpdateSchema.parse(req.body);
      const row = await updateCompanyUpdate(id, input);
      if (!row) throw app.httpErrors.notFound("Update not found");
      return { update: row };
    },
  );

  app.delete(
    "/admin/company-updates/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteCompanyUpdate(id);
      if (!row) throw app.httpErrors.notFound("Update not found");
      return { id: row.id };
    },
  );
};
