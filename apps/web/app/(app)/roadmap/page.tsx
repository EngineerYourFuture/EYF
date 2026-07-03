"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Button, Badge, PageHeader, Skeleton } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";
import { Reveal } from "@/components/motion";
import { Icons } from "@/components/icons";
import { companyLabel } from "@/lib/company";

type Task = { area: string; label: string; detail: string; href: string };
type Week = { week: number; phase: "Foundation" | "Depth" | "Interview"; theme: string; tasks: Task[]; milestone: string };
type Roadmap = {
  id: string; templateSlug: string; startedAt: string;
  title: string | null; targetRole: string | null; targetCompany: string | null;
  weeks: number | null; hoursPerDay: number | null; plan: Week[] | null;
};
type Track = { slug: string; name: string; weeks: number };
type Company = { slug: string };

export default function Page() {
  const { data, mutate, isLoading } = useApi<Roadmap[]>("/roadmap/me");
  const active = data?.find((r) => r.templateSlug === "personalized" && r.plan) ?? null;
  const [editing, setEditing] = useState(false);

  return (
    <PageMotion className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow-radial" aria-hidden />
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Your plan"
          title="Roadmap"
          subtitle="A week-by-week plan generated for your role, your target company, and — most importantly — your weakest areas. One path. Finish it."
        />

        {isLoading ? (
          <div className="mt-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : active && !editing ? (
          <PlanView roadmap={active} onRegenerate={() => setEditing(true)} />
        ) : (
          <Generator onDone={async () => { setEditing(false); await mutate(); }} onCancel={active ? () => setEditing(false) : undefined} />
        )}
      </div>
    </PageMotion>
  );
}

/* ─────────── Generator form ─────────── */
function Generator({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const { data: tracks } = useApi<Track[]>("/tracks");
  const { data: companies } = useApi<Company[]>("/companies");
  const action = useApiAction();
  const [trackSlug, setTrackSlug] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!trackSlug) { toast.error("Pick a target role first."); return; }
    setBusy(true);
    try {
      await action("/roadmap/generate", {
        method: "POST",
        body: JSON.stringify({ trackSlug, targetCompany: targetCompany || null, weeks, hoursPerDay }),
      }, { silent: true });
      toast.success("Your roadmap is ready.");
      onDone();
    } catch {
      toast.error("Couldn't generate — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="glow" className="mt-8">
      <h2 className="font-display text-xl font-bold">Build my roadmap</h2>
      <p className="text-text-3 text-sm mt-1">Four inputs. We do the rest, calibrated to your live skill graph.</p>

      <div className="mt-6 space-y-6">
        <Field label="Target role" hint="Drives the role-specific curriculum">
          <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
            <option value="">Select a role…</option>
            {(tracks ?? []).map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
          </select>
        </Field>

        <Field label="Target company" hint="Optional — calibrates difficulty + adds their problem set">
          <select value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
            <option value="">No specific company</option>
            {(companies ?? []).map((c) => <option key={c.slug} value={c.slug}>{companyLabel(c.slug)}</option>)}
          </select>
        </Field>

        <Field label="Timeline" hint="How long until you start applying?">
          <div className="flex flex-wrap gap-2">
            {[4, 8, 12, 16, 24].map((w) => (
              <Chip key={w} active={weeks === w} onClick={() => setWeeks(w)}>{w} weeks</Chip>
            ))}
          </div>
        </Field>

        <Field label="Hours per day" hint="Be honest — the plan adapts to your pace">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 6, 8].map((h) => (
              <Chip key={h} active={hoursPerDay === h} onClick={() => setHoursPerDay(h)}>{h} hr{h > 1 ? "s" : ""}</Chip>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <Button glow onClick={generate} disabled={busy}>{busy ? "Generating…" : "Generate my roadmap"}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium text-text-1">{label}</label>
        {hint && <span className="text-text-4 text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
        active ? "border-accent bg-accent-tint text-accent" : "border-border text-text-2 hover:border-edge"
      }`}>{children}</button>
  );
}

/* ─────────── Plan view ─────────── */
const PHASE_TONE = { Foundation: "accent", Depth: "medium", Interview: "easy" } as const;

function PlanView({ roadmap, onRegenerate }: { roadmap: Roadmap; onRegenerate: () => void }) {
  const plan = roadmap.plan ?? [];
  const weeks = roadmap.weeks ?? plan.length;
  const daysSince = Math.floor((Date.now() - new Date(roadmap.startedAt).getTime()) / 86_400_000);
  const currentWeek = Math.min(weeks, Math.floor(daysSince / 7) + 1);
  const pct = Math.round((Math.max(0, currentWeek - 1) / weeks) * 100);

  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* Left: the week-by-week timeline */}
      <Reveal className="space-y-3 order-2 lg:order-1">
        {plan.map((wk) => (
          <WeekCard key={wk.week} wk={wk} current={wk.week === currentWeek} />
        ))}
      </Reveal>

      {/* Right: sticky overview — always visible while you scroll the weeks */}
      <aside className="lg:sticky lg:top-6 space-y-4 order-1 lg:order-2">
        <Card variant="glow">
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Active roadmap</div>
          <h2 className="font-display text-xl font-bold mt-1 leading-tight">{roadmap.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {roadmap.targetRole && <Badge tone="accent">{roadmap.targetRole}</Badge>}
            {roadmap.targetCompany && <Badge>{companyLabel(roadmap.targetCompany)}</Badge>}
            <Badge>{roadmap.hoursPerDay} hrs/day</Badge>
          </div>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-text-2 font-medium">Week {currentWeek} of {weeks}</span>
            <span className="text-text-4 font-mono">{pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full bg-brand transition-all duration-700" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <Button variant="secondary" size="sm" onClick={onRegenerate} className="w-full mt-5">Regenerate</Button>
        </Card>

        <div className="flex flex-col gap-2 px-1 text-sm">
          <Link href="/today" className="text-brand font-medium hover:underline">Start today&apos;s tasks →</Link>
          <Link href="/skills" className="text-text-3 hover:text-text-1">See your skill graph →</Link>
        </div>
      </aside>
    </div>
  );
}

function WeekCard({ wk, current }: { wk: Week; current: boolean }) {
  const [open, setOpen] = useState(current);
  const tone = PHASE_TONE[wk.phase];
  return (
    <div className={`rounded-2xl border bg-surface shadow-card transition-colors ${current ? "border-accent/50" : "border-border"}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display font-bold ${
          current ? "bg-accent text-accent-ink" : "bg-surface-2 text-text-2 border border-border"
        }`}>{wk.week}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={tone}>{wk.phase}</Badge>
            {current && <Badge tone="accent">This week</Badge>}
          </div>
          <div className="font-medium mt-1.5 truncate">{wk.theme}</div>
        </div>
        <span className={`shrink-0 text-text-4 transition-transform ${open ? "rotate-90" : ""}`}><Icons.arrow width={16} height={16} /></span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1">
          <div className="space-y-2">
            {wk.tasks.map((t, i) => (
              <Link key={i} href={t.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5 hover:border-edge transition-colors">
                <Badge>{t.area}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{t.label}</div>
                  <div className="text-text-4 text-xs truncate">{t.detail}</div>
                </div>
                <span className="text-text-4 shrink-0"><Icons.arrow width={14} height={14} /></span>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-text-3">
            <span className="text-accent"><Icons.target width={15} height={15} /></span>
            <span className="font-medium text-text-2">Milestone:</span> {wk.milestone}
          </div>
        </div>
      )}
    </div>
  );
}
