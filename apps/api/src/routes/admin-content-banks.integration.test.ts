import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the question/prompt banks (`admin-content-banks.ts`) —
 * 12 previously untested writes across three verticals.
 *
 * Two behaviours here are worth more than the CRUD:
 *
 *   1. `correctIndex` must land inside `choices`. POST enforces it with a Zod
 *      refine, but PATCH has to validate the MERGED result — patching choices
 *      down to two while a stored correctIndex of 3 stays put would publish a
 *      question no student can answer correctly. That merge check is easy to lose.
 *   2. `import-bank` is documented as idempotent and is a one-click button in the
 *      staff UI. If it stopped de-duplicating, a double click would silently
 *      double the bank and skew every assessment drawn from it.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("content banks — CRUD integrity + idempotent import (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId = "", studentId = "", qId = "";
  const s = Date.now();
  const topic = `zz-test-${s}`;

  const adminHeaders = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: adminId, email: "b-admin@x", name: "Admin", role: "ADMIN", plan: "free" }, { expiresIn: "5m" })}`,
    "x-admin-gate": app.jwt.sign({ id: adminId, adminGate: true }, { expiresIn: "5m" }),
  });
  const adminAuth = () => ({ ...adminHeaders(), "content-type": "application/json" });
  const studentAuth = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: studentId, email: "b-stu@x", name: "Stu", role: "STUDENT_ELITE", plan: "elite" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });

  const question = {
    area: "dsa", topic, difficulty: "easy",
    prompt: "Which is O(1)?",
    choices: ["array index", "linear scan", "sort"],
    correctIndex: 0,
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [admin, student] = await Promise.all([
      prisma.user.create({ data: { clerkId: `bk_a_${s}`, email: `bk-a-${s}@test.eyf`, name: "Admin", role: "ADMIN" } }),
      prisma.user.create({ data: { clerkId: `bk_s_${s}`, email: `bk-s-${s}@test.eyf`, name: "Stu" } }),
    ]);
    adminId = admin.id; studentId = student.id;
  });

  afterAll(async () => {
    await prisma.assessmentBankQuestion.deleteMany({ where: { topic } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { actorId: adminId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, studentId] } } }).catch(() => {});
    await app.close();
  });

  it("refuses a student without manage:content", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/admin/content/assessment", headers: studentAuth(), payload: JSON.stringify(question) });
    expect(res.statusCode).toBe(403);
    expect(await prisma.assessmentBankQuestion.count({ where: { topic } })).toBe(0);
  });

  it("rejects a correctIndex that points past the choices", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/admin/content/assessment", headers: adminAuth(),
      payload: JSON.stringify({ ...question, correctIndex: 3 }), // only 3 choices → max valid index is 2
    });
    expect(res.statusCode).toBe(400);
    expect(await prisma.assessmentBankQuestion.count({ where: { topic } })).toBe(0);
  });

  it("rejects a single-choice question", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/admin/content/assessment", headers: adminAuth(),
      payload: JSON.stringify({ ...question, choices: ["only one"], correctIndex: 0 }),
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates a question and records an audit entry", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/admin/content/assessment", headers: adminAuth(), payload: JSON.stringify(question) });
    expect(res.statusCode).toBe(201);
    qId = res.json().data.id;
    expect(res.json().data.active).toBe(true); // schema default applied

    const audit = await prisma.auditLog.findFirst({ where: { entityId: qId, action: "create" } });
    expect(audit).not.toBeNull();
    expect(audit!.actorId).toBe(adminId);
  });

  it("patches a single field without disturbing the rest", async () => {
    const res = await app.inject({
      method: "PATCH", url: `/v1/admin/content/assessment/${qId}`, headers: adminAuth(),
      payload: JSON.stringify({ difficulty: "hard" }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.difficulty).toBe("hard");

    const row = await prisma.assessmentBankQuestion.findUnique({ where: { id: qId }, select: { prompt: true, choices: true, correctIndex: true } });
    expect(row!.prompt).toBe(question.prompt);
    expect(row!.choices).toHaveLength(3);
    expect(row!.correctIndex).toBe(0);
  });

  it("validates correctIndex against the MERGED result, not just the payload", async () => {
    // Stored correctIndex is 0 and there are 3 choices. Shrinking choices to two
    // is fine (0 < 2)…
    const ok = await app.inject({
      method: "PATCH", url: `/v1/admin/content/assessment/${qId}`, headers: adminAuth(),
      payload: JSON.stringify({ choices: ["a", "b"] }),
    });
    expect(ok.statusCode).toBe(200);

    // …but moving correctIndex past the now-shorter list must be refused, even
    // though the payload alone looks valid.
    const bad = await app.inject({
      method: "PATCH", url: `/v1/admin/content/assessment/${qId}`, headers: adminAuth(),
      payload: JSON.stringify({ correctIndex: 5 }),
    });
    expect(bad.statusCode).toBe(400);

    const row = await prisma.assessmentBankQuestion.findUnique({ where: { id: qId }, select: { correctIndex: true, choices: true } });
    expect(row!.correctIndex).toBe(0);          // unchanged
    expect(row!.choices).toHaveLength(2);
  });

  it("404s a patch and a delete against an unknown id", async () => {
    const miss = "cl00000000000000000000000";
    const p = await app.inject({ method: "PATCH", url: `/v1/admin/content/assessment/${miss}`, headers: adminAuth(), payload: JSON.stringify({ difficulty: "hard" }) });
    expect(p.statusCode).toBe(404);
    const d = await app.inject({ method: "DELETE", url: `/v1/admin/content/assessment/${miss}`, headers: adminHeaders() });
    expect(d.statusCode).toBe(404);
  });

  it("import-bank is idempotent — a second click imports nothing new", async () => {
    const first = await app.inject({ method: "POST", url: "/v1/admin/content/assessment/import-bank", headers: adminAuth(), payload: JSON.stringify({}) });
    expect(first.statusCode).toBe(200);
    const countAfterFirst = await prisma.assessmentBankQuestion.count();

    const second = await app.inject({ method: "POST", url: "/v1/admin/content/assessment/import-bank", headers: adminAuth(), payload: JSON.stringify({}) });
    expect(second.statusCode).toBe(200);
    expect(second.json().data.imported).toBe(0);

    // The row count is the real proof — a de-dup regression would double the bank.
    expect(await prisma.assessmentBankQuestion.count()).toBe(countAfterFirst);
  });

  it("deletes the question", async () => {
    const res = await app.inject({ method: "DELETE", url: `/v1/admin/content/assessment/${qId}`, headers: adminHeaders() });
    expect(res.statusCode).toBe(200);
    expect(await prisma.assessmentBankQuestion.count({ where: { id: qId } })).toBe(0);
  });
});
