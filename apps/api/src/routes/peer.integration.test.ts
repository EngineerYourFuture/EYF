import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for peer mocks (`peer.ts`) — 4 previously untested writes.
 *
 * The signaling endpoints carry the real risk. `/:mockId/signal` relays WebRTC
 * offers/answers/ICE between two people in a live call, so if the participant
 * check ever weakens, a stranger who knows a mock id can inject signalling into
 * someone else's interview. That check is the main thing pinned here.
 *
 * `/queue/join` is the Basic+ paywall. BILLING_ENABLED is set explicitly rather
 * than inherited, because it defaults to false (the paywall is off pre-launch) —
 * without pinning it the gate test would silently pass for the wrong reason.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("peer mocks — plan gate + signalling participants (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let aId = "", bId = "", strangerId = "";
  let peerMockId = "", aiMockId = "";
  const s = Date.now();

  const auth = (id: string, plan = "elite") => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: `p${id}@x`, name: "P", role: "STUDENT_ELITE", plan }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });
  const signal = (mockId: string, id: string, plan = "elite") =>
    app.inject({
      method: "POST", url: `/v1/peer/${mockId}/signal`, headers: auth(id, plan),
      payload: JSON.stringify({ kind: "offer", payload: { sdp: "v=0" } }),
    });

  beforeAll(async () => {
    process.env.BILLING_ENABLED = "true";
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [a, b, stranger] = await Promise.all([
      prisma.user.create({ data: { clerkId: `pr_a_${s}`, email: `pr-a-${s}@test.eyf`, name: "A" } }),
      prisma.user.create({ data: { clerkId: `pr_b_${s}`, email: `pr-b-${s}@test.eyf`, name: "B" } }),
      prisma.user.create({ data: { clerkId: `pr_x_${s}`, email: `pr-x-${s}@test.eyf`, name: "X" } }),
    ]);
    aId = a.id; bId = b.id; strangerId = stranger.id;

    const [peerMock, aiMock] = await Promise.all([
      prisma.mockSession.create({ data: { type: "PEER", candidateId: aId, peerId: bId, scheduledFor: new Date() } }),
      prisma.mockSession.create({ data: { type: "AI", candidateId: aId, scheduledFor: new Date() } }),
    ]);
    peerMockId = peerMock.id; aiMockId = aiMock.id;
  });

  afterAll(async () => {
    await prisma.mockSession.deleteMany({ where: { candidateId: { in: [aId, bId, strangerId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [aId, bId, strangerId] } } }).catch(() => {});
    await app.close();
  });

  // ── paywall ──────────────────────────────────────────────────────
  it("refuses queue entry on the free plan (peer mocks are Basic+)", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/peer/queue/join", headers: auth(strangerId, "free"),
      payload: JSON.stringify({}),
    });
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe("PLAN_UPGRADE_REQUIRED");
  });

  it("allows queue entry on a paid plan, and leaving is idempotent", async () => {
    const join = await app.inject({
      method: "POST", url: "/v1/peer/queue/join", headers: auth(strangerId, "basic"),
      payload: JSON.stringify({}),
    });
    expect(join.statusCode).toBe(200);

    // Leaving twice must not error — clients retry this on disconnect.
    for (let i = 0; i < 2; i++) {
      const leave = await app.inject({ method: "POST", url: "/v1/peer/queue/leave", headers: auth(strangerId, "basic"), payload: JSON.stringify({}) });
      expect(leave.statusCode).toBe(200);
    }
  });

  // ── signalling participants ──────────────────────────────────────
  it("lets a participant relay a signal to their peer", async () => {
    const res = await signal(peerMockId, aId);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.sent).toBe(true);
  });

  it("refuses a stranger who knows the mock id — no hijacking a live call", async () => {
    const res = await signal(peerMockId, strangerId);
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("refuses signalling against a non-peer (AI) mock", async () => {
    const res = await signal(aiMockId, aId);
    expect(res.statusCode).toBe(404);
  });

  it("refuses signalling against a mock id that does not exist", async () => {
    const res = await signal("cl00000000000000000000000", aId);
    expect(res.statusCode).toBe(404);
  });

  it("refuses a non-participant polling for another pair's signals", async () => {
    const res = await app.inject({
      method: "GET", url: `/v1/peer/${peerMockId}/signal`,
      headers: { authorization: auth(strangerId).authorization },
    });
    // 404 rather than 403 here: the poll route doesn't disclose that the mock exists.
    expect(res.statusCode).toBe(404);
  });

  it("requires authentication to signal at all", async () => {
    const res = await app.inject({
      method: "POST", url: `/v1/peer/${peerMockId}/signal`,
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ kind: "offer", payload: {} }),
    });
    expect(res.statusCode).toBe(401);
  });
});
