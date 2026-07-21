import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Covers the leaderboard scope resolution (routes/leaderboard.ts, Tier 2): global always renders,
 * a cohort scope the user hasn't set (no college) short-circuits with scopeReady:false rather than
 * erroring, and query params are validated.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("leaderboard scope resolution (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;

  const tok = () => app.jwt.sign({ id: userId, email: "lb@x", name: "LB", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    // No college / graduationYear set — so college/year scopes are "not ready".
    const u = await prisma.user.create({ data: { clerkId: `lb_${Date.now()}`, email: `lb-${Date.now()}@test.eyf`, name: "Loner" } });
    userId = u.id;
  });

  afterAll(async () => {
    if (!userId) return;
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  it("returns a global leaderboard (always ready)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/leaderboard?scope=global&metric=xp", headers: { authorization: `Bearer ${tok()}` } });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.scope).toBe("global");
    expect(Array.isArray(data.rows)).toBe(true);
  });

  it("short-circuits a cohort scope the user hasn't set (scopeReady:false, no error)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/leaderboard?scope=college", headers: { authorization: `Bearer ${tok()}` } });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.scopeReady).toBe(false);
    expect(data.rows).toEqual([]);
  });

  it("validates query params (bad metric → 400)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/leaderboard?metric=bogus", headers: { authorization: `Bearer ${tok()}` } });
    expect(res.statusCode).toBe(400);
  });
});
