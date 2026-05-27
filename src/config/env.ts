import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";

const nodeEnvFromProcess = process.env.NODE_ENV ?? "development";
if (!["development", "test", "production"].includes(nodeEnvFromProcess)) {
  throw new Error("NODE_ENV must be one of development, test, production.");
}

const resolvedNodeEnv = nodeEnvFromProcess as NodeEnv;
const resolvedPort = Number(process.env.PORT ?? 3000);
const serveFrontend = process.env.SERVE_FRONTEND === "true";
const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
const corsAllowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ??
  (serveFrontend
    ? `http://localhost:${resolvedPort},http://127.0.0.1:${resolvedPort},http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176`
    : "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

// When serving frontend from the same process, always allow the server's own origin.
if (appUrl && !corsAllowedOrigins.includes(appUrl)) {
  corsAllowedOrigins.push(appUrl);
}

if (Number.isNaN(resolvedPort) || resolvedPort <= 0) {
  throw new Error("PORT must be a positive number.");
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
const webhookSigningSecret = process.env.BILLING_WEBHOOK_SECRET;

if (!jwtAccessSecret || jwtAccessSecret.length < 24) {
  throw new Error("JWT_ACCESS_SECRET must be set and at least 24 chars.");
}
if (!jwtRefreshSecret || jwtRefreshSecret.length < 24) {
  throw new Error("JWT_REFRESH_SECRET must be set and at least 24 chars.");
}
if (!webhookSigningSecret || webhookSigningSecret.length < 24) {
  throw new Error("BILLING_WEBHOOK_SECRET must be set and at least 24 chars.");
}

const judge0ApiUrl = (process.env.JUDGE0_API_URL ?? "https://api.judge0.com").replace(/\/$/, "");
const judge0ApiKey = process.env.JUDGE0_API_KEY ?? "";

if (resolvedNodeEnv === "production") {
  if (judge0ApiUrl === "https://api.judge0.com") {
    console.warn(
      "[EYF] WARNING: JUDGE0_API_URL is unset — falling back to public api.judge0.com. " +
      "This instance has no SLA and will fail under load. " +
      "Set JUDGE0_API_URL to a self-hosted Judge0 CE instance."
    );
  }
  if (!judge0ApiKey) {
    console.warn(
      "[EYF] WARNING: JUDGE0_API_KEY is unset — unauthenticated requests will hit " +
      "Judge0's lowest rate-limit tier."
    );
  }
}

export const env = {
  nodeEnv: resolvedNodeEnv,
  port: resolvedPort,
  appName: process.env.APP_NAME ?? "eyf-api",
  appUrl,
  jwtAccessSecret,
  jwtRefreshSecret,
  billingWebhookSecret: webhookSigningSecret,
  corsAllowedOrigins,
  trustProxy: process.env.TRUST_PROXY === "true",
  serveFrontend,
  judge0ApiUrl,
  judge0ApiKey,
};
