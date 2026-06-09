import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@tadhealth/db";
import {
  createDepartmentResourceSchema,
  updateDepartmentResourceSchema,
} from "@tadhealth/shared";
import {
  createDepartmentResource,
  deleteDepartmentResource,
  getResourceById,
  listCompanyResources,
  listResourcesForDepartment,
  updateDepartmentResource,
} from "../services/department-resources.js";
import { isDepartmentManagerByName } from "../services/department-managers.js";
import { getProfile } from "../services/profiles.js";

const idParam = z.object({ id: z.string().uuid() });
const deptQuery = z.object({ department: z.string().min(1).max(80) });

async function resourceDeptName(id: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ name: schema.departmentResources.departmentName })
    .from(schema.departmentResources)
    .where(eq(schema.departmentResources.id, id))
    .limit(1);
  return row?.name ?? null;
}

async function ensureCanManage(
  app: import("fastify").FastifyInstance,
  userId: string,
  departmentName: string,
) {
  const profile = await getProfile(userId);
  if (profile?.isAdmin) return;
  const ok = await isDepartmentManagerByName(userId, departmentName);
  if (!ok)
    throw app.httpErrors.forbidden("Not a manager of this department");
}

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

  // Company-wide resources (handbook/benefits) visible to every employee.
  app.get(
    "/company-resources",
    { preHandler: [app.requireAuth] },
    async () => {
      const resources = await listCompanyResources();
      return { resources };
    },
  );

  // Single resource (used by the rich-document detail view; any authenticated
  // user may read, mirroring the select-all RLS policy).
  app.get(
    "/resources/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const resource = await getResourceById(id);
      if (!resource) throw app.httpErrors.notFound("Resource not found");
      return { resource };
    },
  );

  app.post(
    "/admin/department-resources",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const input = createDepartmentResourceSchema.parse(req.body);
      await ensureCanManage(app, req.user!.sub, input.departmentName);
      const row = await createDepartmentResource(input, {
        actorId: req.user!.sub,
      });
      return { resource: row };
    },
  );

  app.patch(
    "/admin/department-resources/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateDepartmentResourceSchema.parse(req.body);
      const name = await resourceDeptName(id);
      if (!name) throw app.httpErrors.notFound("Resource not found");
      await ensureCanManage(app, req.user!.sub, name);
      if (input.departmentName && input.departmentName !== name) {
        await ensureCanManage(app, req.user!.sub, input.departmentName);
      }
      const row = await updateDepartmentResource(id, input);
      if (!row) throw app.httpErrors.notFound("Resource not found");
      return { resource: row };
    },
  );

  app.delete(
    "/admin/department-resources/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const name = await resourceDeptName(id);
      if (!name) throw app.httpErrors.notFound("Resource not found");
      await ensureCanManage(app, req.user!.sub, name);
      const row = await deleteDepartmentResource(id);
      if (!row) throw app.httpErrors.notFound("Resource not found");
      return { id: row.id };
    },
  );
};
