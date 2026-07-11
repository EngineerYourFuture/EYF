/**
 * Observability: error tracking (Sentry) + Prometheus metrics + a request
 * correlation id. Everything here degrades to a safe no-op when the relevant
 * env var is absent, so local/dev runs need zero configuration and production
 * lights up the moment SENTRY_DSN / a Prometheus scraper is pointed at it.
 */
import * as Sentry from "@sentry/node";
import { collectDefaultMetrics, Registry, Histogram, Counter } from "prom-client";
import { env } from "../env.js";

let sentryOn = false;

export function initSentry(): void {
  if (!env.SENTRY_DSN || sentryOn) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.RELEASE,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  });
  sentryOn = true;
}

/** Report an error to Sentry (if configured) with optional request context. */
export function captureException(err: unknown, ctx?: Record<string, unknown>): void {
  if (!sentryOn) return;
  Sentry.captureException(err, ctx ? { extra: ctx } : undefined);
}

export async function flushSentry(ms = 2000): Promise<void> {
  if (sentryOn) await Sentry.flush(ms).catch(() => {});
}

// ── Prometheus ──────────────────────────────────────────────────────
export const registry = new Registry();
registry.setDefaultLabels({ service: "eyf-api", release: env.RELEASE });
collectDefaultMetrics({ register: registry });

export const httpDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

export const httpRequests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});
