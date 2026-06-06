"use client";
import { Card, Button, Badge, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Roadmap = { id: string; templateSlug: string; currentDay: number; completionPct: number; startedAt: string };

const TEMPLATES = [
  {
    slug: "30-day-sprint", label: "30-day sprint", icon: "bolt" as const,
    blurb: "Campus drive in a month? This is the cram.",
    days: 30, pace: "~4 hrs/day", intensity: "Intense", recommended: false,
    highlights: ["Top-150 DSA patterns", "Core CS speed-run", "2 mock interviews/week"],
  },
  {
    slug: "60-day-sprint", label: "60-day sprint", icon: "target" as const,
    blurb: "Balanced pace for placement season.",
    days: 60, pace: "~2.5 hrs/day", intensity: "Balanced", recommended: true,
    highlights: ["Full DSA curriculum", "OS · DBMS · CN · OOP", "Resume + projects polish", "Weekly mocks"],
  },
  {
    slug: "12-week-product", label: "12-week product", icon: "cube" as const,
    blurb: "Long arc for product-company prep.",
    days: 84, pace: "~2 hrs/day", intensity: "Deep", recommended: false,
    highlights: ["Advanced DSA + system design", "Behavioural prep", "2 portfolio projects", "Expert mock reviews"],
  },
];

const labelFor = (slug: string) => TEMPLATES.find((t) => t.slug === slug)?.label ?? slug;

export default function Page() {
  const { data, mutate } = useApi<Roadmap[]>("/roadmap/me");
  const action = useApiAction();
  const [starting, setStarting] = useState<string | null>(null);
  const active = data?.[0];

  async function start(slug: string) {
    setStarting(slug);
    await action("/roadmap/start", { method: "POST", body: JSON.stringify({ templateSlug: slug }) });
    await mutate();
    setStarting(null);
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Your plan"
        title="Roadmap"
        subtitle="One path. Don't flip between templates — pick one and finish it. Every day is scheduled for you."
      />

      {/* Active plan */}
      {active && (
        <Card variant="glow" className="mt-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-text-3">Active plan</div>
              <h2 className="font-display text-2xl font-bold mt-1">{labelFor(active.templateSlug)}</h2>
              <p className="text-text-3 text-sm mt-1">Day {active.currentDay} · {Math.round(active.completionPct)}% complete</p>
            </div>
            <Badge tone="accent">In progress</Badge>
          </div>
          <div className="mt-4 h-2 rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full bg-accent transition-all duration-700" style={{ width: `${Math.max(2, active.completionPct)}%` }} />
          </div>
        </Card>
      )}

      {/* Templates */}
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {TEMPLATES.map((t) => {
          const Icon = Icons[t.icon];
          const isActive = active?.templateSlug === t.slug;
          return (
            <Card key={t.slug} variant={t.recommended ? "elevated" : "default"}
              className={`relative flex flex-col ${t.recommended ? "border-accent/40" : ""}`}>
              {t.recommended && (
                <div className="absolute -top-2.5 left-5">
                  <Badge tone="accent">Recommended</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                  <Icon width={22} height={22} />
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold leading-none">{t.days}</div>
                  <div className="text-text-4 text-[11px] uppercase tracking-wide">days</div>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold mt-4">{t.label}</h3>
              <p className="text-text-3 text-sm mt-1.5">{t.blurb}</p>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Badge>{t.pace}</Badge>
                <Badge tone={t.intensity === "Intense" ? "hard" : t.intensity === "Deep" ? "info" : "medium"}>{t.intensity}</Badge>
              </div>

              <ul className="mt-4 space-y-1.5 flex-1">
                {t.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-text-2">
                    <span className="text-accent mt-0.5">✓</span>{h}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                <Button className="w-full" variant={t.recommended ? "primary" : "secondary"} glow={t.recommended}
                  onClick={() => start(t.slug)} disabled={!!starting}>
                  {starting === t.slug ? "Starting…" : isActive ? "Restart plan" : "Start this plan"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* How it works */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold">How the roadmap works</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {[
            { icon: "map" as const, t: "Daily schedule", d: "Each day gets a focused mix of problems, theory, and review — no decision fatigue." },
            { icon: "flame" as const, t: "Streaks keep you honest", d: "Miss a day and your streak resets. The plan adapts the backlog forward." },
            { icon: "trophy" as const, t: "Calibrated to you", d: "Built from your assessment so weak patterns get more airtime than strong ones." },
          ].map((s) => {
            const Icon = Icons[s.icon];
            return (
              <div key={s.t} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <span className="text-accent"><Icon width={20} height={20} /></span>
                <div className="font-medium mt-3">{s.t}</div>
                <p className="text-text-3 text-sm mt-1 leading-relaxed">{s.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PageMotion>
  );
}
