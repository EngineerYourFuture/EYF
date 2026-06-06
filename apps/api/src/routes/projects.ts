import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Difficulty, ProjectStatus } from "@eyf/db";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { difficulty, tag } = z.object({
      difficulty: z.nativeEnum(Difficulty).optional(),
      tag: z.string().optional(),
    }).parse(req.query);
    const list = await prisma.projectIdea.findMany({
      where: { ...(difficulty && { difficulty }), ...(tag && { tags: { has: tag } }) },
      orderBy: { weeks: "asc" },
    });
    return { success: true, data: list };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const idea = await prisma.projectIdea.findUnique({ where: { slug } });
    if (!idea) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
    return { success: true, data: idea };
  });

  app.get("/me/started", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.userProject.findMany({
      where: { userId: req.session!.id },
      include: { idea: true },
      orderBy: { startedAt: "desc" },
    });
    return { success: true, data: list };
  });

  app.post("/:slug/start", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const idea = await prisma.projectIdea.findUnique({ where: { slug } });
    if (!idea) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
    const created = await prisma.userProject.upsert({
      where: { userId_ideaId: { userId: req.session!.id, ideaId: idea.id } },
      create: { userId: req.session!.id, ideaId: idea.id },
      update: {},
    });
    return { success: true, data: created };
  });

  app.patch("/me/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      status: z.nativeEnum(ProjectStatus).optional(),
      githubUrl: z.string().url().optional(),
      liveUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const owned = await prisma.userProject.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
    const updated = await prisma.userProject.update({
      where: { id },
      data: { ...body, ...(body.status === ProjectStatus.COMPLETED && { completedAt: new Date() }) },
    });
    return { success: true, data: updated };
  });
}
