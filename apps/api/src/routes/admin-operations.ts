import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { z } from "zod";
import { requirePermission } from "../middleware/permissions.js";
import { env } from "../env.js";
import { judgeAvailable } from "../services/judge-availability.js";
import { credentialStatus } from "../lib/configuration-status.js";

export async function adminOperationsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.requireAuth, requirePermission("view:analytics")] }, async (req, reply) => {
    reply.header("Cache-Control", "private, no-store");
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) }).parse(req.query);
    const now = new Date(), since = new Date(now.getTime() - days * 86_400_000);
    const started = { startedAt: { gte: since, lte: now }, user: { deletedAt: null } };
    const [sprints, practice, reviews, activity, usage, paid, content, dependencies, waiting] = await Promise.all([
      Promise.all([prisma.placementSprint.count({ where: started }), prisma.placementSprint.count({ where: { ...started, baselineCompletedAt: { not: null } } }), prisma.placementSprint.count({ where: { ...started, drillsCompletedAt: { not: null } } }), prisma.placementSprint.count({ where: { ...started, challengeCompletedAt: { not: null } } }), prisma.placementSprint.count({ where: { ...started, retestCompletedAt: { not: null } } })]),
      prisma.sprintPracticeRound.count({ where: { completedAt: { gte: since, lte: now }, sprint: { user: { deletedAt: null } } } }),
      Promise.all([prisma.sprintReview.count({ where: { revokedAt: null, reviewedAt: null } }), prisma.sprintReview.count({ where: { reviewedAt: { gte: since, lte: now } } })]),
      prisma.$queryRaw<{ active: bigint; returning: bigint }[]>`
        WITH events AS (
          SELECT "userId", "submittedAt" AS at FROM problem_solutions WHERE "submittedAt" >= ${since} AND "submittedAt" <= ${now}
          UNION ALL SELECT "userId", "completedAt" AS at FROM lms_lesson_progress WHERE "completedAt" >= ${since} AND "completedAt" <= ${now}
          UNION ALL SELECT s."userId", r."completedAt" AS at FROM sprint_practice_rounds r JOIN placement_sprints s ON s.id=r."sprintId" WHERE r."completedAt" >= ${since} AND r."completedAt" <= ${now}
          UNION ALL SELECT "userId", "startedAt" AS at FROM placement_sprints WHERE "startedAt" >= ${since} AND "startedAt" <= ${now}
          UNION ALL SELECT "userId", "baselineCompletedAt" AS at FROM placement_sprints WHERE "baselineCompletedAt" >= ${since} AND "baselineCompletedAt" <= ${now}
          UNION ALL SELECT "userId", "retestCompletedAt" AS at FROM placement_sprints WHERE "retestCompletedAt" >= ${since} AND "retestCompletedAt" <= ${now}
        ), learner_days AS (SELECT e."userId", COUNT(DISTINCT e.at::date) AS days FROM events e JOIN users u ON u.id=e."userId" WHERE u."deletedAt" IS NULL GROUP BY e."userId")
        SELECT COUNT(*) AS active, COUNT(*) FILTER (WHERE days >= 2) AS returning FROM learner_days`,
      prisma.providerUsage.groupBy({ by: ["provider", "model", "feature", "outcome"], where: { createdAt: { gte: since, lte: now } }, _count: { _all: true, estimatedUsd: true }, _sum: { inputTokens: true, outputTokens: true, cacheReadTokens: true, cacheWriteTokens: true, durationSeconds: true, estimatedUsd: true }, _avg: { latencyMs: true } }),
      prisma.invoice.aggregate({ where: { status: "paid", paidAt: { gte: since, lte: now } }, _sum: { amountInr: true }, _count: true }),
      Promise.all([prisma.problem.count({ where: { testCases: { none: {} } } }), prisma.problem.count({ where: { starterCode: { none: {} } } }), prisma.problem.count({ where: { editorial: null } }), prisma.course.count({ where: { published: true, lessons: { none: {} } } }), prisma.mcqBankQuestion.count({ where: { explanation: "" } })]),
      judgeAvailable(),
      prisma.problemSolution.count({ where: { verdict: "PENDING", submittedAt: { lt: new Date(now.getTime() - 5 * 60_000) } } }),
    ]);
    const providerRows = usage.map((u) => ({ provider: u.provider, model: u.model, feature: u.feature, outcome: u.outcome, requests: u._count._all, unpricedRequests: u._count._all - u._count.estimatedUsd, inputTokens: u._sum.inputTokens ?? 0, outputTokens: u._sum.outputTokens ?? 0, cacheReadTokens: u._sum.cacheReadTokens ?? 0, cacheWriteTokens: u._sum.cacheWriteTokens ?? 0, durationSeconds: u._sum.durationSeconds, estimatedUsd: u._sum.estimatedUsd, averageLatencyMs: Math.round(u._avg.latencyMs ?? 0) }));
    return { success: true, data: { days, generatedAt: now, since,
      sprintFunnel: ["Started", "Starting check", "Focused practice", "Practical passed", "Report completed"].map((label, i) => ({ label, count: sprints[i] })),
      learning: { activeLearners: Number(activity[0]?.active ?? 0), returningLearners: Number(activity[0]?.returning ?? 0), completedPracticeRounds: practice },
      support: { pendingReviews: reviews[0], completedReviews: reviews[1], submissionsWaitingOverFiveMinutes: waiting },
      providerUsage: providerRows, recordedRevenue: { currency: "INR", paidInvoiceAmount: paid._sum.amountInr ?? 0, paidInvoices: paid._count },
      contentGaps: ["Problems without tests", "Problems without starter code", "Problems without editorials", "Published courses without lessons", "MCQs without explanations"].map((label, i) => ({ label, count: content[i] })),
      services: [ { name: "Code execution", status: dependencies ? "reachable" : "unavailable", detail: "Judge API and EYF worker presence; a real submission smoke test is still required." }, ...[{ name: "Authentication", status: credentialStatus(env.CLERK_SECRET_KEY) }, { name: "AI interviews", status: credentialStatus(env.ANTHROPIC_API_KEY) }, { name: "Audio transcription", status: credentialStatus(env.OPENAI_API_KEY) }, { name: "Transactional email", status: credentialStatus(env.RESEND_API_KEY) }, { name: "Error monitoring", status: credentialStatus(env.SENTRY_DSN) }].map((s) => ({ name: s.name, status: s.status, detail: "Configuration presence only; this does not verify live delivery." })), { name: "Payments", status: env.BILLING_ENABLED ? "enabled" : "deferred", detail: env.BILLING_ENABLED ? "Check payment reconciliation before accepting customers." : "Preview access remains enabled. Integrate payments last." } ],
      definitions: { funnel: "Progress today of sprints started in the selected window. Later cohorts have had less time to complete.", returning: "Learners with recorded learning activity on at least two different UTC dates in this window. This is not a cohort retention rate.", cost: "Estimated API usage since tracking was installed, using configured contract rates. Unpriced or failed requests have unknown cost. Provider invoices remain authoritative; infrastructure, staffing and tax are excluded." },
    } };
  });
}
