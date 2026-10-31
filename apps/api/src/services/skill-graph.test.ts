import { describe, it, expect } from "vitest";
import { skillGraphFrom, type SkillGraphInput } from "./skill-graph.js";

function input(over: Partial<SkillGraphInput> = {}): SkillGraphInput {
  return {
    accepted: [], allSubs: 0, latestAssessment: null, flashcards: [], reviews: [],
    mocks: [], resumes: [], projects: [], cognitive: [], mcqAttempts: [], commDrills: [],
    projectPrepCount: 0,
    ...over,
  };
}
const dimScore = (g: ReturnType<typeof skillGraphFrom>, key: string) =>
  g.dimensions.find((d) => d.key === key)!.score;

describe("skillGraphFrom — empty", () => {
  it("returns all 9 dimensions at score 0 with no strongest", () => {
    const g = skillGraphFrom(input());
    expect(g.dimensions.map((d) => d.key)).toEqual([
      "dsa", "aptitude", "os", "dbms", "cn", "oop", "projects", "resume", "communication",
    ]);
    expect(g.overall).toBe(0);
    expect(g.strongest).toBeNull();
    expect(g.weakest).not.toBeNull();
    expect(g.dimensions.every((d) => d.score === 0)).toBe(true);
  });
});

describe("skillGraphFrom — DSA", () => {
  it("scores DSA from solved count and acceptance rate", () => {
    const g = skillGraphFrom(input({
      accepted: Array.from({ length: 60 }, () => ({ problem: { difficulty: "MEDIUM" } })),
      allSubs: 100,
    }));
    expect(dimScore(g, "dsa")).toBeGreaterThan(0);
    expect(g.dimensions.find((d) => d.key === "dsa")!.detail).toContain("60 solved");
  });
});

describe("skillGraphFrom — aptitude signals", () => {
  it("uses whichever of assessment / cognitive / MCQ the user has", () => {
    const withMcq = skillGraphFrom(input({
      mcqAttempts: [{ category: "APTITUDE", score: 80 }, { category: "LOGICAL", score: 60 }],
    }));
    expect(dimScore(withMcq, "aptitude")).toBeGreaterThan(0);
    expect(withMcq.dimensions.find((d) => d.key === "aptitude")!.href).toBe("/mcq");

    const withGames = skillGraphFrom(input({ cognitive: [{ accuracyPct: 90 }] }));
    expect(dimScore(withGames, "aptitude")).toBe(90);
    expect(withGames.dimensions.find((d) => d.key === "aptitude")!.detail).toContain("cognitive games");
  });
});

describe("skillGraphFrom — core CS subjects", () => {
  it("scores a subject from SRS reps against its flashcard total", () => {
    const g = skillGraphFrom(input({
      flashcards: [{ subject: "OS", _count: 2 }],
      reviews: [
        { repetitions: 3, flashcard: { subject: "OS" } },
        { repetitions: 3, flashcard: { subject: "OS" } },
      ],
    }));
    expect(dimScore(g, "os")).toBeGreaterThan(0);
    expect(g.dimensions.find((d) => d.key === "os")!.detail).toContain("cards reviewed");
  });
});

describe("skillGraphFrom — career dimensions", () => {
  it("scores projects (started + shipped + prep) and resume from best ATS", () => {
    const g = skillGraphFrom(input({
      projects: [{ status: "COMPLETED" }, { status: "IN_PROGRESS" }],
      projectPrepCount: 1,
      resumes: [{ atsScore: 88 }, { atsScore: null }],
    }));
    expect(dimScore(g, "projects")).toBeGreaterThan(0);
    expect(dimScore(g, "resume")).toBe(88);
    expect(g.dimensions.find((d) => d.key === "resume")!.detail).toContain("88/100");
  });

  it("scores communication from mocks + drills + verbal MCQ", () => {
    const g = skillGraphFrom(input({
      mocks: [{ feedback: { overallScore: 70 } }],
      commDrills: [{ score: 60 }],
      mcqAttempts: [{ category: "VERBAL", score: 80 }],
    }));
    expect(dimScore(g, "communication")).toBeGreaterThan(0);
    expect(g.dimensions.find((d) => d.key === "communication")!.detail).toContain("verbal MCQ");
  });

  it("routes communication CTA to /communication when only drills exist", () => {
    const g = skillGraphFrom(input({ commDrills: [{ score: 60 }] }));
    expect(g.dimensions.find((d) => d.key === "communication")!.href).toBe("/communication");
  });
});

describe("skillGraphFrom — overall + strongest/weakest", () => {
  it("picks the highest-scoring dimension as strongest", () => {
    const g = skillGraphFrom(input({ resumes: [{ atsScore: 95 }] }));
    expect(g.strongest).toBe("Resume");
    expect(g.overall).toBeGreaterThan(0);
  });
});
