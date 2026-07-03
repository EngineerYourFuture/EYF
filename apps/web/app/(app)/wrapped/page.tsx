"use client";
import { toast } from "sonner";
import { Card, Button, MetricTile, Meter, Skeleton } from "@eyf/ui";
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
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
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
          <Skeleton className="h-[28rem] rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <ShareCard data={data} />
          <ShareRow data={data} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
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

/* ─────────── The shareable poster ─────────── */
function ShareCard({ data }: { data: Wrapped }) {
  return (
    <div className="mt-8 theme-dark relative overflow-hidden rounded-2xl border border-accent/20 bg-bg p-7 sm:p-9 shadow-glow-sm">
      <div className="pointer-events-none absolute -top-1/3 -right-10 h-72 w-72 rounded-full blur-[90px]" style={{ background: "radial-gradient(circle, rgba(255, 255, 255,0.28), transparent 60%)" }} />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(255, 255, 255,0.18), transparent 60%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255,0.8) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-xl tracking-tight text-text-1">EYF</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">{data.year} Wrapped</span>
        </div>

        <p className="font-display text-2xl sm:text-3xl font-bold mt-6 leading-snug max-w-md text-text-1">{data.headline}</p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <PosterStat value={data.totalSolved} label="problems solved" />
          <PosterStat value={`${data.bestStreakDays}d`} label="best streak" />
          <PosterStat value={data.mockSessions} label="mock interviews" />
        </div>

        <div className="mt-7 flex items-center justify-between">
          <span className="text-text-3 text-sm">
            {data.topPattern ? <>Signature pattern: <span className="text-accent font-mono">{data.topPattern}</span></> : "Engineering my future"}
          </span>
          <span className="text-text-4 text-xs font-mono">engineeryourfuture</span>
        </div>
      </div>
    </div>
  );
}
function PosterStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl sm:text-4xl font-bold text-accent leading-none tabular-nums">{value}</div>
      <div className="text-text-4 text-[11px] uppercase tracking-wide mt-1.5">{label}</div>
    </div>
  );
}

/* ─────────── Share actions ─────────── */
function ShareRow({ data }: { data: Wrapped }) {
  const shareText = `My ${data.year} on EYF: ${data.totalSolved} problems solved, a ${data.bestStreakDays}-day best streak${data.mockSessions ? `, ${data.mockSessions} mock interviews` : ""} 🔥 Engineering my future.`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://engineeryourfuture.app";

  async function share() {
    const payload = { title: `EYF Wrapped ${data.year}`, text: shareText, url: shareUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(payload);
        track(Events.WrappedDownloaded, { year: data.year, via: "native" });
        return;
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast.success("Share text copied to clipboard.");
    } catch { /* user dismissed the share sheet */ }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button onClick={share}>Share my Wrapped</Button>
      <DownloadPdf year={data.year} />
      <span className="text-text-4 text-xs">Screenshot the card above to post it anywhere.</span>
    </div>
  );
}

function DownloadPdf({ year }: { year: number }) {
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
      track(Events.WrappedDownloaded, { year, via: "pdf" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Button size="sm" variant="secondary" onClick={download} disabled={busy}>{busy ? "…" : "↓ PDF"}</Button>;
}
