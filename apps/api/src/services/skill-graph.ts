/**
 * Engineering Skill Graph — spec PROBLEM #2. Fuses every signal in EYF into a
 * mastery % across the dimensions a placement actually tests: DSA, Aptitude,
 * the four core CS subjects, Projects, Resume, and Communication. This is the
 * "visibility into weaknesses" layer — one honest map of where the user stands.
 *
 * Server-side so it can read assessment gap analysis + per-subject flashcard
 * SRS progress directly. Pure-ish (only DB reads), deterministic output shape.
 */
import { prisma, Verdict, Subject } from "@eyf/db";

export type SkillGroup = "Problem Solving" | "Core CS" | "Career";

export type SkillDimension = {
  key: string;
  label: string;
  group: SkillGroup;
  score: number;   // 0..100 mastery
  detail: string;  // human one-liner on the current state
  href: string;    // where to go to improve it
};

export type SkillGraph = {
  dimensions: SkillDimension[];
  overall: number;
  strongest: string | null;
  weakest: string | null;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const SUBJECT_LABEL: Record<Subject, string> = {
  OS: "Operating Systems",
  DBMS: "DBMS",
  CN: "Computer Networks",
  OOP: "OOP",
};

export async function computeSkillGraph(userId: string): Promise<SkillGraph> {
  const [profile, accepted, allSubs, latestAssessment, flashcards, reviews, mocks, resumes, projects, cognitive] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.problemSolution.findMany({
        where: { userId, verdict: Verdict.ACCEPTED }, distinct: ["problemId"],
        select: { problem: { select: { difficulty: true } } },
      }),
      prisma.problemSolution.count({ where: { userId } }),
      prisma.assessmentSession.findFirst({ where: { userId }, orderBy: { completedAt: "desc" } }),
      prisma.flashcard.groupBy({ by: ["subject"], _count: true }),
      prisma.flashcardReview.findMany({
        where: { userId }, select: { repetitions: true, flashcard: { select: { subject: true } } },
      }),
      prisma.mockSession.findMany({ where: { candidateId: userId }, select: { feedback: true } }),
      prisma.resume.findMany({ where: { userId }, select: { atsScore: true } }),
      prisma.userProject.findMany({ where: { userId }, select: { status: true } }),
      prisma.cognitiveSession.findMany({ where: { userId }, select: { accuracyPct: true } }),
    ]);

  // ── Problem Solving / DSA ──────────────────────────────────────────
  const solvedCount = accepted.length;
  const acceptanceRate = allSubs > 0 ? solvedCount / allSubs : 0;
  const dsa = solvedCount === 0 ? 0
    : clamp(0.7 * clamp((solvedCount / 120) * 100) + 0.3 * acceptanceRate * 100);

  // ── Aptitude ───────────────────────────────────────────────────────
  const gap = (latestAssessment?.gapAnalysis ?? {}) as { dsa?: number; cs?: number; aptitude?: number };
  const cogAcc = mean(cognitive.map((c) => c.accuracyPct));
  const aptitude = clamp(
    latestAssessment && cognitive.length ? 0.6 * (gap.aptitude ?? 0) + 0.4 * cogAcc :
    latestAssessment ? (gap.aptitude ?? 0) :
    cognitive.length ? cogAcc : 0,
  );

  // ── Core CS subjects (per-subject SRS mastery, floored by assessment CS) ──
  const totalBySubject = new Map<Subject, number>();
  for (const row of flashcards) totalBySubject.set(row.subject, row._count);
  const repsBySubject = new Map<Subject, number[]>();
  for (const r of reviews) {
    const s = r.flashcard.subject;
    const arr = repsBySubject.get(s) ?? [];
    arr.push(Math.min(1, r.repetitions / 3)); // 3 clean reps ≈ locked in
    repsBySubject.set(s, arr);
  }
  const subjectScore = (s: Subject) => {
    const total = totalBySubject.get(s) ?? 0;
    const progress = repsBySubject.get(s) ?? [];
    const srs = total > 0 ? (progress.reduce((a, b) => a + b, 0) / total) * 100 : 0;
    return clamp(0.8 * srs + 0.2 * (gap.cs ?? 0));
  };

  // ── Projects ───────────────────────────────────────────────────────
  const completed = projects.filter((p) => p.status === "COMPLETED").length;
  const projectScore = clamp(((projects.length + completed * 0.5) / 2) * 100);

  // ── Resume ─────────────────────────────────────────────────────────
  const bestAts = resumes.reduce((m, r) => Math.max(m, r.atsScore ?? 0), 0);

  // ── Communication (mocks) ──────────────────────────────────────────
  const mockScores = mocks
    .map((m) => (m.feedback as { score?: number; overallScore?: number } | null))
    .map((f) => f?.overallScore ?? f?.score ?? 0)
    .filter((s) => s > 0);
  const communication = mockScores.length
    ? clamp(0.4 * clamp((mocks.length / 4) * 100) + 0.6 * mean(mockScores))
    : 0;

  const dimensions: SkillDimension[] = [
    { key: "dsa", label: "Data Structures & Algorithms", group: "Problem Solving", score: dsa,
      detail: solvedCount ? `${solvedCount} solved · ${Math.round(acceptanceRate * 100)}% acceptance` : "No problems solved yet", href: "/problems" },
    { key: "aptitude", label: "Aptitude", group: "Problem Solving", score: aptitude,
      detail: latestAssessment ? `Last assessment + ${cognitive.length} brain games` : cognitive.length ? `${cognitive.length} cognitive games` : "Take an assessment", href: "/assessment" },
    ...(Object.keys(SUBJECT_LABEL) as Subject[]).map((s) => ({
      key: s.toLowerCase(), label: SUBJECT_LABEL[s], group: "Core CS" as SkillGroup, score: subjectScore(s),
      detail: (repsBySubject.get(s)?.length ?? 0) > 0 ? `${repsBySubject.get(s)!.length} cards reviewed` : "Start the flashcards", href: `/subjects/${s.toLowerCase()}`,
    })),
    { key: "projects", label: "Projects", group: "Career", score: projectScore,
      detail: projects.length ? `${projects.length} started · ${completed} shipped` : "No projects started", href: "/projects" },
    { key: "resume", label: "Resume", group: "Career", score: clamp(bestAts),
      detail: bestAts ? `${bestAts}/100 ATS score` : "No resume scored yet", href: "/resume" },
    { key: "communication", label: "Communication", group: "Career", score: communication,
      detail: mockScores.length ? `${mocks.length} mocks · avg ${Math.round(mean(mockScores))}/100` : "No mock interviews yet", href: "/mocks" },
  ];

  const overall = clamp(mean(dimensions.map((d) => d.score)));
  const ranked = [...dimensions].filter((d) => d.score > 0).sort((a, b) => b.score - a.score);
  const strongest = ranked.length ? ranked[0]!.label : null;
  const weakest = dimensions.reduce((lo, d) => (d.score < lo.score ? d : lo), dimensions[0]!);

  return { dimensions, overall, strongest, weakest: weakest?.label ?? null };
}
