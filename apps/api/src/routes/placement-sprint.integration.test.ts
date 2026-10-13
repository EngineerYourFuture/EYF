import "dotenv/config";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { BASELINE, RETEST, CHALLENGE_HASH, CHALLENGE_TESTS, CHALLENGE_SLUG, focusedDrills, grade } from "../services/placement-sprint.js";
import type { SprintState } from "@eyf/types";

describe.skipIf(!process.env.DATABASE_URL)("placement sprint evidence boundaries", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const users: string[] = [];
  let student: { id: string; token: string }; let other: { id: string; token: string };
  const answers = (bank: typeof BASELINE) => Object.fromEntries(bank.map((q) => [q.id, q.answer]));
  const notes = {
    explanation: "I derive ticket ownership from the verified server identity, validate query values, and use id to break timestamp ties. This avoids client-controlled access and unstable ordering.",
    sql: "SELECT id FROM tickets WHERE owner_id = $1 AND status = $2 ORDER BY created_at DESC, id ASC LIMIT $3 OFFSET $4; An index on (owner_id, status, created_at DESC, id ASC) supports this filtered order.",
    tests: "Check two owners with matching statuses: only the viewer's ids are returned. Check the final page: total is the full filtered count. Check limit zero: expect INVALID_QUERY.",
    assistance: "ai",
  };
  function request(path: string, payload?: unknown, method: "POST" | "GET" | "PATCH" | "DELETE" = "POST", token = student.token) {
    return app.inject({ method, url: `/v1/placement-sprint/${path}`, headers: { authorization: `Bearer ${token}` }, ...(payload === undefined ? {} : { payload: JSON.stringify(payload), headers: { authorization: `Bearer ${token}`, "content-type": "application/json" } }) });
  }
  async function createUser() {
    const key = `sprint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const u = await prisma.user.create({ data: { clerkId: key, email: `${key}@test.eyf`, name: "Sprint learner" } }); users.push(u.id);
    return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT", plan: "free" }) };
  }
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); student = await createUser(); other = await createUser();
  });
  afterAll(async () => { if (prisma) await prisma.user.deleteMany({ where: { id: { in: users } } }); await app?.close(); });

  it("requires authentication on every private route", async () => {
    for (const [path, method] of [["me", "GET"], ["start", "POST"], ["baseline", "POST"], ["retest", "POST"], ["drills", "POST"], ["notes", "PATCH"], ["challenge", "POST"], ["share", "POST"], ["share", "DELETE"]] as const) {
      expect((await app.inject({ method, url: `/v1/placement-sprint/${path}` })).statusCode).toBe(401);
    }
  });
  it("starts idempotently without leaking answer keys or follow-up questions", async () => {
    const a = await request("start"); const b = await request("start");
    expect(a.statusCode).toBe(200); expect(b.json().data.startedAt).toBe(a.json().data.startedAt);
    const state = a.json().data as SprintState;
    expect(state.questions).toHaveLength(6); expect(state.questions[0]).not.toHaveProperty("answer");
    expect(state.questions.every((q) => q.id.startsWith("b"))).toBe(true);
    expect(state.share).toBeNull(); expect(state.report).toBeNull();
  });
  it("does not allow skipping stages, extra answers, or missing questions", async () => {
    expect((await request("retest", { answers: answers(RETEST) })).statusCode).toBe(409);
    expect((await request("baseline", { answers: { b1: 1 } })).statusCode).toBe(400);
    expect((await request("baseline", { answers: { ...answers(BASELINE), extra: 1 } })).statusCode).toBe(400);
    expect((await request("challenge", notes)).statusCode).toBe(409);
    expect((await request("share", { consent: true })).statusCode).toBe(409);
  });
  it("atomically freezes the first result and targets only missed topics", async () => {
    const input = { ...answers(BASELINE), b1: 0 };
    const results = await Promise.all([request("baseline", { answers: input }), request("baseline", { answers: input })]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const state = (await request("me", undefined, "GET")).json().data;
    expect(state.baseline.correct).toBe(5); expect(state.drills.map((d: { topic: string }) => d.topic)).toEqual(["api"]);
    expect(state.drills[0]).not.toHaveProperty("answer"); expect(state.questions).toEqual([]);
    expect((await request("baseline", { answers: answers(BASELINE) })).statusCode).toBe(409);
  });
  it("allows practice retries and saves a private written draft", async () => {
    expect((await request("drills", { answers: { "d-api": 0 } })).statusCode).toBe(422);
    expect((await request("drills", { answers: { "d-api": 1 } })).statusCode).toBe(200);
    expect((await request("notes", { ...notes, explanation: "Draft" }, "PATCH")).statusCode).toBe(200);
    expect((await request("me", undefined, "GET")).json().data.notes.explanation).toBe("Draft");
    expect((await request("me", undefined, "GET", other.token)).json().data.notes).toBeNull();
    expect((await request("challenge", notes)).statusCode).toBe(422);
  });
  it("rejects somebody else's solution, a stale bank, old work, and empty tests", async () => {
    const problem = await prisma.problem.findUniqueOrThrow({ where: { slug: CHALLENGE_SLUG } });
    const good = { problemId: problem.id, userId: student.id, language: "JAVASCRIPT" as const, code: "candidate-private-source", verdict: "ACCEPTED" as const, passedTests: CHALLENGE_TESTS.length, totalTests: CHALLENGE_TESTS.length, testSuiteHash: CHALLENGE_HASH };
    for (const override of [{ userId: other.id }, { testSuiteHash: "outdated" }, { submittedAt: new Date(0) }, { totalTests: 0, passedTests: 0 }]) {
      const row = await prisma.problemSolution.create({ data: { ...good, ...override } });
      expect((await request("challenge", notes)).statusCode).toBe(422);
      const state = (await request("me", undefined, "GET")).json().data;
      expect(state.submission?.eligible ?? false).toBe(false);
      await prisma.problemSolution.delete({ where: { id: row.id } });
    }
    await prisma.problemSolution.create({ data: good });
    expect((await request("challenge", { ...notes, userId: other.id })).statusCode).toBe(400);
    const complete = await request("challenge", notes);
    expect(complete.statusCode).toBe(200); expect(complete.json().data.step).toBe("retest");
    expect(complete.json().data.questions.map((q: { id: string }) => q.id).every((id: string) => id.startsWith("r"))).toBe(true);
    expect((await request("notes", notes, "PATCH")).statusCode).toBe(409);
    expect((await request("challenge", notes)).statusCode).toBe(409);
  });
  it("issues an honest report without source, email, answer keys or an invented placement score", async () => {
    const response = await request("retest", { answers: answers(RETEST) });
    expect(response.statusCode).toBe(200); const state = response.json().data as SprintState;
    expect(state.step).toBe("report"); expect(state.report?.baseline.correct).toBe(5); expect(state.report?.retest.correct).toBe(6);
    expect(state.report?.challenge.evidence.suiteHash).toBe(CHALLENGE_HASH);
    expect(state.report?.challenge.evidence.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(state.report?.reviewMethod).toContain("not executed by this sprint");
    expect(state.report?.reviewMethod).toContain("private and separate from this report");
    expect(JSON.stringify(state.report)).not.toContain("candidate-private-source");
    expect(JSON.stringify(state.report)).not.toContain("@test.eyf");
    expect(state.report).not.toHaveProperty("placementProbability");
  });
  it("requires consent, freezes shared snapshots, rotates and revokes public links", async () => {
    expect((await request("share", { consent: false })).statusCode).toBe(400);
    const shared = (await request("share", { consent: true })).json().data as SprintState;
    const token = shared.share!.token; expect(token).toMatch(/^[\w-]{32}$/);
    const read = () => app.inject({ method: "GET", url: `/v1/placement-sprint/proof/${token}` });
    const first = await read(); expect(first.statusCode).toBe(200); expect(first.headers["cache-control"]).toContain("no-store");
    await prisma.user.update({ where: { id: student.id }, data: { name: "Changed name" } });
    expect((await read()).json().data.report.name).toBe("Sprint learner");
    await request("share", undefined, "DELETE", other.token); expect((await read()).statusCode).toBe(200);
    const rotated = (await request("share", { consent: true })).json().data.share.token;
    expect(rotated).not.toBe(token); expect((await read()).statusCode).toBe(404);
    await request("share", undefined, "DELETE");
    expect((await app.inject({ method: "GET", url: `/v1/placement-sprint/proof/${rotated}` })).statusCode).toBe(404);
  });
  it("does not serve expired reports or reports from deleted accounts", async () => {
    let token = (await request("share", { consent: true })).json().data.share.token;
    await prisma.placementSprint.update({ where: { userId: student.id }, data: { shareExpiresAt: new Date(0) } });
    expect((await app.inject({ method: "GET", url: `/v1/placement-sprint/proof/${token}` })).statusCode).toBe(404);
    token = (await request("share", { consent: true })).json().data.share.token;
    await prisma.user.update({ where: { id: student.id }, data: { deletedAt: new Date() } });
    expect((await app.inject({ method: "GET", url: `/v1/placement-sprint/proof/${token}` })).statusCode).toBe(404);
  });
  it("offers consolidation drills when the starting check is perfect", () => {
    expect(focusedDrills(grade(BASELINE, answers(BASELINE)))).toHaveLength(3);
    expect(new Set([...BASELINE, ...RETEST].map((q) => q.id)).size).toBe(12);
  });
});
