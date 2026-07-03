import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { pickQuestions, ASSESSMENT_BANK } from "../lib/assessment-bank.js";
import { scoreAssessment } from "../services/assessment.js";

const LEVELS = ["easy", "medium", "hard"] as const;
const adaptiveBody = z.object({
  seen: z.array(z.string()).max(30).default([]),
  level: z.number().int().min(0).max(2).default(1),
  current: z.object({ questionId: z.string(), choice: z.number().int().min(0).max(3) }).optional(),
});
const ADAPTIVE_N = 12;

const submitBody = z.object({
  answers: z.array(z.object({ questionId: z.string(), choice: z.number().int().min(0).max(3) })),
  durationSeconds: z.number().int().nonnegative(),
});

export async function assessmentRoutes(app: FastifyInstance) {
  // Adaptive diagnostic — questions harden on a correct answer, soften on a
  // wrong one, converging on the student's exact mastery boundary. Stateless:
  // the client passes what it has seen + the current level.
  app.post("/adaptive", { preHandler: app.requireAuth }, async (req) => {
    const body = adaptiveBody.parse(req.body);
    let level = body.level;
    let correct: boolean | null = null;
    let correctIndex: number | null = null;

    if (body.current) {
      const q = ASSESSMENT_BANK.find((x) => x.id === body.current!.questionId);
      if (q) {
        correct = q.correctIndex === body.current.choice;
        correctIndex = q.correctIndex;
        level = Math.max(0, Math.min(2, level + (correct ? 1 : -1)));
      }
    }

    const done = body.seen.length >= ADAPTIVE_N;
    let next: { id: string; topic: string; area: string; difficulty: string; prompt: string; choices: string[] } | null = null;
    if (!done) {
      // prefer the target level, fall back to the nearest with unseen questions
      for (const l of [level, level + 1, level - 1, level + 2, level - 2].filter((x) => x >= 0 && x <= 2)) {
        const pool = ASSESSMENT_BANK.filter((q) => q.difficulty === LEVELS[l] && !body.seen.includes(q.id));
        if (pool.length) {
          const p = pool[Math.floor(Math.random() * pool.length)]!;
          next = { id: p.id, topic: p.topic, area: p.area, difficulty: p.difficulty, prompt: p.prompt, choices: p.choices };
          break;
        }
      }
    }

    const finished = done || !next;
    const boundary = LEVELS[level];
    return {
      success: true,
      data: {
        correct, correctIndex, level, next,
        answered: body.seen.length + (body.current ? 1 : 0),
        total: ADAPTIVE_N,
        done: finished,
        boundary, // easy | medium | hard — where the student settles
      },
    };
  });

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
