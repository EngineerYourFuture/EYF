import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the moderation surface (`admin.ts`) — 8 previously
 * untested write routes.
 *
 * The property worth pinning is not "lock sets locked=true"; it's the CAPABILITY
 * SEPARATION. These routes sit behind two different grants: forum/OA actions need
 * `moderate`, while approving a mentor needs `verify:mentors`. Per the role map in
 * @eyf/types, MODERATOR holds only the former. If someone ever widens that map or
 * swaps a guard, a community moderator silently gains the power to mark mentors as
 * verified — which is a trust signal students pay for. That is the regression these
 * tests exist to catch.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("admin moderation — capability separation + actions (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId = "", modId = "", studentId = "", mentorUserId = "";
  let mentorId = "", threadId = "", postId = "";
  const s = Date.now();

  const hdr = (id: string, role: string) => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: `${role}@x`, name: role, role, plan: "free" }, { expiresIn: "5m" })}`,
    "x-admin-gate": app.jwt.sign({ id, adminGate: true }, { expiresIn: "5m" }),
  });
  const asAdmin = () => hdr(adminId, "ADMIN");
  const asMod = () => hdr(modId, "MODERATOR");
  const asStudent = () => hdr(studentId, "STUDENT_FREE");

  const freshThread = async () => {
    const t = await prisma.forumThread.create({
      data: { slug: `mod-thread-${s}-${Math.random().toString(36).slice(2, 8)}`, authorId: studentId, category: "GENERAL", title: "Test thread", body: "Body" },
    });
    return t.id;
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [admin, mod, student, mentorUser] = await Promise.all([
      prisma.user.create({ data: { clerkId: `md_a_${s}`, email: `md-a-${s}@test.eyf`, name: "Admin", role: "ADMIN" } }),
      prisma.user.create({ data: { clerkId: `md_m_${s}`, email: `md-m-${s}@test.eyf`, name: "Mod", role: "MODERATOR" } }),
      prisma.user.create({ data: { clerkId: `md_s_${s}`, email: `md-s-${s}@test.eyf`, name: "Stu" } }),
      prisma.user.create({ data: { clerkId: `md_mu_${s}`, email: `md-mu-${s}@test.eyf`, name: "MentorUser" } }),
    ]);
    adminId = admin.id; modId = mod.id; studentId = student.id; mentorUserId = mentorUser.id;

    const mentor = await prisma.mentor.create({
      data: { userId: mentorUserId, company: "Acme", jobTitle: "Staff Eng", yearsExp: 8, expertise: ["system-design"] },
    });
    mentorId = mentor.id;
    threadId = await freshThread();
    const p = await prisma.forumPost.create({ data: { threadId, authorId: studentId, body: "A reply" } });
    postId = p.id;
  });

  afterAll(async () => {
    await prisma.forumPost.deleteMany({ where: { authorId: studentId } }).catch(() => {});
    await prisma.forumThread.deleteMany({ where: { authorId: studentId } }).catch(() => {});
    await prisma.mentor.deleteMany({ where: { userId: mentorUserId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, modId, studentId, mentorUserId] } } }).catch(() => {});
    await app.close();
  });

  // ── capability separation ────────────────────────────────────────
  it("a MODERATOR cannot verify a mentor — that needs verify:mentors, not moderate", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/admin/mod/mentors/${mentorId}/verify`, headers: asMod() });
    expect(res.statusCode).toBe(403);

    const row = await prisma.mentor.findUnique({ where: { id: mentorId }, select: { verified: true } });
    expect(row!.verified).toBe(false); // and nothing changed
  });

  it("a MODERATOR cannot reject (delete) a mentor either", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/admin/mod/mentors/${mentorId}/reject`, headers: asMod() });
    expect(res.statusCode).toBe(403);
    expect(await prisma.mentor.count({ where: { id: mentorId } })).toBe(1);
  });

  it("a plain student is refused every moderation action", async () => {
    for (const url of [
      `/v1/admin/mod/forum/threads/${threadId}/lock`,
      `/v1/admin/mod/forum/threads/${threadId}/pin`,
      `/v1/admin/mod/mentors/${mentorId}/verify`,
    ]) {
      expect((await app.inject({ method: "POST", url, headers: asStudent() })).statusCode).toBe(403);
    }
    const row = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { locked: true, pinned: true } });
    expect(row).toMatchObject({ locked: false, pinned: false });
  });

  it("an ADMIN holds verify:mentors and can verify", async () => {
    const res = await app.inject({ method: "POST", url: `/v1/admin/mod/mentors/${mentorId}/verify`, headers: asAdmin() });
    expect(res.statusCode).toBe(200);

    const row = await prisma.mentor.findUnique({ where: { id: mentorId }, select: { verified: true, verifiedAt: true } });
    expect(row!.verified).toBe(true);
    expect(row!.verifiedAt).not.toBeNull(); // the audit timestamp is stamped, not just the flag
  });

  // ── the moderation actions themselves ────────────────────────────
  it("a MODERATOR can lock, unlock, and pin a thread", async () => {
    const lock = await app.inject({ method: "POST", url: `/v1/admin/mod/forum/threads/${threadId}/lock`, headers: asMod() });
    expect(lock.statusCode).toBe(200);
    expect((await prisma.forumThread.findUnique({ where: { id: threadId }, select: { locked: true } }))!.locked).toBe(true);

    const unlock = await app.inject({ method: "POST", url: `/v1/admin/mod/forum/threads/${threadId}/unlock`, headers: asMod() });
    expect(unlock.statusCode).toBe(200);
    expect((await prisma.forumThread.findUnique({ where: { id: threadId }, select: { locked: true } }))!.locked).toBe(false);

    const pin = await app.inject({ method: "POST", url: `/v1/admin/mod/forum/threads/${threadId}/pin`, headers: asMod() });
    expect(pin.statusCode).toBe(200);
    expect((await prisma.forumThread.findUnique({ where: { id: threadId }, select: { pinned: true } }))!.pinned).toBe(true);
  });

  it("a MODERATOR can delete a single post without touching its thread", async () => {
    const res = await app.inject({ method: "DELETE", url: `/v1/admin/mod/forum/posts/${postId}`, headers: asMod() });
    expect(res.statusCode).toBe(200);
    expect(await prisma.forumPost.count({ where: { id: postId } })).toBe(0);
    expect(await prisma.forumThread.count({ where: { id: threadId } })).toBe(1);
  });

  it("deleting a thread cascades its posts rather than orphaning them", async () => {
    const tid = await freshThread();
    await prisma.forumPost.create({ data: { threadId: tid, authorId: studentId, body: "child" } });

    const res = await app.inject({ method: "DELETE", url: `/v1/admin/mod/forum/threads/${tid}`, headers: asMod() });
    expect(res.statusCode).toBe(200);
    expect(await prisma.forumThread.count({ where: { id: tid } })).toBe(0);
    expect(await prisma.forumPost.count({ where: { threadId: tid } })).toBe(0);
  });
});
