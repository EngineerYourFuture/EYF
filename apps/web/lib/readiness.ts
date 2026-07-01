/**
 * Placement Readiness — EYF's signature metric. Fuses signals from every
 * module into one 0–100 score, a per-pillar breakdown, and a prioritised
 * "do this next" list. This is the thing no single-purpose competitor can
 * compute, because they only own one slice of a student's prep.
 *
 * Pure + deterministic so it's trivial to reason about and test.
 */
import type { IconName } from "@/components/icons";

export type ReadinessInput = {
  totalSolved: number;
  acceptanceRate: number; // 0..1
  difficultyMix: { difficulty: string; count: number }[];
  mocks: { feedback: { overallScore: number } | null }[];
  resumes: { atsScore: number | null }[];
  projects: { status: string }[];
  streak: number;
  longestStreak: number;
  // Best MCQ score per section (0/absent = not attempted).
  mcqBest: Partial<Record<"APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL", number>>;
  // HR / spoken communication drill scores.
  commDrills: { score: number }[];
};

export type Pillar = {
  key: string;
  label: string;
  icon: IconName;
  score: number;   // 0..100
  weight: number;  // 0..1
  detail: string;  // human summary of current state
  href: string;
  action: string;  // CTA when this pillar is weak
};

export type Readiness = {
  overall: number;
  band: string;
  summary: string;
  pillars: Pillar[];
  nextActions: { label: string; detail: string; href: string; icon: IconName }[];
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Targets that roughly map to "campus-ready" for a typical tier-2/3 student.
const TARGET_SOLVED = 120;
const TARGET_MOCKS = 4;
const TARGET_PROJECTS = 2;
const TARGET_STREAK = 21;

export function computeReadiness(i: ReadinessInput): Readiness {
  // DSA — volume blended with quality, with a nudge for hard coverage.
  const solvedScore = clamp((i.totalSolved / TARGET_SOLVED) * 100);
  const hard = i.difficultyMix
    .filter((d) => d.difficulty === "HARD" || d.difficulty === "EXPERT")
    .reduce((a, d) => a + d.count, 0);
  const hardBonus = clamp((hard / 15) * 100);
  const dsa = i.totalSolved === 0 ? 0
    : clamp(0.6 * solvedScore + 0.25 * (i.acceptanceRate * 100) + 0.15 * hardBonus);

  // Interview practice — AI/peer mocks + HR/spoken communication drills.
  const mockCount = i.mocks.length;
  const avgMock = mean(i.mocks.map((m) => m.feedback?.overallScore ?? 0).filter((s) => s > 0));
  const drillScores = i.commDrills.map((d) => d.score).filter((s) => s > 0);
  const practiceCount = mockCount + i.commDrills.length;
  const practiceQuality = mean([
    ...(avgMock > 0 ? [avgMock] : []),
    ...(drillScores.length ? [mean(drillScores)] : []),
  ]);
  const interview = practiceCount === 0 ? 0
    : clamp(0.5 * clamp((practiceCount / TARGET_MOCKS) * 100) + 0.5 * practiceQuality);

  // Aptitude — timed MCQ tests (quant + logical reasoning).
  const aptScores = [i.mcqBest.APTITUDE, i.mcqBest.LOGICAL].filter((s): s is number => (s ?? 0) > 0);
  const aptitude = aptScores.length ? clamp(mean(aptScores)) : 0;

  // Resume — best ATS score the student has achieved.
  const bestAts = i.resumes.reduce((m, r) => Math.max(m, r.atsScore ?? 0), 0);
  const resume = clamp(bestAts);

  // Projects — count, with completed worth a touch more.
  const completed = i.projects.filter((p) => p.status === "COMPLETED").length;
  const projects = clamp(((i.projects.length + completed * 0.5) / TARGET_PROJECTS) * 100);

  // Consistency — sustained habit beats a one-off burst.
  const consistency = clamp(0.65 * clamp((i.longestStreak / TARGET_STREAK) * 100)
    + 0.35 * clamp((i.streak / 7) * 100));

  const pillars: Pillar[] = [
    { key: "dsa", label: "Problem Solving", icon: "code", score: dsa, weight: 0.30,
      detail: i.totalSolved ? `${i.totalSolved} solved · ${Math.round(i.acceptanceRate * 100)}% acceptance` : "No problems solved yet",
      href: "/problems", action: "Solve problems daily" },
    { key: "interview", label: "Interview Practice", icon: "mic", score: interview, weight: 0.20,
      detail: practiceCount ? `${mockCount} mock${mockCount === 1 ? "" : "s"} · ${i.commDrills.length} drill${i.commDrills.length === 1 ? "" : "s"}` : "No interview practice yet",
      href: mockCount || !i.commDrills.length ? "/mocks" : "/communication", action: "Do a mock or HR drill" },
    { key: "aptitude", label: "Aptitude", icon: "clipboard", score: aptitude, weight: 0.15,
      detail: aptScores.length ? `Best ${Math.round(Math.max(...aptScores))}% on MCQ tests` : "No aptitude tests taken",
      href: "/mcq", action: "Take timed aptitude tests" },
    { key: "resume", label: "Resume", icon: "doc", score: resume, weight: 0.13,
      detail: bestAts ? `${bestAts}/100 ATS score` : "No resume scored yet",
      href: "/resume", action: "Build & score your resume" },
    { key: "consistency", label: "Consistency", icon: "flame", score: consistency, weight: 0.12,
      detail: i.longestStreak ? `${i.streak}d streak · best ${i.longestStreak}d` : "No streak yet",
      href: "/dashboard", action: "Build a daily streak" },
    { key: "projects", label: "Projects", icon: "cube", score: projects, weight: 0.10,
      detail: i.projects.length ? `${i.projects.length} started · ${completed} shipped` : "No projects started",
      href: "/projects", action: "Ship a portfolio project" },
  ];

  const overall = clamp(pillars.reduce((a, p) => a + p.score * p.weight, 0));

  const band =
    overall < 35 ? "Just getting started" :
    overall < 60 ? "Building momentum" :
    overall < 80 ? "Getting interview-ready" :
    overall < 92 ? "Almost placement-ready" :
                   "Placement-ready";

  const summary =
    overall < 35 ? "Pick one track and start the daily loop — small, consistent reps compound fast." :
    overall < 60 ? "Solid base forming. Layer in mock interviews and keep the streak alive." :
    overall < 80 ? "You're interview-shaped. Sharpen weak patterns and polish your resume." :
    overall < 92 ? "Genuinely close. Close the last gaps below and you're drive-ready." :
                   "You're placement-ready. Keep sharp and start applying with confidence.";

  // Prioritise by how much each weak pillar drags the overall score.
  const nextActions = [...pillars]
    .filter((p) => p.score < 90)
    .sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))
    .slice(0, 3)
    .map((p) => ({ label: p.action, detail: p.detail, href: p.href, icon: p.icon }));

  return { overall, band, summary, pillars, nextActions };
}
