import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export function errorHandler(
  err: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Pre-shaped API errors (e.g. the rate limiter, which throws its response
  // body) — pass through untouched so the rich payload + status survive.
  const shaped = err as unknown as { success?: boolean; error?: unknown; statusCode?: number };
  if (shaped && typeof shaped === "object" && shaped.success === false && shaped.error) {
    return reply.code(shaped.statusCode ?? 400).send({ success: false, error: shaped.error });
  }

  if (err instanceof ZodError) {
    return reply.code(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body.",
        details: err.flatten(),
      },
    });
  }

  const status = err.statusCode ?? 500;
  req.log.error({ err }, "request failed");

  return reply.code(status).send({
    success: false,
    error: {
      code: err.code ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
      message:
        status >= 500 && process.env.NODE_ENV === "production"
          ? "Something went wrong on our end."
          : err.message,
    },
  });
}
