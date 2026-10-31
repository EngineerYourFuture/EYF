import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildOrgClaims } from "../lib/org-token.js";

describe.skipIf(!process.env.DATABASE_URL)("shared-code portal is retired", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string, code: string, token: string;
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp();
    code = `retired-${Date.now()}`;
    const org = await prisma.organization.create({ data: { name: "Private academy", slug: code, accessCode: code } }); orgId = org.id;
    token = app.jwt.sign(buildOrgClaims(org), { expiresIn: "8h" });
  });
  afterAll(async () => { if (orgId) await prisma.organization.delete({ where: { id: orgId } }); await app?.close(); });
  it("neither valid nor invalid access codes reveal a tenant or mint a session", async () => {
    for (const value of [code, "WRONG"]) {
      const res = await app.inject({ method: "POST", url: "/v1/org/verify", payload: { code: value } });
      expect(res.statusCode).toBe(410); expect(res.json().error.code).toBe("PORTAL_RETIRED"); expect(res.json()).not.toHaveProperty("data");
    }
  });
  it("revokes even unexpired shared tokens and rejects them as personal sessions", async () => {
    for (const headers of [{}, { authorization: `Bearer ${token}` }, { "x-org-token": token }]) {
      const res = await app.inject({ method: "GET", url: "/v1/org/me", headers });
      expect(res.statusCode).toBe(410); expect(res.body).not.toContain(orgId);
    }
    const me = await app.inject({ method: "GET", url: "/v1/me", headers: { authorization: `Bearer ${token}` } });
    expect(me.statusCode).toBe(401);
  });
});
