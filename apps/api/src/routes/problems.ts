import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";

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
