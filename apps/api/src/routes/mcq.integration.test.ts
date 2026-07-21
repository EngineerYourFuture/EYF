import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Covers the public MCQ catalog surfaces (routes/mcq.ts, Tier 2) — `/catalog` and `/sims` are
 * unauthenticated marketing/discovery endpoints, so the contract (200 + shape, no auth) is what
 * matters.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("MCQ public catalog (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;

  beforeAll(async () => { app = await (await import("../app.js")).buildApp(); });
  afterAll(async () => { await app.close(); });

  it("serves the category catalog publicly (no auth) with counts", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/mcq/catalog" });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.categories[0]).toHaveProperty("count");
    expect(Array.isArray(data.companies)).toBe(true);
  });

  it("serves the company sims publicly", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/mcq/sims" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});
