import type { FastifyPluginAsync } from "fastify";
import {
  updateMyProfileSchema,
  updateOnboardingSchema,
} from "@tadhealth/shared";
import {
  ensureProfile,
  getProfileWithEmployee,
  updateMyProfile,
  updateOnboarding,
  uploadMyAvatar,
} from "../services/profiles.js";

const AVATAR_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
import { listManagedDepartmentIds } from "../services/department-managers.js";

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

    const managedDepartmentIds = await listManagedDepartmentIds(userId);

    return {
      profile: result.profile,
      employee: result.employee ?? null,
      manager: result.manager ?? null,
      managedDepartmentIds,
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

  app.patch(
    "/me/onboarding",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const input = updateOnboardingSchema.parse(req.body);
      const row = await updateOnboarding(req.user!.sub, input);
      if (!row)
        throw app.httpErrors.notFound("Profile not found");
      return { profile: row };
    },
  );

  app.post(
    "/me/avatar",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const file = await req.file({ limits: { fileSize: 2 * 1024 * 1024 } });
      if (!file) {
        throw app.httpErrors.badRequest("No file provided");
      }
      if (!AVATAR_MIME.has(file.mimetype)) {
        throw app.httpErrors.unsupportedMediaType(
          `Unsupported file type: ${file.mimetype}`,
        );
      }

      try {
        const employee = await uploadMyAvatar(req.user!.sub, {
          buffer: await file.toBuffer(),
          mimetype: file.mimetype,
          filename: file.filename,
        });
        if (!employee) {
          throw app.httpErrors.notFound(
            "No employee profile linked to this account",
          );
        }
        return { employee };
      } catch (err) {
        req.log.error({ err }, "Avatar upload failed");
        throw app.httpErrors.internalServerError("Upload failed");
      }
    },
  );
};
