import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
} from "@tadhealth/shared";
import {
  addContact,
  deleteContact,
  listContactsForEmployee,
  listMyContacts,
  updateContact,
} from "../services/emergency-contacts.js";

const idParam = z.object({ id: z.string().uuid() });

export const emergencyContactRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/me/emergency-contacts",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const contacts = await listMyContacts(req.user!.sub);
      return { contacts };
    },
  );

  app.post(
    "/me/emergency-contacts",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const input = createEmergencyContactSchema
        .omit({ employeeId: true })
        .parse(req.body);
      try {
        const contact = await addContact(req.user!.sub, input);
        reply.status(201);
        return { contact };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.patch(
    "/me/emergency-contacts/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateEmergencyContactSchema.parse(req.body);
      const contact = await updateContact(req.user!.sub, id, input);
      if (!contact)
        throw app.httpErrors.notFound("Contact not found or not yours");
      return { contact };
    },
  );

  app.delete(
    "/me/emergency-contacts/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const contact = await deleteContact(req.user!.sub, id);
      if (!contact)
        throw app.httpErrors.notFound("Contact not found or not yours");
      return { contact };
    },
  );

  app.get(
    "/admin/employees/:id/emergency-contacts",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const contacts = await listContactsForEmployee(id);
      return { contacts };
    },
  );
};
