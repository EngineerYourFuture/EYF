import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Learn lifecycle integration (PRD §16 / EPIC-05/06): instructor drafts with
 * blocks → cannot publish (capability) → LND publishes (version snapshot,
 * legacy `published` mirror) → two-person rule blocks self-publish when the
 * org opts in → member sees only PUBLISHED, completes lessons, progress
 * counts. Extends the tenant-isolation suite's guarantees to Learn routes.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("org learn lifecycle (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let instructor: { id: string; token: string };
  let lnd: { id: string; token: string };
  let learner: { id: string; token: string };
  let orgId: string;
  let courseId: string;
  let lessonId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    app.inject({
      method, url,
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      ...(body ? { payload: JSON.stringify(body) } : {}),
    });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();

    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({
        data: { clerkId: `learn_int_${tag}_${stamp}`, email: `learn-${tag}-${stamp}@test.eyf`, name: `Learn ${tag}` },
      });
      const token = app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
      return { id: u.id, token };
    };
    instructor = await mkUser("inst");
    lnd = await mkUser("lnd");
    learner = await mkUser("member");

    const org = await prisma.organization.create({
      data: {
        name: `LearnTest ${stamp}`, slug: `learn-test-${stamp}`, accessCode: `lt-${stamp}`,
        members: {
          create: [
            { userId: instructor.id, roles: ["INSTRUCTOR"] },
            { userId: lnd.id, roles: ["LND"] },
            { userId: learner.id, roles: ["MEMBER"] },
          ],
        },
      },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [instructor, lnd, learner].filter(Boolean)) {
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("instructor drafts a course with block lessons", async () => {
    const c = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses`, {
      title: "Backend Onboarding", description: "Week 1 of the backend track.",
    });
    expect(c.statusCode).toBe(201);
    courseId = c.json().data.id;
    expect(c.json().data.status).toBe("DRAFT");

    const l = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/lessons`, {
      title: "Services 101",
      type: "RICH_TEXT",
      estMinutes: 12,
      blocks: [
        { type: "heading", data: { text: "How our services talk" } },
        { type: "rich_text", data: { text: "Every service owns its data…" } },
        { type: "judged_code", data: { problemSlug: "single-number" } },
      ],
    });
    expect(l.statusCode).toBe(201);
    lessonId = l.json().data.id;
    const course = await inject(instructor.token, "GET", `/v1/orgs/${orgId}/courses/${courseId}`);
    expect(course.json().data.estMinutes).toBe(12);
  });

  it("member cannot author; instructor cannot publish (capability separation)", async () => {
    const draft = await inject(learner.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "Nope" });
    expect(draft.statusCode).toBe(403);
    const pub = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/publish`);
    expect(pub.statusCode).toBe(403);
  });

  it("empty-course submit is rejected; real submit moves to IN_REVIEW", async () => {
    const empty = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "Empty" });
    const submitEmpty = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses/${empty.json().data.id}/submit`);
    expect(submitEmpty.statusCode).toBe(400);

    const submit = await inject(instructor.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/submit`);
    expect(submit.statusCode).toBe(200);
    expect(submit.json().data.status).toBe("IN_REVIEW");
  });

  it("member cannot see unpublished; LND publish snapshots a version + mirrors legacy flag", async () => {
    const before = await inject(learner.token, "GET", `/v1/orgs/${orgId}/work/courses`);
    expect(before.json().data).toHaveLength(0);

    const pub = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/publish`);
    expect(pub.statusCode).toBe(200);
    expect(pub.json().data.status).toBe("PUBLISHED");
    expect(pub.json().data.published).toBe(true); // legacy portal mirror
    expect(pub.json().data.version).toBe(2); // bumped after snapshotting v1

    const versions = await prisma.courseVersion.findMany({ where: { courseId } });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.version).toBe(1);
    const snap = versions[0]!.snapshot as { lessons: { title: string }[] };
    expect(snap.lessons[0]!.title).toBe("Services 101");
  });

  it("published courses are frozen — lesson edits demand a revision", async () => {
    const edit = await inject(instructor.token, "PATCH", `/v1/orgs/${orgId}/lessons/${lessonId}`, { title: "Hack" });
    expect(edit.statusCode).toBe(409);
    expect(edit.json().error.code).toBe("NOT_EDITABLE");
  });

  it("two-person rule: LND self-publish blocked when the org opts in", async () => {
    await prisma.organization.update({ where: { id: orgId }, data: { settings: { twoPersonPublish: true } } });
    const own = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses`, { title: "LND Solo Course" });
    const ownId = own.json().data.id;
    await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${ownId}/lessons`, { title: "L1", blocks: [] });
    const self = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${ownId}/publish`);
    expect(self.statusCode).toBe(403);
    expect(self.json().error.code).toBe("TWO_PERSON_RULE");
    // Someone else's course still publishes fine under the rule:
    await prisma.organization.update({ where: { id: orgId }, data: { settings: { twoPersonPublish: false } } });
  });

  it("member learns: list shows progress, completing a lesson counts once", async () => {
    const list = await inject(learner.token, "GET", `/v1/orgs/${orgId}/work/courses`);
    expect(list.json().data).toHaveLength(1);
    expect(list.json().data[0]).toMatchObject({ lessonCount: 1, completedCount: 0 });

    const open = await inject(learner.token, "GET", `/v1/orgs/${orgId}/work/courses/${courseId}`);
    expect(open.statusCode).toBe(200);
    expect(open.json().data.lessons[0].completed).toBe(false);

    await inject(learner.token, "POST", `/v1/orgs/${orgId}/work/lessons/${lessonId}/complete`);
    await inject(learner.token, "POST", `/v1/orgs/${orgId}/work/lessons/${lessonId}/complete`); // idempotent

    const after = await inject(learner.token, "GET", `/v1/orgs/${orgId}/work/courses`);
    expect(after.json().data[0].completedCount).toBe(1);
    const enrollments = await prisma.enrollment.count({ where: { courseId, userId: learner.id } });
    expect(enrollments).toBe(1);
  });

  it("cross-tenant: outsiders get 404 on builder AND /work surfaces", async () => {
    const outsider = await prisma.user.create({
      data: { clerkId: `learn_out_${stamp}`, email: `learn-out-${stamp}@test.eyf`, name: "Outsider" },
    });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Outsider", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    for (const url of [`/v1/orgs/${orgId}/courses`, `/v1/orgs/${orgId}/work/courses`, `/v1/orgs/${orgId}/work/courses/${courseId}`]) {
      const res = await inject(token, "GET", url);
      expect(res.statusCode, url).toBe(404);
    }
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
