"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, PageHeader, SkeletonRows, EmptyState, ErrorState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";

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
  const qs = new URLSearchParams({ limit: "50", ...(q && { q }), ...(diff && { difficulty: diff }) }).toString();
  const { data, isLoading, error, mutate } = useApi<Problem[]>(`/problems?${qs}`);

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl">
      <PageHeader eyebrow="2,000+ problems · 15 patterns" title="Problems" subtitle="Patterns first. Grind second." />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search problems…"
          className="flex-1 min-w-48 bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent/50 outline-none"
        />
        <div className="flex gap-1.5">
          <FilterChip label="All" active={diff === ""} onClick={() => setDiff("")} />
          {DIFFS.map((d) => (
            <FilterChip key={d} label={d[0] + d.slice(1).toLowerCase()} active={diff === d} onClick={() => setDiff(diff === d ? "" : d)} tone={tone[d]} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading && <SkeletonRows rows={8} />}
        {error && <ErrorState message={error.message} retry={() => mutate()} />}
        {data && data.length === 0 && (
          <EmptyState icon="🔍" title="No problems match" description="Try a different search or clear the filters."
            action={<button onClick={() => { setQ(""); setDiff(""); }} className="text-accent text-sm hover:underline">Clear filters</button>} />
        )}
        {data && data.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-text-3 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                  <th className="text-left px-4 py-3 font-medium">Patterns</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Companies</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/problems/${p.slug}`} className="hover:text-accent font-medium">{p.title}</Link>
                      {p.premium && <Badge tone="accent" className="ml-2">PRO</Badge>}
                    </td>
                    <td className="px-4 py-3"><Badge tone={tone[p.difficulty]}>{p.difficulty}</Badge></td>
                    <td className="px-4 py-3 text-text-2">{p.patterns.slice(0, 2).join(", ")}</td>
                    <td className="px-4 py-3 text-text-3 hidden md:table-cell">{p.companies.slice(0, 3).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
