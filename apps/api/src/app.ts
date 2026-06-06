import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import rawBody from "fastify-raw-body";

import { RATE_LIMIT_PER_MIN, type Plan } from "@eyf/types";
import { env } from "./env.js";
import { authPlugin } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { registerRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.API_LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
    },
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  // Raw audio bodies for the voice transcription endpoint.
  app.addContentTypeParser(
    ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "application/octet-stream"],
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.API_CORS_ORIGINS.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(sensible);
  // Per-plan rate limit. authPlugin runs before this, so req.session is
  // already populated for authenticated requests. Anonymous requests fall
  // to the free-tier limit, keyed by IP. Authenticated ones key by user id.
  await app.register(rateLimit, {
    max: (req) => {
      const plan = (req.session?.plan ?? "free") as Plan;
      return RATE_LIMIT_PER_MIN[plan];
    },
    timeWindow: "1 minute",
    keyGenerator: (req) => req.session?.id ?? req.ip,
    errorResponseBuilder: (req, context) => ({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests. Limit is ${context.max}/min on your plan. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
        upgradeRequired: (req.session?.plan ?? "free") !== "elite",
      },
    }),
  });
  await app.register(jwt, {
    secret: { private: env.JWT_ACCESS_SECRET, public: env.JWT_ACCESS_SECRET },
    sign: { expiresIn: "15m" },
  });
  // Keep raw body around for webhook signature verification (Razorpay, Clerk/svix).
  await app.register(rawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
  });

  await app.register(authPlugin);

  app.setErrorHandler(errorHandler);

  app.get("/health", async () => ({ ok: true, ts: Date.now() }));
  app.get("/v1/health", async () => ({ ok: true, ts: Date.now() }));

  await app.register(registerRoutes, { prefix: "/v1" });

  return app;
}
