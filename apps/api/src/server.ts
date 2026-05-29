import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import authPlugin from "./plugins/auth.js";
import errorHandler from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import { employeeRoutes } from "./routes/employees.js";
import { departmentRoutes } from "./routes/departments.js";
import { departmentResourceRoutes } from "./routes/department-resources.js";
import { companyUpdateRoutes } from "./routes/company-updates.js";
import { companyEventRoutes } from "./routes/company-events.js";
import { uploadRoutes } from "./routes/uploads.js";
import { surveyRoutes } from "./routes/surveys.js";
import { notificationRoutes } from "./routes/notifications.js";
import { timeOffRoutes } from "./routes/time-off.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.isProd
        ? undefined
        : { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } },
    },
    trustProxy: true,
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.allowedOrigins.includes(origin)) return cb(null, true);
      // Dev convenience: accept any http://localhost:<port> origin so Vite's
      // auto-port-bumping doesn't require updating ALLOWED_ORIGINS by hand.
      if (
        !config.isProd &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  await app.register(errorHandler);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(
    async (api) => {
      await api.register(meRoutes);
      await api.register(employeeRoutes);
      await api.register(departmentRoutes);
      await api.register(departmentResourceRoutes);
      await api.register(companyUpdateRoutes);
      await api.register(companyEventRoutes);
      await api.register(uploadRoutes);
      await api.register(surveyRoutes);
      await api.register(notificationRoutes);
      await api.register(timeOffRoutes);
    },
    { prefix: "/api/v1" },
  );

  return app;
}

const app = await buildServer();

try {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
