"use client";
import { useApi } from "@/lib/use-api";

type Composure = {
  series: { date: string; composure: number; overall: number; company: string | null }[];
  sessions: number;
  avg: number;
  best: number;
  delta: number;
  trend: "new" | "improving" | "steady" | "declining";
};

const TREND_META: Record<Composure["trend"], { label: string; cls: string }> = {
  improving: { label: "Improving ↑", cls: "text-easy" },
  steady: { label: "Holding steady", cls: "text-text-2" },
  declining: { label: "Dipping ↓", cls: "text-hard" },
  new: { label: "Baseline set", cls: "text-text-3" },
};

/**
 * Composure under pressure — the Mock Interviews differentiator. Competitors
 * record/playback a mock. EYF trends how you HANDLE PRESSURE across sessions
 * (approach-clarity + communication), turning one-off mocks into a growth curve.
 */
export function ComposureTrend() {
  const { data } = useApi<Composure>("/mocks/composure");
  if (!data || data.sessions === 0) return null;
  const t = TREND_META[data.trend];
  const max = Math.max(100, ...data.series.map((s) => s.composure));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Composure under pressure</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums">{data.avg}</span>
            <span className="text-text-3 text-sm">avg over {data.sessions} mock{data.sessions === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${t.cls}`}>{t.label}</div>
          {data.trend !== "new" && (
            <div className="text-xs text-text-3 mt-0.5">
              {data.delta >= 0 ? "+" : ""}{data.delta} since your first mock
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end gap-1.5 h-24">
        {data.series.map((s, i) => (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group" title={`${s.date}: composure ${s.composure}`}>
            <div
              className="w-full rounded-t bg-brand/60 group-hover:bg-brand transition-all duration-500"
              style={{ height: `${Math.max(4, (s.composure / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-4">
        <span>First mock</span>
        <span>Latest</span>
      </div>
    </div>
  );
}
