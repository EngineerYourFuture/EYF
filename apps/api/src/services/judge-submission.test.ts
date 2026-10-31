import { beforeEach, describe, expect, it, vi } from "vitest";
import { Verdict } from "@eyf/db";
import { judgeSubmission } from "./judge-submission.js";
import { testSuiteHash } from "./test-suite.js";

const mocks = vi.hoisted(() => ({
  find: vi.fn(), finalize: vi.fn(), counters: vi.fn(), submit: vi.fn(), result: vi.fn(), award: vi.fn(),
}));
vi.mock("@eyf/db", async (original) => ({
  ...await original<typeof import("@eyf/db")>(),
  prisma: { problemSolution: { findUnique: mocks.find, updateMany: mocks.finalize }, problem: { update: mocks.counters } },
}));
vi.mock("./judge0.js", () => ({ submitToJudge0: mocks.submit, getJudge0Result: mocks.result }));
vi.mock("./gamification.js", () => ({ onAcceptedSubmission: mocks.award }));

const testCases = [{ input: "2 3", expected: "5", isPublic: true }, { input: "-2 2", expected: "0", isPublic: false }];
const submission = (tests = testCases, verdict: string = Verdict.PENDING) => ({
  id: "submission", problemId: "problem", verdict, code: "program", language: "PYTHON",
  problem: { testCases: tests, timeLimitMs: 2000, memoryLimitKb: 262144 },
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue(submission());
  mocks.finalize.mockResolvedValue({ count: 1 });
  mocks.submit.mockResolvedValue("token");
  mocks.result.mockResolvedValue({ verdict: Verdict.ACCEPTED, finished: true, runtimeMs: 10, memoryKb: 1024 });
});

describe("code judging integrity", () => {
  it("runs SQL setup and learner query together only in the remote sandbox", async () => {
    const s = submission([{ input: "CREATE TABLE n(v INT); INSERT INTO n VALUES(42);", expected: "42", isPublic: true }]);
    mocks.find.mockResolvedValue({ ...s, language: "SQL", code: "SELECT v FROM n;", problem: { ...s.problem, executionMode: "SQL" } });
    await judgeSubmission("submission");
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ language: "SQL", sourceCode: "CREATE TABLE n(v INT); INSERT INTO n VALUES(42);\nSELECT v FROM n;", stdin: undefined, expectedOutput: "42" }));
  });
  it("redacts hidden SQL fixtures even when the provider reports a compile error", async () => {
    const s = submission([{ input: "hidden SQL fixture", expected: "42", isPublic: false }]);
    mocks.find.mockResolvedValue({ ...s, language: "SQL", problem: { ...s.problem, executionMode: "SQL" } });
    mocks.result.mockResolvedValue({ verdict: Verdict.COMPILE_ERROR, finished: true, compileOutput: "hidden SQL fixture" });
    await judgeSubmission("submission");
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ errorMsg: "A hidden test did not pass." }) }));
  });
  it("marks a problem without tests unavailable, without executing or rewarding it", async () => {
    mocks.find.mockResolvedValue(submission([]));
    await judgeSubmission("submission");
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verdict: Verdict.INTERNAL_ERROR, totalTests: 0, passedTests: 0 }),
    }));
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.counters).not.toHaveBeenCalled();
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it("accepts only after every test passes and awards progress once", async () => {
    await judgeSubmission("submission");
    expect(mocks.submit).toHaveBeenCalledTimes(2);
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verdict: Verdict.ACCEPTED, totalTests: 2, passedTests: 2, testSuiteHash: testSuiteHash(testCases) }),
    }));
    expect(mocks.award).toHaveBeenCalledOnce();
    expect(mocks.award).toHaveBeenCalledWith("submission");
  });

  it("rejects a wrong answer without awarding progress", async () => {
    mocks.result.mockResolvedValueOnce({ verdict: Verdict.WRONG_ANSWER, finished: true });
    await judgeSubmission("submission");
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verdict: Verdict.WRONG_ANSWER, passedTests: 0 }),
    }));
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it("does not execute an already completed submission again", async () => {
    mocks.find.mockResolvedValue(submission(testCases, Verdict.ACCEPTED));
    await judgeSubmission("submission");
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it("does not leak a hidden input echoed through runtime errors", async () => {
    mocks.result
      .mockResolvedValueOnce({ verdict: Verdict.ACCEPTED, finished: true })
      .mockResolvedValueOnce({ verdict: Verdict.RUNTIME_ERROR, finished: true, stderr: "private stdin: -2 2" });
    await judgeSubmission("submission");
    const saved = mocks.finalize.mock.calls[0]![0].data;
    expect(saved.verdict).toBe(Verdict.RUNTIME_ERROR);
    expect(saved.errorMsg).toBe("A hidden test did not pass.");
    expect(saved.errorMsg).not.toContain("-2 2");
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it("does not reward a submission finalized concurrently by another worker", async () => {
    mocks.finalize.mockResolvedValue({ count: 0 });
    await judgeSubmission("submission");
    expect(mocks.counters).not.toHaveBeenCalled();
    expect(mocks.award).not.toHaveBeenCalled();
  });

  it("leaves service failures for queue retries instead of accepting the code", async () => {
    mocks.submit.mockRejectedValue(new Error("judge offline"));
    await expect(judgeSubmission("submission")).rejects.toThrow("judge offline");
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.award).not.toHaveBeenCalled();
  });
});
