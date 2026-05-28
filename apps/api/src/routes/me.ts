import type { FastifyPluginAsync } from "fastify";
import { updateMyProfileSchema } from "@tadhealth/shared";
import {
  ensureProfile,
  getProfileWithEmployee,
  updateMyProfile,
} from "../services/profiles.js";

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: [app.requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const email = req.user!.email;

    let result = await getProfileWithEmployee(userId);
    // Run ensureProfile whenever the profile is missing OR exists but isn't
    // linked to an employee — covers two cases:
    //   1) First sign-in (auth trigger didn't fire on this Supabase config)
    //   2) User signed up before their directory row existed; now it does,
    //      so backfill the employee_id link.
    if (!result || result.profile.employeeId === null) {
      await ensureProfile(userId, email);
      result = await getProfileWithEmployee(userId);
    }

    if (!result) {
      throw app.httpErrors.internalServerError(
        "Could not initialize profile",
      );
    }

    return {
      profile: result.profile,
      employee: result.employee ?? null,
      manager: result.manager ?? null,
    };
  });

  app.patch(
    "/me/profile",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const input = updateMyProfileSchema.parse(req.body);
      const result = await updateMyProfile(req.user!.sub, input);
      if (!result) {
        throw app.httpErrors.notFound(
          "No employee profile linked to this account",
        );
      }
      return { employee: result.employee, changedFields: result.changes };
    },
  );
};
