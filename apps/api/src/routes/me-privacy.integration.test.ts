import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Locks the GDPR/DPDP data-subject rights in routes/me.ts — legally load-bearing behaviour:
 * Right of Access (`GET /export` returns a machine-readable copy as a download) and Right to
 * Erasure (`POST /delete` requires an explicit typed confirmation, soft-deletes the account,
 * and evicts every session immediately).
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("account privacy: export + erasure (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;

  const token = () => app.jwt.sign({ id: userId, email: "pr@x", name: "Priv", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const u = await prisma.user.create({ data: { clerkId: `pr_${Date.now()}`, email: `pr-${Date.now()}@test.eyf`, name: "Privacy Student" } });
    userId = u.id;
    await prisma.userSession.create({ data: { userId, userAgent: "vitest", ip: "127.0.0.1" } });
  });

  afterAll(async () => {
    if (!userId) return;
    await prisma.userSession.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  it("exports the caller's personal data as a download (Right of Access)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/me/export", headers: { authorization: `Bearer ${token()}` } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
    const data = res.json().data;
    expect(data.exportedAt).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(data.sessions.length).toBeGreaterThanOrEqual(1); // the seeded session is included
  });

  it("refuses erasure without the exact typed confirmation", async () => {
    for (const body of [{}, { confirm: "delete" }, { confirm: "yes" }]) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/me/delete",
        headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
        payload: JSON.stringify(body),
      });
      expect(res.statusCode).toBe(400);
    }
    // Nothing was deleted by the failed attempts.
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
    expect(u?.deletedAt).toBeNull();
  });

  it("soft-deletes the account and evicts all sessions on confirmed erasure (Right to Erasure)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/me/delete",
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
      payload: JSON.stringify({ confirm: "DELETE" }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.deleted).toBe(true);

    const u = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
    expect(u?.deletedAt).not.toBeNull(); // soft-deleted, not hard-deleted
    const sessions = await prisma.userSession.count({ where: { userId } });
    expect(sessions).toBe(0); // every session evicted immediately
  });
});
