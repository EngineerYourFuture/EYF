import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { pickQuestions } from "../lib/assessment-bank.js";
import { scoreAssessment } from "../services/assessment.js";

const submitBody = z.object({
  answers: z.array(z.object({ questionId: z.string(), choice: z.number().int().min(0).max(3) })),
  durationSeconds: z.number().int().nonnegative(),
});

export async function assessmentRoutes(app: FastifyInstance) {
  app.get("/start", { preHandler: app.requireAuth }, async () => {
    const questions = pickQuestions({}); // 12 + 4 + 4
    // Strip the answer key before sending to the client.
    const safe = questions.map(({ correctIndex: _c, explanation: _e, ...rest }) => rest);
    return { success: true, data: { questions: safe } };
  });

  app.post("/submit", { preHandler: app.requireAuth }, async (req) => {
    const { answers, durationSeconds } = submitBody.parse(req.body);
    const scored = scoreAssessment(answers);
    const session = await prisma.assessmentSession.create({
      data: {
        userId: req.session!.id,
        totalQuestions: scored.totalQuestions,
        correctAnswers: scored.correctAnswers,
        gapAnalysis: scored.gapAnalysis,
        placementProbability: scored.placementProbability,
        durationSeconds,
      },
    });
    return { success: true, data: { session, scored } };
  });

  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId: req.session!.id },
      orderBy: { completedAt: "desc" },
      take: 10,
    });
    return { success: true, data: sessions };
  });
}
