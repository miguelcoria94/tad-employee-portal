import fp from "fastify-plugin";
import type { FastifyError, FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";

const errorHandler: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request failed validation",
          details: err.flatten(),
        },
      });
    }
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      return reply.status(err.statusCode).send({
        error: {
          code: err.code ?? "REQUEST_ERROR",
          message: err.message,
        },
      });
    }
    req.log.error({ err }, "Unhandled error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });
};

export default fp(errorHandler, { name: "error-handler" });