"use client";
import { useApi } from "@/lib/use-api";

type Category = "APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL";
type Section = { name: string; category: Category; questions: number; minutes: number };
type Sim = {
  slug: string; company: string; label: string; blurb: string; usedBy: string;
  sections: Section[]; totalQuestions: number; totalMinutes: number;
};

/**
 * Real-company sims — the Aptitude differentiator. Competitors give generic MCQ
 * practice; EYF lets students rehearse the EXACT test they'll sit — the real
 * sections, counts and per-section timing of TCS NQT, AMCAT, InfyTQ, CoCubes.
 */
export function CompanySims({ onStart }: Readonly<{ onStart: (category: Category, count: number, seconds: number) => void }>) {
  const { data } = useApi<Sim[]>("/mcq/sims");
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <h2 className="type-headline">Rehearse the real test</h2>
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-2 border border-edge bg-surface-3 rounded px-2 py-0.5">Exact format</span>
      </div>
      <p className="text-text-3 text-sm mt-1">The actual sections, question counts and timing of the tests you&apos;ll sit — not generic practice.</p>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {data.map((sim) => (
          <div key={sim.slug} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="type-title">{sim.label}</h3>
              <span className="text-xs text-text-4 font-mono shrink-0">{sim.totalQuestions}Q · {sim.totalMinutes}min</span>
            </div>
            <p className="text-text-4 text-xs mt-0.5">{sim.blurb}</p>
            <div className="mt-3 border-t border-border">
              {sim.sections.map((s) => (
                <button type="button"
                  key={s.name}
                  onClick={() => onStart(s.category, Math.min(25, s.questions), s.minutes * 60)}
                  className="w-full flex items-center justify-between gap-3 py-2.5 text-left border-b border-border last:border-b-0 group"
                >
                  <span className="text-sm text-text-2 group-hover:text-text-1 transition-colors">{s.name}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-text-4 font-mono">{s.questions}Q · {s.minutes}m</span>
                    <span className="text-text-2 group-hover:text-text-1 text-sm group-hover:translate-x-0.5 transition-[color,transform]">Start →</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
