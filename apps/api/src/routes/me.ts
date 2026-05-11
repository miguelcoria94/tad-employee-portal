import type { FastifyPluginAsync } from "fastify";
import {
  ensureProfile,
  getProfileWithEmployee,
} from "../services/profiles.js";

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: [app.requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const email = req.user!.email;

    let result = await getProfileWithEmployee(userId);
    if (!result) {
      // First sign-in — the auth trigger may not have fired (e.g. on Supabase
      // configurations where CREATE TRIGGER on auth.users isn't permitted to
      // the migration role). Create the profile here, then re-read.
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
    };
  });
};
