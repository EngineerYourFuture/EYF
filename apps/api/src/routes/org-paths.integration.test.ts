import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Paths + cohorts integration (PRD §15.12, EPIC-07): compose a path from a
 * published course, refuse drafts, publish-gate the path, run a cohort, enroll
 * (rejecting foreign members), read the funnel with computed progress, and
 * fire the stuck detector by back-dating enrollment. Extends tenant isolation
 * to the new routes.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("org paths + cohorts (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let lnd: { id: string; token: string };
  let learner: { id: string; token: string };
  let orgId: string;
  let learnerMemberId: string;
  let courseId: string;
  let lessonId: string;
  let pathId: string;
  let cohortId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `path_${tag}_${stamp}`, email: `path-${tag}-${stamp}@test.eyf`, name: `Path ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    lnd = await mkUser("lnd");
    learner = await mkUser("member");
    const org = await prisma.organization.create({
      data: {
        name: `PathTest ${stamp}`, slug: `path-test-${stamp}`, accessCode: `pt-${stamp}`,
        members: { create: [{ userId: lnd.id, roles: ["LND"] }, { userId: learner.id, roles: ["MEMBER"] }] },
      },
      include: { members: true },
    });
    orgId = org.id;
    learnerMemberId = org.members.find((m) => m.userId === learner.id)!.id;

    // A published course with one lesson (reuse the learn route path).
    const c = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "Path Course" });
    courseId = c.json().data.id;
    const l = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/lessons`, { title: "L1", blocks: [] });
    lessonId = l.json().data.id;
    await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/publish`);
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [lnd, learner].filter(Boolean)) await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    await app?.close();
  });

  it("composes a path; refuses draft courses; publish-gates on emptiness", async () => {
    const p = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/paths`, { title: "Onboarding Program" });
    pathId = p.json().data.id;

    const emptyPublish = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/paths/${pathId}/publish`);
    expect(emptyPublish.statusCode).toBe(400);

    // A fresh draft course cannot be added.
    const draft = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "Draft" });
    const bad = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/paths/${pathId}/items`, { courseId: draft.json().data.id });
    expect(bad.statusCode).toBe(409);
    expect(bad.json().error.code).toBe("COURSE_NOT_PUBLISHED");

    const ok = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/paths/${pathId}/items`, { courseId, orderIndex: 0 });
    expect(ok.statusCode).toBe(201);
    const publish = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/paths/${pathId}/publish`);
    expect(publish.statusCode).toBe(200);
  });

  it("cohort requires a published path; enrollment rejects foreign members", async () => {
    const c = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cohorts`, { pathId, name: "Batch A" });
    expect(c.statusCode).toBe(201);
    cohortId = c.json().data.id;

    const enroll = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cohorts/${cohortId}/enroll`, {
      memberIds: [learnerMemberId, "cln_not_a_member"],
    });
    expect(enroll.statusCode).toBe(200);
    expect(enroll.json().data.enrolled).toBe(1);
    expect(enroll.json().data.rejected).toEqual(["cln_not_a_member"]);
  });

  it("funnel computes progress and advances as the learner completes lessons", async () => {
    const before = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/cohorts/${cohortId}/funnel`);
    expect(before.json().data.funnel).toMatchObject({ enrolled: 1, started: 0, completed: 0 });

    // Learner does the work.
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/work/lessons/${lessonId}/complete`);
    const after = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/cohorts/${cohortId}/funnel`);
    expect(after.json().data.funnel).toMatchObject({ enrolled: 1, started: 1, completed: 1 });
    expect(after.json().data.rows[0]).toMatchObject({ progressPct: 100, status: "COMPLETED", stuckFlag: false });
    // Write-back persisted:
    const enr = await prisma.cohortEnrollment.findFirst({ where: { cohortId, memberId: learnerMemberId } });
    expect(enr?.progressPct).toBe(100);
  });

  it("stuck detector flags a silent, incomplete learner after 7 days", async () => {
    // A FRESH member who never touched the path — the earlier learner already
    // completed it, so progress would read 100 and (correctly) never be stuck.
    const idle = await prisma.user.create({ data: { clerkId: `path_idle_${stamp}`, email: `path-idle-${stamp}@test.eyf`, name: "Idle" } });
    const idleMember = await prisma.orgMember.create({ data: { orgId, userId: idle.id, roles: ["MEMBER"] } });

    const c2 = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cohorts`, { pathId, name: "Batch B" });
    const cid = c2.json().data.id;
    await inject(lnd.token, "POST", `/v1/orgs/${orgId}/cohorts/${cid}/enroll`, { memberIds: [idleMember.id] });
    await prisma.cohortEnrollment.updateMany({
      where: { cohortId: cid },
      data: { enrolledAt: new Date(Date.now() - 10 * 86_400_000) },
    });
    const funnel = await inject(lnd.token, "GET", `/v1/orgs/${orgId}/cohorts/${cid}/funnel`);
    expect(funnel.json().data.funnel.stuck).toBe(1);
    expect(funnel.json().data.rows[0]).toMatchObject({ progressPct: 0, stuckFlag: true });
  });

  it("member sees their cohort in /work/paths with rolled-up progress", async () => {
    const res = await inject(learner.token, "GET", `/v1/orgs/${orgId}/work/paths`);
    expect(res.statusCode).toBe(200);
    const batchA = res.json().data.find((p: { cohortName: string }) => p.cohortName === "Batch A");
    expect(batchA).toMatchObject({ pathTitle: "Onboarding Program", progressPct: 100 });
  });

  it("MEMBER cannot compose paths or read funnels; outsider gets 404", async () => {
    const noAuthor = await inject(learner.token, "POST", `/v1/orgs/${orgId}/paths`, { title: "x" });
    expect(noAuthor.statusCode).toBe(403);
    const noFunnel = await inject(learner.token, "GET", `/v1/orgs/${orgId}/cohorts/${cohortId}/funnel`);
    expect(noFunnel.statusCode).toBe(403);

    const outsider = await prisma.user.create({ data: { clerkId: `path_out_${stamp}`, email: `path-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    const res = await inject(token, "GET", `/v1/orgs/${orgId}/paths`);
    expect(res.statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
