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

  // ── Peer percentile — the Cognitive Games differentiator. ──
  // Turns a solo score into a competitive signal: "faster than 82% of aspirants."
  // Percentile is computed from each player's BEST score per game.
  app.get("/percentile", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const rows = await prisma.cognitiveSession.groupBy({
      by: ["game", "userId"],
      _max: { score: true },
    });

    const byGame = new Map<CognitiveGame, { userId: string; best: number }[]>();
    for (const r of rows) {
      const arr = byGame.get(r.game) ?? [];
      arr.push({ userId: r.userId, best: r._max.score ?? 0 });
      byGame.set(r.game, arr);
    }

    const games: { game: CognitiveGame; best: number; players: number; percentile: number | null }[] = [];
    for (const [game, arr] of byGame) {
      const mine = arr.find((a) => a.userId === userId);
      if (!mine) continue;
      const players = arr.length;
      const beat = arr.filter((a) => a.best < mine.best).length;
      // "faster/better than X% of the OTHER players" (excludes self).
      const percentile = players > 1 ? Math.round((beat / (players - 1)) * 100) : null;
      games.push({ game, best: mine.best, players, percentile });
    }
    games.sort((a, b) => (b.percentile ?? -1) - (a.percentile ?? -1));

    const rated = games.filter((g) => g.percentile !== null);
    const overall = rated.length ? Math.round(rated.reduce((a, g) => a + (g.percentile ?? 0), 0) / rated.length) : null;
    return { success: true, data: { games, overall } };
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
