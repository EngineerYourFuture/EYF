/**
 * Per-route rate-limit overrides for @fastify/rate-limit, applied via a route's
 * `config.rateLimit`. These are TIGHTER than the global per-plan limit for
 * brute-force-sensitive, unauthenticated endpoints.
 */

// Employer-portal login: the access code is a guessable credential, so cap
// attempts hard (per IP, via the global keyGenerator) to make brute-force
// impractical. 5/min ≈ 300/hour vs. the global free-plan rate.
export const ORG_VERIFY_RATE_LIMIT = { max: 5, timeWindow: "1 minute" } as const;
