import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the mentor money paths (`mentors.ts`).
 *
 * Both writes here move money or decide where money lands, so the negative cases
 * are the point:
 *
 *   - `/me/razorpay-link` sets the account payouts are sent to. Only a registered
 *     mentor may set it, and only ever their own.
 *   - `/mocks/:mockId/complete` flips a session to COMPLETED and triggers
 *     settlement. If the ownership check weakened, mentor B could settle mentor
 *     A's session — paying out for work they didn't do.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("mentors — payout link + mock settlement guards (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let mentorAUser = "", mentorBUser = "", plainUser = "", studentId = "";
  let mentorAId = "", mentorBId = "";
  let expertMockA = "", peerMockA = "";
  const s = Date.now();

  const auth = (id: string) => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: `m${id}@x`, name: "M", role: "MENTOR", plan: "elite" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [ua, ub, up, st] = await Promise.all([
      prisma.user.create({ data: { clerkId: `mt_a_${s}`, email: `mt-a-${s}@test.eyf`, name: "Mentor A" } }),
      prisma.user.create({ data: { clerkId: `mt_b_${s}`, email: `mt-b-${s}@test.eyf`, name: "Mentor B" } }),
      prisma.user.create({ data: { clerkId: `mt_p_${s}`, email: `mt-p-${s}@test.eyf`, name: "Plain" } }),
      prisma.user.create({ data: { clerkId: `mt_s_${s}`, email: `mt-s-${s}@test.eyf`, name: "Student" } }),
    ]);
    mentorAUser = ua.id; mentorBUser = ub.id; plainUser = up.id; studentId = st.id;

    const [ma, mb] = await Promise.all([
      prisma.mentor.create({ data: { userId: mentorAUser, company: "Acme", jobTitle: "Staff", yearsExp: 9, expertise: ["dsa"] } }),
      prisma.mentor.create({ data: { userId: mentorBUser, company: "Globex", jobTitle: "Senior", yearsExp: 6, expertise: ["system-design"] } }),
    ]);
    mentorAId = ma.id; mentorBId = mb.id;

    const [em, pm] = await Promise.all([
      prisma.mockSession.create({ data: { type: "EXPERT", candidateId: studentId, mentorId: mentorAId, scheduledFor: new Date() } }),
      prisma.mockSession.create({ data: { type: "PEER", candidateId: studentId, mentorId: mentorAId, scheduledFor: new Date() } }),
    ]);
    expertMockA = em.id; peerMockA = pm.id;
  });

  afterAll(async () => {
    await prisma.mockSession.deleteMany({ where: { candidateId: studentId } }).catch(() => {});
    await prisma.mentorPayout.deleteMany({ where: { mentorId: { in: [mentorAId, mentorBId] } } }).catch(() => {});
    await prisma.mentor.deleteMany({ where: { id: { in: [mentorAId, mentorBId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [mentorAUser, mentorBUser, plainUser, studentId] } } }).catch(() => {});
    await app.close();
  });

  // ── payout account linking ───────────────────────────────────────
  it("refuses a non-mentor trying to link a payout account", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/mentors/me/razorpay-link", headers: auth(plainUser),
      payload: JSON.stringify({ razorpayAccountId: "acc_evil123" }),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("NOT_A_MENTOR");
  });

  it("links the payout account to the CALLER's mentor row only", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/mentors/me/razorpay-link", headers: auth(mentorAUser),
      payload: JSON.stringify({ razorpayAccountId: "acc_mentorA" }),
    });
    expect(res.statusCode).toBe(200);

    const [a, b] = await Promise.all([
      prisma.mentor.findUnique({ where: { id: mentorAId }, select: { razorpayAccountId: true } }),
      prisma.mentor.findUnique({ where: { id: mentorBId }, select: { razorpayAccountId: true } }),
    ]);
    expect(a!.razorpayAccountId).toBe("acc_mentorA");
    expect(b!.razorpayAccountId).toBeNull(); // the other mentor is untouched
  });

  it("rejects a too-short account id rather than storing it", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/mentors/me/razorpay-link", headers: auth(mentorAUser),
      payload: JSON.stringify({ razorpayAccountId: "x" }),
    });
    expect(res.statusCode).toBe(400);

    const row = await prisma.mentor.findUnique({ where: { id: mentorAId }, select: { razorpayAccountId: true } });
    expect(row!.razorpayAccountId).toBe("acc_mentorA"); // previous value intact
  });

  // ── settlement guards ────────────────────────────────────────────
  it("refuses a non-mentor trying to complete a mock", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/mentors/mocks/${expertMockA}/complete`, headers: auth(plainUser), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(403);
  });

  it("mentor B cannot settle mentor A's session — no payout for work they didn't do", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/mentors/mocks/${expertMockA}/complete`, headers: auth(mentorBUser), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(404);

    // The session is untouched, so no settlement was triggered.
    const row = await prisma.mockSession.findUnique({ where: { id: expertMockA }, select: { status: true, endedAt: true } });
    expect(row!.status).not.toBe("COMPLETED");
    expect(row!.endedAt).toBeNull();
    expect(await prisma.mentorPayout.count({ where: { mentorId: mentorBId } })).toBe(0);
  });

  it("refuses to settle a session that isn't an expert mock", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/mentors/mocks/${peerMockA}/complete`, headers: auth(mentorAUser), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("WRONG_TYPE");

    const row = await prisma.mockSession.findUnique({ where: { id: peerMockA }, select: { status: true } });
    expect(row!.status).not.toBe("COMPLETED");
  });

  it("404s an unknown mock id", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/mentors/mocks/cl00000000000000000000000/complete", headers: auth(mentorAUser), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(404);
  });
});
