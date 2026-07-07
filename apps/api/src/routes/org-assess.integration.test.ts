import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Assessment engine integration (PRD §17/18 + the ledger payoff). Author a
 * skill-tagged blueprint from the shared MCQ bank, run it, have a candidate
 * take it, score against the FROZEN draw, apply L1 integrity, and — the whole
 * point — emit ASSESSMENT-weight evidence that OUTWEIGHS an earlier lesson so
 * the ledger reflects proven performance over mere exposure.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("assessment engine (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let lnd: { id: string; token: string };
  let learner: { id: string; token: string };
  let orgId: string;
  let learnerMemberId: string;
  let blueprintId: string;
  let runId: string;
  const bankIds: string[] = [];

  const inject = (token: string, method: "GET" | "POST", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `as_${tag}_${stamp}`, email: `as-${tag}-${stamp}@test.eyf`, name: `Assess ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    lnd = await mkUser("lnd");
    learner = await mkUser("member");
    const org = await prisma.organization.create({
      data: { name: `AssessTest ${stamp}`, slug: `assess-test-${stamp}`, accessCode: `as-${stamp}`, members: { create: [{ userId: lnd.id, roles: ["LND"] }, { userId: learner.id, roles: ["MEMBER"] }] } },
      include: { members: true },
    });
    orgId = org.id;
    learnerMemberId = org.members.find((m) => m.userId === learner.id)!.id;

    // 5 TECHNICAL bank questions with known correct answers.
    for (let i = 0; i < 5; i++) {
      const q = await prisma.mcqBankQuestion.create({
        data: { category: "TECHNICAL", topic: "kafka", difficulty: "medium", prompt: `Q${i}?`, choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "a", companies: [], active: true, sourceId: `astest-${stamp}-${i}` },
      });
      bankIds.push(q.id);
    }
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.mcqBankQuestion.deleteMany({ where: { id: { in: bankIds } } }).catch(() => {});
    for (const u of [lnd, learner].filter(Boolean)) {
      await prisma.skillEvidence.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.skillSnapshot.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("blueprint refuses to over-draw the bank, then authors cleanly", async () => {
    const tooBig = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/blueprints`, { name: "Huge", category: "TECHNICAL", questionCount: 50, skillSlug: "kafka" });
    expect(tooBig.statusCode).toBe(400);
    expect(tooBig.json().error.code).toBe("BANK_TOO_SMALL");

    const bp = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/blueprints`, { name: "Kafka Check", category: "TECHNICAL", questionCount: 5, passingScore: 60, skillSlug: "kafka" });
    expect(bp.statusCode).toBe(201);
    blueprintId = bp.json().data.id;
  });

  it("member cannot author or administer", async () => {
    expect((await inject(learner.token, "POST", `/v1/orgs/${orgId}/blueprints`, { name: "x" })).statusCode).toBe(403);
    expect((await inject(learner.token, "POST", `/v1/orgs/${orgId}/runs`, { blueprintId })).statusCode).toBe(403);
  });

  it("runs, and the candidate gets questions WITHOUT the answer key", async () => {
    const r = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/runs`, { blueprintId, purpose: "TRAINING" });
    expect(r.statusCode).toBe(201);
    runId = r.json().data.id;

    const start = await inject(learner.token, "POST", `/v1/orgs/${orgId}/runs/${runId}/start`);
    expect(start.statusCode).toBe(200);
    expect(start.json().data.questions).toHaveLength(5);
    // No correctIndex leaks to the client.
    expect(start.json().data.questions[0]).not.toHaveProperty("correctIndex");
  });

  it("scores the frozen draw and emits ASSESSMENT evidence at the score", async () => {
    // The engine draws from the GLOBAL bank, so answer the ACTUAL frozen set
    // (as a real candidate would): 4 by their true key, 1 wrong → 80%.
    const attempt = await prisma.assessmentAttempt.findFirstOrThrow({ where: { runId, userId: learner.id } });
    const keys = await prisma.mcqBankQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, correctIndex: true } });
    const keyOf = new Map(keys.map((k) => [k.id, k.correctIndex]));
    const answers = attempt.questionIds.map((id, i) => ({
      questionId: id,
      choice: i < 4 ? keyOf.get(id)! : (keyOf.get(id)! + 1) % 4, // last one deliberately wrong
    }));
    const submit = await inject(learner.token, "POST", `/v1/orgs/${orgId}/attempts/${attempt.id}/submit`, { answers, proctorEvents: 1 });
    expect(submit.statusCode).toBe(200);
    expect(submit.json().data).toMatchObject({ score: 80, passed: true, integrityScore: 90 });

    const ev = await prisma.skillEvidence.findFirst({ where: { userId: learner.id, sourceType: "ASSESSMENT" } });
    expect(ev).toMatchObject({ level: 80, weight: 1.0 }); // ASSESSMENT weight
  });

  it("cannot submit twice", async () => {
    const a = await prisma.assessmentAttempt.findFirstOrThrow({ where: { runId, userId: learner.id } });
    const dupe = await inject(learner.token, "POST", `/v1/orgs/${orgId}/attempts/${a.id}/submit`, { answers: [] });
    expect(dupe.statusCode).toBe(409);
  });

  it("THE PAYOFF: assessment evidence outweighs an earlier lesson in the snapshot", async () => {
    // Simulate a prior lesson completion at level 60, weight 0.5 (LESSON),
    // one day earlier — then the fresh 80 @ weight 1.0 assessment should pull
    // the snapshot well above the lesson floor.
    const kafka = await prisma.skill.findFirstOrThrow({ where: { slug: "kafka" } });
    await prisma.skillEvidence.create({
      data: { userId: learner.id, orgId, skillId: kafka.id, level: 60, weight: 0.5, sourceType: "LESSON", decayHalfLifeDays: 180, createdAt: new Date(Date.now() - 86_400_000) },
    });
    const { recomputeSnapshot } = await import("../lib/skill-ledger.js");
    await recomputeSnapshot(learner.id, orgId, kafka.id);
    const snap = await prisma.skillSnapshot.findFirstOrThrow({ where: { userId: learner.id, orgId, skillId: kafka.id } });
    // weighted avg ≈ (80·1.0 + 60·0.5) / (1.0 + 0.5) ≈ 73 — the test dominates.
    expect(snap.level).toBeGreaterThan(70);
    expect(snap.level).toBeLessThan(80);
    expect(snap.evidenceCount).toBe(2);
  });

  it("results view ranks by score; only viewers see it; outsider 404", async () => {
    const res = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/runs/${runId}/results`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.stats).toMatchObject({ submitted: 1, passed: 1, avgScore: 80 });

    expect((await inject(learner.token, "GET", `/v1/orgs/${orgId}/runs/${runId}/results`)).statusCode).toBe(403);
    const outsider = await prisma.user.create({ data: { clerkId: `as_out_${stamp}`, email: `as-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/blueprints`)).statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
