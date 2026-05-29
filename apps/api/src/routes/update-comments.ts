import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  createUpdateCommentSchema,
  editUpdateCommentSchema,
} from "@tadhealth/shared";
import {
  createComment,
  deleteComment,
  editOwnComment,
  listComments,
} from "../services/update-comments.js";
import { getProfile } from "../services/profiles.js";

const updateIdParam = z.object({ id: z.string().uuid() });
const commentIdParam = z.object({ id: z.string().uuid() });

export const updateCommentRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/company-updates/:id/comments",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = updateIdParam.parse(req.params);
      const comments = await listComments(id);
      return { comments };
    },
  );

  app.post(
    "/company-updates/:id/comments",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const { id } = updateIdParam.parse(req.params);
      const input = createUpdateCommentSchema.parse(req.body);
      try {
        const row = await createComment(req.user!.sub, id, input.body);
        reply.status(201);
        return { comment: row };
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
    "/comments/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = commentIdParam.parse(req.params);
      const input = editUpdateCommentSchema.parse(req.body);
      const row = await editOwnComment(req.user!.sub, id, input.body);
      if (!row)
        throw app.httpErrors.notFound("Comment not found or not yours");
      return { comment: row };
    },
  );

  app.delete(
    "/comments/:id",
    { preHandler: [app.requireAuth] },
    async (req) => {
      const { id } = commentIdParam.parse(req.params);
      const profile = await getProfile(req.user!.sub);
      const row = await deleteComment(
        req.user!.sub,
        profile?.isAdmin ?? false,
        id,
      );
      if (!row)
        throw app.httpErrors.notFound("Comment not found or not yours");
      return { id: row.id };
    },
  );
};
