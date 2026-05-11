import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@tadhealth/shared";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../services/departments.js";

const idParam = z.object({ id: z.string().uuid() });

export const departmentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/departments", { preHandler: [app.requireAuth] }, async () => {
    const rows = await listDepartments();
    return { departments: rows };
  });

  app.post(
    "/admin/departments",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createDepartmentSchema.parse(req.body);
      const row = await createDepartment(input);
      return { department: row };
    },
  );

  app.patch(
    "/admin/departments/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateDepartmentSchema.parse(req.body);
      const row = await updateDepartment(id, input);
      if (!row) throw app.httpErrors.notFound("Department not found");
      return { department: row };
    },
  );

  app.delete(
    "/admin/departments/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteDepartment(id);
      if (!row) throw app.httpErrors.notFound("Department not found");
      return { id: row.id };
    },
  );
};
