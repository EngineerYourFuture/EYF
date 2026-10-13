import { prisma, Verdict } from "@eyf/db";
import { submitToJudge0, getJudge0Result } from "./judge0.js";
import { onAcceptedSubmission } from "./gamification.js";
import { testSuiteHash } from "./test-suite.js";

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

/** Process one queued submission without starting a background worker. */
export async function judgeSubmission(submissionId: string): Promise<void> {
  const submission = await prisma.problemSolution.findUnique({
    where: { id: submissionId },
    include: { problem: { include: { testCases: { orderBy: { orderIndex: "asc" } } } } },
  });
  if (!submission) throw new Error(`No submission ${submissionId}`);

  // A completed job can be delivered again after a worker restart.
  if (submission.verdict !== Verdict.PENDING) return;

  const testCases = submission.problem.testCases;
  if (testCases.length === 0) {
    await prisma.problemSolution.updateMany({
      where: { id: submission.id, verdict: Verdict.PENDING },
      data: {
        verdict: Verdict.INTERNAL_ERROR,
        passedTests: 0,
        totalTests: 0,
        errorMsg: "This problem has no test cases yet. Choose another problem while its tests are prepared.",
      },
    });
    return; // Never accept or award XP for an untested submission.
  }
  const deadline = Date.now() + 60_000;
  let passed = 0;
  let firstFailure: { verdict: Verdict; stderr: string | null } | null = null;
  let maxRuntime = 0;
  let maxMemory = 0;

  for (const tc of testCases) {
    const token = await submitToJudge0({
      language: submission.language,
      // SQL fixtures and the query run inside the same isolated Judge0 database.
      // Never execute learner SQL against EYF's application database.
      sourceCode: submission.problem.executionMode === "SQL" ? `${tc.input}\n${submission.code}` : submission.code,
      stdin: submission.problem.executionMode === "SQL" ? undefined : tc.input,
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
      // A program can echo stdin to stderr. Never return that output for hidden
      // cases or a student could extract the private bank through failed runs.
      const error = failureOutput(result, tc.isPublic, submission.problem.executionMode === "SQL");
      firstFailure = { verdict: result.verdict, stderr: error };
      break; // fail-fast on first wrong/error
    }
  }

  // Atomically finalize the verdict. Only the run that transitions the row OUT
  // of PENDING performs the one-time side effects (problem counters + XP/badges).
  // The judge queue retries (attempts: 3), so without this gate a job that threw
  // AFTER these writes — e.g. a transient error in badge evaluation — would re-run
  // on retry and double-count submissions / double-award XP. A retry now sees the
  // row already finalized (count === 0) and skips the side effects.
  const finalized = await prisma.problemSolution.updateMany({
    where: { id: submission.id, verdict: Verdict.PENDING },
    data: {
      verdict: firstFailure?.verdict ?? Verdict.ACCEPTED,
      runtimeMs: maxRuntime || null,
      memoryKb: maxMemory || null,
      passedTests: passed,
      totalTests: testCases.length,
      testSuiteHash: testSuiteHash(testCases),
      errorMsg: firstFailure?.stderr ?? null,
    },
  });
  if (finalized.count === 0) return; // already judged by an earlier run — don't re-apply side effects

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
}

function failureOutput(result: Awaited<ReturnType<typeof getJudge0Result>>, isPublic: boolean, isSql: boolean) {
  if (isPublic || (result.verdict === Verdict.COMPILE_ERROR && !isSql)) return result.stderr ?? result.compileOutput;
  return "A hidden test did not pass.";
}
