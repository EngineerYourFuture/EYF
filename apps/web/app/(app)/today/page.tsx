"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons, type IconName } from "@/components/icons";
import { useReadiness } from "@/lib/use-readiness";

type Today = {
  challenge: { problem: { slug: string; title: string; difficulty: string }; alreadySolvedToday: boolean } | null;
  streak: number; xpToday: number; problemsSolvedToday: number;
};
type Flash = { id: string }[];
type App = { id: string; status: string; job: { slug: string; title: string; company: string; closesAt: string | null } };

const SUBJECTS = ["os", "dbms", "cn", "oop"] as const;
const diffTone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

type PlanItem = { id: string; label: string; detail: string; href: string; icon: IconName; done: boolean; auto: boolean };

export default function Page() {
  const { data: today } = useApi<Today>("/roadmap/today");
  const { readiness, loading: readinessLoading } = useReadiness();
  const due = {
    os:   useApi<Flash>("/subjects/os/flashcards/due").data,
    dbms: useApi<Flash>("/subjects/dbms/flashcards/due").data,
    cn:   useApi<Flash>("/subjects/cn/flashcards/due").data,
    oop:  useApi<Flash>("/subjects/oop/flashcards/due").data,
  };
  const dueCount = SUBJECTS.reduce((a, s) => a + (due[s]?.length ?? 0), 0);

  // Live application deadlines — the cross-module signal only EYF can surface here.
  const { data: apps } = useApi<App[]>("/jobs/me/applications");
  const deadlines = useMemo(() => {
    const active = new Set(["SAVED", "APPLIED", "OA", "INTERVIEW"]);
    return (apps ?? [])
      .filter((a) => active.has(a.status) && a.job.closesAt)
      .map((a) => ({ ...a, days: Math.ceil((new Date(a.job.closesAt!).getTime() - Date.now()) / 86_400_000) }))
      .filter((a) => a.days >= 0 && a.days <= 10)
      .sort((a, b) => a.days - b.days);
  }, [apps]);

  const dateKey = new Date().toISOString().slice(0, 10);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`eyf-today-${dateKey}`);
      if (raw) setChecked(new Set(JSON.parse(raw)));
    } catch {}
  }, [dateKey]);
  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(`eyf-today-${dateKey}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const loaded = today && !readinessLoading;

  const plan: PlanItem[] = useMemo(() => {
    if (!today || !readiness) return [];
    const items: PlanItem[] = [];
    if (today.challenge) {
      items.push({
        id: "daily", icon: "bolt", href: `/problems/${today.challenge.problem.slug}`,
        label: `Solve today's challenge: ${today.challenge.problem.title}`,
        detail: today.challenge.problem.difficulty,
        done: today.challenge.alreadySolvedToday, auto: true,
      });
    }
    if (dueCount > 0) {
      items.push({
        id: "flashcards", icon: "book", href: "/subjects",
        label: `Review ${dueCount} due flashcard${dueCount > 1 ? "s" : ""}`,
        detail: "Spaced repetition keeps core CS sticky", done: checked.has("flashcards"), auto: false,
      });
    }
    // Smart suggestions from the weakest readiness pillars.
    readiness.nextActions.slice(0, 2).forEach((a, i) => {
      const id = `gap-${i}`;
      items.push({ id, icon: a.icon, href: a.href, label: a.label, detail: a.detail, done: checked.has(id), auto: false });
    });
    return items;
  }, [today, readiness, dueCount, checked]);

  const doneCount = plan.filter((p) => p.done).length;
  const pct = plan.length ? Math.round((doneCount / plan.length) * 100) : 0;
  const allDone = plan.length > 0 && doneCount === plan.length;

  return (
    <PageMotion className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow-radial" aria-hidden />
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Today</h1>
        <p className="text-text-3 mt-2">Your one plan for the day. Finish it and you&apos;ve moved the needle.</p>

        {/* Today stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <MiniStat icon="flame" tone="accent" label="Streak" value={today ? `${today.streak}` : "—"} unit="d" />
          <MiniStat icon="bolt" tone="medium" label="XP today" value={today ? `${today.xpToday}` : "—"} />
          <MiniStat icon="code" label="Solved today" value={today ? `${today.problemsSolvedToday}` : "—"} />
        </div>

        {/* Plan */}
        <Card variant="glow" className="mt-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-xl font-bold">Today&apos;s plan</h2>
            <span className="text-text-3 text-sm font-mono">{doneCount}/{plan.length || "—"}</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>

          {!loaded ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : allDone ? (
            <div className="text-center py-8">
              <div className="text-easy mb-3 flex justify-center"><Icons.trophy width={32} height={32} /></div>
              <p className="font-display text-lg font-bold">Plan complete. 🎯</p>
              <p className="text-text-3 text-sm mt-1">You showed up today — that&apos;s how offers get built. See you tomorrow.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {plan.map((item) => <PlanRow key={item.id} item={item} onToggle={() => toggle(item.id)} />)}
            </div>
          )}
        </Card>

        {/* Application deadlines */}
        {deadlines.length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="text-hard"><Icons.gauge width={18} height={18} /></span> Deadlines this week
              </h2>
              <Link href="/pipeline" className="text-accent text-sm hover:underline">Pipeline →</Link>
            </div>
            <div className="space-y-2">
              {deadlines.map((d) => (
                <Link key={d.id} href={`/jobs/${d.job.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-edge transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{d.job.title}</div>
                    <div className="text-text-4 text-xs truncate">{d.job.company} · {d.status}</div>
                  </div>
                  <Badge tone={d.days <= 2 ? "hard" : d.days <= 5 ? "medium" : "default"}>
                    {d.days === 0 ? "Today" : `${d.days}d`}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/readiness" className="text-accent hover:underline">View placement readiness →</Link>
          <Link href="/roadmap" className="text-text-3 hover:text-text-1">See full roadmap</Link>
        </div>
      </div>
    </PageMotion>
  );
}

function PlanRow({ item, onToggle }: { item: PlanItem; onToggle: () => void }) {
  const Icon = Icons[item.icon];
  const tone = item.detail in diffTone ? diffTone[item.detail as keyof typeof diffTone] : undefined;
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
      item.done ? "border-border bg-surface-2/50" : "border-border bg-surface hover:border-edge"
    }`}>
      <button
        onClick={onToggle}
        disabled={item.auto}
        aria-label={item.done ? "Done" : "Mark done"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
          item.done ? "bg-accent border-accent text-accent-ink" : "border-edge text-transparent hover:border-accent"
        } ${item.auto ? "cursor-default" : "cursor-pointer"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </button>
      <span className={`shrink-0 ${item.done ? "text-text-4" : "text-accent"}`}><Icon width={18} height={18} /></span>
      <Link href={item.href} className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${item.done ? "text-text-3 line-through" : "text-text-1"}`}>{item.label}</div>
        <div className="text-text-4 text-xs mt-0.5">{tone ? "" : item.detail}</div>
      </Link>
      {tone && <Badge tone={tone}>{item.detail}</Badge>}
      {item.auto && item.done && <Badge tone="easy">✓ Done</Badge>}
    </div>
  );
}

function MiniStat({ icon, label, value, unit, tone = "default" }: {
  icon: IconName; label: string; value: string; unit?: string; tone?: "default" | "accent" | "medium";
}) {
  const Icon = Icons[icon];
  const cls = tone === "accent" ? "text-accent" : tone === "medium" ? "text-medium" : "text-text-2";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-3">{label}</span>
        <span className={cls}><Icon width={15} height={15} /></span>
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}{unit && <span className="text-text-3 text-base"> {unit}</span>}</div>
    </div>
  );
}
