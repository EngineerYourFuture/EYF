import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { generateProjectPrep } from "../services/project-prep.js";

export async function projectPrepRoutes(app: FastifyInstance) {
  // Generate a prep guide for a project (Basic+). Accepts either a started
  // UserProject id (we hydrate from the idea) or a fully custom project.
  app.post(
    "/generate",
    { preHandler: [app.requireAuth, app.requirePlan(["basic"])] },
    async (req, reply) => {
      const body = z.object({
        userProjectId: z.string().optional(),
        title: z.string().min(2).max(120).optional(),
        summary: z.string().min(2).max(1000).optional(),
        techStack: z.array(z.string().min(1).max(40)).max(20).optional(),
      }).parse(req.body);

      let title = body.title?.trim();
      let summary = body.summary?.trim();
      let techStack = body.techStack ?? [];

      // Hydrate from a started project if referenced.
      if (body.userProjectId) {
        const up = await prisma.userProject.findFirst({
          where: { id: body.userProjectId, userId: req.session!.id },
          include: { idea: true },
        });
        if (!up) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project not found." } });
        title ??= up.idea.title;
        summary ??= up.notes?.trim() || up.idea.description;
        if (techStack.length === 0) techStack = up.idea.techStack;
      }

      if (!title || !summary) {
        return reply.code(400).send({
          success: false,
          error: { code: "MISSING_PROJECT", message: "Provide a project title and summary, or a started project." },
        });
      }

      let result;
      try {
        result = await generateProjectPrep({ title, summary, techStack });
      } catch (err) {
        req.log.error({ err }, "project prep generation failed");
        return reply.code(503).send({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "The project-prep generator isn't configured yet." },
        });
      }

      const prep = await prisma.projectPrep.create({
        data: {
          userId: req.session!.id,
          projectTitle: title,
          summary,
          techStack,
          questions: result.questions,
          tips: { redFlags: result.redFlags, starHooks: result.starHooks },
        },
      });

      return { success: true, data: prep };
    },
  );

  // History list — recent preps.
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    const preps = await prisma.projectPrep.findMany({
      where: { userId: req.session!.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, projectTitle: true, techStack: true, createdAt: true },
    });
    return { success: true, data: preps };
  });

  // A single prep guide.
  app.get("/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const prep = await prisma.projectPrep.findFirst({ where: { id, userId: req.session!.id } });
    if (!prep) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Prep not found." } });
    return { success: true, data: prep };
  });
}
