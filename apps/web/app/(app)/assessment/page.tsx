"use client";
import { useEffect, useState } from "react";
import { Button, Card, Badge } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";

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

export default function Page() {
  const action = useApiAction();
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [answers, setAnswers]   = useState<Record<string, number>>({});
  const [startedAt, setStarted] = useState<number>(0);
  const [result, setResult]     = useState<Scored["scored"] | null>(null);

  useEffect(() => {
    action<{ questions: Q[] }>("/assessment/start").then((d) => {
      setQuestions(d.questions);
      setStarted(Date.now());
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit() {
    if (!questions) return;
    const payload = {
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      answers: questions.map((q) => ({ questionId: q.id, choice: answers[q.id] ?? -1 })),
    };
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
  }

  if (result) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight">Your readout</h1>
        <p className="text-text-3 mt-2">
          {result.correctAnswers}/{result.totalQuestions} correct. Here&apos;s where you stand.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4">
          <Stat label="DSA"      pct={result.gapAnalysis.dsa} />
          <Stat label="Core CS"  pct={result.gapAnalysis.cs} />
          <Stat label="Aptitude" pct={result.gapAnalysis.aptitude} />
        </div>

        <Card className="mt-10">
          <h2 className="font-display text-xl font-bold">Placement probability</h2>
          <div className="mt-4 space-y-2 text-sm">
            <ProbRow label="Realistic" {...result.placementProbability.realistic} />
            <ProbRow label="Stretch"   {...result.placementProbability.stretch} />
            <ProbRow label="Dream"     {...result.placementProbability.dream} />
          </div>
        </Card>
      </div>
    );
  }

  if (!questions) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Generating your assessment…</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Skill assessment</h1>
      <p className="text-text-3 mt-2">20 questions. ~15 minutes. No grade — just calibration.</p>

      <div className="mt-10 space-y-6">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <div className="flex items-center gap-2">
              <span className="text-text-3 text-xs font-mono">Q{i + 1}/{questions.length}</span>
              <Badge>{q.area}</Badge>
              <Badge tone="accent">{q.difficulty}</Badge>
            </div>
            <p className="mt-4 text-text-1">{q.prompt}</p>
            <div className="mt-4 grid gap-2">
              {q.choices.map((c, idx) => (
                <label key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer ${
                  answers[q.id] === idx ? "border-accent bg-accent-tint" : "border-border hover:border-text-3"
                }`}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === idx}
                    onChange={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                    className="accent-accent"
                  />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Button onClick={onSubmit} size="lg">Get my readout →</Button>
      </div>
    </div>
  );
}

function Stat({ label, pct }: { label: string; pct: number }) {
  const tone = pct >= 70 ? "text-easy" : pct >= 40 ? "text-medium" : "text-hard";
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-text-3">{label}</div>
      <div className={`mt-2 font-display text-4xl font-bold ${tone}`}>{pct}<span className="text-2xl text-text-3">%</span></div>
    </Card>
  );
}

function ProbRow({ label, company, prob }: { label: string; company: string; prob: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
      <div>
        <span className="text-text-3 text-xs uppercase tracking-wider mr-3">{label}</span>
        <span className="text-text-1">{company}</span>
      </div>
      <span className="font-mono">{Math.round(prob * 100)}%</span>
    </div>
  );
}
