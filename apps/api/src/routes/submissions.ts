import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Language, Verdict } from "@eyf/db";
import { SUBMISSION_LIMITS, type Plan } from "@eyf/types";
import { judgeQueue } from "../jobs/queue.js";

const submitBody = z.object({
  problemSlug: z.string(),
  language: z.nativeEnum(Language),
  code: z.string().min(1).max(50_000),
});

export async function submissionRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      const { problemSlug, language, code } = submitBody.parse(req.body);
      const user = req.session!;

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const todayCount = await prisma.problemSolution.count({
        where: { userId: user.id, submittedAt: { gte: startOfDay } },
      });
      const cap = SUBMISSION_LIMITS[user.plan as Plan];
      if (todayCount >= cap) {
        // Free → suggest Basic (20/day); Basic → suggest Pro (unlimited).
        const nextPlan = user.plan === "free" ? "basic" : "pro";
        const nextBenefit = user.plan === "free" ? "20 submissions/day" : "unlimited submissions";
        return reply.code(402).send({
          success: false,
          error: {
            code: "SUBMISSION_LIMIT_EXCEEDED",
            message: `Daily limit reached (${todayCount}/${cap}). Upgrade to ${nextPlan === "basic" ? "Basic" : "Pro"} for ${nextBenefit}.`,
            upgradeRequired: true,
            plan: nextPlan,
          },
        });
      }

      const problem = await prisma.problem.findUnique({
        where: { slug: problemSlug },
        select: { id: true, premium: true },
      });
      if (!problem) {
        return reply.code(404).send({
          success: false,
          error: { code: "PROBLEM_NOT_FOUND", message: "No such problem." },
        });
      }
      if (problem.premium && user.plan === "free") {
        return reply.code(402).send({
          success: false,
          error: {
            code: "PREMIUM_PROBLEM",
            message: "This problem requires a paid plan.",
            upgradeRequired: true,
            plan: "basic",
          },
        });
      }

      const submission = await prisma.problemSolution.create({
        data: {
          problemId: problem.id,
          userId: user.id,
          language,
          code,
          verdict: Verdict.PENDING,
        },
        select: { id: true, verdict: true, submittedAt: true },
      });

      await judgeQueue.add(
        "judge",
        { submissionId: submission.id },
        { jobId: submission.id },
      );
      return reply.code(202).send({ success: true, data: submission });
    },
  );

  app.get(
    "/me",
    { preHandler: app.requireAuth },
    async (req) => {
      const submissions = await prisma.problemSolution.findMany({
        where: { userId: req.session!.id },
        orderBy: { submittedAt: "desc" },
        take: 50,
        include: { problem: { select: { slug: true, title: true, difficulty: true } } },
      });
      return { success: true, data: submissions };
    },
  );

  app.get(
    "/:id",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const submission = await prisma.problemSolution.findFirst({
        where: { id, userId: req.session!.id },
        include: { problem: { select: { slug: true, title: true, difficulty: true } } },
      });
      if (!submission) {
        return reply.code(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Submission not found." },
        });
      }
      return { success: true, data: submission };
    },
  );
}
