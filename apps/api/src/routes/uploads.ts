import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { supabaseAdmin, UPLOADS_BUCKET } from "../lib/supabase.js";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/admin/uploads",
    { preHandler: [app.requireAdmin] },
    async (req) => {
      const file = await req.file({ limits: { fileSize: 10 * 1024 * 1024 } });
      if (!file) {
        throw app.httpErrors.badRequest("No file provided");
      }
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw app.httpErrors.unsupportedMediaType(
          `Unsupported file type: ${file.mimetype}`,
        );
      }

      const buf = await file.toBuffer();
      const ext = extname(file.filename ?? "") || ".png";
      const path = `updates/${randomUUID()}${ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(UPLOADS_BUCKET)
        .upload(path, buf, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadErr) {
        req.log.error({ err: uploadErr }, "Supabase Storage upload failed");
        throw app.httpErrors.internalServerError("Upload failed");
      }

      const { data } = supabaseAdmin.storage
        .from(UPLOADS_BUCKET)
        .getPublicUrl(path);

      return { url: data.publicUrl, path };
    },
  );
};
