import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Covers resume CRUD + ownership in routes/resume.ts (Tier 2). Resumes hold PII, so the
 * ownership boundary is security-relevant: a user can only read/patch their own. Also locks
 * the ATS score being computed on write and the single-default invariant.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("resume CRUD + ownership (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userA: string, userB: string, resumeId: string, secondId: string;

  const tok = (id: string) => app.jwt.sign({ id, email: "r@x", name: "R", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
  const doc = { contact: { name: "Ada Lovelace", email: "ada@eyf.test" }, skills: ["dsa", "sql"] };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    const [a, b] = await Promise.all([
      prisma.user.create({ data: { clerkId: `rz_a_${s}`, email: `rz-a-${s}@test.eyf`, name: "A" } }),
      prisma.user.create({ data: { clerkId: `rz_b_${s}`, email: `rz-b-${s}@test.eyf`, name: "B" } }),
    ]);
    userA = a.id; userB = b.id;
  });

  afterAll(async () => {
    await prisma.resume.deleteMany({ where: { userId: { in: [userA, userB] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } }).catch(() => {});
    await app.close();
  });

  const create = (id: string, title: string) =>
    app.inject({ method: "POST", url: "/v1/resume", headers: { authorization: `Bearer ${tok(id)}`, "content-type": "application/json" }, payload: JSON.stringify({ title, json: doc }) });

  it("creates a resume and computes an ATS score on write", async () => {
    const res = await create(userA, "Primary");
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    resumeId = data.id;
    expect(typeof data.atsScore).toBe("number");
    expect(data.title).toBe("Primary");
  });

  it("lists only the caller's resumes", async () => {
    await create(userB, "B-resume"); // userB's — must not appear for userA
    const res = await app.inject({ method: "GET", url: "/v1/resume/me", headers: { authorization: `Bearer ${tok(userA)}` } });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((r: { userId: string }) => r.userId);
    expect(ids.every((u: string) => u === userA)).toBe(true);
  });

  it("reads own resume but 404s another user's (ownership boundary on PII)", async () => {
    const own = await app.inject({ method: "GET", url: `/v1/resume/${resumeId}`, headers: { authorization: `Bearer ${tok(userA)}` } });
    expect(own.statusCode).toBe(200);
    const other = await app.inject({ method: "GET", url: `/v1/resume/${resumeId}`, headers: { authorization: `Bearer ${tok(userB)}` } });
    expect(other.statusCode).toBe(404);
  });

  it("patches own resume; a non-owner's patch 404s", async () => {
    const other = await app.inject({ method: "PATCH", url: `/v1/resume/${resumeId}`, headers: { authorization: `Bearer ${tok(userB)}`, "content-type": "application/json" }, payload: JSON.stringify({ title: "hacked" }) });
    expect(other.statusCode).toBe(404);
    const own = await app.inject({ method: "PATCH", url: `/v1/resume/${resumeId}`, headers: { authorization: `Bearer ${tok(userA)}`, "content-type": "application/json" }, payload: JSON.stringify({ title: "Renamed" }) });
    expect(own.statusCode).toBe(200);
    expect(own.json().data.title).toBe("Renamed");
  });

  it("keeps a single default when setting isDefault", async () => {
    const second = await create(userA, "Second");
    secondId = second.json().data.id;
    await app.inject({ method: "PATCH", url: `/v1/resume/${resumeId}`, headers: { authorization: `Bearer ${tok(userA)}`, "content-type": "application/json" }, payload: JSON.stringify({ isDefault: true }) });
    await app.inject({ method: "PATCH", url: `/v1/resume/${secondId}`, headers: { authorization: `Bearer ${tok(userA)}`, "content-type": "application/json" }, payload: JSON.stringify({ isDefault: true }) });
    const defaults = await prisma.resume.count({ where: { userId: userA, isDefault: true } });
    expect(defaults).toBe(1); // setting a new default cleared the old one
  });
});
