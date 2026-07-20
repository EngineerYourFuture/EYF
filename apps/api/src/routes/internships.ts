import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, InternshipStatus } from "@eyf/db";

export async function internshipRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { q, role, remote, cursor, limit } = z.object({
      q: z.string().optional(),
      role: z.string().optional(),
      remote: z.coerce.boolean().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(req.query);
    const list = await prisma.internship.findMany({
      where: {
        isActive: true,
        ...(role && { role: { contains: role, mode: "insensitive" } }),
        ...(remote !== undefined && { remote }),
        ...(q && {
          OR: [
            { company: { contains: q, mode: "insensitive" } },
            { role: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { postedAt: "desc" },
    });
    const next = list.length > limit ? list.pop()!.id : null;
    return { success: true, data: list, meta: { cursor: next } };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const i = await prisma.internship.findUnique({ where: { slug } });
    if (!i) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found" } });
    return { success: true, data: i };
  });

  app.get("/me/applications", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.userInternship.findMany({
      where: { userId: req.session!.id },
      include: { internship: true },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: list };
  });

  app.post("/:slug/save", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const i = await prisma.internship.findUnique({ where: { slug } });
    if (!i) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found" } });
    const created = await prisma.userInternship.upsert({
      where: { userId_internshipId: { userId: req.session!.id, internshipId: i.id } },
      create: { userId: req.session!.id, internshipId: i.id, status: InternshipStatus.SAVED },
      update: {},
    });
    return { success: true, data: created };
  });

  app.patch("/me/applications/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      status: z.nativeEnum(InternshipStatus).optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const owned = await prisma.userInternship.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Application not found" } });
    const updated = await prisma.userInternship.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === InternshipStatus.APPLIED && { appliedAt: new Date() }),
      },
    });
    return { success: true, data: updated };
  });
}
