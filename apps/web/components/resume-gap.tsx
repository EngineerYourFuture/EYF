"use client";
import { useApi } from "@/lib/use-api";

type Gap = {
  roleLabel: string;
  matchPct: number;
  matched: string[];
  missing: string[];
  fixes: { label: string; detail: string; severity: "high" | "med" }[];
};

/**
 * Gap to target — the Resume differentiator. Competitors give a static ATS
 * score. EYF scores the resume against the student's TARGET role: which
 * expected keywords are missing and the exact rewrites to clear that bar.
 */
export function ResumeGap({ resumeId }: { resumeId: string }) {
  const { data } = useApi<Gap>(`/resume/${resumeId}/gap`);
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <h3 className="font-display text-lg font-bold">Gap to your target</h3>
      <div className="text-xs font-mono uppercase tracking-wider text-text-3 mt-0.5">
        {data.roleLabel} · {data.matchPct}% keyword match
      </div>
      <div className="mt-3 h-2 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${data.matchPct >= 70 ? "bg-easy" : data.matchPct >= 40 ? "bg-medium" : "bg-brand"}`}
          style={{ width: `${Math.max(3, data.matchPct)}%` }}
        />
      </div>

      {data.missing.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-text-3 mb-1.5">Missing for this role:</div>
          <div className="flex flex-wrap gap-1.5">
            {data.missing.slice(0, 8).map((k) => (
              <span key={k} className="text-xs rounded border border-brand/30 bg-brand/[0.06] text-brand px-2 py-0.5 capitalize">{k}</span>
            ))}
          </div>
        </div>
      )}

      {data.fixes.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-text-3">Clear the bar</div>
          {data.fixes.map((f, i) => (
            <div key={i} className="flex gap-2.5">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${f.severity === "high" ? "bg-brand" : "bg-medium"}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-1">{f.label}</div>
                <div className="text-xs text-text-3 mt-0.5 leading-relaxed">{f.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
