"use client";
import type { CompanyTier } from "@/lib/company-readiness";

type Round = { round: string; format: string; mins: number; dropPct: number };

// Typical hiring funnels by company tier (rounds, format, per-round dropout).
const FUNNELS: Record<CompanyTier, Round[]> = {
  service: [
    { round: "Aptitude + English", format: "Online MCQ — quant, logical, verbal", mins: 90, dropPct: 55 },
    { round: "Technical interview", format: "Basic DSA + your projects", mins: 40, dropPct: 40 },
    { round: "HR interview", format: "Fit, relocation, communication", mins: 30, dropPct: 15 },
  ],
  mass: [
    { round: "Online assessment", format: "2–3 coding problems + MCQs", mins: 90, dropPct: 70 },
    { round: "Technical round 1", format: "Live DSA problem solving", mins: 45, dropPct: 45 },
    { round: "Technical round 2", format: "DSA + project deep-dive", mins: 45, dropPct: 35 },
    { round: "HR / managerial", format: "Behavioural + team fit", mins: 30, dropPct: 15 },
  ],
  product: [
    { round: "Online assessment", format: "2 medium/hard coding problems", mins: 90, dropPct: 75 },
    { round: "Technical round 1", format: "DSA — optimal + edge cases", mins: 50, dropPct: 50 },
    { round: "Technical round 2", format: "DSA + low-level design", mins: 50, dropPct: 40 },
    { round: "Hiring manager", format: "Behavioural + past impact", mins: 45, dropPct: 20 },
  ],
  elite: [
    { round: "Online assessment", format: "2 hard problems, tight timer", mins: 90, dropPct: 82 },
    { round: "Phone screen", format: "1 hard DSA, think-aloud", mins: 45, dropPct: 55 },
    { round: "Onsite — coding ×2", format: "Hard DSA, optimal expected", mins: 90, dropPct: 55 },
    { round: "Onsite — system design", format: "Scalable design discussion", mins: 50, dropPct: 45 },
    { round: "Behavioural / values", format: "Leadership + culture fit", mins: 45, dropPct: 25 },
  ],
};

export function CompanyFunnel({ tier }: Readonly<{ tier: CompanyTier }>) {
  const rounds = FUNNELS[tier];
  let survival = 100;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <h2 className="font-display text-lg font-bold">Hiring process</h2>
      <p className="text-text-3 text-sm mt-1">The rounds you&apos;ll face, their format, and where most candidates get cut.</p>

      <div className="mt-5 space-y-3">
        {rounds.map((r, i) => {
          const entering = survival;
          survival = Math.max(1, Math.round(survival * (1 - r.dropPct / 100)));
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text-1">{i + 1}. {r.round}</span>
                <span className="text-text-4 text-xs font-mono shrink-0">{r.mins}min · ~{r.dropPct}% cut</span>
              </div>
              <div className="text-text-4 text-xs">{r.format}</div>
              <div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full bg-brand/70 rounded-full transition-all duration-500" style={{ width: `${entering}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-text-2">
        Roughly <span className="font-semibold text-text-1">{survival}%</span> of applicants who start make it to an offer — EYF&apos;s job is to keep you in that slice.
      </div>
    </div>
  );
}
