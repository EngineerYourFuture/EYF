import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, OaSection, Difficulty } from "@eyf/db";

export async function oaRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { company, role, limit } = z.object({
      company: z.string().optional(),
      role: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(req.query);
    const reports = await prisma.oaReport.findMany({
      where: {
        ...(company && { company: { contains: company, mode: "insensitive" } }),
        ...(role && { role: { contains: role, mode: "insensitive" } }),
      },
      orderBy: { driveDate: "desc" },
      take: limit,
      include: { author: { select: { name: true } } },
    });
    return { success: true, data: reports };
  });

  app.get("/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const r = await prisma.oaReport.findUnique({
      where: { id },
      include: { author: { select: { name: true, college: true } } },
    });
    if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Report not found" } });
    return { success: true, data: r };
  });

  app.post("/", { preHandler: app.requireAuth }, async (req) => {
    const body = z.object({
      company: z.string().min(2),
      role: z.string().min(2),
      driveDate: z.coerce.date(),
      durationMin: z.number().int().min(15).max(360),
      sections: z.array(z.nativeEnum(OaSection)).min(1),
      difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
      notes: z.string().min(20).max(20_000),
      patterns: z.array(z.string()).default([]),
    }).parse(req.body);
    const created = await prisma.oaReport.create({
      data: { authorId: req.session!.id, ...body },
    });
    return { success: true, data: created };
  });

  app.post("/:id/helpful", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const updated = await prisma.oaReport.updateMany({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
    if (updated.count === 0) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Report not found." } });
    }
    return { success: true, data: { ok: true } };
  });
}
