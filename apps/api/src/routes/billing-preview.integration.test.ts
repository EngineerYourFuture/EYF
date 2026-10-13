import "dotenv/config";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../env.js";

const { enqueue } = vi.hoisted(() => ({ enqueue: vi.fn() }));
vi.mock("../jobs/queue.js", () => ({ judgeQueue: { add: enqueue }, judgeQueueEvents: { on: vi.fn() } }));

describe.skipIf(!process.env.DATABASE_URL)("payment preview access", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string, problemId: string, noteId: string;
  const suffix = `${Date.now()}-preview`;
  const problemSlug = `problem-${suffix}`, noteSlug = `note-${suffix}`;
  const originalBilling = env.BILLING_ENABLED;
  const headers = () => ({ authorization: `Bearer ${app.jwt.sign({ id: userId, email: "preview@test.eyf", name: "Preview", role: "STUDENT_FREE", plan: "free" })}` });
  const post = (url: string, payload: object = {}) => app.inject({ method: "POST", url: `/v1${url}`, headers: headers(), payload });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    app.get("/__preview_plan_probe", { preHandler: app.requirePlan(["pro"]) }, async () => ({ ok: true }));
    userId = (await prisma.user.create({ data: {
      clerkId: `preview_${suffix}`, email: `preview-${suffix}@test.eyf`, name: "Preview",
      subscription: { create: { plan: "FREE" } },
    } })).id;
    problemId = (await prisma.problem.create({ data: {
      slug: problemSlug, title: "Preview addition", description: "Add two integers", difficulty: "EASY", premium: true,
      testCases: { create: [{ input: "2 3", expected: "5", isPublic: true }, { input: "-2 2", expected: "0", isPublic: false }] },
      editorial: { create: { textSolution: "Add the integers", timeComplexity: "O(1)", spaceComplexity: "O(1)" } },
    } })).id;
    noteId = (await prisma.theoryNote.create({ data: { slug: noteSlug, subject: "DBMS", title: "Preview note", content: "Transactions", premium: true } })).id;
    // Already past the free quota: preview must still allow actual practice.
    await prisma.problemSolution.createMany({ data: Array.from({ length: 5 }, () => ({ userId, problemId, language: "PYTHON", code: "print(5)" })) });
  });
  beforeEach(() => { env.BILLING_ENABLED = false; enqueue.mockClear(); });
  afterEach(() => { env.BILLING_ENABLED = originalBilling; });
  afterAll(async () => {
    if (userId) await prisma.problemSolution.deleteMany({ where: { userId } });
    if (problemId) await prisma.problem.delete({ where: { id: problemId } });
    if (noteId) await prisma.theoryNote.delete({ where: { id: noteId } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app?.close();
  });

  it("publishes the server's billing mode", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/billing/status" });
    expect(res.json().data.enabled).toBe(false);
  });

  it("blocks orders, confirmations and webhooks without changing a subscription", async () => {
    const before = await prisma.subscription.findUnique({ where: { userId } });
    for (const route of ["create-order", "confirm", "webhook"]) {
      const res = await post(`/billing/${route}`, { plan: "elite", interval: "annual" });
      expect(res.statusCode).toBe(503);
      expect(res.json().error.code).toBe("BILLING_DISABLED");
    }
    expect(await prisma.subscription.findUnique({ where: { userId } })).toEqual(before);
  });

  it("lets a free student submit premium practice past the normal quota", async () => {
    const res = await post("/submissions", { problemSlug, language: "PYTHON", code: "print(sum(map(int, input().split())))" });
    expect(res.statusCode).toBe(202);
    expect(enqueue).toHaveBeenCalledOnce();
    expect((await prisma.subscription.findUnique({ where: { userId } }))?.plan).toBe("FREE");
  });

  it("unlocks theory, editorials and premium MCQs in preview", async () => {
    for (const url of [`/subjects/notes/${noteSlug}`, `/admin/problems/${problemSlug}/editorial`]) {
      expect((await app.inject({ method: "GET", url: `/v1${url}`, headers: headers() })).statusCode).toBe(200);
    }
    expect((await post("/mcq/start", { category: "TECHNICAL", count: 5 })).statusCode).toBe(200);
  });

  it("opens plan-gated features while preserving authentication and staff permissions", async () => {
    // This exercises the real requirePlan guard without invoking any paid service.
    const gated = await app.inject({ method: "GET", url: "/__preview_plan_probe", headers: headers() });
    expect(gated.statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/__preview_plan_probe" })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/v1/admin/content/problems", headers: headers() })).statusCode).toBe(403);
  });

  it("shows internship preview without inventing Elite status or a rank", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/org/student/internships", headers: headers() });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({ previewAccess: true, isElite: false, eliteRank: null });
    expect(res.json().data.slots.every((slot: { locked: boolean }) => !slot.locked)).toBe(true);
  });

  it("restores the quota and premium gates when billing is enabled", async () => {
    env.BILLING_ENABLED = true;
    expect((await post("/submissions", { problemSlug, language: "PYTHON", code: "print(5)" })).statusCode).toBe(402);
    expect((await post("/mcq/start", { category: "TECHNICAL", count: 5 })).statusCode).toBe(402);
    expect((await app.inject({ method: "GET", url: `/v1/subjects/notes/${noteSlug}`, headers: headers() })).statusCode).toBe(402);
    expect((await app.inject({ method: "GET", url: `/v1/admin/problems/${problemSlug}/editorial`, headers: headers() })).statusCode).toBe(402);
    expect((await app.inject({ method: "GET", url: "/__preview_plan_probe", headers: headers() })).statusCode).toBe(402);
    expect(enqueue).not.toHaveBeenCalled();
  });
});
