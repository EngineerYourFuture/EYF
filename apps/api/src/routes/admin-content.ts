/**
 * Admin content management — CRUD for the content that used to be hard-coded in
 * seeds. This is the TEMPLATE every other content type (subjects, jobs,
 * companies, tracks) follows: capability-gated (manage:content), zod-validated,
 * clean 400/404/409 errors. Staff edit content here instead of in code.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Difficulty } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";

const problemInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty),
  topics: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  premium: z.boolean().default(false),
  timeLimitMs: z.number().int().positive().max(60_000).default(2000),
  memoryLimitKb: z.number().int().positive().default(262144),
});

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

export async function adminContentRoutes(app: FastifyInstance) {
  const canManage = requirePermission("manage:content");
  const guard = { preHandler: [app.requireAuth, canManage] };

  // List — lightweight table view.
  app.get("/problems", guard, async () => {
    const problems = await prisma.problem.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, slug: true, title: true, difficulty: true, premium: true,
        topics: true, patterns: true, companies: true, acceptanceRate: true,
        totalSubmissions: true, updatedAt: true,
      },
    });
    return { success: true, data: problems };
  });

  // Single — full record for the edit form.
  app.get("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    return { success: true, data: problem };
  });

  // Create.
  app.post("/problems", guard, async (req, reply) => {
    const parsed = problemInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.problem.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A problem with that slug already exists." } });
    const created = await prisma.problem.create({ data: parsed.data });
    return reply.code(201).send({ success: true, data: created });
  });

  // Update (partial).
  app.patch("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = problemInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.problem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    if (parsed.data.slug) {
      const dupe = await prisma.problem.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another problem." } });
    }
    const updated = await prisma.problem.update({ where: { id }, data: parsed.data });
    return { success: true, data: updated };
  });

  // Delete — refuse if students have submissions against it (data integrity).
  app.delete("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.problem.findUnique({ where: { id }, select: { _count: { select: { solutions: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    if (existing._count.solutions > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have submitted to this problem. Unpublish instead of deleting." } });
    }
    await prisma.problem.delete({ where: { id } });
    return { success: true, data: { id } };
  });
}
