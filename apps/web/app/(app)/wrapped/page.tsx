"use client";
import { toast } from "sonner";
import { Card, Badge, Button, MetricTile, Meter, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Wrapped = {
  year: number;
  totalSolved: number;
  bestStreakDays: number;
  byDifficulty: Record<string, number>;
  topPattern: string | null;
  primaryLanguage: string | null;
  totalSubmissions: number;
  longestSession: { date: string; problemsSolved: number } | null;
  badgesEarned: number;
  mockSessions: number;
  headline: string;
};

export default function Page() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data } = useApi<Wrapped>(`/wrapped/me/${year}`);
  const diffTotal = data ? Object.values(data.byDifficulty).reduce((a, b) => a + b, 0) : 0;

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">Year in review</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">EYF Wrapped</h1>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-surface border border-border rounded-lg px-3 h-10 text-sm focus:outline-none focus:border-accent">
          {[2026, 2025, 2024].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {!data ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <Card variant="glow" className="mt-8 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-text-3 text-xs uppercase tracking-widest">Your {data.year}</div>
                <p className="font-display text-2xl sm:text-3xl font-bold mt-2 leading-snug max-w-md">{data.headline}</p>
              </div>
              <ShareButton year={data.year} />
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            <MetricTile icon={<Icons.code width={16} height={16} />} tone="accent" label="Solved" value={data.totalSolved} />
            <MetricTile icon={<Icons.bolt width={16} height={16} />} label="Submissions" value={data.totalSubmissions} />
            <MetricTile icon={<Icons.flame width={16} height={16} />} tone="medium" label="Best streak" value={data.bestStreakDays} unit="d" />
            <MetricTile icon={<Icons.mic width={16} height={16} />} tone="info" label="Mocks" value={data.mockSessions} />
            <MetricTile icon={<Icons.trophy width={16} height={16} />} label="Badges" value={data.badgesEarned} />
            <MetricTile icon={<Icons.compass width={16} height={16} />} label="Top pattern" value={<span className="font-mono text-xl">{data.topPattern ?? "—"}</span>} />
          </div>

          <Card className="mt-5">
            <h3 className="font-display text-lg font-bold mb-4">Difficulty mix</h3>
            {diffTotal === 0
              ? <p className="text-text-3 text-sm">No accepted solutions yet — solve a few to fill this in.</p>
              : <div className="space-y-3">
                  {Object.entries(data.byDifficulty).map(([d, n]) => (
                    <Meter key={d}
                      tone={d === "HARD" || d === "EXPERT" ? "hard" : d === "EASY" ? "easy" : "medium"}
                      label={d} value={n} pct={n / diffTotal} />
                  ))}
                </div>}
          </Card>

          {data.longestSession && (
            <Card className="mt-5 flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                <Icons.flame width={22} height={22} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">Biggest day</h3>
                <p className="text-text-3 text-sm">{data.longestSession.problemsSolved} problems on {data.longestSession.date}</p>
              </div>
            </Card>
          )}
        </>
      )}
    </PageMotion>
  );
}

function ShareButton({ year }: { year: number }) {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/wrapped/me/${year}/share.pdf`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Share card not ready");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `eyf-wrapped-${year}.pdf`; a.click();
      URL.revokeObjectURL(url);
      track(Events.WrappedDownloaded, { year });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Button size="sm" onClick={download} disabled={busy}>{busy ? "…" : "↓ Share card"}</Button>;
}
