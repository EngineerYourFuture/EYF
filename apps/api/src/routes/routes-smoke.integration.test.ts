import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Broad smoke coverage for authenticated GET endpoints — signs a student and an
 * admin token, then hits each list/read route and asserts the handler runs
 * without a server error (5xx). Exercises the route handlers + their service
 * calls end-to-end. Skips cleanly without a DATABASE_URL.
 */
const hasDb = !!process.env.DATABASE_URL;

const STUDENT_GETS = [
  "/me/", "/problems/", "/problems/mastery", "/submissions/me",
  "/assessment/me", "/roadmap/me", "/roadmap/today", "/billing/plans",
  "/subjects/", "/subjects/review", "/resume/me", "/gamification/badges",
  "/gamification/me", "/gamification/leaderboard", "/gamification/streak",
  "/projects/", "/projects/me/started", "/jobs/", "/jobs/me/applications",
  "/mentors/", "/mentors/me/payouts", "/mocks/me", "/mocks/composure",
  "/cognitive/me", "/cognitive/percentile", "/certificates/me", "/tracks/",
  "/tracks/me/primary", "/forum/threads", "/internships/", "/internships/me/applications",
  "/code-dna/me", "/oa/", "/pressure/me", "/pressure/me/anxiety",
  "/peer/queue/status", "/companies/", "/skill-graph/me", "/guidance/me",
  "/ask/trending", "/missions/today", "/leaderboard/", "/experiences/",
  "/mcq/catalog", "/mcq/sims", "/mcq/history", "/communication/prompts",
  "/communication/history", "/project-prep/", "/talent/consent", "/talent/offers",
  "/orgs/mine",
];

const ADMIN_GETS = [
  "/admin/mod/overview", "/admin/mod/mentors/pending", "/admin/gate/status",
  "/admin/content/problems", "/admin/content/jobs", "/admin/content/career-tracks",
  "/admin/content/experiences", "/admin/content/theory-notes", "/admin/content/flashcards",
  "/admin/content/internships", "/admin/content/project-ideas", "/admin/content/mcq",
  "/admin/content/assessment", "/admin/content/communication", "/admin/content/sims",
  "/admin/content/knowledge", "/admin/users/", "/admin/payments/overview",
  "/admin/payments/invoices", "/admin/audit/",
];

describe.skipIf(!hasDb)("authenticated GET route smoke (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let studentToken: string;
  let adminToken: string;
  const ids: string[] = [];

  const get = (token: string, url: string) =>
    app.inject({ method: "GET", url: `/v1${url}`, headers: { authorization: `Bearer ${token}` } });

  const mkUser = async (role: string) => {
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const u = await prisma.user.create({
      data: { clerkId: `smoke_${stamp}`, email: `smoke-${stamp}@test.eyf`, name: "Smoke", role: role as never },
    });
    ids.push(u.id);
    return app.jwt.sign({ id: u.id, email: u.email, name: u.name, role, plan: "pro" }, { expiresIn: "10m" });
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    studentToken = await mkUser("STUDENT_PRO");
    adminToken = await mkUser("ADMIN");
  });

  afterAll(async () => {
    const sid = ids[0];
    if (sid) {
      await prisma.cognitiveSession.deleteMany({ where: { userId: sid } }).catch(() => {});
      await prisma.pressureSession.deleteMany({ where: { userId: sid } }).catch(() => {});
      await prisma.interviewExperience.deleteMany({ where: { authorId: sid } }).catch(() => {});
      await prisma.oaReport.deleteMany({ where: { authorId: sid } }).catch(() => {});
    }
    for (const id of ids) await prisma.user.delete({ where: { id } }).catch(() => {});
    await app?.close();
  });

  const post = (token: string, url: string, body: object) =>
    app.inject({ method: "POST", url: `/v1${url}`, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, payload: JSON.stringify(body) });

  it.each(STUDENT_GETS)("student GET %s runs without a 5xx", async (url) => {
    const res = await get(studentToken, url);
    expect(res.statusCode, `${url} → ${res.statusCode} ${res.body?.slice(0, 120)}`).toBeLessThan(500);
  });

  it.each(ADMIN_GETS)("admin GET %s runs without a 5xx", async (url) => {
    const res = await get(adminToken, url);
    expect(res.statusCode, `${url} → ${res.statusCode} ${res.body?.slice(0, 120)}`).toBeLessThan(500);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/me/" });
    expect(res.statusCode).toBe(401);
  });

  it("POST /cognitive/sessions records a game result", async () => {
    const res = await post(studentToken, "/cognitive/sessions", { game: "REACTION", score: 500, accuracyPct: 100, durationSeconds: 30 });
    expect(res.statusCode).toBe(200);
  });

  it("POST /experiences creates an interview experience", async () => {
    const res = await post(studentToken, "/experiences", {
      company: "Acme", role: "SDE-1", outcome: "OFFER", difficulty: 3, rounds: 4,
      body: "A detailed writeup of the interview loop that is definitely long enough.",
    });
    expect(res.statusCode).toBe(200);
  });

  it("POST /oa creates an OA report", async () => {
    const res = await post(studentToken, "/oa", {
      company: "Acme", role: "SDE-1", driveDate: "2026-01-15", durationMin: 90,
      sections: ["DSA", "APTITUDE"], notes: "Two coding questions plus aptitude; medium difficulty overall.",
    });
    expect(res.statusCode).toBe(200);
  });

  it("POST /pressure/start then /:id/end runs a session", async () => {
    const start = await post(studentToken, "/pressure/start", { level: "NORMAL", anxietyBefore: 5 });
    expect(start.statusCode).toBe(200);
    const id = start.json().data.id;
    const end = await post(studentToken, `/pressure/${id}/end`, { completed: true, actualSeconds: 120, anxietyAfter: 3, confidence: 7 });
    expect(end.statusCode).toBeLessThan(500);
  });
});
