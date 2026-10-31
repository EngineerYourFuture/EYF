import { describe, it, expect } from "vitest";
import { Verdict } from "@eyf/db";
import { codeDnaFromSubmissions, type DnaSubmission } from "./code-dna.js";

// Minimal fixture builder — a submission with sensible defaults.
let seq = 0;
function sub(over: Partial<DnaSubmission> = {}): DnaSubmission {
  return {
    problemId: over.problemId ?? `p${seq++}`,
    verdict: over.verdict ?? Verdict.ACCEPTED,
    language: over.language ?? "PYTHON",
    runtimeMs: over.runtimeMs ?? null,
    submittedAt: over.submittedAt ?? new Date(2026, 0, 1, 0, seq),
    problem: over.problem ?? { difficulty: "MEDIUM", patterns: [] },
  };
}

describe("codeDnaFromSubmissions — empty", () => {
  it("returns zeroed defaults with no submissions", () => {
    const d = codeDnaFromSubmissions([]);
    expect(d.totalSubmissions).toBe(0);
    expect(d.acceptedCount).toBe(0);
    expect(d.acceptanceRate).toBe(0);
    expect(d.primaryLanguage).toBeNull();
    expect(d.languageMix).toEqual([]);
    expect(d.difficultyMix).toEqual([]);
    expect(d.patternStrengths).toEqual([]);
    expect(d.avgRuntimeMs).toBeNull();
    expect(d.fastestSolveMin).toBeNull();
    expect(d.firstTryRate).toBe(0);
    expect(d.avgAttemptsToSolve).toBe(0);
    expect(d.speedAccuracy).toBe("Solve a few more to read your style.");
    expect(d.habitFlags).toEqual([]);
  });
});

describe("codeDnaFromSubmissions — mixes & rates", () => {
  it("computes language mix sorted by count with primary language", () => {
    const d = codeDnaFromSubmissions([
      sub({ language: "PYTHON" }), sub({ language: "PYTHON" }), sub({ language: "JAVA" }),
    ]);
    expect(d.primaryLanguage).toBe("PYTHON");
    expect(d.languageMix[0]).toMatchObject({ language: "PYTHON", count: 2 });
    expect(d.languageMix[0]!.pct).toBeCloseTo(2 / 3);
    expect(d.acceptanceRate).toBe(1);
  });

  it("difficulty mix is computed over accepted only", () => {
    const d = codeDnaFromSubmissions([
      sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "HARD", patterns: [] } }),
      sub({ verdict: Verdict.WRONG_ANSWER, problem: { difficulty: "EASY", patterns: [] } }),
    ]);
    expect(d.acceptedCount).toBe(1);
    expect(d.difficultyMix).toEqual([{ difficulty: "HARD", count: 1, pct: 1 }]);
  });

  it("averages runtime and reports fastest solve in minutes over accepted", () => {
    const d = codeDnaFromSubmissions([
      sub({ verdict: Verdict.ACCEPTED, runtimeMs: 120_000 }),
      sub({ verdict: Verdict.ACCEPTED, runtimeMs: 60_000 }),
      sub({ verdict: Verdict.WRONG_ANSWER, runtimeMs: 5_000 }), // ignored (not accepted)
    ]);
    expect(d.avgRuntimeMs).toBe(90_000);
    expect(d.fastestSolveMin).toBe(1); // 60_000ms = 1 min
  });
});

describe("codeDnaFromSubmissions — patterns", () => {
  it("ranks strengths high→low and weaknesses low→high, ignoring one-offs", () => {
    const d = codeDnaFromSubmissions([
      // 'dp' 2 attempts, 2 accepted → rate 1
      sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "MEDIUM", patterns: ["dp"] } }),
      sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "MEDIUM", patterns: ["dp"] } }),
      // 'graphs' 2 attempts, 0 accepted → rate 0
      sub({ verdict: Verdict.WRONG_ANSWER, problem: { difficulty: "MEDIUM", patterns: ["graphs"] } }),
      sub({ verdict: Verdict.WRONG_ANSWER, problem: { difficulty: "MEDIUM", patterns: ["graphs"] } }),
      // 'trees' only 1 attempt → filtered out
      sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "MEDIUM", patterns: ["trees"] } }),
    ]);
    expect(d.patternStrengths[0]!.pattern).toBe("dp");
    expect(d.patternWeaknesses[0]!.pattern).toBe("graphs");
    expect(d.patternStrengths.map((p) => p.pattern)).not.toContain("trees");
  });
});

describe("codeDnaFromSubmissions — speedAccuracy branches", () => {
  const solved = (attemptsPerProblem: number[]) =>
    attemptsPerProblem.flatMap((n, pi) =>
      Array.from({ length: n }, (_, k) =>
        sub({ problemId: `sp${pi}`, verdict: k === n - 1 ? Verdict.ACCEPTED : Verdict.WRONG_ANSWER }),
      ));

  it("one-shot solver at ≤1.4 avg attempts", () => {
    const d = codeDnaFromSubmissions(solved([1, 1, 1]));
    expect(d.firstTryRate).toBe(1);
    expect(d.avgAttemptsToSolve).toBe(1);
    expect(d.speedAccuracy).toContain("One-shot solver");
  });

  it("fast-but-buggy when firstTryRate<0.35 and avgAttempts≥2.4", () => {
    const d = codeDnaFromSubmissions(solved([3, 3, 3])); // 0 first-try, 3 attempts each
    expect(d.firstTryRate).toBe(0);
    expect(d.avgAttemptsToSolve).toBe(3);
    expect(d.speedAccuracy).toContain("Fast but buggy");
  });

  it("iterates-to-correct at ≤2.2 avg attempts", () => {
    const d = codeDnaFromSubmissions(solved([2, 2, 1])); // avg (2+2+1)/3 ≈ 1.7
    expect(d.speedAccuracy).toContain("Iterates to correct");
  });

  it("brute-forces via retries above 2.2 when not flagged fast-but-buggy", () => {
    // two first-try solves keep firstTryRate ≥0.35 so it skips the buggy branch; avg > 2.2
    const d = codeDnaFromSubmissions(solved([1, 1, 5]));
    expect(d.firstTryRate).toBeGreaterThanOrEqual(0.35);
    expect(d.avgAttemptsToSolve).toBeGreaterThan(2.2);
    expect(d.speedAccuracy).toContain("Brute-forces");
  });
});

describe("codeDnaFromSubmissions — habit flags", () => {
  it("flags a low-acceptance grinder (≥50 subs, <40% accepted)", () => {
    const subs = [
      ...Array.from({ length: 40 }, () => sub({ verdict: Verdict.WRONG_ANSWER })),
      ...Array.from({ length: 15 }, () => sub({ verdict: Verdict.ACCEPTED })),
    ];
    expect(codeDnaFromSubmissions(subs).habitFlags).toContain("low-acceptance-grinder");
  });

  it("flags monolingual (≥20 subs, >85% one language)", () => {
    const subs = [
      ...Array.from({ length: 19 }, () => sub({ language: "PYTHON" })),
      sub({ language: "JAVA" }),
    ];
    expect(codeDnaFromSubmissions(subs).habitFlags).toContain("monolingual");
  });

  it("flags hard-leaner (≥5 accepted HARD) and easy-mode (>70% easy of ≥30 accepted)", () => {
    const hard = codeDnaFromSubmissions(
      Array.from({ length: 5 }, () => sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "HARD", patterns: [] } })),
    );
    expect(hard.habitFlags).toContain("hard-leaner");

    const easy = codeDnaFromSubmissions(
      Array.from({ length: 30 }, () => sub({ verdict: Verdict.ACCEPTED, problem: { difficulty: "EASY", patterns: [] } })),
    );
    expect(easy.habitFlags).toContain("easy-mode");
  });
});
