import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { peekSession } from "./auth.js";

/**
 * Regression cover for the rate limiter's identity source.
 *
 * The limiter evaluates in the `onRequest` phase, but every route guard
 * (`requireAuth`) is attached as a `preHandler` — which runs strictly later. So the
 * limiter's old `req.session?.plan` / `req.session?.id` reads were ALWAYS undefined,
 * with two production consequences that no test could see (the suite sets
 * DISABLE_RATE_LIMIT, so the limit function never ran):
 *
 *   1. Every caller got the free-tier budget — a paying elite user was capped at 60
 *      req/min instead of 1200, and the 429 body told them to "upgrade" to the plan
 *      they already had.
 *   2. Every caller was keyed by IP, so an entire campus behind one NAT egress
 *      shared a single bucket — exactly the shape of a placement-drive traffic
 *      spike.
 *
 * These tests assert the property the limiter actually depends on: identity is
 * resolved and readable before the `onRequest` phase ends.
 */
describe("rate-limit identity is resolved during onRequest", () => {
  let app: FastifyInstance;
  let seen: ReturnType<typeof peekSession> | undefined;

  beforeAll(async () => {
    app = await (await import("../app.js")).buildApp();
    app.get(
      "/__identity_probe",
      {
        // A route-level onRequest hook runs after all global onRequest hooks —
        // the same position the rate-limit plugin occupies.
        onRequest: async (req) => {
          seen = peekSession(req);
        },
      },
      async () => ({ ok: true }),
    );
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("exposes the caller's id and plan to onRequest consumers", async () => {
    const token = app.jwt.sign(
      { id: "user_elite_1", email: "elite@test.eyf", name: "Elite", role: "STUDENT_ELITE", plan: "elite" },
      { expiresIn: "5m" },
    );
    const res = await app.inject({
      method: "GET",
      url: "/__identity_probe",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    // Keying by id (not IP) is what keeps one campus NAT from sharing a bucket.
    expect(seen?.id).toBe("user_elite_1");
    // The plan is what selects the per-tier budget.
    expect(seen?.plan).toBe("elite");
  });

  it("leaves anonymous callers unresolved so they fall back to IP keying", async () => {
    const res = await app.inject({ method: "GET", url: "/__identity_probe" });

    expect(res.statusCode).toBe(200);
    expect(seen).toBeNull();
  });

  it("ignores a malformed bearer token rather than faulting the request", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/__identity_probe",
      headers: { authorization: "Bearer not-a-real-jwt" },
    });

    expect(res.statusCode).toBe(200);
    expect(seen).toBeNull();
  });
});
