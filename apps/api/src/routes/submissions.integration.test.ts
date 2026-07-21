import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

/**
 * Covers the code-submission boundaries in routes/submissions.ts — the monetization + ownership
 * gates, without running the judge. The BullMQ queue is mocked so the test is hermetic (no Redis):
 * daily-cap and premium gates return 402, a good submission enqueues a judge job, and a
 * submission is only readable by its owner.
 */
const { addMock } = vi.hoisted(() => ({ addMock: vi.fn() }));
vi.mock("../jobs/queue.js", () => ({
  judgeQueue: { add: addMock },
  judgeQueueEvents: { on: vi.fn() },
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("code submissions: cap + premium + ownership (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let Language: (typeof import("@eyf/db"))["Language"];
  let userA: string, userB: string, freeProblem: string, premiumProblem: string, lang: string;
  let submissionA: string;

  const tok = (id: string, plan = "free") => app.jwt.sign({ id, email: "s@x", name: "S", role: "STUDENT", plan }, { expiresIn: "5m" });
  const submit = (id: string, slug: string, plan = "free") =>
    app.inject({
      method: "POST", url: "/v1/submissions",
      headers: { authorization: `Bearer ${tok(id, plan)}`, "content-type": "application/json" },
      payload: JSON.stringify({ problemSlug: slug, language: lang, code: "print(1)" }),
    });

  beforeAll(async () => {
    const db = await import("@eyf/db");
    prisma = db.prisma; Language = db.Language;
    lang = Object.values(Language)[0] as string;
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    const [a, b] = await Promise.all([
      prisma.user.create({ data: { clerkId: `su_a_${s}`, email: `su-a-${s}@test.eyf`, name: "A" } }),
      prisma.user.create({ data: { clerkId: `su_b_${s}`, email: `su-b-${s}@test.eyf`, name: "B" } }),
    ]);
    userA = a.id; userB = b.id;
    const fp = await prisma.problem.create({ data: { slug: `free-${s}`, title: "Free", description: "test problem", difficulty: "EASY", premium: false } });
    const pp = await prisma.problem.create({ data: { slug: `prem-${s}`, title: "Prem", description: "test problem", difficulty: "EASY", premium: true } });
    freeProblem = fp.slug; premiumProblem = pp.slug;
  });

  afterAll(async () => {
    await prisma.problemSolution.deleteMany({ where: { userId: { in: [userA, userB] } } }).catch(() => {});
    await prisma.problem.deleteMany({ where: { slug: { in: [freeProblem, premiumProblem] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } }).catch(() => {});
    await app.close();
  });

  it("accepts a valid submission (202), stores it PENDING, and enqueues a judge job", async () => {
    addMock.mockClear();
    const res = await submit(userA, freeProblem);
    expect(res.statusCode).toBe(202);
    const data = res.json().data;
    submissionA = data.id;
    expect(data.verdict).toBe("PENDING");
    expect(addMock).toHaveBeenCalledOnce();
    expect(addMock.mock.calls[0]![1]).toEqual({ submissionId: data.id });
  });

  it("404s on an unknown problem", async () => {
    const res = await submit(userA, "does-not-exist");
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("PROBLEM_NOT_FOUND");
  });

  it("402s a free user on a premium problem (no job enqueued)", async () => {
    addMock.mockClear();
    const res = await submit(userA, premiumProblem, "free");
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe("PREMIUM_PROBLEM");
    expect(addMock).not.toHaveBeenCalled();
  });

  it("402s once the daily cap is hit (free = 5/day)", async () => {
    // Seed the free user's 5 allowed submissions for today, then the 6th is rejected.
    const problem = await prisma.problem.findUnique({ where: { slug: freeProblem }, select: { id: true } });
    await prisma.problemSolution.createMany({
      data: Array.from({ length: 5 }, () => ({ problemId: problem!.id, userId: userB, language: lang as never, code: "x", verdict: "PENDING" as never })),
    });
    const res = await submit(userB, freeProblem);
    expect(res.statusCode).toBe(402);
    expect(res.json().error.code).toBe("SUBMISSION_LIMIT_EXCEEDED");
  });

  it("lets the owner read a submission but 404s another user", async () => {
    const own = await app.inject({ method: "GET", url: `/v1/submissions/${submissionA}`, headers: { authorization: `Bearer ${tok(userA)}` } });
    expect(own.statusCode).toBe(200);
    const other = await app.inject({ method: "GET", url: `/v1/submissions/${submissionA}`, headers: { authorization: `Bearer ${tok(userB)}` } });
    expect(other.statusCode).toBe(404);
  });
});
