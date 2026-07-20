"use client";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { Badge } from "@eyf/ui";
import { masteryBarClass } from "@/lib/ui-helpers";

type Mastery = {
  overall: number;
  next: { slug: string; title: string; difficulty: string; pattern: string } | null;
  patterns: { pattern: string; total: number; solved: number; mastery: number }[];
};

const diffTone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;
type Diff = keyof typeof diffTone;

/**
 * Pattern Mastery — EYF's DSA differentiator. Competitors give a flat list;
 * this shows the student's mastery of each of the 15 core patterns AND the
 * exact next problem to fix their weakest one (the coach layer).
 */
export function PatternMastery() {
  const { data } = useApi<Mastery>("/problems/mastery");
  if (!data || data.patterns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Pattern mastery</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums">{data.overall}%</span>
            <span className="text-text-3 text-sm">across {data.patterns.length} core patterns</span>
          </div>
        </div>

        {data.next && (
          <Link
            href={`/problems/${data.next.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] px-4 py-3 hover:bg-brand/[0.1] transition-colors max-w-full"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-brand">Your next rep · {data.next.pattern}</div>
              <div className="font-medium text-text-1 mt-0.5 truncate">{data.next.title}</div>
            </div>
            <Badge tone={diffTone[data.next.difficulty as Diff]}>{data.next.difficulty}</Badge>
            <span className="text-brand shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3.5">
        {data.patterns.map((p) => (
          <div key={p.pattern}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-2 truncate">{p.pattern}</span>
              <span className="text-text-4 font-mono text-xs shrink-0 ml-2 tabular-nums">{p.solved}/{p.total}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${masteryBarClass(p.mastery, 80)}`}
                style={{ width: `${Math.max(3, p.mastery)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
