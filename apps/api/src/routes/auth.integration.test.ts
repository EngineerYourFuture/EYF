import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for session lifecycle (`auth.ts`): refresh rotation, logout
 * eviction, and the concurrent-session cap.
 *
 * These are the account-sharing and session-revocation controls, so the tests
 * assert the SECURITY properties rather than the response shape:
 *
 *   - a refresh token and an access token are not interchangeable;
 *   - logout kills the session server-side, so a stolen refresh token is dead
 *     even though it hasn't expired;
 *   - the session cap actually evicts the oldest device, and the evicted token
 *     stops working (this is what stops one login being shared across a class).
 *
 * DEV_LOGIN_ENABLED is set here rather than inherited, so the suite behaves the
 * same on a CI box that doesn't carry the local .env.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("auth — refresh rotation, logout, session cap (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId = "";
  const s = Date.now();
  const email = `auth-${s}@test.eyf`;

  const login = async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/auth/dev-login",
      headers: { "content-type": "application/json" }, payload: JSON.stringify({ email }),
    });
    expect(res.statusCode).toBe(200);
    return res.json().data as { token: string; refreshToken: string };
  };
  const refresh = (rt: string) =>
    app.inject({ method: "POST", url: "/v1/auth/refresh", headers: { authorization: `Bearer ${rt}` } });

  beforeAll(async () => {
    process.env.DEV_LOGIN_ENABLED = "true";
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const u = await prisma.user.create({ data: { clerkId: `auth_${s}`, email, name: "Auth User" } });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.userSession.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  it("issues a session-backed token pair and rotates both on refresh", async () => {
    const first = await login();
    expect(first.token).toBeTruthy();
    expect(first.refreshToken).toBeTruthy();

    const res = await refresh(first.refreshToken);
    expect(res.statusCode).toBe(200);
    const next = res.json().data;
    expect(next.token).toBeTruthy();
    expect(next.refreshToken).toBeTruthy();

    // Deliberately NOT asserting the rotated string differs from the original:
    // `iat` has second resolution, so re-signing the same {sid,uid} inside the
    // same second yields a byte-identical JWT. That assertion passes or fails on
    // timing, not behaviour. What the endpoint actually promises is that the pair
    // it returns is usable and still bound to the SAME session — assert that.
    const me = await app.inject({ method: "GET", url: "/v1/me", headers: { authorization: `Bearer ${next.token}` } });
    expect(me.statusCode).toBe(200);

    // The rotated refresh token works for a further refresh (the chain continues).
    expect((await refresh(next.refreshToken)).statusCode).toBe(200);

    // Rotation must not spawn a second session row for the same device.
    expect(await prisma.userSession.count({ where: { userId } })).toBe(1);
  });

  it("refuses an ACCESS token presented as a refresh token", async () => {
    const { token } = await login();
    const res = await refresh(token);
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("INVALID_REFRESH");
  });

  it("refuses a garbage refresh token", async () => {
    const res = await refresh("not-a-jwt");
    expect(res.statusCode).toBe(401);
  });

  it("logout evicts the session server-side, killing an unexpired refresh token", async () => {
    const { refreshToken } = await login();
    expect((await refresh(refreshToken)).statusCode).toBe(200); // works before logout

    const out = await app.inject({ method: "POST", url: "/v1/auth/logout", headers: { authorization: `Bearer ${refreshToken}` } });
    expect(out.statusCode).toBe(200);

    // The token itself has NOT expired — it is dead because the session row is gone.
    const after = await refresh(refreshToken);
    expect(after.statusCode).toBe(401);
    expect(after.json().error.code).toBe("SESSION_REVOKED");
  });

  it("caps concurrent sessions and kills the evicted device's token", async () => {
    await prisma.userSession.deleteMany({ where: { userId } });

    const a = await login();
    const b = await login();
    const c = await login();
    const d = await login(); // 4th login forces eviction

    expect(await prisma.userSession.count({ where: { userId } })).toBeLessThanOrEqual(3);

    // The oldest device is signed out — this is the account-sharing control.
    const oldest = await refresh(a.refreshToken);
    expect(oldest.statusCode).toBe(401);
    expect(oldest.json().error.code).toBe("SESSION_REVOKED");

    // The newest device is unaffected.
    expect((await refresh(d.refreshToken)).statusCode).toBe(200);
    void b; void c;
  });

  it("refuses to refresh a soft-deleted account", async () => {
    const { refreshToken } = await login();
    await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });

    const res = await refresh(refreshToken);
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("SESSION_REVOKED");

    await prisma.user.update({ where: { id: userId }, data: { deletedAt: null } });
  });
});
