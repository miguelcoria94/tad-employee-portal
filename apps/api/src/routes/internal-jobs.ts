import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createInternalJobSchema,
  createJobReferralSchema,
  jobReferralStatusSchema,
  updateInternalJobSchema,
  updateJobReferralSchema,
} from "@tadhealth/shared";
import {
  createJob,
  createReferral,
  deleteJob,
  getJob,
  getOpenJob,
  listAllJobs,
  listAllReferrals,
  listMyReferrals,
  listOpenJobs,
  updateJob,
  updateReferral,
  uploadResumeForReferral,
} from "../services/internal-jobs.js";

const idParam = z.object({ id: z.string().uuid() });
const referralListQuery = z.object({
  status: jobReferralStatusSchema.optional(),
});

export const internalJobRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/internal-jobs",
    { preHandler: [app.requireAuth] },
    async () => {
      const jobs = await listOpenJobs();
      return { jobs };
    },
  );

  app.get(
    "/internal-jobs/referrals/mine",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const referrals = await listMyReferrals(req.user!.sub);
      return { referrals };
    },
  );

  app.get(
    "/internal-jobs/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const job = await getOpenJob(id);
      if (!job) throw app.httpErrors.notFound("Job not found");
      return { job };
    },
  );

  app.post(
    "/internal-jobs/:id/referrals",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const input = createJobReferralSchema.parse(req.body);
      try {
        const referral = await createReferral(req.user!.sub, id, input);
        reply.status(201);
        return { referral };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        throw app.httpErrors.createError(
          e.statusCode ?? 500,
          e.message ?? "Failed",
        );
      }
    },
  );

  app.post(
    "/internal-jobs/referrals/:id/resume",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const file = await req.file({ limits: { fileSize: 10 * 1024 * 1024 } });
      if (!file) throw app.httpErrors.badRequest("No file provided");
      try {
        const referral = await uploadResumeForReferral(id, {
          buffer: await file.toBuffer(),
          mimetype: file.mimetype,
          filename: file.filename,
        });
        if (!referral) throw app.httpErrors.notFound("Referral not found");
        return { referral };
      } catch (err) {
        const e = err as Error & { statusCode?: number };
        if (e.statusCode) throw app.httpErrors.createError(e.statusCode, e.message);
        req.log.error({ err }, "Resume upload failed");
        throw app.httpErrors.internalServerError("Resume upload failed");
      }
    },
  );

  app.get(
    "/admin/internal-jobs",
    { preHandler: [app.requireAdmin] },
    async () => {
      const jobs = await listAllJobs();
      return { jobs };
    },
  );

  app.get(
    "/admin/internal-jobs/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const job = await getJob(id);
      if (!job) throw app.httpErrors.notFound("Job not found");
      return { job };
    },
  );

  app.post(
    "/admin/internal-jobs",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const input = createInternalJobSchema.parse(req.body);
      const job = await createJob(input, { actorId: req.user!.sub });
      return { job };
    },
  );

  app.patch(
    "/admin/internal-jobs/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateInternalJobSchema.parse(req.body);
      const job = await updateJob(id, input);
      if (!job) throw app.httpErrors.notFound("Job not found");
      return { job };
    },
  );

  app.delete(
    "/admin/internal-jobs/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const job = await deleteJob(id);
      if (!job) throw app.httpErrors.notFound("Job not found");
      return { id: job.id };
    },
  );

  app.get(
    "/admin/job-referrals",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { status } = referralListQuery.parse(req.query);
      const referrals = await listAllReferrals({ status: status ?? null });
      return { referrals };
    },
  );

  app.patch(
    "/admin/job-referrals/:id",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const { id } = idParam.parse(req.params);
      const input = updateJobReferralSchema.parse(req.body);
      const referral = await updateReferral(id, input);
      if (!referral) throw app.httpErrors.notFound("Referral not found");
      return { referral };
    },
  );
};
