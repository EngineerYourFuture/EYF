import "dotenv/config";
import { createHash } from "node:crypto";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PRACTICE_BANKS } from "../services/sprint-practice.js";
describe.skipIf(!process.env.DATABASE_URL)("sprint reviews and continued practice", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>, prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = `${Date.now()}-continue`, users: { id: string; token: string; email: string }[] = [];
  let orgId: string, sprintId: string, problemId: string, reviewId: string;
  const call = (who: number, method: "GET" | "POST" | "DELETE", path: string, payload?: object) => app.inject({ method, url: `/v1${path}`, headers: { authorization: `Bearer ${users[who]!.token}` }, ...(payload ? { payload } : {}) });
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    for (const tag of ["learner", "reviewer", "outsider", "incomplete"]) { const u = await prisma.user.create({ data: { clerkId: `${stamp}-${tag}`, email: `${stamp}-${tag}@test.eyf`, name: tag } }); users.push({ ...u, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_FREE", plan: "free" }) }); }
    orgId = (await prisma.organization.create({ data: { name: stamp, slug: stamp, accessCode: stamp, members: { create: [{ userId: users[0]!.id, roles: ["MEMBER", "REVIEWER"] }, { userId: users[1]!.id, roles: ["REVIEWER"] }] } } })).id;
    problemId = (await prisma.problem.create({ data: { slug: stamp, title: stamp, description: "Fixture", difficulty: "EASY" } })).id;
    const source = "console.log('private source')", submission = await prisma.problemSolution.create({ data: { userId: users[0]!.id, problemId, language: "JAVASCRIPT", code: source, verdict: "ACCEPTED" } });
    sprintId = (await prisma.placementSprint.create({ data: { userId: users[0]!.id, retestCompletedAt: new Date(), challengeNotes: { explanation: "Private explanation", sql: "SELECT 1", tests: "Boundary checks", assistance: "none" }, challengeEvidence: { submissionId: submission.id, codeHash: createHash("sha256").update(source).digest("hex"), passedTests: 24, totalTests: 24 } } })).id;
  });
  afterAll(async () => { if (orgId) await prisma.organization.delete({ where: { id: orgId } }); for (const u of users) await prisma.user.delete({ where: { id: u.id } }); if (problemId) await prisma.problem.delete({ where: { id: problemId } }); await app?.close(); });
  it("requires completed work and explicit consent; only authorized requested organizations see it", async () => {
    expect((await call(3, "POST", "/placement-sprint/practice/start")).statusCode).toBe(409);
    expect((await call(0, "POST", "/placement-sprint/reviews", { orgId })).statusCode).toBe(400);
    expect((await call(0, "POST", "/placement-sprint/reviews", { orgId: "foreign", consent: true })).statusCode).toBe(404);
    expect((await call(1, "GET", `/orgs/${orgId}/sprint-reviews`)).json().data).toEqual([]);
    expect((await call(0, "POST", "/placement-sprint/reviews", { orgId, consent: true })).statusCode).toBe(200);
    const queue = (await call(1, "GET", `/orgs/${orgId}/sprint-reviews`)).json().data; expect(queue).toHaveLength(1); reviewId = queue[0].id;
    expect((await call(2, "GET", `/orgs/${orgId}/sprint-reviews/${reviewId}`)).statusCode).toBe(404);
    expect((await call(0, "GET", `/orgs/${orgId}/sprint-reviews/${reviewId}`)).statusCode).toBe(404);
    const detail = (await call(1, "GET", `/orgs/${orgId}/sprint-reviews/${reviewId}`)).json().data; expect(detail.code).toBe("console.log('private source')"); expect(JSON.stringify(detail)).not.toContain(users[0]!.email);
  });
  it("publishes once, prevents self-review, and gives learners private feedback", async () => {
    const body = { rubric: { authorization: 2, dataAccess: 2, testing: 1, explanation: 3 }, feedback: "Good ownership handling. Add a test for tied timestamps and a rejected null limit." };
    expect((await call(0, "POST", `/orgs/${orgId}/sprint-reviews/${reviewId}`, body)).statusCode).toBe(409);
    const results = await Promise.all([1, 2].map(() => call(1, "POST", `/orgs/${orgId}/sprint-reviews/${reviewId}`, body))); expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const own = await call(0, "GET", "/placement-sprint/reviews"); expect(own.json().data[0].feedback).toBe(body.feedback);
    expect((await call(2, "DELETE", `/placement-sprint/reviews/${reviewId}`)).statusCode).toBe(404);
    expect((await call(0, "DELETE", `/placement-sprint/reviews/${reviewId}`)).statusCode).toBe(200);
    expect((await call(1, "GET", `/orgs/${orgId}/sprint-reviews/${reviewId}`)).statusCode).toBe(404);
    expect((await call(0, "GET", "/placement-sprint/reviews")).json().data[0].feedback).toBe(body.feedback);
  });
  it("serializes round starts, withholds answers and commits one result under duplicate submissions", async () => {
    const results = await Promise.all([1, 2].map(() => call(0, "POST", "/placement-sprint/practice/start")));
    expect(results.map((r) => r.statusCode)).toEqual([200, 200]); expect(results[0]!.json().data.active.id).toBe(results[1]!.json().data.active.id);
    const round = results[0]!.json().data.active; expect(round.questions[0]).not.toHaveProperty("answer"); expect(round.questions[0]).not.toHaveProperty("explanation");
    const answers = Object.fromEntries(PRACTICE_BANKS[0]!.map((q) => [q.id, q.answer]));
    expect((await call(2, "POST", `/placement-sprint/practice/${round.id}`, { answers })).statusCode).toBe(404);
    expect((await call(0, "POST", `/placement-sprint/practice/${round.id}`, { answers: {} })).statusCode).toBe(400);
    const submitted = await Promise.all([1, 2].map(() => call(0, "POST", `/placement-sprint/practice/${round.id}`, { answers }))); expect(submitted.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const state = (await call(0, "GET", "/placement-sprint/practice")).json().data; expect(state.history[0].result).toMatchObject({ correct: 6, total: 6 }); expect(state.feedback).toHaveLength(6); expect(state.active).toBeNull();
  });
  it("rotates practice sets, discloses repeats and leaves the first sprint evidence intact", async () => {
    const before = await prisma.placementSprint.findUniqueOrThrow({ where: { id: sprintId } });
    const second = (await call(0, "POST", "/placement-sprint/practice/start")).json().data.active; expect(second.sequence).toBe(2); expect(second.repeated).toBe(false);
    const answers = Object.fromEntries(PRACTICE_BANKS[1]!.map((q) => [q.id, q.answer])); expect((await call(0, "POST", `/placement-sprint/practice/${second.id}`, { answers })).statusCode).toBe(200);
    expect((await call(0, "POST", "/placement-sprint/practice/start")).json().data.active.repeated).toBe(true);
    const after = await prisma.placementSprint.findUniqueOrThrow({ where: { id: sprintId } }); expect(after).toEqual(before);
  });
});
