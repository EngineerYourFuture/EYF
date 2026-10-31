import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Locks the EYF Score public-share contract (routes/score.ts): the score is computed
 * SERVER-SIDE and frozen behind an unguessable code, and /verify/:code is PUBLIC — a
 * recruiter with the link sees the genuine snapshot without an account. This is a trust
 * surface, so the properties tested are security-relevant: no auth on verify, an
 * unguessable code, and a clean 404 that never leaks whether a user exists.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("EYF Score share + public verify (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;
  let code: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const u = await prisma.user.create({
      data: { clerkId: `sc_${Date.now()}`, email: `sc-${Date.now()}@test.eyf`, name: "Score Student", college: "IIT Testpur" },
    });
    userId = u.id;
  });

  afterAll(async () => {
    if (!userId) return;
    await prisma.scoreShare.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  it("computes the score server-side and returns an unguessable code", async () => {
    const token = app.jwt.sign({ id: userId, email: "sc@x", name: "Score", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    const res = await app.inject({
      method: "POST",
      url: "/v1/score/share",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: "{}",
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    code = data.code;
    // Unguessable: 10 chars from the unambiguous alphabet (no 0/o/1/l/i).
    expect(code).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);
    // Server-computed snapshot shape (never a client-supplied number).
    expect(typeof data.snapshot.overall).toBe("number");
    expect(data.snapshot.overall).toBeGreaterThanOrEqual(0);
    expect(data.snapshot.overall).toBeLessThanOrEqual(100);
    expect(typeof data.snapshot.band).toBe("string");
    expect(data.snapshot.name).toBe("Score Student");
  });

  it("verifies the code PUBLICLY — no auth header — and returns the frozen snapshot", async () => {
    const res = await app.inject({ method: "GET", url: `/v1/score/verify/${code}` });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.code).toBe(code);
    expect(typeof data.snapshot.overall).toBe("number");
    expect(data.snapshot.name).toBe("Score Student");
    expect(data.issuedAt).toBeTruthy();
  });

  it("404s on an unknown code without leaking existence", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/score/verify/zzzzzzzzzz" });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("rejects an over-long code at the validation boundary", async () => {
    const res = await app.inject({ method: "GET", url: `/v1/score/verify/${"a".repeat(65)}` });
    expect(res.statusCode).toBe(400);
  });
});
