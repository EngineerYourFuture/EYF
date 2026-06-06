import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, PressureLevel } from "@eyf/db";
import { pressureBudget, summarizeAnxiety } from "../services/pressure.js";

export async function pressureRoutes(app: FastifyInstance) {
  app.post("/start", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({
      problemSlug: z.string().optional(),
      level: z.nativeEnum(PressureLevel).default(PressureLevel.NORMAL),
      anxietyBefore: z.number().int().min(1).max(10).optional(),
    }).parse(req.body);
    const problem = body.problemSlug
      ? await prisma.problem.findUnique({ where: { slug: body.problemSlug }, select: { id: true, difficulty: true } })
      : null;
    if (body.problemSlug && !problem) {
      return reply.code(404).send({ success: false, error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found." } });
    }
    const targetSeconds = problem ? pressureBudget(problem.difficulty, body.level) : pressureBudget("MEDIUM", body.level);
    const session = await prisma.pressureSession.create({
      data: {
        userId: req.session!.id,
        problemId: problem?.id ?? null,
        level: body.level,
        targetSeconds,
        anxietyBefore: body.anxietyBefore ?? null,
      },
    });
    return { success: true, data: session };
  });

  app.post("/:id/end", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      completed: z.boolean(),
      actualSeconds: z.number().int().min(0).max(7200),
      anxietyAfter: z.number().int().min(1).max(10).optional(),
      confidence: z.number().int().min(1).max(10).optional(),
    }).parse(req.body);
    const owned = await prisma.pressureSession.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Session not found." } });
    const updated = await prisma.pressureSession.update({
      where: { id },
      data: { ...body, endedAt: new Date() },
    });
    return { success: true, data: updated };
  });

  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const sessions = await prisma.pressureSession.findMany({
      where: { userId: req.session!.id },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { problem: { select: { slug: true, title: true, difficulty: true } } },
    });
    return { success: true, data: sessions };
  });

  app.get("/me/anxiety", { preHandler: app.requireAuth }, async (req) => {
    const rows = await prisma.pressureSession.findMany({
      where: { userId: req.session!.id },
      select: { anxietyBefore: true, anxietyAfter: true, completed: true },
    });
    return { success: true, data: summarizeAnxiety(rows) };
  });
}
