import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "@tadhealth/shared";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employees.js";

const idParam = z.object({ id: z.string().uuid() });

export const employeeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/employees", { preHandler: [app.requireAuth] }, async (req) => {
    const query = listEmployeesQuerySchema.parse(req.query);
    const rows = await listEmployees(query);
    return { employees: rows };
  });

  app.get(
    "/employees/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await getEmployee(id);
      if (!row) throw app.httpErrors.notFound("Employee not found");
      return { employee: row };
    },
  );

  app.post("/employees", { preHandler: [app.requireAdmin] }, async (req) => {
    const input = createEmployeeSchema.parse(req.body);
    const row = await createEmployee(input);
    return { employee: row };
  });

  app.patch(
    "/employees/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateEmployeeSchema.parse(req.body);
      const row = await updateEmployee(id, input);
      if (!row) throw app.httpErrors.notFound("Employee not found");
      return { employee: row };
    },
  );

  app.delete(
    "/employees/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await deleteEmployee(id);
      if (!row) throw app.httpErrors.notFound("Employee not found");
      return { id: row.id };
    },
  );
};