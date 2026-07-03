/**
 * Per-company Placement Readiness — the spec's headline moat ("TCS Ready: 92%,
 * Amazon Ready: 32%"). Different companies hire against different bars, so we
 * score the user's existing readiness pillars against a per-tier bar instead of
 * one flat number. Pure + deterministic; reuses computeReadiness pillars.
 */
import type { Pillar } from "./readiness";

export type CompanyTier = "service" | "mass" | "product" | "elite";
type PillarKey = "dsa" | "interview" | "aptitude" | "resume" | "consistency" | "projects";

type TierProfile = {
  label: string;
  blurb: string;
  // Pillar score (0..100) that counts as "fully clears the bar" for this tier.
  bar: Record<PillarKey, number>;
  // How much each pillar matters for this tier (weights sum to 1).
  weight: Record<PillarKey, number>;
};

export const TIER_PROFILES: Record<CompanyTier, TierProfile> = {
  service: {
    label: "Service-based",
    blurb: "Aptitude is the gate — clear the test, keep a clean resume, and the DSA bar is gentle.",
    bar:    { dsa: 40, interview: 35, aptitude: 65, resume: 70, consistency: 55, projects: 35 },
    weight: { dsa: 0.15, interview: 0.13, aptitude: 0.27, resume: 0.22, consistency: 0.15, projects: 0.08 },
  },
  mass: {
    label: "Product (mass-hire)",
    blurb: "Solid DSA plus a couple of real projects. Aptitude and resume still count.",
    bar:    { dsa: 60, interview: 55, aptitude: 55, resume: 70, consistency: 60, projects: 55 },
    weight: { dsa: 0.30, interview: 0.20, aptitude: 0.15, resume: 0.14, consistency: 0.11, projects: 0.10 },
  },
  product: {
    label: "Product",
    blurb: "Strong DSA, mock-tested communication, and shipped projects.",
    bar:    { dsa: 75, interview: 68, aptitude: 50, resume: 75, consistency: 65, projects: 65 },
    weight: { dsa: 0.36, interview: 0.22, aptitude: 0.08, resume: 0.12, consistency: 0.09, projects: 0.13 },
  },
  elite: {
    label: "Top-tier (FAANG+)",
    blurb: "High DSA including hards, strong mocks, and real portfolio depth. Aptitude barely matters.",
    bar:    { dsa: 88, interview: 78, aptitude: 45, resume: 78, consistency: 70, projects: 72 },
    weight: { dsa: 0.38, interview: 0.25, aptitude: 0.05, resume: 0.09, consistency: 0.08, projects: 0.15 },
  },
};

const COMPANY_TIER: Record<string, CompanyTier> = {
  // service-based mass recruiters
  tcs: "service", infosys: "service", wipro: "service", accenture: "service",
  cognizant: "service", capgemini: "service", techmahindra: "service", hcl: "service", deloitte: "service",
  // product / unicorn mass-hire
  flipkart: "mass", zomato: "mass", swiggy: "mass", paytm: "mass", phonepe: "mass",
  groww: "mass", razorpay: "mass", cred: "mass", oracle: "mass", sap: "mass",
  ibm: "mass", samsung: "mass", nvidia: "mass",
  // product
  microsoft: "product", adobe: "product", uber: "product", atlassian: "product",
  salesforce: "product", linkedin: "product", walmart: "product", visa: "product", paypal: "product",
  // top-tier
  amazon: "elite", google: "elite", meta: "elite", netflix: "elite",
  apple: "elite", deshaw: "elite", goldmansachs: "elite",
};

export function tierOf(slug: string): CompanyTier {
  return COMPANY_TIER[slug] ?? "mass";
}

/** Per-company placement readiness 0..100, from the user's pillars vs the company's bar. */
export function companyReadiness(pillars: Pillar[], tier: CompanyTier): number {
  const p = TIER_PROFILES[tier];
  const score = (key: PillarKey) => pillars.find((x) => x.key === key)?.score ?? 0;
  let sum = 0;
  (Object.keys(p.weight) as PillarKey[]).forEach((k) => {
    const ratio = p.bar[k] === 0 ? 1 : Math.min(1, score(k) / p.bar[k]);
    sum += p.weight[k] * ratio;
  });
  return Math.round(sum * 100);
}

export function readinessBand(pct: number): { label: string; tone: "easy" | "accent" | "medium" | "hard" } {
  if (pct >= 85) return { label: "Ready", tone: "easy" };
  if (pct >= 65) return { label: "Close", tone: "accent" };
  if (pct >= 40) return { label: "Getting there", tone: "medium" };
  return { label: "Not yet", tone: "hard" };
}

/** The biggest single thing dragging readiness for this tier — for a "do this next" nudge. */
export function biggestGap(pillars: Pillar[], tier: CompanyTier): Pillar | null {
  const p = TIER_PROFILES[tier];
  let worst: { pillar: Pillar; drag: number } | null = null;
  for (const pillar of pillars) {
    const key = pillar.key as PillarKey;
    if (!(key in p.bar)) continue;
    const gap = Math.max(0, p.bar[key] - pillar.score);
    const drag = p.weight[key] * gap;
    if (drag > 0 && (!worst || drag > worst.drag)) worst = { pillar, drag };
  }
  return worst?.pillar ?? null;
}

/** Representative spread across tiers for the "Am I ready for…?" board. */
export const SPOTLIGHT_COMPANIES = [
  "tcs", "infosys", "accenture",
  "flipkart", "phonepe", "razorpay",
  "microsoft", "adobe",
  "amazon", "google",
];
