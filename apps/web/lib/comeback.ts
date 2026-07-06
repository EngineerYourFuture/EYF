/**
 * Rejection Recovery — the comeback engine.
 *
 * The most dangerous moment in placement prep is the week after a rejection:
 * that's when students stop. No platform touches it. EYF can, because it
 * already knows the student's pillar scores AND every company's hiring bar —
 * so a rejection becomes a diagnosis ("your resume is 21 points under
 * Amazon's screen bar") plus a 14-day plan, plus proof they're already above
 * the bar elsewhere. Pure and deterministic: no AI key required.
 */
import type { Pillar } from "./readiness";
import {
  TIER_PROFILES,
  tierOf,
  companyReadiness,
  readinessBand,
  SPOTLIGHT_COMPANIES,
} from "./company-readiness";
import { companyLabel } from "./company";

export type RejectionStage = "APPLIED" | "OA" | "INTERVIEW";

export const STAGE_META: Record<RejectionStage, { label: string; short: string }> = {
  APPLIED: { label: "No shortlist / no callback", short: "the resume screen" },
  OA: { label: "Online assessment", short: "the online test" },
  INTERVIEW: { label: "Interview rounds", short: "the interviews" },
};

/** Which pillars typically kill each stage, most likely first. */
const STAGE_PILLARS: Record<RejectionStage, { key: string; why: string }[]> = {
  APPLIED: [
    { key: "resume", why: "Shortlisting is mostly an ATS + 6-second human scan — a resume under the bar means nobody ever saw the rest of you." },
    { key: "projects", why: "Screeners look for proof you build; a thin projects section reads as a thin candidate." },
  ],
  OA: [
    { key: "aptitude", why: "Most OAs gate on timed aptitude before your code is even judged." },
    { key: "dsa", why: "OA coding rewards pattern speed — accuracy under a clock, not eventual correctness." },
    { key: "consistency", why: "Test-day speed is built by daily reps; practice gaps surface as time pressure." },
  ],
  INTERVIEW: [
    { key: "interview", why: "Interviews score how you think aloud — structure and communication, not just the final answer." },
    { key: "dsa", why: "Follow-ups probe depth; memorised patterns crack at the first 'why?'." },
    { key: "projects", why: "'Walk me through your project' collapses when there's nothing deep to walk through." },
  ],
};

/** Concrete two-week remediations per pillar — every task deep-links a module. */
const PILLAR_FIX: Record<string, { week1: Task[]; week2: Task[] }> = {
  resume: {
    week1: [
      { label: "Re-score your resume and read the gap-to-target report", href: "/resume" },
      { label: "Rewrite your top 3 bullets with numbers (impact, scale, %)", href: "/resume" },
      { label: "Ship one measurable win to add — even a small one", href: "/projects" },
    ],
    week2: [
      { label: "Get your ATS score above the tier bar", href: "/resume" },
      { label: "Mirror the JD keywords for your target role", href: "/resume" },
    ],
  },
  projects: {
    week1: [
      { label: "Pick one project idea and start it today", href: "/projects" },
      { label: "Define the one metric your project will show (users, ms, rows)", href: "/projects" },
    ],
    week2: [
      { label: "Deploy it — a live URL beats ten repos", href: "/projects" },
      { label: "Write the 90-second walkthrough you'd give an interviewer", href: "/communication" },
    ],
  },
  aptitude: {
    week1: [
      { label: "One timed aptitude section every day", href: "/mcq" },
      { label: "Drill your weakest topic from the mistake review", href: "/mcq" },
    ],
    week2: [
      { label: "Run the full company sim, exact timing", href: "/mcq" },
      { label: "Repeat until you clear the sim twice in a row", href: "/mcq" },
    ],
  },
  dsa: {
    week1: [
      { label: "Solve your weakest pattern daily (adaptive next-rep)", href: "/problems" },
      { label: "Re-solve yesterday's problem from a blank editor", href: "/problems" },
    ],
    week2: [
      { label: "Timed sets in Pressure Mode — speed is the skill", href: "/pressure" },
      { label: "One blind-mode solve per day", href: "/problems" },
    ],
  },
  interview: {
    week1: [
      { label: "One AI mock now — get the rubric, not the vibes", href: "/mocks" },
      { label: "Record two HR drills; kill the filler words", href: "/communication" },
    ],
    week2: [
      { label: "One peer mock — a human across the table", href: "/peer-mocks" },
      { label: "Build 3 STAR stories you can tell in 90 seconds", href: "/communication" },
    ],
  },
  consistency: {
    week1: [
      { label: "Clear the Daily Mission every day this week", href: "/today" },
      { label: "Solve at the same hour daily — make it automatic", href: "/today" },
    ],
    week2: [
      { label: "Protect the streak — 14 straight days rewires test speed", href: "/today" },
    ],
  },
};

/** Stage-specific proof-it-worked task that closes week 2. */
const RETEST: Record<RejectionStage, Task> = {
  APPLIED: { label: "Re-score your resume — clear the bar before the next apply", href: "/resume" },
  OA: { label: "Sit the full company sim under exact timing — pass it twice", href: "/mcq" },
  INTERVIEW: { label: "Book an AI mock and beat your last rubric score", href: "/mocks" },
};

export type Task = { label: string; href: string };
export type ComebackCause = {
  pillarKey: string;
  pillarLabel: string;
  score: number;
  bar: number;
  gap: number;
  why: string;
  evidence: string;
};
export type ComebackWin = { slug: string; name: string; pct: number; band: string };
export type ComebackPlan = {
  companyName: string;
  tierLabel: string;
  stage: RejectionStage;
  reframe: string;
  causes: ComebackCause[]; // top 2 below-bar causes; empty = numbers were there
  week1: Task[];
  week2: Task[];
  wins: ComebackWin[]; // companies where the student is ALREADY above 70
};

export function companySlugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildComebackPlan(input: { stage: RejectionStage; companyName: string; pillars: Pillar[] }): ComebackPlan {
  const { stage, companyName, pillars } = input;
  const slug = companySlugFromName(companyName);
  const tier = tierOf(slug);
  const profile = TIER_PROFILES[tier];
  const score = (key: string) => pillars.find((p) => p.key === key)?.score ?? 0;
  const label = (key: string) => pillars.find((p) => p.key === key)?.label ?? key;
  const detail = (key: string) => pillars.find((p) => p.key === key)?.detail ?? "";

  // Diagnosis: stage-relevant pillars that sit BELOW this tier's bar, ranked
  // by (gap × stage priority). Deterministic and explainable.
  const candidates = STAGE_PILLARS[stage]
    .map((c, i) => {
      const bar = profile.bar[c.key as keyof typeof profile.bar] ?? 60;
      const s = score(c.key);
      return { ...c, bar, score: s, gap: bar - s, priority: 1 - i * 0.25 };
    })
    .filter((c) => c.gap > 0)
    .sort((a, b) => b.gap * b.priority - a.gap * a.priority);

  const causes: ComebackCause[] = candidates.slice(0, 2).map((c) => ({
    pillarKey: c.key,
    pillarLabel: label(c.key),
    score: c.score,
    bar: c.bar,
    gap: c.gap,
    why: c.why,
    evidence: detail(c.key),
  }));

  // 14-day plan: week 1 attacks cause #1, week 2 attacks cause #2 (or
  // reinforces #1) and always ends with the stage's re-test.
  const fix1 = causes[0] ? PILLAR_FIX[causes[0].pillarKey] : undefined;
  const fix2 = causes[1] ? PILLAR_FIX[causes[1].pillarKey] : undefined;
  const week1 = fix1?.week1 ?? [
    { label: "Keep your daily loop — your numbers were above this bar", href: "/today" },
    { label: "Apply to 5 more companies this week — widen the funnel", href: "/jobs" },
  ];
  const week2 = [...(fix2?.week1 ?? fix1?.week2 ?? []), RETEST[stage]];

  // Confidence restore: companies where they're ALREADY in contention.
  const wins: ComebackWin[] = SPOTLIGHT_COMPANIES
    .filter((s) => s !== slug)
    .map((s) => {
      const pct = companyReadiness(pillars, tierOf(s));
      return { slug: s, name: companyLabel(s), pct, band: readinessBand(pct).label };
    })
    .filter((w) => w.pct >= 70)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const reframe = causes.length === 0
    ? `Your numbers clear ${companyName}'s ${profile.label.toLowerCase()} bar — this one came down to funnel math, not ability. The fix is volume, not rebuilding.`
    : `${companyName} filters at ${STAGE_META[stage].short} on exactly the thing your data flags. That's not a verdict on you — it's a 14-day work order.`;

  return { companyName, tierLabel: profile.label, stage, reframe, causes, week1, week2, wins };
}

// ── Stage memory (which stage an application died at) ─────────────────
const STAGE_KEY = "eyf-rejection-stages";

export function rememberRejectionStage(appId: string, stage: RejectionStage) {
  try {
    const map = JSON.parse(localStorage.getItem(STAGE_KEY) ?? "{}") as Record<string, RejectionStage>;
    map[appId] = stage;
    localStorage.setItem(STAGE_KEY, JSON.stringify(map));
  } catch { /* private mode */ }
}

export function recalledRejectionStage(appId: string): RejectionStage | null {
  try {
    const map = JSON.parse(localStorage.getItem(STAGE_KEY) ?? "{}") as Record<string, RejectionStage>;
    const s = map[appId];
    return s === "APPLIED" || s === "OA" || s === "INTERVIEW" ? s : null;
  } catch {
    return null;
  }
}
