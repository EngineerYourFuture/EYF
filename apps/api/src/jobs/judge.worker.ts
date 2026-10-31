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
import { judgeSubmission } from "../services/judge-submission.js";

export const judgeWorker = new Worker<{ submissionId: string }>(
  "judge",
  (job) => judgeSubmission(job.data.submissionId),
  { connection: redis, concurrency: 4 },
);

judgeWorker.on("failed", async (job, err) => {
  console.error(`[judge] job ${job?.id} failed:`, err);
  // Don't leave the submission PENDING forever — once retries are exhausted,
  // mark it INTERNAL_ERROR so the UI can show "judging failed, retry".
  if (job?.data.submissionId && isFinalFailure(job.attemptsMade, job.opts.attempts)) {
    // Only mark errored if judging never finalized (still PENDING). Guarding on
    // PENDING keeps a job that failed AFTER a real verdict was written (e.g. in
    // post-verdict badge eval) from clobbering that verdict with INTERNAL_ERROR.
    await prisma.problemSolution
      .updateMany({
        where: { id: job.data.submissionId, verdict: Verdict.PENDING },
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
