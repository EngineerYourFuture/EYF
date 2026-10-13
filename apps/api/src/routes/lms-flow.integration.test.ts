import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("LMS complete learning flow and access boundaries", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = `${Date.now()}-lms`;
  const users: { id: string; token: string; email: string }[] = [];
  let orgId: string, memberId: string, ownerId: string, courseId: string, lessonId: string, publicId: string, staffId: string, problemId: string, questionId: string;
  const call = (who: number, method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: object) => app.inject({ method, url: `/v1${url}`, headers: { authorization: `Bearer ${users[who]!.token}` }, ...(payload ? { payload } : {}) });
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    for (const tag of ["owner", "learner", "outsider"]) {
      const u = await prisma.user.create({ data: { clerkId: `${stamp}-${tag}`, email: `${stamp}-${tag}@test.eyf`, name: tag } });
      users.push({ ...u, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_FREE", plan: "free" }) });
    }
    const org = await prisma.organization.create({ data: { name: stamp, slug: stamp, accessCode: stamp, members: { create: [{ userId: users[0]!.id, roles: ["OWNER"] }, { userId: users[1]!.id, roles: ["MEMBER"] }] } }, include: { members: true } });
    orgId = org.id; memberId = org.members.find((m) => m.userId === users[1]!.id)!.id; ownerId = org.members.find((m) => m.userId === users[0]!.id)!.id;
    publicId = (await prisma.course.create({ data: { orgId, title: "Public partner course", published: true, audience: "CANDIDATE" } })).id;
    staffId = (await prisma.course.create({ data: { orgId, title: "Staff only", published: true, audience: "STAFF" } })).id;
    problemId = (await prisma.problem.create({ data: { slug: stamp, title: stamp, description: "Add two numbers", difficulty: "EASY", testCases: { create: [{ input: "2 3", expected: "5", isPublic: true }] } } })).id;
    questionId = (await prisma.mcqBankQuestion.create({ data: { prompt: "LMS fixture: 1 + 1?", choices: ["2", "3"], correctIndex: 0, category: "TECHNICAL", difficulty: "EASY", topic: "LMS fixture", explanation: "Addition" } })).id;
  });
  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } });
    if (problemId) { await prisma.problemSolution.deleteMany({ where: { problemId } }); await prisma.problem.delete({ where: { id: problemId } }); }
    if (questionId) await prisma.mcqBankQuestion.delete({ where: { id: questionId } });
    for (const u of users) await prisma.user.delete({ where: { id: u.id } });
    await app?.close();
  });

  it("authors quiz/media content, updates skill tags, publishes, and preserves revisions", async () => {
    const draft = await call(0, "POST", `/orgs/${orgId}/courses`, { title: "Private training" }); expect(draft.statusCode).toBe(201); courseId = draft.json().data.id;
    expect((await call(0, "POST", `/orgs/${orgId}/courses/${courseId}/publish`)).statusCode).toBe(400);
    const lesson = await call(0, "POST", `/orgs/${orgId}/courses/${courseId}/lessons`, { title: "Check understanding", blocks: [
      { type: "quiz", data: { question: "2 + 3?", choices: ["5", "6"], correctIndex: 0 } },
      { type: "judged_code", data: { problemSlug: stamp } },
      { type: "video", data: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
    ] }); expect(lesson.statusCode).toBe(201); lessonId = lesson.json().data.id;
    const skill = await call(0, "PATCH", `/orgs/${orgId}/lessons/${lessonId}`, { skillSlug: "addition", estMinutes: 9 }); expect(skill.statusCode).toBe(200);
    expect((await call(0, "GET", `/orgs/${orgId}/courses/${courseId}`)).json().data.estMinutes).toBe(9);
    expect((await call(0, "POST", `/orgs/${orgId}/courses/${courseId}/publish`)).statusCode).toBe(200);
    const revision = await call(0, "POST", `/orgs/${orgId}/courses/${courseId}/revise`); expect(revision.statusCode).toBe(201); expect(revision.json().data.status).toBe("DRAFT");
    expect((await prisma.course.findUnique({ where: { id: courseId } }))?.status).toBe("PUBLISHED");
  });

  it("keeps every course private through legacy learner endpoints", async () => {
    const catalog = await call(2, "GET", "/org/catalog");
    const ids = catalog.json().data.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(publicId); expect(ids).not.toContain(staffId); expect(ids).not.toContain(courseId);
    for (const id of [courseId, staffId, publicId]) {
      expect((await call(2, "GET", `/org/courses/${id}/learn`)).statusCode).toBe(404);
      expect((await call(2, "POST", `/org/courses/${id}/enroll`)).statusCode).toBe(404);
    }
    expect((await call(2, "POST", `/org/lessons/${lessonId}/complete`)).statusCode).toBe(404);
    expect((await call(2, "POST", `/org/courses/${publicId}/enroll`)).statusCode).toBe(404);
    expect((await call(1, "GET", `/org/courses/${staffId}/learn`)).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: "/v1/org/verify", payload: { code: stamp } })).statusCode).toBe(410);
  });

  it("requires quiz and judged exercise evidence, conceals answers, and counts completion once", async () => {
    for (const url of [`/orgs/${orgId}/work/courses/${courseId}`, `/org/courses/${courseId}/learn`]) {
      const player = await call(1, "GET", url); expect(player.statusCode).toBe(200);
      expect(player.json().data.lessons[0].blocks[0].data).not.toHaveProperty("correctIndex");
    }
    for (const url of [`/orgs/${orgId}/work/lessons/${lessonId}/complete`, `/org/lessons/${lessonId}/complete`]) {
      expect((await call(1, "POST", url)).statusCode).toBe(422);
      expect((await call(1, "POST", url, { answers: { "0": 0 } })).statusCode).toBe(422);
    }
    await prisma.problemSolution.create({ data: { userId: users[1]!.id, problemId, language: "PYTHON", code: "print(5)", verdict: "ACCEPTED" } });
    const results = await Promise.all([1, 2].map(() => call(1, "POST", `/orgs/${orgId}/work/lessons/${lessonId}/complete`, { answers: { "0": 0 } })));
    expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
    expect(await prisma.lessonProgress.count({ where: { lessonId, userId: users[1]!.id } })).toBe(1);
    expect(await prisma.skillEvidence.count({ where: { sourceId: lessonId, userId: users[1]!.id } })).toBe(1);
  });

  it("creates a program and cohort, enrolls learners, and shows completed progress", async () => {
    const path = await call(0, "POST", `/orgs/${orgId}/paths`, { title: "Onboarding" }); const pathId = path.json().data.id;
    expect((await call(0, "POST", `/orgs/${orgId}/paths/${pathId}/items`, { courseId })).statusCode).toBe(201);
    expect((await call(0, "POST", `/orgs/${orgId}/paths/${pathId}/publish`)).statusCode).toBe(200);
    expect((await call(0, "DELETE", `/orgs/${orgId}/paths/${pathId}/items/${courseId}`)).statusCode).toBe(409);
    const cohort = await call(0, "POST", `/orgs/${orgId}/cohorts`, { pathId, name: "October group" }); expect(cohort.statusCode).toBe(201);
    const cohortId = cohort.json().data.id;
    expect((await call(0, "POST", `/orgs/${orgId}/cohorts/${cohortId}/enroll`, { memberIds: [memberId] })).statusCode).toBe(200);
    expect((await call(0, "GET", `/orgs/${orgId}/cohorts/${cohortId}/funnel`)).json().data.funnel.completed).toBe(1);
    expect((await call(1, "GET", `/orgs/${orgId}/work/paths`)).json().data[0].progressPct).toBe(100);
    expect((await call(2, "GET", `/orgs/${orgId}/learning-members`)).statusCode).toBe(404);
  });

  it("supports invitations and access management without removing the last owner", async () => {
    expect((await call(0, "PATCH", `/orgs/${orgId}/members/${ownerId}`, { status: "SUSPENDED" })).statusCode).toBe(400);
    const invite = await call(0, "POST", `/orgs/${orgId}/invites`, { email: users[2]!.email }); expect(invite.statusCode).toBe(201);
    expect((await call(0, "GET", `/orgs/${orgId}/invites`)).json().data[0]).not.toHaveProperty("token");
    expect((await call(1, "POST", "/orgs/invites/accept", { token: invite.json().data.token })).statusCode).toBe(403);
    expect((await call(2, "POST", "/orgs/invites/accept", { token: invite.json().data.token })).statusCode).toBe(200);
    const second = await call(0, "POST", `/orgs/${orgId}/invites`, { email: "pending@test.eyf" });
    expect((await call(0, "DELETE", `/orgs/${orgId}/invites/${second.json().data.id}`)).statusCode).toBe(200);
    expect((await call(0, "PATCH", `/orgs/${orgId}/members/${memberId}`, { status: "SUSPENDED" })).statusCode).toBe(200);
    expect((await call(1, "GET", `/orgs/${orgId}/work/courses/${courseId}`)).statusCode).toBe(404);
    expect((await call(1, "GET", `/org/courses/${courseId}/learn`)).statusCode).toBe(404);
    await call(0, "PATCH", `/orgs/${orgId}/members/${memberId}`, { status: "ACTIVE" });
  });

  it("takes an assessment, rejects duplicate answers, issues and verifies a certificate", async () => {
    const blueprint = await call(0, "POST", `/orgs/${orgId}/blueprints`, { name: "Completion assessment", questionCount: 1, category: "TECHNICAL" }); expect(blueprint.statusCode).toBe(201);
    const blueprintId = blueprint.json().data.id;
    expect((await call(0, "POST", `/orgs/${orgId}/cert-templates`, { name: "Onboarding complete", criteria: "ASSESSMENT_PASS", blueprintId })).statusCode).toBe(201);
    const run = await call(0, "POST", `/orgs/${orgId}/runs`, { blueprintId }); const runId = run.json().data.id;
    const start = await call(1, "POST", `/orgs/${orgId}/runs/${runId}/start`); expect(start.statusCode).toBe(200);
    const attempt = start.json().data; expect(attempt.expiresAt).toBeTruthy(); expect(attempt.questions[0]).not.toHaveProperty("correctIndex");
    const key = await prisma.mcqBankQuestion.findUniqueOrThrow({ where: { id: attempt.questions[0].id } }); const answer = { questionId: key.id, choice: key.correctIndex };
    expect((await call(1, "POST", `/orgs/${orgId}/attempts/${attempt.attemptId}/submit`, { answers: [answer, answer] })).statusCode).toBe(400);
    expect((await call(1, "POST", `/orgs/${orgId}/attempts/${attempt.attemptId}/submit`, { answers: [answer] })).json().data.passed).toBe(true);
    const certs = await call(1, "GET", `/orgs/${orgId}/work/certificates`); const cert = certs.json().data[0]; expect(cert.title).toBe("Onboarding complete");
    const verified = await app.inject({ method: "GET", url: `/v1/certificates/verify/${cert.verificationCode}` }); expect(verified.statusCode).toBe(200);
  });
});
