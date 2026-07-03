import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";

/**
 * Cohort leaderboard — rank within your college, your graduation year, or
 * globally, by XP / problems solved / best streak. College-cohort competition
 * is a uniquely strong motivator for campus placements, and it leans on the
 * college + graduationYear we collect at onboarding.
 */
export async function leaderboardRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    const { scope, metric, limit } = z.object({
      scope: z.enum(["global", "college", "year"]).default("global"),
      metric: z.enum(["xp", "solved", "streak", "weekly"]).default("xp"),
      limit: z.coerce.number().min(5).max(100).default(25),
    }).parse(req.query);
    const userId = req.session!.id;

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { college: true, graduationYear: true },
    });

    // Resolve the cohort filter. If the user hasn't set the field a scope needs,
    // short-circuit with scopeReady:false so the UI can nudge them to fill it in.
    let scopeLabel = "Global";
    let userWhere: { college?: string; graduationYear?: number } = {};
    if (scope === "college") {
      scopeLabel = me?.college ?? "Your college";
      if (!me?.college) {
        return { success: true, data: { scope, metric, scopeLabel, scopeReady: false, total: 0, rows: [], me: null } };
      }
      userWhere = { college: me.college };
    } else if (scope === "year") {
      scopeLabel = me?.graduationYear ? `Class of ${me.graduationYear}` : "Your year";
      if (!me?.graduationYear) {
        return { success: true, data: { scope, metric, scopeLabel, scopeReady: false, total: 0, rows: [], me: null } };
      }
      userWhere = { graduationYear: me.graduationYear };
    }
    const where = { user: userWhere };

    // Weekly climbers — ranked by XP EARNED in the last 7 days (from dailyStreak),
    // not cumulative. Levels the field so a newcomer grinding this week can top it.
    if (metric === "weekly") {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      let cohortIds: Set<string> | null = null;
      if (scope !== "global") {
        const cohort = await prisma.userProfile.findMany({ where, select: { userId: true } });
        cohortIds = new Set(cohort.map((c) => c.userId));
      }
      const agg = await prisma.dailyStreak.groupBy({
        by: ["userId"], where: { date: { gte: since } }, _sum: { xpEarned: true },
      });
      const ranked = agg
        .map((a) => ({ userId: a.userId, value: a._sum.xpEarned ?? 0 }))
        .filter((a) => a.value > 0 && (!cohortIds || cohortIds.has(a.userId)))
        .sort((x, y) => y.value - x.value);

      const total = ranked.length;
      const meIdx = ranked.findIndex((r) => r.userId === userId);
      const meValue = meIdx >= 0 ? ranked[meIdx]!.value : 0;
      const rank = meIdx >= 0 ? meIdx + 1 : total + 1;
      const percentile = total > 0 && meIdx >= 0 ? Math.max(1, Math.round((1 - meIdx / total) * 100)) : null;

      const top = ranked.slice(0, limit);
      const users = await prisma.user.findMany({
        where: { id: { in: top.map((r) => r.userId) } },
        select: { id: true, name: true, college: true, graduationYear: true },
      });
      const byId = new Map(users.map((u) => [u.id, u]));
      const meLevel = await prisma.userProfile.findUnique({ where: { userId }, select: { level: true } });

      return {
        success: true,
        data: {
          scope, metric, scopeLabel, scopeReady: true, total,
          rows: top.map((r, i) => ({
            rank: i + 1,
            name: byId.get(r.userId)?.name ?? "—",
            college: byId.get(r.userId)?.college ?? null,
            gradYear: byId.get(r.userId)?.graduationYear ?? null,
            level: 0,
            value: r.value,
            isMe: r.userId === userId,
          })),
          me: { rank, value: meValue, percentile, level: meLevel?.level ?? 1 },
        },
      };
    }

    const orderBy =
      metric === "xp" ? { currentXp: "desc" as const } :
      metric === "solved" ? { totalSolved: "desc" as const } :
      { longestStreak: "desc" as const };
    const valueOf = (p: { currentXp: number; totalSolved: number; longestStreak: number }) =>
      metric === "xp" ? p.currentXp : metric === "solved" ? p.totalSolved : p.longestStreak;

    const [rows, total, meProfile] = await Promise.all([
      prisma.userProfile.findMany({
        where, orderBy, take: limit,
        include: { user: { select: { id: true, name: true, college: true, graduationYear: true } } },
      }),
      prisma.userProfile.count({ where }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { currentXp: true, totalSolved: true, longestStreak: true, level: true },
      }),
    ]);

    const meValue = meProfile ? valueOf(meProfile) : 0;
    const gt =
      metric === "xp" ? { currentXp: { gt: meValue } } :
      metric === "solved" ? { totalSolved: { gt: meValue } } :
      { longestStreak: { gt: meValue } };
    const ahead = await prisma.userProfile.count({ where: { ...where, ...gt } });
    const rank = ahead + 1;
    const percentile = total > 0 ? Math.max(1, Math.round((1 - (rank - 1) / total) * 100)) : null;

    return {
      success: true,
      data: {
        scope, metric, scopeLabel, scopeReady: true, total,
        rows: rows.map((p, i) => ({
          rank: i + 1,
          name: p.user.name,
          college: p.user.college,
          gradYear: p.user.graduationYear,
          level: p.level,
          value: valueOf(p),
          isMe: p.user.id === userId,
        })),
        me: { rank, value: meValue, percentile, level: meProfile?.level ?? 1 },
      },
    };
  });
}
