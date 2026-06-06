import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CognitiveGame } from "@eyf/db";

const submitBody = z.object({
  game: z.nativeEnum(CognitiveGame),
  score: z.number().int().min(0),
  accuracyPct: z.number().min(0).max(100),
  tabSwitchCount: z.number().int().min(0).default(0),
  durationSeconds: z.number().int().min(0),
});

export async function cognitiveRoutes(app: FastifyInstance) {
  app.post("/sessions", { preHandler: app.requireAuth }, async (req) => {
    const body = submitBody.parse(req.body);
    // Anti-cheat: if user tab-switched >2 times, scale score down by 50%.
    const adjustedScore = body.tabSwitchCount > 2 ? Math.round(body.score * 0.5) : body.score;
    const session = await prisma.cognitiveSession.create({
      data: { userId: req.session!.id, ...body, score: adjustedScore },
    });
    return { success: true, data: session };
  });

  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const sessions = await prisma.cognitiveSession.findMany({
      where: { userId: req.session!.id },
      orderBy: { playedAt: "desc" },
      take: 50,
    });
    return { success: true, data: sessions };
  });

  app.get("/leaderboard/:game", async (req) => {
    const { game } = z.object({ game: z.nativeEnum(CognitiveGame) }).parse(req.params);
    const top = await prisma.cognitiveSession.findMany({
      where: { game },
      orderBy: { score: "desc" },
      take: 25,
      include: { user: { select: { name: true, college: true } } },
    });
    return { success: true, data: top.map((s, i) => ({ rank: i + 1, name: s.user.name, college: s.user.college, score: s.score, accuracyPct: s.accuracyPct })) };
  });
}
