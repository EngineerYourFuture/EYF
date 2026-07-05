import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";

export async function adminRoutes(app: FastifyInstance) {
  // Capability-gated (RBAC source of truth: @eyf/types/permissions) —
  // mentor verification is its own capability, moderation another.
  const requireAdmin = requirePermission("verify:mentors");
  const requireMod   = requirePermission("moderate");

  // ─── Overview counts ───────────────────────────────────────────
  app.get("/overview", { preHandler: [app.requireAuth, requireMod] }, async () => {
    const [users, problems, threads, lockedThreads, mentorsPending, oaReports] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.problem.count(),
      prisma.forumThread.count(),
      prisma.forumThread.count({ where: { locked: true } }),
      prisma.mentor.count({ where: { verified: false } }),
      prisma.oaReport.count(),
    ]);
    return { success: true, data: { users, problems, threads, lockedThreads, mentorsPending, oaReports } };
  });

  // ─── Mentor verification queue ────────────────────────────────
  app.get("/mentors/pending", { preHandler: [app.requireAuth, requireAdmin] }, async () => {
    const mentors = await prisma.mentor.findMany({
      where: { verified: false },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } } },
    });
    return { success: true, data: mentors };
  });

  app.post("/mentors/:id/verify", { preHandler: [app.requireAuth, requireAdmin] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const updated = await prisma.mentor.update({
      where: { id },
      data: { verified: true, verifiedAt: new Date() },
    });
    void reply;
    return { success: true, data: updated };
  });

  app.post("/mentors/:id/reject", { preHandler: [app.requireAuth, requireAdmin] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.mentor.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  });

  // ─── Forum moderation ─────────────────────────────────────────
  app.post("/forum/threads/:id/lock", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const t = await prisma.forumThread.update({ where: { id }, data: { locked: true } });
    return { success: true, data: t };
  });

  app.post("/forum/threads/:id/unlock", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const t = await prisma.forumThread.update({ where: { id }, data: { locked: false } });
    return { success: true, data: t };
  });

  app.post("/forum/threads/:id/pin", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const t = await prisma.forumThread.update({ where: { id }, data: { pinned: true } });
    return { success: true, data: t };
  });

  app.delete("/forum/threads/:id", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.forumThread.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  });

  app.delete("/forum/posts/:id", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.forumPost.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  });

  // ─── OA reports moderation ────────────────────────────────────
  app.delete("/oa/:id", { preHandler: [app.requireAuth, requireMod] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.oaReport.delete({ where: { id } });
    return { success: true, data: { deleted: true } };
  });
}
