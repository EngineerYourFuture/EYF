import { Router, Request, Response } from "express";
import { checkJudge0Health } from "../lib/judge0";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/system/health
// Returns liveness of the database and Judge0 execution engine.
// Responds 200 when all services are ok, 503 when any are degraded/down.
// The frontend polls this on ProblemDetailPage mount to surface a banner
// before the user writes code against a non-functional execution engine.
router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  const [judge0Result, dbResult] = await Promise.allSettled([
    checkJudge0Health(),
    prisma.$queryRaw`SELECT 1`.then(() => true as const).catch(() => false as const),
  ]);

  const judge0 = judge0Result.status === "fulfilled"
    ? judge0Result.value
    : { status: "down" as const, latencyMs: -1 };

  const dbOk = dbResult.status === "fulfilled" ? dbResult.value : false;

  const overall = judge0.status === "ok" && dbOk ? "ok" : "degraded";

  res.status(overall === "ok" ? 200 : 503).json({
    status: overall,
    ts: new Date().toISOString(),
    services: {
      database:       dbOk ? "ok" : "down",
      judge0:         judge0.status,
      judge0LatencyMs: judge0.latencyMs,
      // Tells the frontend whether to show a self-hosted vs public-instance warning
      judge0Tier:     env.judge0ApiUrl === "https://api.judge0.com" ? "public" : "self-hosted",
    },
  });
});

export { router as systemRouter };
