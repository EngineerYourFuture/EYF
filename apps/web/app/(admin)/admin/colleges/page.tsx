"use client";
import { useState } from "react";
import { Card, SkeletonRows } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

/**
 * TPO channel (Innovation Roadmap A1), v1 — admin view of college batch health
 * so EYF can spot engaged batches and target them for placement-cell partnerships.
 */
type College = { college: string; students: number };
type Batch = {
  college: string;
  students: number;
  active: number;
  engaged: number;
  avgLevel: number;
  avgXp: number;
  avgSolved: number;
  topTargetRoles: { role: string; count: number }[];
  gradYears: { year: number; count: number }[];
};

export default function Page() {
  const { data: colleges, isLoading } = useApi<College[]>("/admin/colleges");
  const [selected, setSelected] = useState<string | null>(null);
  const { data: batch } = useApi<Batch>(
    selected ? `/admin/colleges/batch?college=${encodeURIComponent(selected)}` : null,
  );

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-4">TPO channel</p>
        <h1 className="font-display text-2xl font-bold text-text-1">College batch health</h1>
        <p className="text-text-3 text-sm mt-1">
          Colleges ranked by enrolled students. Pick one to see how ready its batch is — the pitch data for a placement-cell partnership.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Card>
          <h2 className="font-display font-bold mb-3">Colleges</h2>
          {isLoading ? (
            <SkeletonRows rows={6} />
          ) : (colleges ?? []).length === 0 ? (
            <p className="text-text-4 text-sm">No colleges yet — students add theirs in Settings.</p>
          ) : (
            <div className="space-y-1">
              {colleges!.map((c) => (
                <button
                  key={c.college}
                  onClick={() => setSelected(c.college)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    selected === c.college ? "bg-accent-tint border border-accent/30" : "hover:bg-surface-2 border border-transparent"
                  }`}
                >
                  <span className="text-text-1 truncate">{c.college}</span>
                  <span className="font-mono text-xs text-text-4">{c.students}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div>
          {!selected ? (
            <Card className="flex items-center justify-center min-h-[200px]">
              <p className="text-text-4 text-sm">Select a college to see its batch health.</p>
            </Card>
          ) : !batch ? (
            <Card><SkeletonRows rows={4} /></Card>
          ) : (
            <Card>
              <h2 className="font-display text-lg font-bold text-text-1">{batch.college}</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Metric label="Students" value={batch.students} />
                <Metric label="Active" value={batch.active} sub="solved ≥ 1" />
                <Metric label="Engaged" value={batch.engaged} sub="7+ day streak" />
                <Metric label="Avg level" value={batch.avgLevel} />
                <Metric label="Avg XP" value={batch.avgXp} />
                <Metric label="Avg solved" value={batch.avgSolved} />
              </div>

              {batch.topTargetRoles.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-display text-sm font-bold text-text-2 mb-2">Top target roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {batch.topTargetRoles.map((r) => (
                      <span key={r.role} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-1">
                        {r.role} <span className="text-text-4">· {r.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {batch.gradYears.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-display text-sm font-bold text-text-2 mb-2">Graduating</h3>
                  <div className="flex flex-wrap gap-2">
                    {batch.gradYears.map((g) => (
                      <span key={g.year} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-1">
                        {g.year} <span className="text-text-4">· {g.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: Readonly<{ label: string; value: number; sub?: string }>) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="font-display text-2xl font-bold text-text-1">{value}</div>
      <div className="text-text-3 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-text-4 text-[10px]">{sub}</div>}
    </div>
  );
}
