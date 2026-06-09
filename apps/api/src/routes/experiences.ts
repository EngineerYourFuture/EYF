import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, InterviewOutcome } from "@eyf/db";

/** Crowd-sourced full-loop interview experiences, filterable by company. */
export async function experienceRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { company, cursor, limit } = z.object({
      company: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(req.query);
    const items = await prisma.interviewExperience.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: company ? { company } : {},
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      include: { author: { select: { name: true, college: true } } },
    });
    const next = items.length > limit ? items.pop()!.id : null;
    return { success: true, data: items, meta: { cursor: next } };
  });

  app.post("/", { preHandler: app.requireAuth }, async (req) => {
    const body = z.object({
      company: z.string().trim().min(1).max(60),
      role: z.string().trim().min(1).max(80),
      outcome: z.nativeEnum(InterviewOutcome),
      difficulty: z.coerce.number().int().min(1).max(5),
      rounds: z.coerce.number().int().min(1).max(15),
      body: z.string().trim().min(20).max(20_000),
      tips: z.string().trim().max(2_000).optional().nullable(),
    }).parse(req.body);
    const created = await prisma.interviewExperience.create({
      data: { ...body, authorId: req.session!.id },
    });
    return { success: true, data: created };
  });

  app.post("/:id/upvote", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const exp = await prisma.interviewExperience.findUnique({ where: { id } });
    if (!exp) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Experience not found" } });
    const updated = await prisma.interviewExperience.update({ where: { id }, data: { upvotes: { increment: 1 } } });
    return { success: true, data: { upvotes: updated.upvotes } };
  });
}
