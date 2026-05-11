import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createDepartmentResourceSchema,
  updateDepartmentResourceSchema,
} from "@tadhealth/shared";
import {
  createDepartmentResource,
  deleteDepartmentResource,
  listResourcesForDepartment,
  updateDepartmentResource,
} from "../services/department-resources.js";

const idParam = z.object({ id: z.string().uuid() });
const deptQuery = z.object({ department: z.string().min(1).max(80) });

export const departmentResourceRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/department-resources",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { department } = deptQuery.parse(req.query);
      const resources = await listResourcesForDepartment(department);
      return { resources };
    },
  );

  app.post(
    "/admin/department-resources",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createDepartmentResourceSchema.parse(req.body);
      const row = await createDepartmentResource(input);
      return { resource: row };
    },
  );

  app.patch(
    "/admin/department-resources/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateDepartmentResourceSchema.parse(req.body);
      const row = await updateDepartmentResource(id, input);
      if (!row) throw app.httpErrors.notFound("Resource not found");
      return { resource: row };
    },
  );

  app.delete(
    "/admin/department-resources/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteDepartmentResource(id);
      if (!row) throw app.httpErrors.notFound("Resource not found");
      return { id: row.id };
    },
  );
};
