import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createSurveySchema,
  submitResponseSchema,
  updateSurveySchema,
} from "@tadhealth/shared";
import {
  adminCreateSurvey,
  adminDeleteSurvey,
  adminUpdateSurvey,
  getSurveyForUser,
  getSurveyResults,
  listSurveysForUser,
  submitSurveyResponse,
} from "../services/surveys.js";
import { getProfile } from "../services/profiles.js";

const idParam = z.object({ id: z.string().uuid() });

export const surveyRoutes: FastifyPluginAsync = async (app) => {
  // Public (auth-only) reads
  app.get("/surveys", { preHandler: [app.requireAuth] }, async (req) => {
    const surveys = await listSurveysForUser(req.user!.sub);
    return { surveys };
  });

  app.get(
    "/surveys/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const survey = await getSurveyForUser(id, req.user!.sub);
      if (!survey) throw app.httpErrors.notFound("Survey not found");
      return { survey };
    },
  );

  app.post(
    "/surveys/:id/responses",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const input = submitResponseSchema.parse(req.body);
      try {
        const res = await submitSurveyResponse(id, req.user!.sub, input);
        reply.status(201);
        return { id: res.id };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Submit failed",
        );
      }
    },
  );

  app.get(
    "/surveys/:id/results",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const results = await getSurveyResults(id);
      if (!results) throw app.httpErrors.notFound("Survey not found");

      // Permission check: admin always allowed; others only if the survey
      // has show_results_to_all enabled.
      if (!results.survey.showResultsToAll) {
        const profile = await getProfile(req.user!.sub);
        if (!profile?.isAdmin) {
          throw app.httpErrors.forbidden("Results aren't shared with you");
        }
      }
      return results;
    },
  );

  // Admin writes
  app.post(
    "/admin/surveys",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createSurveySchema.parse(req.body);
      const row = await adminCreateSurvey(input, { actorId: req.user!.sub });
      return { survey: row };
    },
  );

  app.patch(
    "/admin/surveys/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateSurveySchema.parse(req.body);
      try {
        const row = await adminUpdateSurvey(id, input);
        if (!row) throw app.httpErrors.notFound("Survey not found");
        return { survey: row };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        if (e.statusCode === 409) throw app.httpErrors.conflict(e.message);
        throw err;
      }
    },
  );

  app.delete(
    "/admin/surveys/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const row = await adminDeleteSurvey(id);
      if (!row) throw app.httpErrors.notFound("Survey not found");
      return { id: row.id };
    },
  );
};
