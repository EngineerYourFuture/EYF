"use client";
import Link from "next/link";
import { Card, Button, Badge, Meter, PageHeader, Skeleton } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { useGuidance } from "@/lib/use-guidance";
import { companyReadiness, readinessBand, tierOf, TIER_PROFILES, SPOTLIGHT_COMPANIES } from "@/lib/company-readiness";
import { companyLabel } from "@/lib/company";
import type { Readiness } from "@/lib/readiness";

export default function Page() {
  const { guidance } = useGuidance();
  const r = guidance?.readiness ?? null;

  return (
    <PageMotion className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-glow-radial" aria-hidden />
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Your north star"
          title="Placement Readiness"
          subtitle="One score across everything that gets you placed — DSA, interviews, resume, projects, and consistency. Updated live as you progress."
        />

        {/* Active coaching voice from the guidance engine. */}
        {guidance?.coachNote && guidance.actions.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent-tint/40 px-5 py-4">
            <span className="text-accent mt-0.5 shrink-0"><Icons.sparkle width={18} height={18} /></span>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-accent mb-1">Your coach</div>
              <p className="text-text-1 font-medium leading-snug">{guidance.coachNote}</p>
            </div>
          </div>
        )}

        {!r ? (
          <div className="mt-8 grid lg:grid-cols-[320px_1fr] gap-6">
            <Skeleton className="h-72 rounded-2xl" />
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid lg:grid-cols-[320px_1fr] gap-6 items-stretch">
              {/* Score hero */}
              <Card variant="glow" className="flex flex-col items-center justify-center text-center py-10">
                <ReadinessRing score={r.overall} />
                <Badge tone={r.overall >= 80 ? "easy" : r.overall >= 50 ? "accent" : "medium"} className="mt-5">{r.band}</Badge>
                <p className="text-text-3 text-sm mt-4 max-w-xs leading-relaxed">{r.summary}</p>
              </Card>

              {/* Pillar breakdown */}
              <Card>
                <h2 className="font-display text-lg font-bold mb-4">What makes up your score</h2>
                <div className="space-y-4">
                  {r.pillars.map((p) => {
                    const Icon = Icons[p.icon];
                    return (
                      <Link key={p.key} href={p.href} className="block group">
                        <Meter
                          tone={p.score >= 70 ? "easy" : p.score >= 40 ? "medium" : "hard"}
                          pct={p.score / 100}
                          label={
                            <span className="inline-flex items-center gap-2">
                              <span className="text-text-3 group-hover:text-text-2"><Icon width={15} height={15} /></span>
                              <span className="group-hover:text-text-1">{p.label}</span>
                              <span className="text-text-4 text-xs">· {Math.round(p.weight * 100)}% weight</span>
                            </span>
                          }
                          value={`${p.score}`}
                        />
                        <div className="text-text-4 text-xs mt-1 ml-6">{p.detail}</div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Do this next */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold mb-4">Do this next</h2>
              {r.nextActions.length === 0 ? (
                <Card className="flex items-center gap-3">
                  <span className="text-easy"><Icons.trophy width={22} height={22} /></span>
                  <p className="text-text-2">Every pillar is strong — you&apos;re placement-ready. Keep your streak and start applying.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4">
                  {r.nextActions.map((a, idx) => {
                    const Icon = Icons[a.icon];
                    return (
                      <Card key={a.href} interactive className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                            <Icon width={20} height={20} />
                          </span>
                          <span className="text-text-4 font-mono text-xs">#{idx + 1}</span>
                        </div>
                        <div className="font-medium mt-3">{a.label}</div>
                        <div className="text-text-4 text-xs mt-1 flex-1">{a.detail}</div>
                        <Link href={a.href} className="mt-4">
                          <Button size="sm" variant="secondary" className="w-full">Go <Icons.arrow width={14} height={14} /></Button>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Am I ready for…? — per-company readiness */}
            <CompanyBoard r={r} />

            <p className="text-text-4 text-xs mt-8 max-w-2xl">
              Your readiness updates automatically as you solve problems, take mocks, score your resume, ship projects, and keep your streak.
              No other app can compute this — because no other app sees your whole journey.
            </p>
          </>
        )}
      </div>
    </PageMotion>
  );
}

function CompanyBoard({ r }: { r: Readiness }) {
  const rows = SPOTLIGHT_COMPANIES
    .map((slug) => {
      const tier = tierOf(slug);
      const pct = companyReadiness(r.pillars, tier);
      return { slug, tier, pct, band: readinessBand(pct) };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold mb-1">Am I ready for…?</h2>
      <p className="text-text-3 text-sm mb-4 max-w-2xl">
        Every company hires against a different bar. Here&apos;s where you stand for each — tap any to open targeted prep.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map((c) => (
          <Link key={c.slug} href={`/companies/${c.slug}`}
            className="block rounded-xl border border-border bg-surface px-4 py-3 shadow-card hover:border-edge transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium">{companyLabel(c.slug)}</span>
                <span className="text-text-4 text-xs ml-2">{TIER_PROFILES[c.tier].label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-display text-lg font-bold tabular-nums">{c.pct}%</span>
                <Badge tone={c.band.tone}>{c.band.label}</Badge>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                c.pct >= 85 ? "bg-easy" : c.pct >= 65 ? "bg-accent" : c.pct >= 40 ? "bg-medium" : "bg-hard"
              }`} style={{ width: `${c.pct}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 76, c = 2 * Math.PI * radius;
  return (
    <div className="relative h-48 w-48">
      <svg viewBox="0 0 180 180" className="h-48 w-48 -rotate-90">
        <circle cx="90" cy="90" r={radius} className="fill-none stroke-surface-3" strokeWidth="12" />
        <circle cx="90" cy="90" r={radius} className="fill-none stroke-accent" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-bold leading-none">{score}</span>
        <span className="text-text-3 text-xs font-mono mt-1">/ 100 ready</span>
      </div>
    </div>
  );
}
