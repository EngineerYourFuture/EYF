import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  API_CORS_ORIGINS: z.string().default("http://localhost:3000"),
  API_LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().url(),
  // Direct (non-pooled) connection for migrations/DDL. Optional — Prisma falls
  // back to DATABASE_URL when unset (single-node/local). In prod set the pooled
  // URL as DATABASE_URL and the direct URL here.
  DIRECT_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // Number of trusted proxy hops in front of the API (LB/CDN). trustProxy is set
  // to this exact count so X-Forwarded-For can't be spoofed past the real edge.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  // ── Observability (all optional; no-op without values) ──────────────
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  // Service version/commit surfaced to Sentry + /metrics for release tracking.
  RELEASE: z.string().default("dev"),
  // When set, GET /metrics requires `Authorization: Bearer <token>` so the
  // Prometheus endpoint isn't world-readable. Unset = open (scrape via network policy).
  METRICS_TOKEN: z.string().optional(),

  // 32+ chars (256-bit). Generate with `openssl rand -hex 32`. A short secret
  // makes HS256 tokens offline-forgeable — including admin tokens.
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Dev-only email login (no password). Fail-closed: OFF unless explicitly
  // enabled, so a deploy that forgets NODE_ENV=production can't hand out admin
  // tokens. Never set this in production.
  DEV_LOGIN_ENABLED: z.string().default("false").transform((v) => v === "true"),

  // Test-only escape hatches for the SSRF guard and the rate limiter. Gated on
  // dedicated flags (NOT NODE_ENV) so no production value of NODE_ENV can silently
  // disable a security control — a deploy misconfigured as NODE_ENV=test still
  // keeps both on. Set true ONLY in the test env (see vitest.config). Fail-closed.
  DISABLE_SSRF_GUARD: z.string().default("false").transform((v) => v === "true"),
  DISABLE_RATE_LIMIT: z.string().default("false").transform((v) => v === "true"),

  // Second gate on the admin portal: staff must enter this shared access code
  // (on top of being logged in with a staff role) to reach /admin. Unset = gate
  // disabled (dev). Set a strong value in production for defense-in-depth.
  ADMIN_ACCESS_CODE: z.string().optional(),

  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Master switch for paywalls. Off until Razorpay goes live, so the whole app
  // is usable on the free tier; set BILLING_ENABLED=true to re-enable plan gating.
  BILLING_ENABLED: z.string().default("false").transform((v) => v === "true"),

  JUDGE0_URL: z.string().url().default("http://localhost:2358"),
  JUDGE0_TOKEN: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("EYF <noreply@eyf.in>"),

  // ── Storage (Cloudflare R2; all optional — no-op without values) ─────
  // Validated here so a typo'd key fails fast at boot instead of at first
  // upload, matching every other integration. Not required: object storage
  // is not wired yet, so the app runs without these.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Public app origin — used for absolute links in transactional email.
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://eyf.in"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
