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
  const [profile, accepted, allSubs, latestAssessment, flashcards, reviews, mocks, resumes, projects, cognitive, mcqAttempts, commDrills, projectPrepCount] =
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
      prisma.mcqAttempt.findMany({ where: { userId }, select: { category: true, score: true } }),
      prisma.communicationDrill.findMany({ where: { userId }, select: { score: true } }),
      prisma.projectPrep.count({ where: { userId } }),
    ]);

  // Best MCQ score achieved in a given section (0 if never attempted).
  const mcqBest = (cat: "APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL") =>
    mcqAttempts.filter((a) => a.category === cat).reduce((m, a) => Math.max(m, a.score), 0);

  // ── Problem Solving / DSA ──────────────────────────────────────────
  const solvedCount = accepted.length;
  const acceptanceRate = allSubs > 0 ? solvedCount / allSubs : 0;
  const dsa = solvedCount === 0 ? 0
    : clamp(0.7 * clamp((solvedCount / 120) * 100) + 0.3 * acceptanceRate * 100);

  // ── Aptitude (assessment gap + brain games + timed MCQ tests) ───────
  const gap = (latestAssessment?.gapAnalysis ?? {}) as { dsa?: number; cs?: number; aptitude?: number };
  const cogAcc = mean(cognitive.map((c) => c.accuracyPct));
  const aptMcq = mean([mcqBest("APTITUDE"), mcqBest("LOGICAL")].filter((s) => s > 0));
  // Average of whichever signals the user has actually produced.
  const aptSignals = [
    ...(latestAssessment ? [gap.aptitude ?? 0] : []),
    ...(cognitive.length ? [cogAcc] : []),
    ...(aptMcq > 0 ? [aptMcq] : []),
  ];
  const aptitude = clamp(mean(aptSignals));

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
  const techMcq = mcqBest("TECHNICAL"); // core-CS MCQ signal, shared across subjects
  const subjectScore = (s: Subject) => {
    const total = totalBySubject.get(s) ?? 0;
    const progress = repsBySubject.get(s) ?? [];
    const srs = total > 0 ? (progress.reduce((a, b) => a + b, 0) / total) * 100 : 0;
    return clamp(0.7 * srs + 0.15 * (gap.cs ?? 0) + 0.15 * techMcq);
  };

  // ── Projects (build + interview-defence prep) ──────────────────────
  const completed = projects.filter((p) => p.status === "COMPLETED").length;
  const projectScore = clamp(((projects.length + completed * 0.5) / 2) * 100 + Math.min(8, projectPrepCount * 4));

  // ── Resume ─────────────────────────────────────────────────────────
  const bestAts = resumes.reduce((m, r) => Math.max(m, r.atsScore ?? 0), 0);

  // ── Communication (mocks + HR/spoken drills + verbal MCQ) ──────────
  const mockScores = mocks
    .map((m) => (m.feedback as { score?: number; overallScore?: number } | null))
    .map((f) => f?.overallScore ?? f?.score ?? 0)
    .filter((s) => s > 0);
  const drillScores = commDrills.map((d) => d.score).filter((s) => s > 0);
  const verbalMcq = mcqBest("VERBAL");
  const commQuality = mean([
    ...(mockScores.length ? [mean(mockScores)] : []),
    ...(drillScores.length ? [mean(drillScores)] : []),
    ...(verbalMcq > 0 ? [verbalMcq] : []),
  ]);
  const commVolume = clamp(((mocks.length + commDrills.length) / 6) * 100);
  const communication = commQuality > 0 ? clamp(0.7 * commQuality + 0.3 * commVolume) : 0;

  const dimensions: SkillDimension[] = [
    { key: "dsa", label: "Data Structures & Algorithms", group: "Problem Solving", score: dsa,
      detail: solvedCount ? `${solvedCount} solved · ${Math.round(acceptanceRate * 100)}% acceptance` : "No problems solved yet", href: "/problems" },
    { key: "aptitude", label: "Aptitude", group: "Problem Solving", score: aptitude,
      detail: aptMcq > 0 ? `MCQ tests + assessment + ${cognitive.length} brain games`
        : latestAssessment ? `Last assessment + ${cognitive.length} brain games`
        : cognitive.length ? `${cognitive.length} cognitive games`
        : "Take a test or assessment",
      href: aptMcq > 0 || latestAssessment ? "/mcq" : "/assessment" },
    ...(Object.keys(SUBJECT_LABEL) as Subject[]).map((s) => ({
      key: s.toLowerCase(), label: SUBJECT_LABEL[s], group: "Core CS" as SkillGroup, score: subjectScore(s),
      detail: (repsBySubject.get(s)?.length ?? 0) > 0 ? `${repsBySubject.get(s)!.length} cards reviewed` : "Start the flashcards", href: `/subjects/${s.toLowerCase()}`,
    })),
    { key: "projects", label: "Projects", group: "Career", score: projectScore,
      detail: projects.length ? `${projects.length} started · ${completed} shipped${projectPrepCount ? ` · ${projectPrepCount} prepped` : ""}` : "No projects started", href: "/projects" },
    { key: "resume", label: "Resume", group: "Career", score: clamp(bestAts),
      detail: bestAts ? `${bestAts}/100 ATS score` : "No resume scored yet", href: "/resume" },
    { key: "communication", label: "Communication", group: "Career", score: communication,
      detail: communication > 0
        ? `${mocks.length} mocks · ${commDrills.length} drills${verbalMcq > 0 ? " · verbal MCQ" : ""}`
        : "No mocks or drills yet",
      href: commDrills.length && !mocks.length ? "/communication" : "/mocks" },
  ];

  const overall = clamp(mean(dimensions.map((d) => d.score)));
  const ranked = [...dimensions].filter((d) => d.score > 0).sort((a, b) => b.score - a.score);
  const strongest = ranked.length ? ranked[0]!.label : null;
  const weakest = dimensions.reduce((lo, d) => (d.score < lo.score ? d : lo), dimensions[0]!);

  return { dimensions, overall, strongest, weakest: weakest?.label ?? null };
}
