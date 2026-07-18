"use client";
/**
 * Comeback Plan modal — opened from a rejected application in the pipeline.
 * Asks (or recalls) which stage it died at, then renders the deterministic
 * diagnosis from lib/comeback.ts: likely causes with your real numbers vs the
 * company's bar, a 14-day plan of deep-linked tasks, and the companies where
 * you're ALREADY above the bar. Rejection → work order, not a verdict.
 */
import { useState } from "react";
import Link from "next/link";
import { Badge, Button } from "@eyf/ui";
import { Modal } from "@/components/modal";
import { Icons } from "@/components/icons";
import { useReadiness } from "@/lib/use-readiness";
import {
  buildComebackPlan,
  recalledRejectionStage,
  rememberRejectionStage,
  STAGE_META,
  type RejectionStage,
} from "@/lib/comeback";

const STAGES: RejectionStage[] = ["APPLIED", "OA", "INTERVIEW"];

export function ComebackPlanModal({ appId, companyName, jobTitle, onClose }: {
  appId: string;
  companyName: string;
  jobTitle: string;
  onClose: () => void;
}) {
  const { readiness } = useReadiness();
  const [stage, setStage] = useState<RejectionStage | null>(() => recalledRejectionStage(appId));

  const pick = (s: RejectionStage) => { rememberRejectionStage(appId, s); setStage(s); };
  const plan = stage && readiness ? buildComebackPlan({ stage, companyName, pillars: readiness.pillars }) : null;

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="comeback-title"
      panelClassName="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-6 shadow-card-lg focus:outline-none"
    >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-accent">Comeback plan</div>
            <h2 id="comeback-title" className="font-display text-xl font-bold mt-1">{jobTitle} · {companyName}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-text-4 hover:text-text-1 p-1 -m-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {!stage ? (
          <div className="mt-6">
            <p className="text-text-2">Where did it end?</p>
            <p className="text-text-4 text-xs mt-1">That tells us which bar you hit — the plan is different for each.</p>
            <div className="mt-4 grid gap-2">
              {STAGES.map((s) => (
                <button key={s} onClick={() => pick(s)}
                  className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-left hover:border-edge transition-colors">
                  <span className="font-medium">{STAGE_META[s].label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : !plan ? (
          <div className="mt-6 text-text-3 text-sm">Reading your pillar data…</div>
        ) : (
          <div className="mt-5 space-y-6">
            <p className="text-text-1 font-medium leading-relaxed">{plan.reframe}</p>

            {plan.causes.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">What likely happened</div>
                <div className="space-y-2">
                  {plan.causes.map((c) => (
                    <div key={c.pillarKey} className="rounded-xl border border-border bg-surface-2 px-4 py-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium">{c.pillarLabel}</span>
                        <span className="font-mono text-xs text-hard">{c.score} vs bar {c.bar} · {c.gap} short</span>
                      </div>
                      <p className="text-text-3 text-xs mt-1.5 leading-relaxed">{c.why}</p>
                      {c.evidence && <p className="text-text-4 text-[11px] mt-1 font-mono">{c.evidence}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Your next 14 days</div>
              {[["Week 1", plan.week1], ["Week 2", plan.week2]].map(([title, tasks]) => (
                <div key={title as string} className="mb-3">
                  <div className="text-text-4 text-xs font-mono mb-1.5">{title as string}</div>
                  <div className="space-y-1.5">
                    {(tasks as { label: string; href: string }[]).map((t) => (
                      <Link key={t.label} href={t.href} onClick={onClose}
                        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-2 hover:text-text-1 hover:border-edge transition-colors">
                        <span className="text-accent shrink-0"><Icons.arrow width={13} height={13} /></span>
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {plan.wins.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Where you&apos;re already above the bar</div>
                <div className="flex flex-wrap gap-2">
                  {plan.wins.map((w) => (
                    <Link key={w.slug} href={`/companies/${w.slug}`} onClick={onClose}>
                      <Badge tone="easy">{w.name} · {w.pct}%</Badge>
                    </Link>
                  ))}
                </div>
                <p className="text-text-4 text-xs mt-2">One door closed. These are open right now — keep applying while you rebuild.</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Link href="/today" onClick={onClose} className="flex-1">
                <Button className="w-full">Start day 1 now</Button>
              </Link>
              <button onClick={() => setStage(null)} className="text-text-4 text-xs hover:text-text-2">Change stage</button>
            </div>
          </div>
        )}
    </Modal>
  );
}
