import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Verdict } from "@eyf/db";

const listQuery = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  pattern:    z.string().optional(),
  company:    z.string().optional(),
  q:          z.string().optional(),
  cursor:     z.string().optional(),
  limit:      z.coerce.number().min(1).max(50).default(20),
});

export async function problemRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { difficulty, pattern, company, q, cursor, limit } = listQuery.parse(req.query);
    const problems = await prisma.problem.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        ...(difficulty ? { difficulty } : {}),
        ...(pattern ? { patterns: { has: pattern } } : {}),
        ...(company ? { companies: { has: company } } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, difficulty: true,
        topics: true, patterns: true, companies: true,
        premium: true, acceptanceRate: true,
      },
    });
    const next = problems.length > limit ? problems.pop()!.id : null;
    return { success: true, data: problems, meta: { cursor: next } };
  });

  // ── Pattern Mastery + adaptive next rep — EYF's DSA differentiator. ──
  // Per-pattern mastery from the student's accepted solutions, plus the exact
  // next problem to fix their weakest pattern. No competitor computes this.
  app.get("/mastery", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const [allProblems, solved] = await Promise.all([
      prisma.problem.findMany({ select: { id: true, slug: true, title: true, difficulty: true, patterns: true } }),
      prisma.problemSolution.findMany({
        where: { userId, verdict: Verdict.ACCEPTED }, distinct: ["problemId"], select: { problemId: true },
      }),
    ]);
    const solvedIds = new Set(solved.map((s) => s.problemId));

    const stats = new Map<string, { total: number; solved: number }>();
    for (const p of allProblems) {
      for (const pat of p.patterns) {
        const s = stats.get(pat) ?? { total: 0, solved: 0 };
        s.total += 1;
        if (solvedIds.has(p.id)) s.solved += 1;
        stats.set(pat, s);
      }
    }
    const patterns = [...stats.entries()]
      .map(([pattern, s]) => ({ pattern, total: s.total, solved: s.solved, mastery: s.total ? Math.round((s.solved / s.total) * 100) : 0 }))
      .sort((a, b) => a.mastery - b.mastery || b.total - a.total);

    // Adaptive "next rep": weakest pattern that still has an unsolved problem.
    let next: { slug: string; title: string; difficulty: string; pattern: string } | null = null;
    for (const pm of patterns) {
      if (pm.solved >= pm.total) continue;
      const cand = allProblems.find((p) => p.patterns.includes(pm.pattern) && !solvedIds.has(p.id));
      if (cand) { next = { slug: cand.slug, title: cand.title, difficulty: cand.difficulty, pattern: pm.pattern }; break; }
    }
    const overall = patterns.length ? Math.round(patterns.reduce((a, p) => a + p.mastery, 0) / patterns.length) : 0;
    return { success: true, data: { patterns, next, overall } };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        starterCode: true,
        testCases: { where: { isPublic: true }, orderBy: { orderIndex: "asc" } },
      },
    });
    if (!problem) {
      return reply.code(404).send({
        success: false,
        error: { code: "PROBLEM_NOT_FOUND", message: "No such problem." },
      });
    }
    return { success: true, data: problem };
  });
}
