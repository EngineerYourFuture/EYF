import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("problem authoring and hidden-test boundaries", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId: string, problemId: string;
  const suffix = `${Date.now()}-problem-tests`;
  const slug = `sum-${suffix}`;
  const headers = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: adminId, email: "problem-admin@test.eyf", name: "Admin", role: "ADMIN", plan: "free" })}`,
    "x-admin-gate": app.jwt.sign({ id: adminId, adminGate: true }),
  });
  const body = {
    slug, title: "Sum", description: "Read two integers; print their sum.", difficulty: "EASY",
    testCases: [{ input: "2 3", expected: "5", isPublic: true }, { input: "-12 4", expected: "-8", isPublic: false }],
  };
  const create = (payload: object) => app.inject({ method: "POST", url: "/v1/admin/content/problems", headers: headers(), payload });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    adminId = (await prisma.user.create({ data: { clerkId: `pt_${suffix}`, email: `pt-${suffix}@test.eyf`, name: "Admin", role: "ADMIN" } })).id;
  });
  afterAll(async () => {
    if (problemId) await prisma.problem.delete({ where: { id: problemId } });
    if (adminId) {
      await prisma.auditLog.deleteMany({ where: { actorId: adminId } });
      await prisma.user.delete({ where: { id: adminId } });
    }
    await app?.close();
  });

  it("rejects missing, empty, duplicate and public-only test banks", async () => {
    const { testCases, ...noTests } = body;
    for (const payload of [noTests, { ...body, testCases: [] }, { ...body, testCases: testCases.map((t) => ({ ...t, isPublic: true })) }, { ...body, testCases: testCases.map((t) => ({ ...t, input: "same" })) }]) {
      expect((await create(payload)).statusCode).toBe(400);
    }
    expect(await prisma.problem.count({ where: { slug } })).toBe(0);
  });

  it("creates the problem and its public and hidden tests together", async () => {
    const res = await create(body);
    expect(res.statusCode).toBe(201);
    problemId = res.json().data.id;
    const tests = await prisma.testCase.findMany({ where: { problemId }, orderBy: { orderIndex: "asc" }, select: { input: true, expected: true, isPublic: true } });
    expect(tests).toEqual(body.testCases);
  });

  it("shows the full bank to staff but never exposes hidden tests publicly", async () => {
    const staff = await app.inject({ method: "GET", url: `/v1/admin/content/problems/${problemId}`, headers: headers() });
    expect(staff.json().data.testCases).toHaveLength(2);
    const publicProblem = await app.inject({ method: "GET", url: `/v1/problems/${slug}` });
    expect(publicProblem.json().data.testCases).toHaveLength(1);
    expect(publicProblem.body).not.toContain("-12 4");
    expect(publicProblem.body).not.toContain('"expected":"-8"');
  });

  it("preserves tests on a metadata-only edit and rejects erasing the bank", async () => {
    const patch = (payload: object) => app.inject({ method: "PATCH", url: `/v1/admin/content/problems/${problemId}`, headers: headers(), payload });
    expect((await patch({ title: "Add two numbers" })).statusCode).toBe(200);
    expect((await patch({ testCases: [] })).statusCode).toBe(400);
    expect(await prisma.testCase.count({ where: { problemId } })).toBe(2);
  });

  it("replaces the bank without leaving old tests behind", async () => {
    const testCases = [{ input: "0 0", expected: "0", isPublic: true }, { input: "100 99", expected: "199", isPublic: false }];
    const res = await app.inject({ method: "PATCH", url: `/v1/admin/content/problems/${problemId}`, headers: headers(), payload: { testCases } });
    expect(res.statusCode).toBe(200);
    const saved = await prisma.testCase.findMany({ where: { problemId }, orderBy: { orderIndex: "asc" }, select: { input: true, expected: true, isPublic: true } });
    expect(saved).toEqual(testCases);
  });
});
