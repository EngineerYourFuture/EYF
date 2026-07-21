import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Locks the employer-portal auth boundary (routes/org.ts): `/verify` exchanges an org access
 * code for a short-lived signed token, and every other route requires that token — the raw
 * code is never a per-request credential. Security-relevant: a wrong code must not authenticate,
 * and a protected route must reject missing/garbage tokens.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("employer portal auth boundary (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string;
  let accessCode: string;
  let token: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    accessCode = `PORTAL-${s}`;
    const org = await prisma.organization.create({ data: { name: "Portal Co", slug: `portal-${s}`, accessCode } });
    orgId = org.id;
  });

  afterAll(async () => {
    if (!orgId) return;
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await app.close();
  });

  const verify = (code: string) =>
    app.inject({ method: "POST", url: "/v1/org/verify", headers: { "content-type": "application/json" }, payload: JSON.stringify({ code }) });

  it("exchanges a valid access code for an org session token", async () => {
    const res = await verify(accessCode);
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.id).toBe(orgId);
    expect(typeof data.token).toBe("string");
    token = data.token;
  });

  it("rejects a wrong access code (no token issued)", async () => {
    const res = await verify("PORTAL-WRONG");
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("INVALID_ORG_CODE");
  });

  it("authenticates a protected route with the issued token", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/org/me", headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.id).toBe(orgId);
    expect(data.counts).toHaveProperty("courses");
  });

  it("rejects a protected route with no token", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/org/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("ORG_UNAUTHORIZED");
  });

  it("rejects a protected route with a garbage token", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/org/me", headers: { authorization: "Bearer not.a.real.token" } });
    expect(res.statusCode).toBe(401);
  });
});
