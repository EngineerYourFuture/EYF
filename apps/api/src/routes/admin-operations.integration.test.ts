import "dotenv/config";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { recordProviderUsage } from "../lib/provider-usage.js";
describe.skipIf(!process.env.DATABASE_URL)("operating metrics and request usage attribution", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>, prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = `${Date.now()}-ops`, users: { id: string; token: string; gate: string }[] = [];
  const call = (who: number, path: string) => app.inject({ method: "GET", url: path, headers: { authorization: `Bearer ${users[who]!.token}`, "x-admin-gate": users[who]!.gate } });
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp();
    app.get("/test-metered-request", { preHandler: app.requireAuth }, async () => { await Promise.resolve(); await recordProviderUsage({ provider: stamp, model: "fixture-model", requestId: stamp, outcome: "OK", inputTokens: 40, outputTokens: 10, latencyMs: 123 }); return { ok: true }; });
    await app.ready();
    for (const role of ["ADMIN", "STUDENT_FREE"] as const) { const u = await prisma.user.create({ data: { clerkId: `${stamp}-${role}`, email: `${stamp}-${role}@test.eyf`, name: role, role } }); users.push({ id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: role, role, plan: "free" }), gate: app.jwt.sign({ id: u.id, adminGate: true }) }); }
  });
  afterAll(async () => { await prisma.providerUsage.deleteMany({ where: { provider: stamp } }); for (const u of users) await prisma.user.delete({ where: { id: u.id } }); await app?.close(); });
  it("attributes provider usage through Fastify's asynchronous request lifecycle", async () => {
    expect((await call(1, "/test-metered-request")).statusCode).toBe(200);
    const usage = await prisma.providerUsage.findFirst({ where: { provider: stamp } }); expect(usage).toMatchObject({ userId: users[1]!.id, feature: "/test-metered-request", inputTokens: 40, outputTokens: 10, estimatedUsd: null });
  });
  it("restricts metrics to analytics staff, validates windows and preserves unknown costs", async () => {
    expect((await app.inject({ url: "/v1/admin/operations" })).statusCode).toBe(401);
    expect((await call(1, "/v1/admin/operations")).statusCode).toBe(403);
    expect((await call(0, "/v1/admin/operations?days=10000")).statusCode).toBe(400);
    const res = await call(0, "/v1/admin/operations?days=7"); expect(res.statusCode).toBe(200); expect(res.headers["cache-control"]).toBe("private, no-store");
    const data = res.json().data; expect(data.sprintFunnel).toHaveLength(5); expect(data.providerUsage.find((u: { provider: string }) => u.provider === stamp)).toMatchObject({ requests: 1, unpricedRequests: 1, estimatedUsd: null });
    expect(JSON.stringify(data)).not.toContain(users[1]!.id);
  });
});
