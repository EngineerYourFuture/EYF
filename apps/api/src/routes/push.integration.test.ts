import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for push-token registration (`push.ts`) — 3 untested writes.
 *
 * The asymmetry between the two routes is deliberate and worth pinning:
 *
 *   - `/register` upserts on the token and (re)binds it to the caller, so a phone
 *     that switches accounts stops delivering to the previous owner. That is the
 *     intended handoff behaviour.
 *   - `/unregister` is scoped to `(token, userId)`, so one user CANNOT silently
 *     unregister another user's device.
 *
 * If unregister ever lost its userId clause, anyone holding a token string could
 * mute another student's notifications.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("push — token registration scoping (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let aId = "", bId = "";
  const s = Date.now();
  const tokenA = `tok-a-${s}-aaaaaaaaaa`;

  const auth = (id: string) => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: `pu${id}@x`, name: "U", role: "STUDENT_FREE", plan: "free" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });
  const register = (id: string, token: string, platform = "WEB") =>
    app.inject({ method: "POST", url: "/v1/push/register", headers: auth(id), payload: JSON.stringify({ token, platform }) });
  const unregister = (id: string, token: string) =>
    app.inject({ method: "POST", url: "/v1/push/unregister", headers: auth(id), payload: JSON.stringify({ token }) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [a, b] = await Promise.all([
      prisma.user.create({ data: { clerkId: `pu_a_${s}`, email: `pu-a-${s}@test.eyf`, name: "A" } }),
      prisma.user.create({ data: { clerkId: `pu_b_${s}`, email: `pu-b-${s}@test.eyf`, name: "B" } }),
    ]);
    aId = a.id; bId = b.id;
  });

  afterAll(async () => {
    await prisma.pushToken.deleteMany({ where: { userId: { in: [aId, bId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [aId, bId] } } }).catch(() => {});
    await app.close();
  });

  it("requires authentication", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/push/register",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ token: tokenA, platform: "WEB" }),
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects a too-short token and an unknown platform", async () => {
    expect((await register(aId, "short")).statusCode).toBe(400);
    expect((await register(aId, tokenA, "PAGER")).statusCode).toBe(400);
    expect(await prisma.pushToken.count({ where: { userId: aId } })).toBe(0);
  });

  it("registers a token bound to the caller", async () => {
    const res = await register(aId, tokenA);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.userId).toBe(aId);

    const row = await prisma.pushToken.findUnique({ where: { token: tokenA }, select: { userId: true, lang: true } });
    expect(row!.userId).toBe(aId);
    expect(row!.lang).toBe("en"); // schema default
  });

  it("re-registering the same token updates in place instead of duplicating", async () => {
    const res = await register(aId, tokenA);
    expect(res.statusCode).toBe(200);
    expect(await prisma.pushToken.count({ where: { token: tokenA } })).toBe(1);
  });

  it("another user cannot unregister a device that isn't theirs", async () => {
    const res = await unregister(bId, tokenA);
    // The route reports success (deleteMany matched nothing) — the guarantee is
    // in the data, not the status, so assert the row survived.
    expect(res.statusCode).toBe(200);
    const row = await prisma.pushToken.findUnique({ where: { token: tokenA }, select: { userId: true } });
    expect(row).not.toBeNull();
    expect(row!.userId).toBe(aId);
  });

  it("the owner can unregister their own device", async () => {
    const res = await unregister(aId, tokenA);
    expect(res.statusCode).toBe(200);
    expect(await prisma.pushToken.count({ where: { token: tokenA } })).toBe(0);
  });

  it("re-registering the same token under a new account hands the device over", async () => {
    await register(aId, tokenA);
    const res = await register(bId, tokenA);
    expect(res.statusCode).toBe(200);

    // Intended handoff: one physical device maps to one account at a time.
    const row = await prisma.pushToken.findUnique({ where: { token: tokenA }, select: { userId: true } });
    expect(row!.userId).toBe(bId);
    expect(await prisma.pushToken.count({ where: { token: tokenA } })).toBe(1);
  });
});
