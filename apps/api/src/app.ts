import { timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import rawBody from "fastify-raw-body";

import { RATE_LIMIT_PER_MIN, type Plan } from "@eyf/types";
import { env } from "./env.js";
import { redis } from "./lib/redis.js";
import { authPlugin } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { registerRoutes } from "./routes/index.js";
import { initSentry, captureException, registry, httpDuration, httpRequests } from "./lib/observability.js";
import { checkReadiness } from "./lib/health.js";

/** Constant-time `Authorization: Bearer <token>` check — no early-exit timing leak. */
function bearerMatches(header: string | undefined, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const got = Buffer.from(header ?? "");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function buildApp() {
  initSentry();

  const app = Fastify({
    logger: {
      level: env.API_LOG_LEVEL,
      // Defense-in-depth (S3): strip credentials/PII from any log line. The default
      // Fastify request serializer doesn't emit headers, but this covers a raised log
      // level or any future custom header/body logging so secrets can never leak.
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          'req.headers["x-admin-gate"]',
          'req.headers["x-razorpay-signature"]',
          "headers.authorization",
          "*.password",
          "*.token",
          "password",
        ],
        censor: "[redacted]",
      },
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
    },
    disableRequestLogging: false,
    // Trust exactly the number of proxy hops in front of us (LB/CDN), so a
    // client can't spoof X-Forwarded-For past the real edge. `true` would trust
    // any hop — which defeats IP-based rate limiting.
    trustProxy: env.TRUST_PROXY_HOPS,
    bodyLimit: 1_048_576,
    // Correlation id: reuse an inbound x-request-id (from the edge) or mint one.
    genReqId: (req) => (req.headers["x-request-id"] as string) ?? crypto.randomUUID(),
  });

  // Raw audio bodies for the voice transcription endpoint.
  app.addContentTypeParser(
    ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "application/octet-stream"],
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  // Security headers. CSP is intentionally strict but scoped to the API's own
  // responses (JSON + errors); the web app sets its own page CSP. HSTS is on so
  // downgrade attacks are refused once served over TLS.
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "same-site" },
  });
  await app.register(cors, {
    origin: env.API_CORS_ORIGINS.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(sensible);
  // Per-plan rate limit backed by Redis so the limit is GLOBAL across every API
  // instance (an in-memory store would let the effective limit scale with the
  // pod count and reset on each deploy). authPlugin runs first, so req.session
  // is populated for authenticated requests; anonymous requests key by IP.
  await app.register(rateLimit, {
    // Shared Redis store in real deployments → the limit is global across every
    // instance. In tests we use the default in-memory store so each app build is
    // isolated (a shared store would leak counts across test files).
    ...(env.NODE_ENV === "test" ? {} : { redis, nameSpace: "eyf-rl:" }),
    max: (req) => {
      // Tests hammer many endpoints from one IP; the limiter runs before auth
      // (so it can't see the plan) — disable it under test to avoid false 429s.
      // Dedicated flag (not NODE_ENV) so prod can't disable the limiter by env-name.
      if (env.DISABLE_RATE_LIMIT) return 1_000_000;
      const plan = (req.session?.plan ?? "free") as Plan;
      return RATE_LIMIT_PER_MIN[plan];
    },
    timeWindow: "1 minute",
    keyGenerator: (req) => req.session?.id ?? req.ip,
    // The plugin THROWS this to the error handler, so it must carry a statusCode
    // (else it renders as 500). errorHandler passes pre-shaped API errors through.
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
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
  // Separate 30-day refresh-token signer under its own secret. Distinct secrets
  // mean a refresh token can't be replayed as an access token (it won't verify
  // under the access secret) and vice-versa. Decorates reply.refreshJwtSign /
  // request.refreshJwtVerify. Powers POST /v1/auth/refresh.
  await app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    namespace: "refresh",
    sign: { expiresIn: "30d" },
  });
  // Keep raw body around for webhook signature verification (Razorpay, Clerk/svix).
  await app.register(rawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
  });

  await app.register(authPlugin);

  // Per-request metrics + echo the correlation id back to the caller.
  app.addHook("onResponse", async (req, reply) => {
    reply.header("x-request-id", req.id);
    const route = (req.routeOptions?.url ?? req.url.split("?")[0]) as string;
    const labels = { method: req.method, route, status: String(reply.statusCode) };
    httpRequests.inc(labels);
    httpDuration.observe(labels, reply.elapsedTime / 1000);
  });

  app.setErrorHandler((err: FastifyError, req, reply) => {
    const status = err.statusCode ?? 500;
    if (status >= 500) {
      captureException(err, { reqId: req.id, url: req.url, method: req.method });
    }
    return errorHandler(err, req, reply);
  });

  // ── Health & metrics (unauthenticated, excluded from rate limiting) ──
  app.get("/livez", { config: { rateLimit: false } }, async () => ({ ok: true }));
  app.get("/readyz", { config: { rateLimit: false } }, async (_req, reply) => {
    const r = await checkReadiness();
    return reply.code(r.ok ? 200 : 503).send({ ok: r.ok, checks: r.checks });
  });
  // Back-compat shallow checks (existing probes / uptime pingers).
  app.get("/health", { config: { rateLimit: false } }, async () => ({ ok: true, ts: Date.now() }));
  app.get("/v1/health", { config: { rateLimit: false } }, async () => ({ ok: true, ts: Date.now() }));

  app.get("/metrics", { config: { rateLimit: false } }, async (req, reply) => {
    // Fail CLOSED in production (S2): metrics leak internal route names, latencies, and
    // traffic volumes, so an unset token must NOT mean "open". Hidden as 404 (don't reveal
    // the endpoint exists) — this forces operators to set METRICS_TOKEN before scraping.
    // Dev/test stay open for convenience.
    if (!env.METRICS_TOKEN) {
      if (env.NODE_ENV === "production") return reply.code(404).send("not found");
    } else if (!bearerMatches(req.headers.authorization, env.METRICS_TOKEN)) {
      return reply.code(401).send("unauthorized");
    }
    reply.header("content-type", registry.contentType);
    return registry.metrics();
  });

  await app.register(registerRoutes, { prefix: "/v1" });

  return app;
}
