import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Skill Ledger integration (PRD §15.13 — the moat). Prove the evidence loop
 * end to end: a skill-tagged lesson, on completion, writes an evidence row and
 * a decay-weighted snapshot; the member ledger shows it; the org matrix
 * aggregates it by department; a role bar computes gap-to-bar. Every level
 * traces to real work — no self-reported numbers.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("skill ledger (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let lnd: { id: string; token: string };
  let learner: { id: string; token: string };
  let orgId: string;
  let learnerMemberId: string;
  let deptId: string;
  let courseId: string;
  let lessonId: string;

  const inject = (token: string, method: "GET" | "POST", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `sk_${tag}_${stamp}`, email: `sk-${tag}-${stamp}@test.eyf`, name: `Skill ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    lnd = await mkUser("lnd");
    learner = await mkUser("member");
    const org = await prisma.organization.create({
      data: {
        name: `SkillTest ${stamp}`, slug: `skill-test-${stamp}`, accessCode: `sk-${stamp}`,
        departments: { create: { name: "Backend" } },
        members: { create: [{ userId: lnd.id, roles: ["LND"] }, { userId: learner.id, roles: ["MEMBER"] }] },
      },
      include: { departments: true, members: true },
    });
    orgId = org.id;
    deptId = org.departments[0]!.id;
    learnerMemberId = org.members.find((m) => m.userId === learner.id)!.id;
    // Put the learner in the Backend department (matrix rows key on this).
    await prisma.orgMember.update({ where: { id: learnerMemberId }, data: { departmentId: deptId } });

    // A published course whose lesson is tagged with the "kafka" skill.
    courseId = (await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "Kafka 101" })).json().data.id;
    lessonId = (await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/lessons`, {
      title: "Topics & Partitions", blocks: [], skillSlug: "kafka", skillLevel: 70,
    })).json().data.id;
    await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/publish`);
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [lnd, learner].filter(Boolean)) {
      await prisma.skillEvidence.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.skillSnapshot.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("completing a tagged lesson writes evidence + a snapshot (traceable, not self-reported)", async () => {
    const before = await prisma.skillSnapshot.count({ where: { userId: learner.id } });
    expect(before).toBe(0);

    await inject(learner.token, "POST", `/v1/orgs/${orgId}/work/lessons/${lessonId}/complete`);

    const evidence = await prisma.skillEvidence.findMany({ where: { userId: learner.id } });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({ level: 70, sourceType: "LESSON", orgId });
    const snap = await prisma.skillSnapshot.findFirst({ where: { userId: learner.id } });
    expect(snap?.level).toBe(70); // single fresh evidence → its level
    expect(snap?.evidenceCount).toBe(1);
  });

  it("re-completing does NOT stack evidence (first completion only)", async () => {
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/work/lessons/${lessonId}/complete`);
    const evidence = await prisma.skillEvidence.count({ where: { userId: learner.id } });
    expect(evidence).toBe(1);
  });

  it("member ledger shows the skill with its computed level", async () => {
    const res = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/members/${learnerMemberId}/ledger`);
    expect(res.statusCode).toBe(200);
    const kafka = res.json().data.ledger.find((l: { slug: string }) => l.slug === "kafka");
    expect(kafka).toMatchObject({ level: 70, name: "kafka", evidenceCount: 1 });
  });

  it("role bar gap: below-bar shows the shortfall, sorted worst-first", async () => {
    await inject(lnd.token, "POST", `/v1/orgs/${orgId}/role-bars`, {
      name: "Backend L2",
      skills: [
        { skillSlug: "kafka", requiredLevel: 85, weight: 2 },
        { skillSlug: "postgres", requiredLevel: 70, weight: 1 },
      ],
    });
    const bar = await prisma.roleBar.findFirst({ where: { orgId }, select: { id: true } });
    const res = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/members/${learnerMemberId}/ledger?roleBarId=${bar!.id}`);
    const gap = res.json().data.gap;
    expect(gap.roleBar).toBe("Backend L2");
    // postgres missing entirely (gap 70) ranks above kafka (85-70=15).
    expect(gap.gaps.map((g: { name: string }) => g.name)).toEqual(["postgres", "kafka"]);
    expect(gap.gaps[0]).toMatchObject({ name: "postgres", level: 0, gap: 70, met: false });
    expect(gap.overall).toBeGreaterThan(0);
    expect(gap.overall).toBeLessThan(100);
  });

  it("org skill matrix aggregates the level under the member's department", async () => {
    const res = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/skills/matrix`);
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.skills.some((s: { slug: string }) => s.slug === "kafka")).toBe(true);
    const backend = data.matrix.find((r: { department: string }) => r.department === "Backend");
    const kafkaCell = backend.cells.find((c: { slug: string }) => c.slug === "kafka");
    expect(kafkaCell).toMatchObject({ level: 70, coverage: 1 });
  });

  it("a MEMBER cannot read skills surfaces; outsider gets 404", async () => {
    const denied = await inject(learner.token, "GET", `/v1/orgs/${orgId}/skills/matrix`);
    expect(denied.statusCode).toBe(403);
    const outsider = await prisma.user.create({ data: { clerkId: `sk_out_${stamp}`, email: `sk-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    const out = await inject(token, "GET", `/v1/orgs/${orgId}/skills/matrix`);
    expect(out.statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
