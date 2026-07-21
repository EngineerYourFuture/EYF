/**
 * Placement Readiness + Guidance — EYF's signature intelligence layer.
 *
 * Shared (web + api) and PURE so scoring is deterministic and unit-testable.
 * `computeReadiness` fuses every pillar signal into one 0-100 score + a per-
 * pillar breakdown. `rankActions` turns that breakdown into a prioritised,
 * explained "do this next" list — the deterministic core of the guidance
 * engine. The LLM never scores or ranks; it only phrases the top action
 * (see api guidance.ts). Icon is a plain string here; the web layer re-types
 * it to its IconName union at the boundary.
 */

export type ReadinessInput = {
  totalSolved: number;
  acceptanceRate: number; // 0..1
  difficultyMix: { difficulty: string; count: number }[];
  mocks: { feedback: { overallScore: number } | null }[];
  resumes: { atsScore: number | null }[];
  projects: { status: string }[];
  streak: number;
  longestStreak: number;
  mcqBest: Partial<Record<"APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL", number>>;
  commDrills: { score: number }[];
};

export type Pillar = {
  key: string;
  label: string;
  icon: string;
  score: number;   // 0..100
  weight: number;  // 0..1
  detail: string;
  href: string;
  action: string;
};

export type Readiness = {
  overall: number;
  band: string;
  summary: string;
  pillars: Pillar[];
  nextActions: { label: string; detail: string; href: string; icon: string }[];
};

/** A ranked, explained next-best-action — the deterministic guidance unit. */
export type GuidanceAction = {
  pillarKey: string;
  label: string;   // the CTA
  reason: string;  // deterministic "why this, why now"
  href: string;
  icon: string;
  score: number;   // current pillar score 0..100
  weight: number;  // pillar weight 0..1
  impact: number;  // weight * (100 - score): overall-score points unlocked by fixing it
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const TARGET_SOLVED = 120;
const TARGET_MOCKS = 4;
const TARGET_PROJECTS = 2;
const TARGET_STREAK = 21;

/**
 * The student's goal. Readiness is scored AGAINST this — a Product-SDE aspirant
 * and a service-company aspirant with identical stats get different scores AND
 * different next-best-actions, because different roles weight the pillars
 * differently. This is what no single-purpose competitor computes: "how ready
 * are you for YOUR target."
 */
export type ReadinessGoal = { targetRole?: string | null; targetCompany?: string | null };

type WeightSet = { dsa: number; interview: number; aptitude: number; resume: number; consistency: number; projects: number };

/**
 * Version stamp for the readiness algorithm. The Proof Loop freezes this onto every
 * PlacementOutcome snapshot so calibration NEVER correlates scores computed under
 * different WEIGHTS/formulas. BUMP THIS whenever WEIGHTS, the band thresholds, or the
 * `computeReadiness` formula change (e.g. "r2"). See docs/PLAN-proof-loop.md (H2).
 */
export const READINESS_ALGO_VERSION = "r1";

// Pillar weight profiles by goal archetype (each sums to 1.00).
const WEIGHTS: Record<string, WeightSet> = {
  //        dsa   interview aptitude resume consistency projects
  balanced:  { dsa: 0.30, interview: 0.20, aptitude: 0.15, resume: 0.13, consistency: 0.12, projects: 0.10 },
  product:   { dsa: 0.38, interview: 0.24, aptitude: 0.05, resume: 0.10, consistency: 0.13, projects: 0.10 }, // FAANG / product SDE — DSA + interviews dominate, aptitude barely matters
  service:   { dsa: 0.20, interview: 0.12, aptitude: 0.26, resume: 0.13, consistency: 0.14, projects: 0.15 }, // TCS / Infosys / Wipro — aptitude-gated, lighter DSA
  frontend:  { dsa: 0.24, interview: 0.20, aptitude: 0.05, resume: 0.12, consistency: 0.10, projects: 0.29 }, // frontend / full-stack — projects carry the interview
  data:      { dsa: 0.28, interview: 0.17, aptitude: 0.15, resume: 0.10, consistency: 0.12, projects: 0.18 }, // data / ML — DSA + projects
};

const PRODUCT_COMPANIES = ["amazon", "google", "microsoft", "meta", "flipkart", "adobe", "uber", "atlassian", "razorpay", "cred", "swiggy", "zomato", "phonepe", "navi", "juspay", "directi", "arcesium", "salesforce", "linkedin", "apple", "netflix", "nvidia", "goldman", "de shaw", "sprinklr", "zepto"];
const SERVICE_COMPANIES = ["tcs", "infosys", "wipro", "cognizant", "accenture", "capgemini", "techmahindra", "tech mahindra", "hcl", "deloitte", "ltimindtree", "mindtree", "mphasis", "dxc", "hexaware"];

/** Resolve the goal to a weight profile. Company tier wins over role text. */
function resolveProfile(goal?: ReadinessGoal): { key: string; weights: WeightSet } {
  const role = (goal?.targetRole ?? "").toLowerCase();
  const company = (goal?.targetCompany ?? "").toLowerCase();
  if (company && SERVICE_COMPANIES.some((c) => company.includes(c))) return { key: "service", weights: WEIGHTS.service! };
  if (company && PRODUCT_COMPANIES.some((c) => company.includes(c))) return { key: "product", weights: WEIGHTS.product! };
  if (/front|full.?stack|\bweb\b|react|\bui\b/.test(role)) return { key: "frontend", weights: WEIGHTS.frontend! };
  if (/data|\bml\b|\bai\b|analyst|scien/.test(role)) return { key: "data", weights: WEIGHTS.data! };
  if (/sde|software|backend|product/.test(role)) return { key: "product", weights: WEIGHTS.product! };
  return { key: "balanced", weights: WEIGHTS.balanced! };
}

const plural = (n: number) => (n === 1 ? "" : "s");

function readinessBand(overall: number): string {
  if (overall < 35) return "Just getting started";
  if (overall < 60) return "Building momentum";
  if (overall < 80) return "Getting interview-ready";
  if (overall < 92) return "Almost placement-ready";
  return "Placement-ready";
}

function readinessSummaryBase(overall: number): string {
  if (overall < 35) return "Pick one track and start the daily loop — small, consistent reps compound fast.";
  if (overall < 60) return "Solid base forming. Layer in mock interviews and keep the streak alive.";
  if (overall < 80) return "You're interview-shaped. Sharpen weak patterns and polish your resume.";
  if (overall < 92) return "Genuinely close. Close the last gaps below and you're drive-ready.";
  return "You're placement-ready. Keep sharp and start applying with confidence.";
}

export function computeReadiness(i: ReadinessInput, goal?: ReadinessGoal): Readiness {
  const { key: profileKey, weights: w } = resolveProfile(goal);
  const solvedScore = clamp((i.totalSolved / TARGET_SOLVED) * 100);
  const hard = i.difficultyMix
    .filter((d) => d.difficulty === "HARD" || d.difficulty === "EXPERT")
    .reduce((a, d) => a + d.count, 0);
  const hardBonus = clamp((hard / 15) * 100);
  const dsa = i.totalSolved === 0 ? 0
    : clamp(0.6 * solvedScore + 0.25 * (i.acceptanceRate * 100) + 0.15 * hardBonus);

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

  const aptScores = [i.mcqBest.APTITUDE, i.mcqBest.LOGICAL].filter((s): s is number => (s ?? 0) > 0);
  const aptitude = aptScores.length ? clamp(mean(aptScores)) : 0;

  const bestAts = i.resumes.reduce((m, r) => Math.max(m, r.atsScore ?? 0), 0);
  const resume = clamp(bestAts);

  const completed = i.projects.filter((p) => p.status === "COMPLETED").length;
  const projects = clamp(((i.projects.length + completed * 0.5) / TARGET_PROJECTS) * 100);

  const consistency = clamp(0.65 * clamp((i.longestStreak / TARGET_STREAK) * 100)
    + 0.35 * clamp((i.streak / 7) * 100));

  const pillars: Pillar[] = [
    { key: "dsa", label: "Problem Solving", icon: "code", score: dsa, weight: w.dsa,
      detail: i.totalSolved ? `${i.totalSolved} solved · ${Math.round(i.acceptanceRate * 100)}% acceptance` : "No problems solved yet",
      href: "/problems", action: "Solve problems daily" },
    { key: "interview", label: "Interview Practice", icon: "mic", score: interview, weight: w.interview,
      detail: practiceCount ? `${mockCount} mock${plural(mockCount)} · ${i.commDrills.length} drill${plural(i.commDrills.length)}` : "No interview practice yet",
      href: mockCount || !i.commDrills.length ? "/mocks" : "/communication", action: "Do a mock or HR drill" },
    { key: "aptitude", label: "Aptitude", icon: "clipboard", score: aptitude, weight: w.aptitude,
      detail: aptScores.length ? `Best ${Math.round(Math.max(...aptScores))}% on MCQ tests` : "No aptitude tests taken",
      href: "/mcq", action: "Take timed aptitude tests" },
    { key: "resume", label: "Resume", icon: "doc", score: resume, weight: w.resume,
      detail: bestAts ? `${bestAts}/100 ATS score` : "No resume scored yet",
      href: "/resume", action: "Build & score your resume" },
    { key: "consistency", label: "Consistency", icon: "flame", score: consistency, weight: w.consistency,
      detail: i.longestStreak ? `${i.streak}d streak · best ${i.longestStreak}d` : "No streak yet",
      href: "/dashboard", action: "Build a daily streak" },
    { key: "projects", label: "Projects", icon: "cube", score: projects, weight: w.projects,
      detail: i.projects.length ? `${i.projects.length} started · ${completed} shipped` : "No projects started",
      href: "/projects", action: "Ship a portfolio project" },
  ];

  const overall = clamp(pillars.reduce((a, p) => a + p.score * p.weight, 0));

  const band = readinessBand(overall);
  const base = readinessSummaryBase(overall);

  // Tell the student this score is tuned to their target — the differentiator.
  const goalTune: Record<string, string> = {
    product: "Scored for a product-SDE bar — DSA and interviews carry the most weight here.",
    service: "Scored for a service-company bar — aptitude and consistency carry the most weight here.",
    frontend: "Scored for a frontend/full-stack bar — shipped projects carry the most weight here.",
    data: "Scored for a data/ML bar — DSA and projects carry the most weight here.",
  };
  const summary = profileKey === "balanced" ? base : `${base} ${goalTune[profileKey]}`;

  const nextActions = [...pillars]
    .filter((p) => p.score < 90)
    .sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))
    .slice(0, 3)
    .map((p) => ({ label: p.action, detail: p.detail, href: p.href, icon: p.icon }));

  return { overall, band, summary, pillars, nextActions };
}

/**
 * Rank the pillars into an explained next-best-action list. Deterministic:
 * ordered by overall-score impact (weight x gap). A brand-new user (no signal
 * anywhere) gets a foundation-first ordering instead of "improve your 0s".
 * Returns [] when every pillar is already strong (>=90) — the "you're ready"
 * state the caller renders as "start applying".
 */
export function rankActions(r: Readiness, limit = 3): GuidanceAction[] {
  const anyProgress = r.pillars.some((p) => p.score > 0);
  const weak = r.pillars.filter((p) => p.score < 90);
  if (weak.length === 0) return [];

  const ranked = [...weak].sort(
    (a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score),
  );

  return ranked.slice(0, Math.max(1, limit)).map((p, idx) => {
    const impact = Math.round(p.weight * (100 - p.score));
    let reason: string;
    if (!anyProgress) reason = `Start here — ${p.label.toLowerCase()} is the foundation the rest compounds on.`;
    else if (idx === 0) reason = `Your biggest lever right now: ${p.label} is at ${p.score}/100 and carries ${Math.round(p.weight * 100)}% of your score. ${p.detail}.`;
    else reason = `Then ${p.label} (${p.score}/100). ${p.detail}.`;
    return {
      pillarKey: p.key,
      label: p.action,
      reason,
      href: p.href,
      icon: p.icon,
      score: p.score,
      weight: p.weight,
      impact,
    };
  });
}
