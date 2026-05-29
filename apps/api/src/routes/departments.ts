import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  addDepartmentManagerSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@tadhealth/shared";
import {
  createDepartment,
  deleteDepartment,
  listDepartmentsForUser,
  updateDepartment,
} from "../services/departments.js";
import {
  addManager,
  listAssignableEmployees,
  listManagersForDepartment,
  removeManager,
} from "../services/department-managers.js";

const idParam = z.object({ id: z.string().uuid() });
const userIdParam = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const departmentRoutes: FastifyPluginAsync = async (app) => {
  app.get("/departments", { preHandler: [app.requireAuth] }, async (req) => {
    const rows = await listDepartmentsForUser(req.user!.sub);
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

  app.get(
    "/departments/:id/managers",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const managers = await listManagersForDepartment(id);
      return { managers };
    },
  );

  app.post(
    "/admin/departments/:id/managers",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = addDepartmentManagerSchema.parse(req.body);
      try {
        const row = await addManager(id, input.employeeId);
        return row;
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
    "/admin/departments/:id/managers/:userId",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id, userId } = userIdParam.parse(req.params);
      const row = await removeManager(id, userId);
      if (!row) throw app.httpErrors.notFound("Manager not found");
      return { userId: row.userId };
    },
  );

  app.get(
    "/admin/assignable-employees",
    { preHandler: [app.requireAdmin] },
    async () => {
      const employees = await listAssignableEmployees();
      return { employees };
    },
  );
};
