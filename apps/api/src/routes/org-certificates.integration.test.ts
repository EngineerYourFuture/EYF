import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Org certificates integration (PRD §15.9): an ASSESSMENT_PASS template
 * auto-issues a skill-anchored, publicly-verifiable certificate when a
 * candidate passes; the public /verify rail shows the issuer + asserted
 * skills; revocation flips /verify to invalid instantly; re-pass is idempotent.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("org certificates (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let lnd: { id: string; token: string };
  let learner: { id: string; token: string };
  let orgId: string;
  let blueprintId: string;
  let runId: string;
  let certCode: string;
  let certId: string;
  const bankIds: string[] = [];

  const inject = (token: string, method: "GET" | "POST", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });
  const verify = (code: string) => app.inject({ method: "GET", url: `/v1/certificates/verify/${code}` });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `ct_${tag}_${stamp}`, email: `ct-${tag}-${stamp}@test.eyf`, name: `Cert ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    lnd = await mkUser("lnd");
    learner = await mkUser("member");
    const org = await prisma.organization.create({
      data: { name: `CertTest ${stamp}`, slug: `cert-test-${stamp}`, accessCode: `ct-${stamp}`, members: { create: [{ userId: lnd.id, roles: ["LND"] }, { userId: learner.id, roles: ["MEMBER"] }] } },
    });
    orgId = org.id;
    for (let i = 0; i < 5; i++) {
      const q = await prisma.mcqBankQuestion.create({ data: { category: "TECHNICAL", topic: "kafka", difficulty: "easy", prompt: `CQ${i}?`, choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "a", companies: [], active: true, sourceId: `cttest-${stamp}-${i}` } });
      bankIds.push(q.id);
    }
    blueprintId = (await inject(lnd.token, "POST", `/v1/orgs/${orgId}/blueprints`, { name: "Kafka Cert Exam", category: "TECHNICAL", questionCount: 5, passingScore: 60, skillSlug: "kafka" })).json().data.id;
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.mcqBankQuestion.deleteMany({ where: { id: { in: bankIds } } }).catch(() => {});
    for (const u of [lnd, learner].filter(Boolean)) {
      await prisma.certificate.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.skillEvidence.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.skillSnapshot.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("ASSESSMENT_PASS template requires a blueprint; then authors", async () => {
    const bad = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cert-templates`, { name: "x", criteria: "ASSESSMENT_PASS" });
    expect(bad.statusCode).toBe(400);
    const tpl = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cert-templates`, {
      name: "Certified Kafka Engineer",
      criteria: "ASSESSMENT_PASS",
      blueprintId,
      skills: [{ slug: "kafka", level: 80 }],
    });
    expect(tpl.statusCode).toBe(201);
  });

  it("passing the assessment auto-issues a verifiable, skill-anchored certificate", async () => {
    runId = (await inject(lnd.token, "POST", `/v1/orgs/${orgId}/runs`, { blueprintId, purpose: "CERTIFICATION" })).json().data.id;
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/runs/${runId}/start`);
    const attempt = await prisma.assessmentAttempt.findFirstOrThrow({ where: { runId, userId: learner.id } });
    const keys = new Map((await prisma.mcqBankQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, correctIndex: true } })).map((k) => [k.id, k.correctIndex]));
    const answers = attempt.questionIds.map((id) => ({ questionId: id, choice: keys.get(id)! })); // all correct → 100
    const submit = await inject(learner.token, "POST", `/v1/orgs/${orgId}/attempts/${attempt.id}/submit`, { answers, proctorEvents: 0 });
    expect(submit.json().data.passed).toBe(true);

    const cert = await prisma.certificate.findFirstOrThrow({ where: { userId: learner.id, orgId } });
    certCode = cert.verificationCode;
    certId = cert.id;
    expect(cert.title).toBe("Certified Kafka Engineer");
    expect(cert.score).toBe(100);

    const v = await verify(certCode);
    expect(v.statusCode).toBe(200);
    expect(v.json().data).toMatchObject({ revoked: false, issuer: `CertTest ${stamp}`, title: "Certified Kafka Engineer" });
    expect(v.json().data.skillsAsserted).toEqual([{ slug: "kafka", level: 80 }]);
  });

  it("re-passing does not mint a duplicate certificate (idempotent)", async () => {
    // Second run, same blueprint/template → still one active cert.
    const run2 = (await inject(lnd.token, "POST", `/v1/orgs/${orgId}/runs`, { blueprintId, purpose: "TRAINING" })).json().data.id;
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/runs/${run2}/start`);
    const a2 = await prisma.assessmentAttempt.findFirstOrThrow({ where: { runId: run2, userId: learner.id } });
    const keys = new Map((await prisma.mcqBankQuestion.findMany({ where: { id: { in: a2.questionIds } }, select: { id: true, correctIndex: true } })).map((k) => [k.id, k.correctIndex]));
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/attempts/${a2.id}/submit`, { answers: a2.questionIds.map((id) => ({ questionId: id, choice: keys.get(id)! })), proctorEvents: 0 });
    const count = await prisma.certificate.count({ where: { userId: learner.id, orgId, revokedAt: null } });
    expect(count).toBe(1);
  });

  it("revocation flips /verify to invalid instantly", async () => {
    const rev = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/certificates/${certId}/revoke`, { reason: "Issued in error" });
    expect(rev.statusCode).toBe(200);
    const v = await verify(certCode);
    expect(v.statusCode).toBe(200); // still resolves — but as revoked
    expect(v.json().data).toMatchObject({ revoked: true, revokeReason: "Issued in error" });
    // Double revoke is a 409.
    expect((await inject(lnd.token, "POST", `/v1/orgs/${orgId}/certificates/${certId}/revoke`)).statusCode).toBe(409);
  });

  it("a bad code 404s; a MEMBER can't manage templates; outsider 404", async () => {
    expect((await verify("nonexistentcode")).statusCode).toBe(404);
    expect((await inject(learner.token, "POST", `/v1/orgs/${orgId}/cert-templates`, { name: "x" })).statusCode).toBe(403);
    const outsider = await prisma.user.create({ data: { clerkId: `ct_out_${stamp}`, email: `ct-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/certificates`)).statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
