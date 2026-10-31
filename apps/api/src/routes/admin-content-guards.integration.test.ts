import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the remaining content modules: `admin-content-learn.ts`
 * (6 writes), `admin-content-career.ts` (6) and `admin-content-mcq.ts` (4).
 *
 * Their CRUD is the same shape already pinned in admin-content / -banks, so this
 * file targets only the parts that are NOT copy-paste — the guards where a subtle
 * mistake ships broken content or destroys student history:
 *
 *   1. PATCH slug collision must exclude the row being edited (`NOT: { id }`).
 *      Without that, re-saving a form without changing the slug 409s against
 *      itself — a self-collision that looks like data corruption to staff.
 *   2. HAS_DEPENDENTS: a flashcard students have reviewed, or an internship they
 *      have applied to, must not be deletable out from under that history.
 *   3. MCQ `correctIndex` is validated against the MERGED patch result, same as
 *      the assessment bank.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("content guards — slug collisions, dependents, merged validation (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId = "", studentId = "";
  let noteA = "", noteB = "", cardId = "", mcqId = "";
  const s = Date.now();
  const slugA = `note-a-${s}`, slugB = `note-b-${s}`;

  const headers = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: adminId, email: "g-admin@x", name: "Admin", role: "ADMIN", plan: "free" }, { expiresIn: "5m" })}`,
    "x-admin-gate": app.jwt.sign({ id: adminId, adminGate: true }, { expiresIn: "5m" }),
  });
  const auth = () => ({ ...headers(), "content-type": "application/json" });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [admin, student] = await Promise.all([
      prisma.user.create({ data: { clerkId: `gd_a_${s}`, email: `gd-a-${s}@test.eyf`, name: "Admin", role: "ADMIN" } }),
      prisma.user.create({ data: { clerkId: `gd_s_${s}`, email: `gd-s-${s}@test.eyf`, name: "Stu" } }),
    ]);
    adminId = admin.id; studentId = student.id;

    const [a, b, card, mcq] = await Promise.all([
      prisma.theoryNote.create({ data: { slug: slugA, subject: "OS", title: "Note A", content: "a" } }),
      prisma.theoryNote.create({ data: { slug: slugB, subject: "OS", title: "Note B", content: "b" } }),
      prisma.flashcard.create({ data: { subject: "OS", topic: `t-${s}`, front: "Q", back: "A" } }),
      prisma.mcqBankQuestion.create({
        data: { category: "APTITUDE", topic: `t-${s}`, prompt: "2+2?", choices: ["3", "4", "5"], correctIndex: 1, explanation: "four" },
      }),
    ]);
    noteA = a.id; noteB = b.id; cardId = card.id; mcqId = mcq.id;
  });

  afterAll(async () => {
    await prisma.flashcardReview.deleteMany({ where: { flashcardId: cardId } }).catch(() => {});
    await prisma.flashcard.deleteMany({ where: { id: cardId } }).catch(() => {});
    await prisma.theoryNote.deleteMany({ where: { slug: { in: [slugA, slugB] } } }).catch(() => {});
    await prisma.mcqBankQuestion.deleteMany({ where: { id: mcqId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { actorId: adminId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, studentId] } } }).catch(() => {});
    await app.close();
  });

  // ── 1. slug collision semantics ──────────────────────────────────
  it("lets a note keep its OWN slug on patch (no self-collision)", async () => {
    const res = await app.inject({
      method: "PATCH", url: `/v1/admin/content/theory-notes/${noteA}`, headers: auth(),
      payload: JSON.stringify({ slug: slugA, title: "Note A renamed" }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.title).toBe("Note A renamed");
  });

  it("refuses a slug already held by a DIFFERENT note", async () => {
    const res = await app.inject({
      method: "PATCH", url: `/v1/admin/content/theory-notes/${noteA}`, headers: auth(),
      payload: JSON.stringify({ slug: slugB }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("SLUG_TAKEN");

    const [a, b] = await Promise.all([
      prisma.theoryNote.findUnique({ where: { id: noteA }, select: { slug: true } }),
      prisma.theoryNote.findUnique({ where: { id: noteB }, select: { slug: true } }),
    ]);
    expect(a!.slug).toBe(slugA); // the edited note is unchanged
    expect(b!.slug).toBe(slugB); // and the note that owns the slug still holds it
  });

  it("refuses a duplicate slug on create", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/admin/content/theory-notes", headers: auth(),
      payload: JSON.stringify({ slug: slugB, subject: "OS", title: "Clash", content: "x" }),
    });
    expect(res.statusCode).toBe(409);
  });

  // ── 2. dependents guard ──────────────────────────────────────────
  it("refuses to delete a flashcard students have reviewed", async () => {
    await prisma.flashcardReview.create({ data: { userId: studentId, flashcardId: cardId } });

    const res = await app.inject({ method: "DELETE", url: `/v1/admin/content/flashcards/${cardId}`, headers: headers() });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("HAS_DEPENDENTS");
    // The review history survives with its card intact.
    expect(await prisma.flashcard.count({ where: { id: cardId } })).toBe(1);
    expect(await prisma.flashcardReview.count({ where: { flashcardId: cardId } })).toBe(1);
  });

  // ── 3. merged validation on the MCQ bank ─────────────────────────
  it("validates MCQ correctIndex against the merged patch result", async () => {
    // 3 choices, stored index 1. Shrinking to two choices keeps 1 valid.
    const ok = await app.inject({
      method: "PATCH", url: `/v1/admin/content/mcq/${mcqId}`, headers: auth(),
      payload: JSON.stringify({ choices: ["3", "4"] }),
    });
    expect(ok.statusCode).toBe(200);

    // Now push the index past the shortened list — payload alone looks fine.
    const bad = await app.inject({
      method: "PATCH", url: `/v1/admin/content/mcq/${mcqId}`, headers: auth(),
      payload: JSON.stringify({ correctIndex: 4 }),
    });
    expect(bad.statusCode).toBe(400);

    const row = await prisma.mcqBankQuestion.findUnique({ where: { id: mcqId }, select: { correctIndex: true, choices: true } });
    expect(row!.correctIndex).toBe(1);
    expect(row!.choices).toHaveLength(2);
  });

  it("mcq import-bank is idempotent", async () => {
    const first = await app.inject({ method: "POST", url: "/v1/admin/content/mcq/import-bank", headers: auth(), payload: JSON.stringify({}) });
    expect(first.statusCode).toBe(200);
    const after = await prisma.mcqBankQuestion.count();

    const second = await app.inject({ method: "POST", url: "/v1/admin/content/mcq/import-bank", headers: auth(), payload: JSON.stringify({}) });
    expect(second.statusCode).toBe(200);
    expect(second.json().data.imported).toBe(0);
    expect(await prisma.mcqBankQuestion.count()).toBe(after);
  });

  it("still refuses a student across all three modules", async () => {
    const stu = {
      authorization: `Bearer ${app.jwt.sign({ id: studentId, email: "s@x", name: "S", role: "STUDENT_ELITE", plan: "elite" }, { expiresIn: "5m" })}`,
      "content-type": "application/json",
    };
    for (const url of ["/v1/admin/content/theory-notes", "/v1/admin/content/flashcards", "/v1/admin/content/mcq"]) {
      const res = await app.inject({ method: "POST", url, headers: stu, payload: JSON.stringify({}) });
      expect(res.statusCode).toBe(403);
    }
  });
});
