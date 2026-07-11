import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * AI Course Builder integration (PRD §20). The house rule proven: with NO
 * Anthropic key the deterministic skeleton still produces a real, editable,
 * skill-tagged DRAFT course — then the normal submit/publish lifecycle works
 * on it. AI drafts, humans commit.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("AI course builder (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let lnd: { id: string; token: string };
  let member: { id: string; token: string };
  let orgId: string;

  const inject = (token: string, method: "GET" | "POST", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `ai_${tag}_${stamp}`, email: `ai-${tag}-${stamp}@test.eyf`, name: `AI ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    lnd = await mkUser("lnd");
    member = await mkUser("member");
    const org = await prisma.organization.create({
      data: { name: `AITest ${stamp}`, slug: `ai-test-${stamp}`, accessCode: `ai-${stamp}`, members: { create: [{ userId: lnd.id, roles: ["LND"] }, { userId: member.id, roles: ["MEMBER"] }] } },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [lnd, member].filter(Boolean)) await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    await app?.close();
  });

  it("drafts a real, editable, skill-tagged course (deterministic skeleton without a key)", async () => {
    const res = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/ai/course-draft`, { topic: "Kafka", audience: "backend intern", lessonCount: 5 });
    expect(res.statusCode).toBe(201);
    const { courseId, lessons, source } = res.json().data;
    expect(lessons).toBe(5);
    expect(["ai", "template"]).toContain(source); // template when no key

    // The course is a real DRAFT with real lessons + blocks + skill tags.
    const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId }, include: { lessons: { orderBy: { orderIndex: "asc" } } } });
    expect(course.status).toBe("DRAFT");
    expect(course.lessons).toHaveLength(5);
    expect(course.estMinutes).toBeGreaterThan(0);
    const first = course.lessons[0]!;
    expect(first.skillId).not.toBeNull(); // tagged → feeds the ledger on completion
    expect(Array.isArray(first.blocks)).toBe(true);
    expect((first.blocks as unknown[]).length).toBeGreaterThan(0);
    // A hands-on lesson carries a judged exercise.
    const handsOn = course.lessons.find((l) => (l.blocks as { type: string }[]).some((b) => b.type === "judged_code"));
    expect(handsOn).toBeTruthy();
  });

  it("the AI draft flows through the normal publish lifecycle", async () => {
    const draft = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/ai/course-draft`, { topic: "Postgres", audience: "fresher", lessonCount: 3 });
    const courseId = draft.json().data.courseId;
    // submit → publish (LND holds both here).
    expect((await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/submit`)).statusCode).toBe(200);
    const pub = await inject(lnd.token, "POST", `/v1/orgs/${orgId}/courses/${courseId}/publish`);
    expect(pub.statusCode).toBe(200);
    expect(pub.json().data.status).toBe("PUBLISHED");
    // A member can now open it in the player.
    const open = await inject(member.token, "GET", `/v1/orgs/${orgId}/work/courses/${courseId}`);
    expect(open.statusCode).toBe(200);
    expect(open.json().data.lessons.length).toBe(3);
  });

  it("MEMBER cannot AI-draft; outsider 404; ai_credits metered only for real AI", async () => {
    expect((await inject(member.token, "POST", `/v1/orgs/${orgId}/ai/course-draft`, { topic: "x", audience: "y" })).statusCode).toBe(403);
    const outsider = await prisma.user.create({ data: { clerkId: `ai_out_${stamp}`, email: `ai-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    expect((await inject(token, "POST", `/v1/orgs/${orgId}/ai/course-draft`, { topic: "x", audience: "y" })).statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
    // Without a key, the two template drafts above metered 0 ai_credits.
    const { currentPeriod } = await import("../lib/usage.js");
    const counter = await prisma.usageCounter.findUnique({ where: { orgId_metric_period: { orgId, metric: "ai_credits", period: currentPeriod() } } });
    if (!process.env.ANTHROPIC_API_KEY) expect(counter?.value ?? 0).toBe(0);
  });
});
