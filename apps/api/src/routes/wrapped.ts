import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { buildWrapped } from "../services/wrapped.js";
import { renderWrappedShare } from "../services/pdf.js";

export async function wrappedRoutes(app: FastifyInstance) {
  app.get("/me/:year", { preHandler: app.requireAuth }, async (req) => {
    const { year } = z.object({ year: z.coerce.number().int().min(2024).max(2099) }).parse(req.params);
    const data = await buildWrapped(req.session!.id, year);
    return { success: true, data };
  });

  app.get("/me/:year/share.pdf", { preHandler: app.requireAuth }, async (req, reply) => {
    const { year } = z.object({ year: z.coerce.number().int().min(2024).max(2099) }).parse(req.params);
    const [data, user] = await Promise.all([
      buildWrapped(req.session!.id, year),
      prisma.user.findUnique({ where: { id: req.session!.id }, select: { name: true } }),
    ]);
    const pdf = await renderWrappedShare({
      name: user?.name ?? "EYF Student",
      year: data.year,
      totalSolved: data.totalSolved,
      bestStreakDays: data.bestStreakDays,
      topPattern: data.topPattern,
      badgesEarned: data.badgesEarned,
      mockSessions: data.mockSessions,
      headline: data.headline,
    });
    return reply
      .header("content-type", "application/pdf")
      .header("content-disposition", `attachment; filename="eyf-wrapped-${data.year}.pdf"`)
      .send(pdf);
  });
}
