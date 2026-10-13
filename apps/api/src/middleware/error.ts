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
    // Handlers validate the body, path params, AND the query string with the same
    // `z.parse(...)` call shape, so this handler cannot tell which one failed. It
    // used to answer "Invalid request body." unconditionally, which sent anyone
    // with a bad path param or query value off debugging a body they never sent.
    // `details.fieldErrors` already names the offending field, so stay accurate
    // about what we actually know.
    return reply.code(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
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
