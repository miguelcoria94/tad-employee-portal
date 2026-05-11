import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { verifySupabaseJwt, type SupabaseJwtPayload } from "../lib/jwt.js";
import { getProfile } from "../services/profiles.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: SupabaseJwtPayload;
    isAdmin?: boolean;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest) => Promise<void>;
    requireAdmin: (req: FastifyRequest) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  // req.user / req.isAdmin are typed via the `declare module "fastify"` block
  // below. We don't call decorateRequest because in Fastify v5 the getter
  // variant makes the property read-only, which breaks the assignment below.

  app.decorate("requireAuth", async (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw app.httpErrors.unauthorized("Missing bearer token");
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      req.user = await verifySupabaseJwt(token);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      req.log.warn({ err }, `JWT verification failed: ${detail}`);
      throw app.httpErrors.unauthorized(
        process.env.NODE_ENV === "production"
          ? "Invalid or expired token"
          : `Invalid or expired token (${detail})`,
      );
    }
  });

  app.decorate("requireAdmin", async (req: FastifyRequest) => {
    await app.requireAuth(req);
    if (!req.user) throw app.httpErrors.unauthorized();
    const profile = await getProfile(req.user.sub);
    if (!profile?.isAdmin) {
      throw app.httpErrors.forbidden("Admin access required");
    }
    req.isAdmin = true;
  });
};

export default fp(authPlugin, { name: "auth" });