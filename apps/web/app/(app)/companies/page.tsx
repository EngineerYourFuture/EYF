"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader, SkeletonRows, EmptyState, ErrorState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { companyLabel } from "@/lib/company";

type Company = { slug: string; total: number; solved: number; coverage: number };

export default function CompaniesPage() {
  const { data, isLoading, error, mutate } = useApi<Company[]>("/companies");
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter((c) => companyLabel(c.slug).toLowerCase().includes(q.toLowerCase()));

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Targeted prep"
        title="Company Prep"
        subtitle="Pick where you're interviewing. We surface exactly what that company asks, sorted by how often — and track your coverage as you solve."
      />

      <div className="mt-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search companies…"
          className="w-full max-w-sm bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent/50 outline-none"
        />
      </div>

      {error ? (
        <div className="mt-8"><ErrorState message="Couldn't load companies." retry={() => mutate()} /></div>
      ) : isLoading ? (
        <SkeletonRows rows={6} className="mt-8" />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={q ? "No companies match" : "No company-tagged problems yet"}
          description={q ? "Try a different name." : "Once problems are tagged with companies, they'll show up here."}
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`}>
              <Card interactive className="flex items-center gap-4">
                <CoverageRing pct={c.coverage} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-bold truncate">{companyLabel(c.slug)}</div>
                  <div className="text-text-3 text-sm">
                    {c.solved}/{c.total} solved
                  </div>
                </div>
                <span className="text-text-4 shrink-0"><Icons.arrow width={18} height={18} /></span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageMotion>
  );
}

function CoverageRing({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r;
  const tone = pct >= 70 ? "stroke-easy" : pct >= 35 ? "stroke-medium" : "stroke-accent";
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} className="fill-none stroke-surface-3" strokeWidth="6" />
        <circle cx="28" cy="28" r={r} className={`fill-none ${tone}`} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-sm font-bold">{pct}%</span>
      </div>
    </div>
  );
}
