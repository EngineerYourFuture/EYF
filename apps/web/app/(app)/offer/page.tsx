"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Badge, Button, PageHeader, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { useReadiness } from "@/lib/use-readiness";
import { tierOf } from "@/lib/company-readiness";
import { companyLabel } from "@/lib/company";
import { predictOffer } from "@/lib/offer";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Track = { slug: string; name: string; salaryMinInr: number; salaryMaxInr: number };
type Company = { slug: string };

const TIER_LABEL: Record<string, string> = { service: "Service-based", mass: "Product (mass-hire)", product: "Product", elite: "Top-tier" };

export default function Page() {
  const { data: tracks } = useApi<Track[]>("/tracks");
  const { data: companies } = useApi<Company[]>("/companies");
  const { readiness, loading } = useReadiness();
  const [trackSlug, setTrackSlug] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  const track = (tracks ?? []).find((t) => t.slug === trackSlug);
  const tier = companySlug ? tierOf(companySlug) : "mass";
  const overall = readiness?.overall ?? 0;
  const lever = readiness?.nextActions?.[0] ?? null;

  const prediction = track
    ? predictOffer({ readiness: overall, minLpa: track.salaryMinInr / 1e5, maxLpa: track.salaryMaxInr / 1e5, tier })
    : null;

  return (
    <PageMotion className="relative">
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="What you're worth"
          title="Offer Predictor"
          subtitle="Your expected package, projected from your live readiness, the role's market band, and the company's tier — plus the one lever that raises it most."
        />

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-1">Target role</label>
            <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)}
              className="mt-2 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
              <option value="">Select a role…</option>
              {(tracks ?? []).map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-1">Target company <span className="text-text-4 font-normal">(optional)</span></label>
            <select value={companySlug} onChange={(e) => setCompanySlug(e.target.value)}
              className="mt-2 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
              <option value="">Typical product company</option>
              {(companies ?? []).map((c) => <option key={c.slug} value={c.slug}>{companyLabel(c.slug)}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <Skeleton className="mt-8 h-64 rounded-2xl" />
        ) : !track || !prediction ? (
          <Card className="mt-8 text-center py-12">
            <div className="text-text-4 flex justify-center mb-3"><Icons.briefcase width={28} height={28} /></div>
            <p className="font-display text-lg font-bold">Pick a role to see your projection</p>
            <p className="text-text-3 text-sm mt-1">We&apos;ll model your package from your readiness and the market band.</p>
          </Card>
        ) : (
          <>
            {/* Predicted package */}
            <Card variant="glow" className="mt-8 text-center py-10 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative">
                <div className="text-xs font-mono uppercase tracking-widest text-text-3">Projected offer</div>
                <div className="mt-3 font-display text-5xl sm:text-6xl font-bold tracking-tight">
                  ₹{prediction.lowLpa}–{prediction.highLpa}<span className="text-2xl text-text-3"> LPA</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Badge tone="accent">{track.name}</Badge>
                  {companySlug && <Badge>{companyLabel(companySlug)}</Badge>}
                  <Badge>{TIER_LABEL[tier]}</Badge>
                </div>
                <p className="text-text-3 text-sm mt-4 max-w-md mx-auto">
                  At your current <Link href="/readiness" className="text-accent hover:underline">{overall}% readiness</Link>, this is the band you&apos;d realistically land today.
                </p>
              </div>
            </Card>

            {/* Ceiling progress */}
            <Card className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-2 text-sm font-medium">Your ceiling at this tier</span>
                <span className="font-display font-bold">₹{prediction.ceilingLpa} LPA</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${prediction.pctOfCeiling}%` }} />
              </div>
              <p className="text-text-4 text-xs mt-2">
                You&apos;re at {prediction.pctOfCeiling}% of the ceiling. Closing the gap is mostly about readiness.
              </p>
            </Card>

            {/* The lever */}
            {lever && (
              <Card className="mt-5 flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                  <Icons.activity width={22} height={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-text-3">Biggest lever</div>
                  <div className="font-medium mt-0.5">{lever.label}</div>
                  <div className="text-text-4 text-xs">{lever.detail}</div>
                </div>
                <Link href={lever.href}><Button size="sm" variant="secondary">Do it <Icons.arrow width={14} height={14} /></Button></Link>
              </Card>
            )}

            <p className="text-text-4 text-xs mt-6 max-w-2xl">
              A model, not a promise — real offers vary with interviews, market, and timing. But the inputs are real: your readiness,
              the role&apos;s band, and the company&apos;s tier. Raise your readiness and watch this climb.
            </p>
          </>
        )}
      </div>
    </PageMotion>
  );
}
