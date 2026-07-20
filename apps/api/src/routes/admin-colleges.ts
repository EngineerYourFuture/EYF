import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { collegeBatchHealth, type StudentStat } from "../services/college-analytics.js";

/**
 * TPO channel (Innovation Roadmap A1), v1 — admin-gated so EYF can see which
 * colleges have engaged batches and target them for placement-cell partnerships.
 * v2 exposes this to the TPOs themselves via college accounts.
 */
export async function adminCollegeRoutes(app: FastifyInstance) {
  const gate = requirePermission("manage:users");

  // Colleges ranked by student count — the pitch list.
  app.get("/", { preHandler: [app.requireAuth, gate] }, async () => {
    const rows = await prisma.user.groupBy({
      by: ["college"],
      where: { college: { not: null }, deletedAt: null },
      _count: { _all: true },
    });
    const colleges = rows
      .map((r) => ({ college: r.college!, students: r._count._all }))
      .sort((a, b) => b.students - a.students);
    return { success: true, data: colleges };
  });

  // Batch health for one college.
  app.get("/batch", { preHandler: [app.requireAuth, gate] }, async (req, reply) => {
    const { college } = z.object({ college: z.string().min(1) }).parse(req.query);
    const users = await prisma.user.findMany({
      where: { college, deletedAt: null },
      select: {
        targetRole: true,
        graduationYear: true,
        profile: { select: { level: true, currentXp: true, streakDays: true, totalSolved: true } },
      },
    });
    if (users.length === 0) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "No students for this college." } });
    }
    const stats: StudentStat[] = users.map((u) => ({
      level: u.profile?.level ?? 1,
      currentXp: u.profile?.currentXp ?? 0,
      streakDays: u.profile?.streakDays ?? 0,
      totalSolved: u.profile?.totalSolved ?? 0,
      targetRole: u.targetRole,
      graduationYear: u.graduationYear,
    }));
    return { success: true, data: { college, ...collegeBatchHealth(stats) } };
  });
}
