/**
 * Personalized Roadmap Engine — spec PROBLEM #1. Generates a week-by-week plan
 * from the user's target role, target company, timeline, and — crucially —
 * their live Skill Graph, so weak areas are remediated first and the difficulty
 * arc is calibrated to the company's hiring bar. Deterministic; pure synthesis
 * over real EYF modules (problems, subjects, mocks, resume, projects, company prep).
 */
import { prisma } from "@eyf/db";
import { computeSkillGraph, type SkillDimension } from "./skill-graph.js";

type Tier = "service" | "mass" | "product" | "elite";

const COMPANY_TIER: Record<string, Tier> = {
  tcs: "service", infosys: "service", wipro: "service", accenture: "service",
  cognizant: "service", capgemini: "service", techmahindra: "service", hcl: "service", deloitte: "service",
  flipkart: "mass", zomato: "mass", swiggy: "mass", paytm: "mass", phonepe: "mass",
  groww: "mass", razorpay: "mass", cred: "mass", oracle: "mass", sap: "mass", ibm: "mass", samsung: "mass",
  microsoft: "product", adobe: "product", uber: "product", atlassian: "product",
  salesforce: "product", linkedin: "product", walmart: "product", visa: "product", paypal: "product",
  amazon: "elite", google: "elite", meta: "elite", netflix: "elite", apple: "elite", deshaw: "elite",
};
const TIER_LABEL: Record<Tier, string> = {
  service: "service-based", mass: "product (mass-hire)", product: "product", elite: "top-tier",
};
const tierOf = (slug?: string | null): Tier => (slug ? COMPANY_TIER[slug] ?? "mass" : "mass");

export type RoadmapTask = { area: string; label: string; detail: string; href: string };
export type RoadmapWeek = { week: number; phase: "Foundation" | "Depth" | "Interview"; theme: string; tasks: RoadmapTask[]; milestone: string };
export type GeneratedPlan = {
  title: string;
  targetRole: string;
  targetCompany: string | null;
  tier: Tier;
  weeks: number;
  hoursPerDay: number;
  summary: string;
  focusAreas: string[];
  plan: RoadmapWeek[];
};

export type GenerateInput = {
  trackSlug: string;
  targetCompany?: string | null;
  weeks: number;     // 4..24
  hoursPerDay: number; // 1..8
};

const SUBJECT_HREF: Record<string, string> = { os: "/subjects/os", dbms: "/subjects/dbms", cn: "/subjects/cn", oop: "/subjects/oop" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function generateRoadmap(userId: string, input: GenerateInput): Promise<GeneratedPlan> {
  const [graph, track] = await Promise.all([
    computeSkillGraph(userId),
    prisma.careerTrack.findUnique({ where: { slug: input.trackSlug } }),
  ]);
  const roleName = track?.name ?? cap(input.trackSlug);
  const tier = tierOf(input.targetCompany);
  const weeks = Math.max(4, Math.min(24, Math.round(input.weeks)));

  // Weakest dimensions first — these drive what gets remediated, and when.
  const ranked = [...graph.dimensions].sort((a, b) => a.score - b.score);
  const weak = ranked.filter((d) => d.score < 60);
  const focusAreas = ranked.slice(0, 3).map((d) => d.label);

  // Phase split: foundation (remediate) → depth (role + harder DSA) → interview.
  const foundationWeeks = Math.max(1, Math.round(weeks * 0.4));
  const interviewWeeks = Math.max(1, Math.round(weeks * 0.25));
  const depthWeeks = Math.max(1, weeks - foundationWeeks - interviewWeeks);

  const rolePatterns = (track?.patterns ?? []).filter(Boolean);
  const dsaPatterns = ["arrays-hashing", "two-pointers", "sliding-window", "binary-search", "stack", "linked-list", "trees", "graphs", "dynamic-programming", "greedy"];

  const plan: RoadmapWeek[] = [];
  let w = 1;

  // ── FOUNDATION ─────────────────────────────────────────────────────
  // Cycle through the weakest areas, giving each a focused remediation week.
  const remediation = buildRemediationQueue(weak, foundationWeeks);
  for (let i = 0; i < foundationWeeks; i++) {
    const r = remediation[i % remediation.length]!;
    const pattern = dsaPatterns[i % dsaPatterns.length]!;
    const tasks: RoadmapTask[] = [
      { area: "DSA", label: `Master the ${pattern.replace(/-/g, " ")} pattern`, detail: `Solve 6–8 problems on ${pattern.replace(/-/g, " ")}`, href: `/problems?pattern=${pattern}` },
      r.task,
    ];
    if (tier === "service" || tier === "mass") {
      tasks.push({ area: "Aptitude", label: "Timed aptitude drill", detail: "20 min quant + logical, daily", href: "/games" });
    }
    plan.push({
      week: w++, phase: "Foundation", theme: r.theme,
      tasks, milestone: r.milestone,
    });
  }

  // ── DEPTH ──────────────────────────────────────────────────────────
  const harder = ["dynamic-programming", "graphs", "backtracking", "intervals", "tries", "heap"];
  for (let i = 0; i < depthWeeks; i++) {
    const focus = track?.curriculum && Array.isArray(track.curriculum)
      ? ((track.curriculum as { focus?: string }[])[i]?.focus ?? null) : null;
    const pat = harder[i % harder.length]!;
    const tasks: RoadmapTask[] = [
      { area: "DSA", label: `Advanced: ${pat.replace(/-/g, " ")}`, detail: `Medium→Hard set on ${pat.replace(/-/g, " ")}`, href: `/problems?pattern=${pat}` },
    ];
    if (focus) {
      tasks.push({ area: roleName, label: focus, detail: `Role-specific: ${focus}`, href: `/tracks/${input.trackSlug}` });
    } else if (rolePatterns[i % Math.max(1, rolePatterns.length)]) {
      const rp = rolePatterns[i % rolePatterns.length]!;
      tasks.push({ area: roleName, label: cap(rp), detail: `${roleName} core: ${rp}`, href: `/tracks/${input.trackSlug}` });
    }
    if (i === Math.floor(depthWeeks / 2)) {
      tasks.push({ area: "Projects", label: "Ship a portfolio project", detail: "Start a resume-worthy build", href: "/projects" });
    }
    if (tier === "product" || tier === "elite") {
      tasks.push({ area: "System Design", label: "System design primer", detail: "One design concept + a mock prompt", href: "/mocks" });
    }
    plan.push({
      week: w++, phase: "Depth", theme: focus ? `${roleName}: ${focus}` : `${roleName} depth + hard DSA`,
      tasks, milestone: i === Math.floor(depthWeeks / 2) ? "First portfolio project underway" : `Clear 10 medium/hard problems`,
    });
  }

  // ── INTERVIEW ──────────────────────────────────────────────────────
  for (let i = 0; i < interviewWeeks; i++) {
    const tasks: RoadmapTask[] = [];
    const first = i === 0, last = i === interviewWeeks - 1;
    if (first) {
      tasks.push({ area: "Resume", label: "ATS-score your resume", detail: "Hit 80+ and fix missing keywords", href: "/resume" });
      tasks.push({ area: "Mocks", label: "First AI mock interview", detail: "Baseline your interview readiness", href: "/mocks" });
    } else if (last) {
      tasks.push({ area: "Mocks", label: "Final mock + retro", detail: "Full loop simulation; review the recording", href: "/mocks" });
      tasks.push({ area: "Apply", label: "Open your application pipeline", detail: "Start applying with confidence", href: "/pipeline" });
    } else {
      tasks.push({ area: "Mocks", label: "Weekly mock interview", detail: "Rotate DSA + behavioral rounds", href: "/mocks" });
    }
    if (input.targetCompany) {
      tasks.push({ area: "Company Prep", label: `${cap(input.targetCompany)} problem set`, detail: "Close coverage on their most-asked problems", href: `/companies/${input.targetCompany}` });
    }
    if (tier === "elite" || tier === "product") {
      tasks.push({ area: "Behavioral", label: "STAR stories", detail: "Prepare 5 strong behavioral answers", href: "/mocks" });
    }
    plan.push({
      week: w++, phase: "Interview", theme: last ? "Final prep & apply" : "Interview conditioning",
      tasks, milestone: last ? "Interview-ready — start applying" : "Anxiety down, reps up",
    });
  }

  const companyBit = input.targetCompany ? ` targeting ${cap(input.targetCompany)} (${TIER_LABEL[tier]})` : "";
  const weakBit = focusAreas.length ? ` We front-load your weakest areas — ${focusAreas.slice(0, 2).join(" and ")} — then ramp to ${TIER_LABEL[tier]} depth.` : "";

  return {
    title: `${weeks}-week ${roleName} roadmap`,
    targetRole: roleName,
    targetCompany: input.targetCompany ?? null,
    tier,
    weeks,
    hoursPerDay: Math.max(1, Math.min(8, Math.round(input.hoursPerDay))),
    summary: `A ${weeks}-week plan for ${roleName}${companyBit}, ~${input.hoursPerDay} hrs/day.${weakBit}`,
    focusAreas,
    plan,
  };
}

/** Turn the weakest skill dims into foundation-week remediation themes. */
function buildRemediationQueue(weak: SkillDimension[], count: number): { theme: string; task: RoadmapTask; milestone: string }[] {
  const q: { theme: string; task: RoadmapTask; milestone: string }[] = [];
  for (const d of weak) {
    if (d.key in SUBJECT_HREF) {
      q.push({ theme: `Core CS: ${d.label}`, milestone: `${d.label} flashcards green`,
        task: { area: "Core CS", label: `${d.label} fundamentals`, detail: "Notes + spaced-repetition flashcards", href: SUBJECT_HREF[d.key]! } });
    } else if (d.key === "aptitude") {
      q.push({ theme: "Aptitude & speed", milestone: "Aptitude accuracy 80%+",
        task: { area: "Aptitude", label: "Aptitude foundations", detail: "Quant, logical, and a calibration quiz", href: "/assessment" } });
    } else if (d.key === "resume") {
      q.push({ theme: "Resume baseline", milestone: "Resume drafted + scored",
        task: { area: "Resume", label: "Draft your resume", detail: "Get a first ATS score to beat", href: "/resume" } });
    } else if (d.key === "communication") {
      q.push({ theme: "Communication warm-up", milestone: "First mock done",
        task: { area: "Mocks", label: "Low-stakes peer mock", detail: "Get comfortable talking through code", href: "/peer-mocks" } });
    } else {
      q.push({ theme: "DSA foundations", milestone: "50 easy/medium solved",
        task: { area: "DSA", label: "Pattern fundamentals", detail: "Build the core problem-solving base", href: "/problems" } });
    }
  }
  // Always ensure at least a DSA + core-CS foundation even if nothing flagged weak.
  if (q.length === 0) {
    q.push({ theme: "DSA foundations", milestone: "50 easy/medium solved",
      task: { area: "DSA", label: "Pattern fundamentals", detail: "Build the core problem-solving base", href: "/problems" } });
    q.push({ theme: "Core CS sweep", milestone: "All 4 subjects started",
      task: { area: "Core CS", label: "Core subjects sweep", detail: "OS · DBMS · CN · OOP flashcards", href: "/subjects" } });
  }
  void count; // caller cycles through the queue to fill the foundation weeks
  return q;
}
