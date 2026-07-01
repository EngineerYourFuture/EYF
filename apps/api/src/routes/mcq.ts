import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, McqCategory } from "@eyf/db";
import {
  MCQ_CATEGORIES,
  mcqCompanies,
  mcqCount,
  pickTest,
} from "../lib/mcq-bank.js";
import { scoreMcq } from "../services/mcq.js";

/** Verbal + Technical sections and company-pattern filters are premium. */
const FREE_CATEGORIES = new Set(
  MCQ_CATEGORIES.filter((c) => c.free).map((c) => c.id),
);

function upgradeRequired(reply: import("fastify").FastifyReply, message: string) {
  return reply.code(402).send({
    success: false,
    error: { code: "PLAN_UPGRADE_REQUIRED", message, upgradeRequired: true, plan: "basic" },
  });
}

export async function mcqRoutes(app: FastifyInstance) {
  // Catalog — categories with live counts + available company filters. Public so
  // the config screen renders instantly.
  app.get("/catalog", async () => ({
    success: true,
    data: {
      categories: MCQ_CATEGORIES.map((c) => ({ ...c, count: mcqCount(c.id) })),
      companies: mcqCompanies(),
    },
  }));

  // Start a test — returns questions WITHOUT the correct answer.
  app.post("/start", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({
      category: z.nativeEnum(McqCategory),
      company: z.string().min(1).max(60).optional(),
      count: z.number().int().min(5).max(25).default(10),
    }).parse(req.body);

    const isFreePlan = req.session!.plan === "free";
    if (isFreePlan && !FREE_CATEGORIES.has(body.category)) {
      return upgradeRequired(reply, "Verbal and Technical sections are on Basic. Upgrade to unlock.");
    }
    if (isFreePlan && body.company) {
      return upgradeRequired(reply, "Company-specific tests are on Basic. Upgrade to target a company.");
    }

    const questions = pickTest(body).map((q) => ({
      id: q.id,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      prompt: q.prompt,
      choices: q.choices,
      companies: q.companies,
    }));

    if (questions.length === 0) {
      return reply.code(404).send({
        success: false,
        error: { code: "NO_QUESTIONS", message: "No questions available for that selection yet." },
      });
    }

    // ~72s per question is a realistic aptitude-test budget.
    return { success: true, data: { questions, suggestedSeconds: questions.length * 72 } };
  });

  // Submit answers — scores, persists the attempt, returns full review.
  app.post("/submit", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({
      category: z.nativeEnum(McqCategory),
      company: z.string().min(1).max(60).optional(),
      durationSeconds: z.number().int().min(0).max(7200),
      answers: z.array(z.object({
        questionId: z.string(),
        choice: z.number().int().min(-1).max(9),
      })).min(1).max(25),
    }).parse(req.body);

    const result = scoreMcq(body.answers);
    if (result.totalQuestions === 0) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_ANSWERS", message: "None of the submitted questions were recognised." },
      });
    }

    const attempt = await prisma.mcqAttempt.create({
      data: {
        userId: req.session!.id,
        category: body.category,
        company: body.company ?? null,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        score: result.score,
        durationSeconds: body.durationSeconds,
        detail: result.review.map((r) => ({
          questionId: r.questionId,
          chosen: r.chosen,
          correctIndex: r.correctIndex,
        })),
      },
    });

    return { success: true, data: { attemptId: attempt.id, ...result } };
  });

  // History — recent attempts for the streak/progress view.
  app.get("/history", { preHandler: app.requireAuth }, async (req) => {
    const attempts = await prisma.mcqAttempt.findMany({
      where: { userId: req.session!.id },
      orderBy: { completedAt: "desc" },
      take: 30,
      select: {
        id: true, category: true, company: true, totalQuestions: true,
        correctAnswers: true, score: true, durationSeconds: true, completedAt: true,
      },
    });
    const best: Partial<Record<string, number>> = {};
    for (const a of attempts) best[a.category] = Math.max(best[a.category] ?? 0, a.score);
    return { success: true, data: { attempts, bestByCategory: best } };
  });
}
