"use client";
import Link from "next/link";
import { Card, Badge, Button, Meter, Skeleton, ErrorState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { companyLabel } from "@/lib/company";
import { useReadiness } from "@/lib/use-readiness";
import { companyReadiness, readinessBand, tierOf, biggestGap } from "@/lib/company-readiness";

type Problem = {
  id: string; slug: string; title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  patterns: string[]; premium: boolean; acceptanceRate: number; solved: boolean;
};
type Detail = {
  company: string;
  coverage: number;
  counts: { total: number; solved: number };
  breakdown: { difficulty: string; total: number; solved: number }[];
  topPatterns: { pattern: string; count: number }[];
  problems: Problem[];
};

const tone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

export default function Page({ params }: { params: { slug: string } }) {
  const { data, isLoading, error, mutate } = useApi<Detail>(`/companies/${params.slug}`);
  const label = companyLabel(params.slug);

  return (
    <PageMotion className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow-radial" aria-hidden />
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <Link href="/companies" className="text-text-3 hover:text-text-1 text-sm inline-flex items-center gap-1.5">
          <span className="rotate-180"><Icons.arrow width={14} height={14} /></span> All companies
        </Link>

        {error ? (
          <div className="mt-8"><ErrorState message="Couldn't load this company." retry={() => mutate()} /></div>
        ) : isLoading || !data ? (
          <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          </div>
        ) : (
          <CompanyView label={label} data={data} />
        )}
      </div>
    </PageMotion>
  );
}

function CompanyView({ label, data }: { label: string; data: Detail }) {
  const nextUnsolved = data.problems.find((p) => !p.solved);
  const { readiness } = useReadiness();
  const tier = tierOf(data.company);
  const ready = readiness ? companyReadiness(readiness.pillars, tier) : null;
  const band = ready != null ? readinessBand(ready) : null;
  const gap = readiness ? biggestGap(readiness.pillars, tier) : null;

  return (
    <>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">{label}</h1>
      <p className="text-text-3 mt-2">
        {data.counts.total} problems reported in {label} interviews — sorted by how often they show up.
      </p>
      <Link href={`/experiences?company=${data.company}`} className="mt-2 inline-flex items-center gap-1.5 text-accent text-sm hover:underline">
        <Icons.chat width={14} height={14} /> Read {label} interview experiences
      </Link>

      {/* Per-company readiness banner */}
      {ready != null && band && (
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-card">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums">{ready}%</span>
            <span className="text-text-3 text-sm">{label} ready</span>
          </div>
          <Badge tone={band.tone}>{band.label}</Badge>
          <div className="h-2 flex-1 min-w-32 bg-surface-3 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              ready >= 85 ? "bg-easy" : ready >= 65 ? "bg-accent" : ready >= 40 ? "bg-medium" : "bg-hard"
            }`} style={{ width: `${ready}%` }} />
          </div>
          {gap && (
            <Link href={gap.href} className="text-accent text-sm hover:underline shrink-0">
              Biggest gap: {gap.label} →
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-[320px_1fr] gap-6 items-stretch">
        {/* Coverage hero */}
        <Card variant="glow" className="flex flex-col items-center justify-center text-center py-8">
          <CoverageRing pct={data.coverage} />
          <div className="mt-4 font-display text-lg font-bold">{data.counts.solved}/{data.counts.total} solved</div>
          <p className="text-text-3 text-sm mt-1 max-w-xs">
            {data.coverage >= 70 ? "Strong coverage — keep it sharp." :
             data.coverage >= 35 ? "Good start. Close the gaps below." :
             "Lots of upside here. Start with the easy wins."}
          </p>
          {nextUnsolved && (
            <Link href={`/problems/${nextUnsolved.slug}`} className="mt-5 w-full">
              <Button glow className="w-full">Solve next: {nextUnsolved.title}</Button>
            </Link>
          )}
        </Card>

        {/* Breakdown + patterns */}
        <Card>
          <h2 className="font-display text-lg font-bold mb-4">Coverage by difficulty</h2>
          <div className="space-y-4">
            {data.breakdown.map((b) => (
              <Meter
                key={b.difficulty}
                tone={b.difficulty === "EASY" ? "easy" : b.difficulty === "MEDIUM" ? "medium" : "hard"}
                pct={b.total ? b.solved / b.total : 0}
                label={<span className="capitalize">{b.difficulty.toLowerCase()}</span>}
                value={`${b.solved}/${b.total}`}
              />
            ))}
          </div>
          {data.topPatterns.length > 0 && (
            <>
              <h3 className="font-display text-sm font-bold mt-6 mb-3 text-text-2">Patterns they lean on</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.topPatterns.map((p) => (
                  <Badge key={p.pattern}>{p.pattern} · {p.count}</Badge>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Problem list */}
      <h2 className="font-display text-xl font-bold mt-10 mb-4">The problem set</h2>
      <div className="space-y-2">
        {data.problems.map((p) => (
          <Link key={p.id} href={`/problems/${p.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card hover:border-edge transition-colors">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
              p.solved ? "bg-accent border-accent text-accent-ink" : "border-edge text-transparent"
            }`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <span className={`flex-1 min-w-0 truncate font-medium ${p.solved ? "text-text-3" : "text-text-1"}`}>{p.title}</span>
            {p.premium && <Badge tone="accent">Pro</Badge>}
            <span className="hidden sm:inline text-text-4 font-mono text-xs">{Math.round(p.acceptanceRate * 100)}%</span>
            <Badge tone={tone[p.difficulty]}>{p.difficulty}</Badge>
          </Link>
        ))}
      </div>
    </>
  );
}

function CoverageRing({ pct }: { pct: number }) {
  const r = 60, c = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 144 144" className="h-40 w-40 -rotate-90">
        <circle cx="72" cy="72" r={r} className="fill-none stroke-surface-3" strokeWidth="11" />
        <circle cx="72" cy="72" r={r} className="fill-none stroke-accent" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold leading-none">{pct}<span className="text-2xl">%</span></span>
        <span className="text-text-3 text-xs font-mono mt-1">covered</span>
      </div>
    </div>
  );
}
