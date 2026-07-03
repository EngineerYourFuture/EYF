"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Badge, PageHeader, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Reveal } from "@/components/motion";
import { Icons } from "@/components/icons";

type Row = { rank: number; name: string; college: string | null; gradYear: number | null; level: number; value: number; isMe: boolean };
type Board = {
  scope: string; metric: string; scopeLabel: string; scopeReady: boolean; total: number;
  rows: Row[]; me: { rank: number; value: number; percentile: number | null; level: number } | null;
};

const SCOPES = [
  { key: "global", label: "Global", icon: "compass" as const },
  { key: "college", label: "My college", icon: "building" as const },
  { key: "year", label: "My year", icon: "award" as const },
];
const METRICS = [
  { key: "xp", label: "XP", unit: "XP" },
  { key: "solved", label: "Solved", unit: "solved" },
  { key: "streak", label: "Streak", unit: "day best" },
  { key: "weekly", label: "This week", unit: "XP this week" },
];

export default function Page() {
  const [scope, setScope] = useState("global");
  const [metric, setMetric] = useState("xp");
  const { data, isLoading } = useApi<Board>(`/leaderboard?scope=${scope}&metric=${metric}`);
  const unit = METRICS.find((m) => m.key === metric)!.unit;

  return (
    <PageMotion className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow-radial" aria-hidden />
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Where you rank"
          title="Leaderboard"
          subtitle="See how you stack up against your college, your graduating class, and everyone on EYF. Compete where it counts."
        />

        {/* Scope + metric tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {SCOPES.map((s) => {
            const Icon = Icons[s.icon];
            const on = scope === s.key;
            return (
              <button key={s.key} onClick={() => setScope(s.key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                  on ? "border-accent bg-accent-tint text-accent" : "border-border text-text-2 hover:border-edge"}`}>
                <Icon width={15} height={15} /> {s.label}
              </button>
            );
          })}
          <div className="ml-auto flex gap-1.5">
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => setMetric(m.key)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  metric === m.key ? "border-accent bg-accent-tint text-accent" : "border-border text-text-3 hover:border-edge"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading || !data ? (
          <div className="mt-6 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : !data.scopeReady ? (
          <Card className="mt-8 text-center py-10">
            <div className="text-text-4 flex justify-center mb-3"><Icons.building width={28} height={28} /></div>
            <p className="font-display text-lg font-bold">
              {scope === "college" ? "Add your college to see your cohort" : "Add your graduation year"}
            </p>
            <p className="text-text-3 text-sm mt-1">We rank you against peers once we know your {scope === "college" ? "college" : "class"}.</p>
            <Link href="/settings" className="inline-block mt-4 text-accent hover:underline">Update in settings →</Link>
          </Card>
        ) : (
          <>
            {/* Your rank hero */}
            {data.me && (
              <Card variant="glow" className="mt-6 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="font-display text-4xl font-bold tabular-nums">#{data.me.rank}</div>
                  <div>
                    <div className="text-text-3 text-sm">of {data.total} in {data.scopeLabel}</div>
                    {data.total > 1 && (() => {
                      const topPct = Math.max(1, Math.ceil((data.me!.rank / data.total) * 100));
                      return <Badge tone={topPct <= 10 ? "easy" : topPct <= 50 ? "accent" : "medium"} className="mt-1">Top {topPct}%</Badge>;
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold tabular-nums">{data.me.value.toLocaleString()}</div>
                  <div className="text-text-4 text-xs">{unit}</div>
                </div>
              </Card>
            )}

            {/* Ranked list */}
            <Reveal className="mt-5 space-y-2">
              {data.rows.length === 0 && <Card><p className="text-text-3 text-sm">No one here yet — be the first.</p></Card>}
              {data.rows.map((r) => <RankRow key={r.rank} r={r} unit={unit} />)}
            </Reveal>
          </>
        )}
      </div>
    </PageMotion>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

function RankRow({ r, unit }: { r: Row; unit: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card transition-colors ${
      r.isMe ? "border-accent bg-accent-tint" : "border-border bg-surface"
    }`}>
      <div className="w-8 shrink-0 text-center font-display font-bold">
        {r.rank <= 3 ? <span className="text-xl">{MEDAL[r.rank - 1]}</span> : <span className="text-text-3">{r.rank}</span>}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-surface-2 font-display text-sm font-bold text-accent">
        {r.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate flex items-center gap-2">
          {r.name}{r.isMe && <Badge tone="accent">You</Badge>}
        </div>
        <div className="text-text-4 text-xs truncate">{r.college ?? "—"}{r.gradYear ? ` · ${r.gradYear}` : ""}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-display font-bold tabular-nums">{r.value.toLocaleString()}</div>
        <div className="text-text-4 text-[10px] uppercase tracking-wide">{unit}</div>
      </div>
    </div>
  );
}
