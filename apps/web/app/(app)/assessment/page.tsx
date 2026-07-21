"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, MetricTile, Meter, PageHeader, Skeleton, ErrorState } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { track, Events } from "@/lib/analytics";
import { PageMotion } from "@/components/page-motion";
import { AdaptiveDiagnostic } from "@/components/adaptive-diagnostic";
import { Reveal } from "@/components/motion";
import { Icons } from "@/components/icons";
import { scoreTone } from "@/lib/ui-helpers";

type Q = { id: string; topic: string; area: string; difficulty: string; prompt: string; choices: string[] };
type Scored = {
  scored: {
    totalQuestions: number;
    correctAnswers: number;
    gapAnalysis: { dsa: number; cs: number; aptitude: number };
    placementProbability: {
      realistic: { company: string; prob: number };
      stretch:   { company: string; prob: number };
      dream:     { company: string; prob: number };
    };
  };
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function NextStep({ href, icon, title, desc, primary }: Readonly<{
  href: string; icon: "activity" | "target" | "map"; title: string; desc: string; primary?: boolean;
}>) {
  const Icon = Icons[icon];
  return (
    <Link href={href}
      className={`group flex flex-col rounded-xl border p-4 shadow-card card-interactive ${
        primary ? "border-accent/50 bg-accent-tint" : "border-border bg-surface"
      }`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
        primary ? "bg-accent text-accent-ink border-accent" : "bg-accent-tint text-accent border-accent/20"
      }`}><Icon width={20} height={20} /></span>
      <div className="mt-3 font-medium text-text-1">{title}</div>
      <div className="text-text-4 text-xs mt-1 flex-1">{desc}</div>
      <span className="mt-3 text-accent text-sm inline-flex items-center gap-1">Open <Icons.arrow width={14} height={14} /></span>
    </Link>
  );
}

export default function Page() {
  const action = useApiAction();
  const confirm = useConfirm();
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [answers, setAnswers]   = useState<Record<string, number>>({});
  const pick = (qId: string, idx: number) => setAnswers((p) => ({ ...p, [qId]: idx }));
  const [startedAt, setStartedAt] = useState<number>(0);
  const [result, setResult]     = useState<Scored["scored"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"choose" | "full" | "adaptive">("choose");
  const [loadError, setLoadError] = useState(false);

  // Called imperatively (effect + retry) so `action`'s unstable identity doesn't
  // re-trigger the effect. On failure we surface a retry instead of hanging on
  // the loading skeleton forever.
  function startFull() {
    setLoadError(false);
    action<{ questions: Q[] }>("/assessment/start")
      .then((d) => { setQuestions(d.questions); setStartedAt(Date.now()); })
      .catch(() => setLoadError(true));
  }

  useEffect(() => {
    if (mode !== "full" || questions) { return; }
    startFull();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit() {
    if (!questions) { return; }
    const blanks = questions.length - Object.keys(answers).length;
    if (blanks > 0) {
      const ok = await confirm({
        title: "Submit with unanswered questions?",
        message: `${blanks} question${blanks === 1 ? "" : "s"} left blank — blanks count as wrong.`,
        confirmLabel: "Submit anyway",
      });
      if (!ok) { return; }
    }
    setSubmitting(true);
    const payload = {
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      answers: questions.map((q) => ({ questionId: q.id, choice: answers[q.id] ?? -1 })),
    };
    try {
      const data = await action<Scored>("/assessment/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      track(Events.AssessmentTaken, {
        correct: data.scored.correctAnswers,
        total: data.scored.totalQuestions,
        dreamProb: data.scored.placementProbability.dream.prob,
        durationSec: payload.durationSeconds,
      });
      setResult(data.scored);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } finally { setSubmitting(false); }
  }

  /* ---------- mode chooser ---------- */
  if (mode === "choose") {
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <PageHeader eyebrow="Skill assessment" title="Find your level" subtitle="Two ways in — a fast adaptive diagnostic that pinpoints your exact boundary, or the full topic-by-topic assessment." />
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <button onClick={() => setMode("adaptive")} className="text-left rounded-2xl border border-brand/30 bg-brand/[0.04] p-5 hover:bg-brand/[0.08] transition-colors">
            <div className="text-xs font-mono uppercase tracking-wider text-brand">Recommended</div>
            <h3 className="font-display text-lg font-bold mt-1">Adaptive diagnostic</h3>
            <p className="text-text-3 text-sm mt-1">12 questions that harden or soften with each answer to find your exact mastery boundary. ~4 min.</p>
          </button>
          <button onClick={() => setMode("full")} className="text-left rounded-2xl border border-border bg-surface p-5 hover:border-edge transition-colors">
            <div className="text-xs font-mono uppercase tracking-wider text-text-4">Full</div>
            <h3 className="font-display text-lg font-bold mt-1">Full assessment</h3>
            <p className="text-text-3 text-sm mt-1">20 fixed questions across DSA, core CS and aptitude with a topic-by-topic report. ~12 min.</p>
          </button>
        </div>
      </PageMotion>
    );
  }

  /* ---------- adaptive ---------- */
  if (mode === "adaptive") {
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl mx-auto">
        <button onClick={() => setMode("choose")} className="text-text-4 text-sm hover:text-text-2 mb-4">← Back</button>
        <PageHeader eyebrow="Adaptive diagnostic" title="Find your exact level" subtitle="Each answer changes what comes next — get it right and it hardens." />
        <div className="mt-8"><AdaptiveDiagnostic onExit={() => setMode("choose")} /></div>
      </PageMotion>
    );
  }

  /* ---------- result ---------- */
  if (result) {
    const probTone = (p: number) => { if (p >= 0.6) { return "easy"; } if (p >= 0.3) { return "medium"; } return "hard"; };
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Calibration complete"
          title="Your readout"
          subtitle={`${result.correctAnswers}/${result.totalQuestions} correct — here's where you stand and what to fix.`}
        />

        <div className="mt-8 grid grid-cols-3 gap-4">
          <MetricTile label="DSA" value={result.gapAnalysis.dsa} unit="%"
            tone={scoreTone(result.gapAnalysis.dsa)} />
          <MetricTile label="Core CS" value={result.gapAnalysis.cs} unit="%"
            tone={scoreTone(result.gapAnalysis.cs)} />
          <MetricTile label="Aptitude" value={result.gapAnalysis.aptitude} unit="%"
            tone={scoreTone(result.gapAnalysis.aptitude)} />
        </div>

        <Card variant="glow" className="mt-5">
          <h2 className="font-display text-xl font-bold">Placement probability</h2>
          <p className="text-text-3 text-sm mt-1">Modelled from your score against typical bars.</p>
          <div className="mt-5 space-y-4">
            {([["Realistic", result.placementProbability.realistic],
               ["Stretch", result.placementProbability.stretch],
               ["Dream", result.placementProbability.dream]] as const).map(([label, p]) => (
              <Meter key={label} tone={probTone(p.prob)} pct={p.prob}
                label={<span><span className="text-text-3 text-xs uppercase tracking-wider mr-2">{label}</span>{p.company}</span>}
                value={`${Math.round(p.prob * 100)}%`} />
            ))}
          </div>
        </Card>

        {/* The loop made visible: this readout just moved your measured state. */}
        <Reveal className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent"><Icons.activity width={18} height={18} /></span>
            <h2 className="font-display text-lg font-bold">This just updated your map</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <NextStep href="/skills" icon="activity" title="Skill Graph"
              desc="Your aptitude & core-CS mastery moved with these answers." />
            <NextStep href="/readiness" icon="target" title="Placement Readiness"
              desc="Your overall score reflects this calibration now." />
            <NextStep href="/roadmap" icon="map" title="Generate roadmap"
              desc="Turn this readout into a week-by-week plan." primary />
          </div>
        </Reveal>
      </PageMotion>
    );
  }

  /* ---------- loading / load error ---------- */
  if (!questions) {
    if (loadError) {
      return (
        <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
          <PageHeader eyebrow="Skill assessment" title="Couldn't start the assessment" subtitle="Something went wrong loading your questions." />
          <div className="mt-8">
            <ErrorState message="We couldn't load your assessment. Check your connection and try again." retry={startFull} />
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader eyebrow="Skill assessment" title="Generating your assessment…" subtitle="20 questions, hand-picked across DSA, core CS, and aptitude." />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  /* ---------- questions ---------- */
  const answered = Object.keys(answers).length;
  const total = questions.length;
  const pct = Math.round((answered / total) * 100);

  return (
    <PageMotion className="relative">
      {/* sticky progress */}
      <div className="sticky top-0 lg:top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="px-4 sm:px-6 lg:px-10 py-3 max-w-5xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Skill assessment</span>
            <span className="text-text-3 font-mono">{answered}/{total} answered</span>
          </div>
          <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <p className="text-text-3">~15 minutes. No grade — just calibration. Answer what you can; skips count as wrong.</p>

        <div className="mt-8 space-y-5">
          {questions.map((q, i) => {
            const done = answers[q.id] != null;
            return (
              <Card key={q.id} className={done ? "border-accent/30" : ""}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-3 text-xs font-mono">Q{i + 1}</span>
                  <Badge>{q.area}</Badge>
                  <Badge tone="accent">{q.difficulty}</Badge>
                  {done && <span className="ml-auto text-easy"><Icons.target width={16} height={16} /></span>}
                </div>
                <p className="mt-4 text-text-1 font-medium" id={`q-${q.id}`}>{q.prompt}</p>
                <div className="mt-4 grid gap-2" role="radiogroup" aria-labelledby={`q-${q.id}`}>
                  {q.choices.map((c, idx) => {
                    const on = answers[q.id] === idx;
                    return (
                      <label key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-accent ${
                        on ? "border-accent bg-accent-tint" : "border-border hover:border-edge hover:bg-surface-2"
                      }`}>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-mono font-bold ${
                          on ? "bg-accent text-accent-ink" : "bg-surface-3 text-text-3"
                        }`}>{LETTERS[idx]}</span>
                        <input type="radio" name={q.id} checked={on}
                          onChange={() => pick(q.id, idx)} className="sr-only" />
                        <span className="text-sm">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* sticky submit bar */}
      <div className="sticky bottom-0 z-30 bg-bg/90 backdrop-blur-md border-t border-border">
        <div className="px-4 sm:px-6 lg:px-10 py-3 max-w-5xl mx-auto flex items-center justify-between gap-3">
          <span className="text-text-3 text-sm">
            {answered === total ? "All answered — ready." : `${total - answered} left (skips count as wrong)`}
          </span>
          <Button onClick={onSubmit} disabled={submitting || answered === 0} glow>
            {submitting ? "Scoring…" : "Get my readout →"}
          </Button>
        </div>
      </div>
    </PageMotion>
  );
}
