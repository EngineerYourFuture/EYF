import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { ORG_VERIFY_RATE_LIMIT } from "./rate-limits.js";

describe("org /verify rate limit (access-code brute-force protection)", () => {
  it("allows up to `max` attempts per IP, then 429s", async () => {
    const app = Fastify();
    await app.register(rateLimit, { global: false }); // per-route configs only
    app.post("/verify", { config: { rateLimit: ORG_VERIFY_RATE_LIMIT } }, async () => ({ ok: true }));

    const fire = () => app.inject({ method: "POST", url: "/verify", payload: { code: "x" }, remoteAddress: "9.9.9.9" });
    const codes: number[] = [];
    for (let i = 0; i < ORG_VERIFY_RATE_LIMIT.max + 1; i++) codes.push((await fire()).statusCode);

    expect(codes.slice(0, ORG_VERIFY_RATE_LIMIT.max).every((c) => c === 200)).toBe(true);
    expect(codes[ORG_VERIFY_RATE_LIMIT.max]).toBe(429); // the extra attempt is blocked
    await app.close();
  });

  it("is meaningfully tight for a code-guessing endpoint (guards against loosening)", () => {
    expect(ORG_VERIFY_RATE_LIMIT.max).toBeLessThanOrEqual(10);
    expect(ORG_VERIFY_RATE_LIMIT.timeWindow).toBe("1 minute");
  });
});
