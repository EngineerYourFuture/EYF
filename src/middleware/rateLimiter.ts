import rateLimit, { Options } from "express-rate-limit";

interface LimiterConfig {
  windowMs: number;
  max: number;
  message?: string;
}

export const createRateLimiter = (config: LimiterConfig) =>
  rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: config.message ?? "Too many requests. Please wait before trying again.",
        },
      });
    },
  } satisfies Partial<Options>);

// Named limiters used across the app
export const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20, message: "Too many auth attempts. Try again in 15 minutes." });
export const ctfSubmitLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 10, message: "Too many flag submissions. Wait 5 minutes before trying again." });
export const voteLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
export const reviewLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5 });
