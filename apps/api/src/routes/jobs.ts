import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, JobRole, ApplicationStatus } from "@eyf/db";

const listQuery = z.object({
  role: z.nativeEnum(JobRole).optional(),
  remote: z.coerce.boolean().optional(),
  company: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function jobRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { role, remote, company, q, cursor, limit } = listQuery.parse(req.query);
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        ...(role && { role }),
        ...(remote !== undefined && { remote }),
        ...(company && { company: { contains: company, mode: "insensitive" } }),
        ...(q && {
          OR: [
            { title:    { contains: q, mode: "insensitive" } },
            { company:  { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { postedAt: "desc" },
    });
    const next = jobs.length > limit ? jobs.pop()!.id : null;
    return { success: true, data: jobs, meta: { cursor: next } };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });
    return { success: true, data: job };
  });

  // ── Personal tracker ────────────────────────────────────────────
  app.get("/me/applications", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.jobApplication.findMany({
      where: { userId: req.session!.id },
      include: { job: true },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: list };
  });

  app.post("/:slug/save", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });
    const created = await prisma.jobApplication.upsert({
      where: { userId_jobId: { userId: req.session!.id, jobId: job.id } },
      create: { userId: req.session!.id, jobId: job.id, status: ApplicationStatus.SAVED },
      update: {},
    });
    return { success: true, data: created };
  });

  app.patch("/me/applications/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      status: z.nativeEnum(ApplicationStatus).optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const owned = await prisma.jobApplication.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Application not found" } });
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === ApplicationStatus.APPLIED && { appliedAt: new Date() }),
      },
    });
    return { success: true, data: updated };
  });
}
