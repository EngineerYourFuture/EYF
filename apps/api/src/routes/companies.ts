import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Verdict } from "@eyf/db";

/** Distinct problem IDs the user has an ACCEPTED solution for. */
async function solvedProblemIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.problemSolution.findMany({
    where: { userId, verdict: Verdict.ACCEPTED },
    distinct: ["problemId"],
    select: { problemId: true },
  });
  return new Set(rows.map((r) => r.problemId));
}

const DIFFS = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;

export async function companyRoutes(app: FastifyInstance) {
  // List every company that tags at least one problem, with the user's coverage.
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const [problems, solved] = await Promise.all([
      prisma.problem.findMany({ select: { id: true, companies: true } }),
      solvedProblemIds(userId),
    ]);
    const map = new Map<string, { total: number; solved: number }>();
    for (const p of problems) {
      for (const c of p.companies) {
        const e = map.get(c) ?? { total: 0, solved: 0 };
        e.total += 1;
        if (solved.has(p.id)) e.solved += 1;
        map.set(c, e);
      }
    }
    const data = [...map.entries()]
      .map(([slug, v]) => ({
        slug,
        total: v.total,
        solved: v.solved,
        coverage: v.total ? Math.round((v.solved / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return { success: true, data };
  });

  // A focused prep view for one company: coverage, difficulty breakdown, problems.
  app.get("/:slug", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const userId = req.session!.id;
    const [problems, solved] = await Promise.all([
      prisma.problem.findMany({
        where: { companies: { has: slug } },
        select: {
          id: true, slug: true, title: true, difficulty: true,
          patterns: true, premium: true, acceptanceRate: true,
        },
        // Enum order (EASY→EXPERT) first, then most-asked (highest acceptance ~ most common) first.
        orderBy: [{ difficulty: "asc" }, { acceptanceRate: "desc" }],
      }),
      solvedProblemIds(userId),
    ]);
    if (problems.length === 0) {
      return reply.code(404).send({
        success: false,
        error: { code: "COMPANY_NOT_FOUND", message: "No problems tagged for this company yet." },
      });
    }
    const items = problems.map((p) => ({ ...p, solved: solved.has(p.id) }));
    const counts = { total: items.length, solved: items.filter((p) => p.solved).length };
    const breakdown = DIFFS.map((d) => {
      const list = items.filter((p) => p.difficulty === d);
      return { difficulty: d, total: list.length, solved: list.filter((p) => p.solved).length };
    }).filter((b) => b.total > 0);
    // Top patterns this company leans on, by frequency.
    const patternCount = new Map<string, number>();
    for (const p of items) for (const pat of p.patterns) patternCount.set(pat, (patternCount.get(pat) ?? 0) + 1);
    const topPatterns = [...patternCount.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([pattern, count]) => ({ pattern, count }));

    const coverage = counts.total ? Math.round((counts.solved / counts.total) * 100) : 0;
    return { success: true, data: { company: slug, coverage, counts, breakdown, topPatterns, problems: items } };
  });
}
