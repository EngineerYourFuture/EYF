"use client";
import { toast } from "sonner";
import { Card, Badge, Button, PageHeader, MetricTile, Meter, EmptyState, Skeleton } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Dna = {
  totalSubmissions: number; acceptedCount: number; acceptanceRate: number;
  primaryLanguage: string | null;
  languageMix: { language: string; count: number; pct: number }[];
  difficultyMix: { difficulty: string; count: number; pct: number }[];
  patternStrengths: { pattern: string; acceptanceRate: number; attempts: number }[];
  patternWeaknesses: { pattern: string; acceptanceRate: number; attempts: number }[];
  avgRuntimeMs: number | null; fastestSolveMin: number | null;
  habitFlags: string[];
};
type Plan = {
  summary: string;
  nextFourWeeks: { week: number; focus: string; actions: string[] }[];
  redFlags: string[]; greenFlags: string[]; targetCompanies: string[];
  generatedAt: string;
};

export default function Page() {
  const { data: dna } = useApi<Dna>("/code-dna/me");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const action = useApiAction();

  async function generate() {
    setLoading(true);
    try {
      const p = await action<Plan>("/code-dna/strategy", { method: "POST" });
      setPlan(p);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Your fingerprint"
        title="Code DNA"
        subtitle={dna ? `Synthesised from ${dna.totalSubmissions} submissions — language mix, pattern strengths, and habits.` : "Synthesising your coding fingerprint…"}
      />

      {!dna ? (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile icon={<Icons.target width={16} height={16} />} tone="easy"
              label="Accepted" value={dna.acceptedCount} sub={`${Math.round(dna.acceptanceRate * 100)}% acceptance`} />
            <MetricTile icon={<Icons.code width={16} height={16} />}
              label="Primary lang" value={dna.primaryLanguage ?? "—"} sub="Most used" />
            <MetricTile icon={<Icons.bolt width={16} height={16} />} tone="medium"
              label="Avg runtime" value={dna.avgRuntimeMs ? dna.avgRuntimeMs : "—"} unit={dna.avgRuntimeMs ? "ms" : undefined} sub="Per accepted" />
            <MetricTile icon={<Icons.flame width={16} height={16} />} tone="accent"
              label="Fastest solve" value={dna.fastestSolveMin ?? "—"} unit={dna.fastestSolveMin ? "min" : undefined} sub="Personal best" />
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-easy"><Icons.award width={18} height={18} /></span>
                <h3 className="font-display text-lg font-bold">Strengths</h3>
              </div>
              {dna.patternStrengths.length === 0
                ? <EmptyState title="No patterns yet" description="Solve a handful of problems and your strongest patterns surface here." className="py-8" />
                : <ul className="space-y-3">{dna.patternStrengths.map((p) => (
                    <Meter key={p.pattern} tone="easy" label={p.pattern} value={`${Math.round(p.acceptanceRate * 100)}% · ${p.attempts} tries`} pct={p.acceptanceRate} />
                  ))}</ul>}
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-hard"><Icons.target width={18} height={18} /></span>
                <h3 className="font-display text-lg font-bold">Soft spots</h3>
              </div>
              {dna.patternWeaknesses.length === 0
                ? <EmptyState title="Nothing flagged" description="Once you have enough attempts, weak patterns show up here to target." className="py-8" />
                : <ul className="space-y-3">{dna.patternWeaknesses.map((p) => (
                    <Meter key={p.pattern} tone="hard" label={p.pattern} value={`${Math.round(p.acceptanceRate * 100)}% · ${p.attempts} tries`} pct={p.acceptanceRate} />
                  ))}</ul>}
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <Card>
              <h3 className="font-display text-lg font-bold mb-4">Language mix</h3>
              {dna.languageMix.length === 0
                ? <EmptyState title="No data yet" description="Submit solutions to map your language footprint." className="py-8" />
                : <div className="space-y-3">{dna.languageMix.map((l) => (
                    <Meter key={l.language} label={l.language} value={l.count} pct={l.pct} />
                  ))}</div>}
            </Card>
            <Card>
              <h3 className="font-display text-lg font-bold mb-4">Difficulty mix</h3>
              {dna.difficultyMix.length === 0
                ? <EmptyState title="No data yet" description="Your difficulty spread appears as you solve." className="py-8" />
                : <div className="space-y-3">{dna.difficultyMix.map((d) => (
                    <Meter key={d.difficulty}
                      tone={d.difficulty === "HARD" || d.difficulty === "EXPERT" ? "hard" : d.difficulty === "EASY" ? "easy" : "medium"}
                      label={d.difficulty} value={d.count} pct={d.pct} />
                  ))}</div>}
            </Card>
          </div>

          {dna.habitFlags.length > 0 && (
            <Card className="mt-5">
              <h3 className="font-display text-lg font-bold mb-3">Habits flagged</h3>
              <div className="flex flex-wrap gap-2">
                {dna.habitFlags.map((f) => <Badge key={f} tone="medium">{f}</Badge>)}
              </div>
            </Card>
          )}
        </>
      )}

      {/* AI strategist */}
      <Card variant="glow" className="mt-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-accent"><Icons.sparkle width={20} height={20} /></span>
              <h2 className="font-display text-2xl font-bold">AI Career Strategist</h2>
              <Badge tone="accent">Pro+</Badge>
            </div>
            <p className="text-text-3 text-sm mt-2 max-w-md">Claude reads your DNA and writes a personalised 4-week playbook — what to drill, what to ship, where to aim.</p>
          </div>
          <Button onClick={generate} disabled={loading} glow>
            {loading ? "Thinking…" : plan ? "Regenerate" : "Generate plan"}
          </Button>
        </div>

        {plan && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-text-2 leading-relaxed">{plan.summary}</p>

            <h3 className="font-display text-base font-bold mt-6 mb-3">Next 4 weeks</h3>
            <div className="space-y-3">
              {plan.nextFourWeeks.map((w) => (
                <div key={w.week} className="rounded-lg border border-border bg-surface-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">Week {w.week}</Badge>
                    <span className="font-medium">{w.focus}</span>
                  </div>
                  <ul className="mt-2 text-sm text-text-2 space-y-1">
                    {w.actions.map((a, i) => <li key={i} className="flex gap-2"><span className="text-accent">›</span>{a}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {plan.greenFlags.length > 0 && (
                <div>
                  <h4 className="text-text-3 uppercase text-xs tracking-wider mb-2">Green flags</h4>
                  <ul className="text-sm space-y-1.5">{plan.greenFlags.map((g, i) => <li key={i} className="flex gap-2"><span className="text-easy">✓</span>{g}</li>)}</ul>
                </div>
              )}
              {plan.redFlags.length > 0 && (
                <div>
                  <h4 className="text-text-3 uppercase text-xs tracking-wider mb-2">Red flags</h4>
                  <ul className="text-sm space-y-1.5">{plan.redFlags.map((r, i) => <li key={i} className="flex gap-2"><span className="text-hard">→</span>{r}</li>)}</ul>
                </div>
              )}
            </div>

            {plan.targetCompanies.length > 0 && (
              <div className="mt-6">
                <h4 className="text-text-3 uppercase text-xs tracking-wider mb-2">Aim at</h4>
                <div className="flex flex-wrap gap-2">{plan.targetCompanies.map((c) => <Badge key={c} tone="accent">{c}</Badge>)}</div>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageMotion>
  );
}
