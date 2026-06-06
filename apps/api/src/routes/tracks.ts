import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";

export async function trackRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const tracks = await prisma.careerTrack.findMany({
      orderBy: [{ premium: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, tagline: true, icon: true, salaryMinInr: true, salaryMaxInr: true, demand: true, weeks: true, premium: true, companies: true },
    });
    return { success: true, data: tracks };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const track = await prisma.careerTrack.findUnique({ where: { slug } });
    if (!track) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Track not found" } });
    return { success: true, data: track };
  });

  app.get("/me/primary", { preHandler: app.requireAuth }, async (req) => {
    const t = await prisma.userTrack.findFirst({
      where: { userId: req.session!.id, isPrimary: true },
      include: { track: true },
    });
    return { success: true, data: t };
  });

  app.post("/:slug/choose", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const track = await prisma.careerTrack.findUnique({ where: { slug } });
    if (!track) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Track not found" } });
    await prisma.$transaction(async (tx) => {
      await tx.userTrack.updateMany({ where: { userId: req.session!.id }, data: { isPrimary: false } });
      await tx.userTrack.upsert({
        where: { userId_trackId: { userId: req.session!.id, trackId: track.id } },
        create: { userId: req.session!.id, trackId: track.id, isPrimary: true },
        update: { isPrimary: true },
      });
      await tx.user.update({
        where: { id: req.session!.id },
        data: { targetRole: track.slug },
      });
    });
    return { success: true, data: { trackSlug: slug } };
  });
}
