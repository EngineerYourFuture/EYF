/**
 * Judge0 worker.
 *
 * Pulls a submissionId off the "judge" queue, sends each test case to Judge0,
 * polls until verdict, then writes back the aggregate result.
 *
 * Run: pnpm --filter @eyf/api dev:worker
 */
import { Worker } from "bullmq";
import { prisma, Verdict } from "@eyf/db";
import { isFinalFailure } from "../lib/judge-retry.js";
import { redis } from "../lib/redis.js";
import { submitToJudge0, getJudge0Result } from "../services/judge0.js";
import { onAcceptedSubmission } from "../services/gamification.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollUntilDone(token: string, deadlineMs: number) {
  while (Date.now() < deadlineMs) {
    const result = await getJudge0Result(token);
    if (result.finished) return result;
    await sleep(500);
  }
  throw new Error(`Judge0 timeout for token ${token}`);
}

export const judgeWorker = new Worker<{ submissionId: string }>(
  "judge",
  async (job) => {
    const submission = await prisma.problemSolution.findUnique({
      where: { id: job.data.submissionId },
      include: { problem: { include: { testCases: true } } },
    });
    if (!submission) throw new Error(`No submission ${job.data.submissionId}`);

    const testCases = submission.problem.testCases;
    const deadline = Date.now() + 60_000;
    let passed = 0;
    let firstFailure: { verdict: Verdict; stderr: string | null } | null = null;
    let maxRuntime = 0;
    let maxMemory = 0;

    for (const tc of testCases) {
      const token = await submitToJudge0({
        language: submission.language,
        sourceCode: submission.code,
        stdin: tc.input,
        expectedOutput: tc.expected,
        timeLimitSeconds: Math.ceil(submission.problem.timeLimitMs / 1000),
        memoryLimitKb: submission.problem.memoryLimitKb,
      });
      const result = await pollUntilDone(token, deadline);
      maxRuntime = Math.max(maxRuntime, result.runtimeMs ?? 0);
      maxMemory  = Math.max(maxMemory,  result.memoryKb  ?? 0);
      if (result.verdict === Verdict.ACCEPTED) {
        passed += 1;
      } else if (!firstFailure) {
        firstFailure = { verdict: result.verdict, stderr: result.stderr ?? result.compileOutput };
        break; // fail-fast on first wrong/error
      }
    }

    await prisma.problemSolution.update({
      where: { id: submission.id },
      data: {
        verdict: firstFailure?.verdict ?? Verdict.ACCEPTED,
        runtimeMs: maxRuntime || null,
        memoryKb: maxMemory || null,
        passedTests: passed,
        totalTests: testCases.length,
        errorMsg: firstFailure?.stderr ?? null,
      },
    });

    if (!firstFailure) {
      await prisma.problem.update({
        where: { id: submission.problemId },
        data: {
          totalSubmissions: { increment: 1 },
          totalAccepted: { increment: 1 },
        },
      });
      await onAcceptedSubmission(submission.id);
    } else {
      await prisma.problem.update({
        where: { id: submission.problemId },
        data: { totalSubmissions: { increment: 1 } },
      });
    }
  },
  { connection: redis, concurrency: 4 },
);

judgeWorker.on("failed", async (job, err) => {
  console.error(`[judge] job ${job?.id} failed:`, err);
  // Don't leave the submission PENDING forever — once retries are exhausted,
  // mark it INTERNAL_ERROR so the UI can show "judging failed, retry".
  if (job?.data.submissionId && isFinalFailure(job.attemptsMade, job.opts.attempts)) {
    await prisma.problemSolution
      .update({
        where: { id: job.data.submissionId },
        data: { verdict: Verdict.INTERNAL_ERROR, errorMsg: "Judging failed — please retry." },
      })
      .catch((e) => console.error("[judge] failed to mark submission errored:", e));
  }
});

console.log("[judge] worker started");

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    console.log(`[judge] ${sig} received, draining…`);
    await judgeWorker.close();
    process.exit(0);
  });
}
