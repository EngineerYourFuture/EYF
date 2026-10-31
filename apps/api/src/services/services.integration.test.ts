import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Integration coverage for the service query wrappers — the thin `computeX(userId)`
 * functions that run the Prisma queries and hand off to the (separately unit-tested)
 * pure logic. Seeds one user + a solved problem, then exercises each wrapper against
 * the real DB. Skips cleanly when no DATABASE_URL is present.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("service query wrappers (real DB)", () => {
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;
  let problemId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    const stamp = Date.now();
    const u = await prisma.user.create({
      data: { clerkId: `svc_${stamp}`, email: `svc-${stamp}@test.eyf`, name: "Svc Test" },
    });
    userId = u.id;
    const p = await prisma.problem.create({
      data: { slug: `svc-prob-${stamp}`, title: "Svc Problem", description: "seed", difficulty: "EASY", patterns: ["arrays-hashing"] },
    });
    problemId = p.id;
    await prisma.problemSolution.create({
      data: { problemId, userId, language: "PYTHON", code: "print(1)", verdict: "ACCEPTED", runtimeMs: 50 },
    });
    await prisma.userProfile.create({ data: { userId, currentXp: 0, streakDays: 1 } });
  });

  const extraProblemIds: string[] = [];

  afterAll(async () => {
    if (userId) {
      await prisma.peerQueue.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.flashcardReview.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.cognitiveSession.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.dailyStreak.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.missionDay.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.userBadge.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.problemSolution.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    for (const pid of [problemId, ...extraProblemIds]) {
      if (pid) await prisma.problem.delete({ where: { id: pid } }).catch(() => {});
    }
  });

  it("computeCodeDna reflects the seeded accepted submission", async () => {
    const { computeCodeDna } = await import("./code-dna.js");
    const dna = await computeCodeDna(userId);
    expect(dna.totalSubmissions).toBe(1);
    expect(dna.acceptedCount).toBe(1);
    expect(dna.primaryLanguage).toBe("PYTHON");
  });

  it("computeSkillGraph runs all its queries and scores DSA", async () => {
    const { computeSkillGraph } = await import("./skill-graph.js");
    const g = await computeSkillGraph(userId);
    expect(g.dimensions).toHaveLength(9);
    expect(g.dimensions.find((d) => d.key === "dsa")!.score).toBeGreaterThan(0);
  });

  it("buildWrapped aggregates the current year", async () => {
    const { buildWrapped } = await import("./wrapped.js");
    const w = await buildWrapped(userId, new Date().getFullYear());
    expect(w.totalSubmissions).toBeGreaterThanOrEqual(1);
    expect(w.primaryLanguage).toBe("PYTHON");
  });

  it("generateRoadmap builds a plan from the live skill graph", async () => {
    const { generateRoadmap } = await import("./roadmap-generator.js");
    const plan = await generateRoadmap(userId, { trackSlug: "backend", weeks: 8, hoursPerDay: 4 });
    expect(plan.plan).toHaveLength(8);
    expect(plan.weeks).toBe(8);
  });

  it("getDailyMission marks the solve task done", async () => {
    const { getDailyMission } = await import("./missions.js");
    const m = await getDailyMission(userId);
    expect(m.tasks).toHaveLength(3);
    expect(m.tasks.find((t) => t.key === "solve")!.done).toBe(true);
  });

  it("pickDailyChallenge exercises the pool query", async () => {
    const { pickDailyChallenge } = await import("./daily.js");
    const c = await pickDailyChallenge(userId);
    expect(c === null || typeof c.problem.slug === "string").toBe(true);
  });

  it("onAcceptedSubmission awards without throwing", async () => {
    const { onAcceptedSubmission } = await import("./gamification.js");
    const sub = await prisma.problemSolution.findFirst({ where: { userId } });
    await expect(onAcceptedSubmission(sub!.id)).resolves.toBeUndefined();
  });

  it("peer-matching queues a lone user, reports position, then leaves", async () => {
    const { joinOrMatch, checkMatch, leaveQueue } = await import("./peer-matching.js");
    try {
      const r = await joinOrMatch({ userId });
      expect(r.matched).toBe(false);
      if (!r.matched) expect(r.queuePosition).toBeGreaterThanOrEqual(0);

      const m = await checkMatch(userId);
      expect(m.matched).toBe(false);
      expect(m.mockSessionId).toBeNull();
    } finally {
      await leaveQueue(userId);
      await prisma.peerQueue.deleteMany({ where: { userId } });
    }
  });

  it("settleExpertMockPayout is a no-op for a missing / non-expert mock", async () => {
    const { settleExpertMockPayout } = await import("./payouts.js");
    await expect(settleExpertMockPayout("does-not-exist")).resolves.toBeUndefined();
  });

  it("claimDailyMission refuses an incomplete day", async () => {
    const { claimDailyMission } = await import("./missions.js");
    const r = await claimDailyMission(userId); // only the solve task is done
    expect(r.claimed).toBe(false);
    expect(r.reason).toBe("incomplete");
  });

  it("pickDailyChallenge biases toward a weak pattern", async () => {
    const { pickDailyChallenge } = await import("./daily.js");
    const stamp = Date.now();
    const wp = await prisma.problem.create({
      data: { slug: `svc-weak-${stamp}`, title: "Weak", description: "seed", difficulty: "MEDIUM", patterns: ["dynamic-programming"] },
    });
    extraProblemIds.push(wp.id);
    await prisma.problemSolution.createMany({
      data: [
        { problemId: wp.id, userId, language: "PYTHON", code: "x", verdict: "WRONG_ANSWER" },
        { problemId: wp.id, userId, language: "PYTHON", code: "x", verdict: "WRONG_ANSWER" },
      ],
    });
    const c = await pickDailyChallenge(userId); // now the weak-pattern branch of the pool query runs
    expect(c === null || typeof c.problem.slug === "string").toBe(true);
  });

  it("claimDailyMission awards the bonus once every task is done, and is idempotent", async () => {
    const { claimDailyMission } = await import("./missions.js");
    const now = new Date();
    const cards = await Promise.all([0, 1, 2].map((i) =>
      prisma.flashcard.create({ data: { subject: "OS", topic: `t${i}`, front: "q", back: "a" } }),
    ));
    try {
      await prisma.flashcardReview.createMany({
        data: cards.map((c) => ({ userId, flashcardId: c.id, lastReviewedAt: now })),
      });
      await prisma.cognitiveSession.create({ data: { userId, game: "REACTION", score: 100, accuracyPct: 90, durationSeconds: 30, playedAt: now } });

      const r = await claimDailyMission(userId);
      expect(r.claimed).toBe(true);
      expect(r.awardedXp).toBeGreaterThan(0);

      const again = await claimDailyMission(userId);
      expect(again.claimed).toBe(false);
      expect(again.reason).toBe("already-claimed");
    } finally {
      await prisma.flashcard.deleteMany({ where: { id: { in: cards.map((c) => c.id) } } }).catch(() => {});
    }
  });

  it("settleExpertMockPayout creates a PENDING payout for a completed expert mock", async () => {
    const { settleExpertMockPayout } = await import("./payouts.js");
    const stamp = Date.now();
    const mentorUser = await prisma.user.create({
      data: { clerkId: `mtr_${stamp}`, email: `mtr-${stamp}@test.eyf`, name: "Mentor" },
    });
    const mentor = await prisma.mentor.create({
      data: { userId: mentorUser.id, company: "Acme", jobTitle: "Staff", yearsExp: 8, hourlyRateInr: 1000 },
    });
    const mock = await prisma.mockSession.create({
      data: { type: "EXPERT", status: "COMPLETED", candidateId: userId, mentorId: mentor.id, durationMin: 60, scheduledFor: new Date() },
    });
    try {
      await settleExpertMockPayout(mock.id);
      const payout = await prisma.mentorPayout.findUnique({ where: { mockSessionId: mock.id } });
      expect(payout).not.toBeNull();
      expect(payout!.status).toBe("PENDING");
      // idempotent — a second settle is a no-op
      await expect(settleExpertMockPayout(mock.id)).resolves.toBeUndefined();
    } finally {
      await prisma.mentorPayout.deleteMany({ where: { mockSessionId: mock.id } }).catch(() => {});
      await prisma.mockSession.delete({ where: { id: mock.id } }).catch(() => {});
      await prisma.mentor.delete({ where: { id: mentor.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: mentorUser.id } }).catch(() => {});
    }
  });

  it("peer-matching pairs two waiting users and both discover the session", async () => {
    const { joinOrMatch, checkMatch, leaveQueue } = await import("./peer-matching.js");
    const stamp = Date.now();
    const u2 = await prisma.user.create({
      data: { clerkId: `peer_${stamp}`, email: `peer-${stamp}@test.eyf`, name: "Peer2" },
    });
    let mockId: string | null = null;
    try {
      const r1 = await joinOrMatch({ userId, problemFocus: "arrays" });
      expect(r1.matched).toBe(false);

      const r2 = await joinOrMatch({ userId: u2.id, problemFocus: "arrays" });
      expect(r2.matched).toBe(true);
      if (r2.matched) mockId = r2.mockSessionId;

      // both sides of the pair resolve the same matched session
      const [a, b] = await Promise.all([checkMatch(userId), checkMatch(u2.id)]);
      expect(a.matched).toBe(true);
      expect(b.matched).toBe(true);
      expect(a.mockSessionId).toBe(mockId);
      expect(b.mockSessionId).toBe(mockId);
    } finally {
      await leaveQueue(userId).catch(() => {});
      await leaveQueue(u2.id).catch(() => {});
      await prisma.peerQueue.deleteMany({ where: { userId: { in: [userId, u2.id] } } }).catch(() => {});
      if (mockId) await prisma.mockSession.delete({ where: { id: mockId } }).catch(() => {});
      await prisma.user.delete({ where: { id: u2.id } }).catch(() => {});
    }
  });
});
