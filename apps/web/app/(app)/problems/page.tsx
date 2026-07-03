"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PageHeader, SkeletonRows, EmptyState, ErrorState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { PatternMastery } from "@/components/pattern-mastery";

type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  patterns: string[];
  companies: string[];
  premium: boolean;
  acceptanceRate: number;
};

const tone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;
const DIFFS = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;

export default function ProblemsPage() {
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<string>("");
  const [pattern, setPattern] = useState<string>("");
  // Server-side filters (difficulty + pattern + search); API caps limit at 50.
  const qs = new URLSearchParams({ limit: "50", ...(q && { q }), ...(diff && { difficulty: diff }), ...(pattern && { pattern }) }).toString();
  const { data, isLoading, error, mutate } = useApi<Problem[]>(`/problems?${qs}`);

  // Stable pattern list for the rail — derived from an unfiltered load so the
  // options don't vanish when a pattern is selected.
  const { data: catalog } = useApi<Problem[]>(`/problems?limit=50`);
  const patterns = useMemo(() => {
    const set = new Set<string>();
    (catalog ?? []).forEach((p) => p.patterns.forEach((x) => set.add(x)));
    return [...set].sort();
  }, [catalog]);
  const shown = data ?? [];

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-7xl">
      <PageHeader eyebrow="2,000+ problems · 15 patterns" title="Problems" subtitle="Patterns first. Grind second." />

      <div className="mt-8"><PatternMastery /></div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            const pool = (catalog ?? shown);
            if (pool.length) window.location.href = `/problems/${pool[Math.floor(Math.random() * pool.length)]!.slug}?blind=1`;
          }}
          className="text-sm font-medium text-brand hover:underline"
        >
          🎯 Blind practice — random problem, no tags, timer on →
        </button>
      </div>

      <div className="mt-6 grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Filters rail */}
        <aside className="lg:sticky lg:top-6 space-y-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-text-3 mb-2">Difficulty</div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="All" active={diff === ""} onClick={() => setDiff("")} />
              {DIFFS.map((d) => (
                <FilterChip key={d} label={d[0] + d.slice(1).toLowerCase()} active={diff === d} onClick={() => setDiff(diff === d ? "" : d)} tone={tone[d]} />
              ))}
            </div>
          </div>

          {patterns.length > 0 && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-text-3 mb-2">Patterns</div>
              <div className="flex flex-col gap-0.5 max-h-[52vh] overflow-y-auto pr-1">
                <FilterRow label="All patterns" active={pattern === ""} onClick={() => setPattern("")} />
                {patterns.map((pt) => (
                  <FilterRow key={pt} label={pt} active={pattern === pt} onClick={() => setPattern(pattern === pt ? "" : pt)} />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main list */}
        <div className="min-w-0">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none"
          />

          <div className="mt-4">
            {isLoading && <SkeletonRows rows={10} />}
            {error && <ErrorState message={error.message} retry={() => mutate()} />}
            {data && shown.length === 0 && (
              <EmptyState icon="🔍" title="No problems match" description="Try a different search, difficulty, or pattern."
                action={<button onClick={() => { setQ(""); setDiff(""); setPattern(""); }} className="text-accent text-sm hover:underline">Clear filters</button>} />
            )}
            {data && shown.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-surface/60 text-text-3 text-xs">
                  <span>{shown.length} problem{shown.length === 1 ? "" : "s"}{pattern && ` · ${pattern}`}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-surface/40 text-text-3 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Title</th>
                      <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Patterns</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Companies</th>
                      <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Acceptance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/problems/${p.slug}`} className="hover:text-accent font-medium">{p.title}</Link>
                          {p.premium && <Badge tone="accent" className="ml-2">PRO</Badge>}
                        </td>
                        <td className="px-4 py-3"><Badge tone={tone[p.difficulty]}>{p.difficulty}</Badge></td>
                        <td className="px-4 py-3 text-text-2 hidden sm:table-cell">{p.patterns.slice(0, 2).join(", ")}</td>
                        <td className="px-4 py-3 text-text-3 hidden lg:table-cell">{p.companies.slice(0, 3).join(", ")}</td>
                        <td className="px-4 py-3 text-text-3 text-right hidden md:table-cell tabular-nums">{Math.round(p.acceptanceRate)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageMotion>
  );
}

function FilterChip({ label, active, onClick, tone }: { label: string; active: boolean; onClick: () => void; tone?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
        active ? "border-accent text-text-1 bg-accent-tint" : "border-border text-text-3 hover:text-text-2"
      }`}
    >
      {label}
    </button>
  );
}

function FilterRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
        active ? "bg-accent-tint text-text-1 font-medium" : "text-text-3 hover:text-text-1 hover:bg-surface-3"
      }`}
    >
      {label}
    </button>
  );
}
