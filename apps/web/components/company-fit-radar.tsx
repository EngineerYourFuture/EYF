"use client";
import { useState } from "react";
import { useGuidance } from "@/lib/use-guidance";
import { TIER_PROFILES, tierOf } from "@/lib/company-readiness";
import { companyLabel } from "@/lib/company";

const AXES = [
  { key: "dsa", label: "DSA" },
  { key: "interview", label: "Interview" },
  { key: "aptitude", label: "Aptitude" },
  { key: "resume", label: "Resume" },
  { key: "consistency", label: "Streak" },
  { key: "projects", label: "Projects" },
];
const COMPANIES = ["amazon", "google", "microsoft", "flipkart", "tcs", "infosys"];

const CX = 140, CY = 118, R = 90;
function points(vals: number[]) {
  const n = vals.length;
  return vals.map((v, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, v)) / 100) * R;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/**
 * Company-fit radar — the student's profile vs what a target company expects.
 * Pure-logic: reuses the readiness pillars + per-tier bars. Shows the axes where
 * they fall short of the company's bar at a glance.
 */
export function CompanyFitRadar() {
  const { guidance } = useGuidance();
  const [company, setCompany] = useState("amazon");
  if (!guidance) return null;

  const pillars = guidance.readiness.pillars;
  const score = (k: string) => pillars.find((p) => p.key === k)?.score ?? 0;
  const bar = TIER_PROFILES[tierOf(company)].bar as Record<string, number>;

  const mine = AXES.map((a) => score(a.key));
  const target = AXES.map((a) => bar[a.key] ?? 0);
  const gaps = AXES.map((a, i) => ({ label: a.label, gap: target[i]! - mine[i]! }))
    .filter((g) => g.gap > 0).sort((a, b) => b.gap - a.gap);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Company fit</div>
          <p className="text-text-3 text-sm mt-1">Your profile vs what <span className="text-text-1 font-medium">{companyLabel(company)}</span> hires against.</p>
        </div>
        <select value={company} onChange={(e) => setCompany(e.target.value)}
          className="h-9 px-3 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-accent">
          {COMPANIES.map((c) => <option key={c} value={c}>{companyLabel(c)}</option>)}
        </select>
      </div>

      <div className="mt-4 grid sm:grid-cols-[280px_1fr] gap-6 items-center">
        <svg viewBox="0 0 280 236" className="w-full max-w-[280px] mx-auto">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon key={f} points={points(AXES.map(() => 100 * f))} fill="none" stroke="rgb(var(--text-1) / 0.08)" />
          ))}
          {AXES.map((a, i) => {
            const ang = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
            return <line key={a.key} x1={CX} y1={CY} x2={CX + R * Math.cos(ang)} y2={CY + R * Math.sin(ang)} stroke="rgb(var(--text-1) / 0.08)" />;
          })}
          <polygon points={points(target)} fill="none" stroke="rgb(var(--text-3))" strokeDasharray="3 3" strokeWidth="1.5" />
          <polygon points={points(mine)} fill="rgb(var(--brand) / 0.15)" stroke="rgb(var(--brand))" strokeWidth="2" />
          {AXES.map((a, i) => {
            const ang = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
            const lr = R + 16;
            return (
              <text key={a.key} x={CX + lr * Math.cos(ang)} y={CY + lr * Math.sin(ang)}
                fontSize="9" fill="rgb(var(--text-3))" textAnchor="middle" dominantBaseline="middle">{a.label}</text>
            );
          })}
        </svg>

        <div>
          <div className="flex items-center gap-4 text-xs mb-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />You</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed border-text-3" />{companyLabel(company)} bar</span>
          </div>
          {gaps.length > 0 ? (
            <>
              <div className="text-text-3 text-sm mb-2">Where you&apos;re below their bar:</div>
              <div className="space-y-1.5">
                {gaps.slice(0, 3).map((g) => (
                  <div key={g.label} className="flex items-center justify-between text-sm">
                    <span className="text-text-2">{g.label}</span>
                    <span className="text-brand font-mono">−{g.gap}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-easy text-sm">You meet or beat their bar on every axis. 🎯</div>
          )}
        </div>
      </div>
    </div>
  );
}
