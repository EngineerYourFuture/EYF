"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Badge, MetricTile, PageHeader, Skeleton, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { ReadinessNudge } from "@/components/readiness-nudge";
import { CompanySims } from "@/components/company-sims";

type Category = "APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL";
type CatalogCat = { id: Category; name: string; blurb: string; free: boolean; count: number };
type Catalog = { categories: CatalogCat[]; companies: string[] };

type Q = {
  id: string; category: Category; topic: string; difficulty: string;
  prompt: string; choices: string[]; companies: string[];
};
type ReviewItem = {
  questionId: string; prompt: string; choices: string[]; chosen: number;
  correctIndex: number; isCorrect: boolean; explanation: string; topic: string;
};
type Result = {
  attemptId: string; totalQuestions: number; correctAnswers: number; score: number;
  byTopic: Record<string, { right: number; total: number }>; review: ReviewItem[];
};
type Attempt = {
  id: string; category: Category; company: string | null; totalQuestions: number;
  correctAnswers: number; score: number; durationSeconds: number; completedAt: string;
};
type History = { attempts: Attempt[]; bestByCategory: Partial<Record<Category, number>> };

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const scoreTone = (p: number) => (p >= 70 ? "easy" : p >= 40 ? "medium" : "hard");

export default function Page() {
  const action = useApiAction();
  const { data: catalog } = useApi<Catalog>("/mcq/catalog");
  const { data: history, mutate: refetchHistory } = useApi<History>("/mcq/history");

  const [phase, setPhase] = useState<"config" | "test" | "review">("config");

  // config
  const [category, setCategory] = useState<Category>("APTITUDE");
  const [company, setCompany] = useState<string>("");
  const [count, setCount] = useState<number>(10);
  const [starting, setStarting] = useState(false);

  // test
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  // review
  const [result, setResult] = useState<Result | null>(null);

  const selectedCat = catalog?.categories.find((c) => c.id === category);

  async function runStart(cat: Category, comp: string, cnt: number, seconds?: number) {
    setCategory(cat); setCompany(comp); setCount(cnt);
    setStarting(true);
    try {
      const data = await action<{ questions: Q[]; suggestedSeconds: number }>("/mcq/start", {
        method: "POST",
        body: JSON.stringify({ category: cat, company: comp || undefined, count: cnt }),
      });
      setQuestions(data.questions);
      setAnswers({});
      setRemaining(seconds ?? data.suggestedSeconds);
      setStartedAt(Date.now());
      setResult(null);
      setPhase("test");
      window.scrollTo({ top: 0 });
    } finally { setStarting(false); }
  }
  function onStart() { return runStart(category, company, count); }

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      category,
      company: company || undefined,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      answers: questions.map((q) => ({ questionId: q.id, choice: answers[q.id] ?? -1 })),
    };
    try {
      const data = await action<Result>("/mcq/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      track(Events.McqCompleted, { category, company: company || null, score: data.score, total: data.totalQuestions });
      setResult(data);
      setPhase("review");
      refetchHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setSubmitting(false); }
  }
  submitRef.current = onSubmit;

  // countdown — auto-submits at zero
  useEffect(() => {
    if (phase !== "test") return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); submitRef.current(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  /* ─── REVIEW ─────────────────────────────────────────── */
  if (phase === "review" && result) {
    const topics = Object.entries(result.byTopic).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow={`${selectedCat?.name ?? category}${company ? ` · ${company}` : ""}`}
          title="Test complete"
          subtitle={`${result.correctAnswers}/${result.totalQuestions} correct — review every question below.`}
        />
        <div className="mt-8 grid grid-cols-3 gap-4">
          <MetricTile label="Score" value={result.score} unit="%" tone={scoreTone(result.score)} />
          <MetricTile label="Correct" value={result.correctAnswers} />
          <MetricTile label="Questions" value={result.totalQuestions} />
        </div>

        {topics.length > 0 && (
          <Card className="mt-5">
            <h2 className="font-display text-lg font-bold">By topic</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map(([topic, s]) => (
                <Badge key={topic} tone={s.right === s.total ? "accent" : "default"}>
                  {topic}: {s.right}/{s.total}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-8 space-y-4">
          {result.review.map((r, i) => (
            <Card key={r.questionId} className={r.isCorrect ? "border-easy/40" : "border-hard/40"}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-text-3 text-xs font-mono">Q{i + 1}</span>
                <Badge>{r.topic}</Badge>
                <span className={`ml-auto text-xs font-medium ${r.isCorrect ? "text-easy" : "text-hard"}`}>
                  {r.isCorrect ? "Correct" : r.chosen === -1 ? "Skipped" : "Wrong"}
                </span>
              </div>
              <p className="mt-3 text-text-1 font-medium">{r.prompt}</p>
              <div className="mt-3 grid gap-2">
                {r.choices.map((c, idx) => {
                  const isRight = idx === r.correctIndex;
                  const isChosen = idx === r.chosen;
                  return (
                    <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                      isRight ? "border-easy/60 bg-easy/10"
                      : isChosen ? "border-hard/60 bg-hard/10"
                      : "border-border"
                    }`}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-mono font-bold bg-surface-3 text-text-3">
                        {LETTERS[idx]}
                      </span>
                      <span className="text-text-1">{c}</span>
                      {isRight && <span className="ml-auto text-easy text-xs">✓ answer</span>}
                      {isChosen && !isRight && <span className="ml-auto text-hard text-xs">your pick</span>}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-text-3 text-sm border-t border-border pt-3">{r.explanation}</p>
            </Card>
          ))}
        </div>

        <ReadinessNudge label="This test just moved your readiness" />

        <div className="mt-8 flex gap-3">
          <Button onClick={() => { setPhase("config"); setResult(null); }}>Back to sections</Button>
          <Button variant="ghost" onClick={onStart}>Retake this section</Button>
        </div>
      </PageMotion>
    );
  }

  /* ─── TEST ───────────────────────────────────────────── */
  if (phase === "test") {
    const answered = Object.keys(answers).length;
    const total = questions.length;
    const pct = Math.round((answered / Math.max(1, total)) * 100);
    const low = remaining <= 30;
    return (
      <PageMotion className="relative">
        <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border">
          <div className="px-4 sm:px-6 lg:px-10 py-3 max-w-5xl mx-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{selectedCat?.name ?? category}{company ? ` · ${company}` : ""}</span>
              <span className={`font-mono flex items-center gap-1.5 ${low ? "text-hard" : "text-text-3"}`}>
                <Icons.gauge width={15} height={15} /> {fmtTime(remaining)}
                <span className="ml-3 text-text-4">{answered}/{total}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
          <div className="space-y-5">
            {questions.map((q, i) => {
              const done = answers[q.id] != null;
              return (
                <Card key={q.id} className={done ? "border-accent/30" : ""}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-3 text-xs font-mono">Q{i + 1}</span>
                    <Badge>{q.topic}</Badge>
                    <Badge tone="accent">{q.difficulty}</Badge>
                    {done && <span className="ml-auto text-easy"><Icons.target width={16} height={16} /></span>}
                  </div>
                  <p className="mt-4 text-text-1 font-medium">{q.prompt}</p>
                  <div className="mt-4 grid gap-2">
                    {q.choices.map((c, idx) => {
                      const on = answers[q.id] === idx;
                      return (
                        <label key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          on ? "border-accent bg-accent-tint" : "border-border hover:border-edge hover:bg-surface-2"
                        }`}>
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-mono font-bold ${
                            on ? "bg-accent text-accent-ink" : "bg-surface-3 text-text-3"
                          }`}>{LETTERS[idx]}</span>
                          <input type="radio" name={q.id} checked={on}
                            onChange={() => setAnswers((p) => ({ ...p, [q.id]: idx }))} className="sr-only" />
                          <span className="text-sm">{c}</span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Scoring…" : "Submit test"}</Button>
            <span className="text-text-4 text-sm">Unanswered count as wrong.</span>
          </div>
        </div>
      </PageMotion>
    );
  }

  /* ─── CONFIG ─────────────────────────────────────────── */
  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Timed practice"
        title="MCQ Tests"
        subtitle="Aptitude, reasoning, verbal and core-CS — the sections real placement rounds test. Pick a section, optionally target a company, and go against the clock."
      />

      <CompanySims onStart={(cat, cnt, secs) => runStart(cat, "", cnt, secs)} />

      {!catalog ? (
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {catalog.categories.map((c) => {
              const on = category === c.id;
              const best = history?.bestByCategory?.[c.id];
              return (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    on ? "border-accent bg-accent-tint" : "border-border bg-surface hover:border-edge"
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-1">{c.name}</span>
                    {!c.free && <Badge tone="accent">Basic</Badge>}
                    {best != null && <span className="ml-auto text-xs text-text-4 font-mono">best {best}%</span>}
                  </div>
                  <p className="text-text-4 text-xs mt-1.5">{c.blurb}</p>
                  <p className="text-text-3 text-xs mt-2 font-mono">{c.count} questions</p>
                </button>
              );
            })}
          </div>

          <Card className="mt-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-text-3 text-xs uppercase tracking-wider">Target company <span className="text-text-4 normal-case">(optional)</span></label>
                <select value={company} onChange={(e) => setCompany(e.target.value)}
                  className="mt-2 w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent">
                  <option value="">Any company</option>
                  {catalog.companies.map((co) => <option key={co} value={co}>{co}</option>)}
                </select>
              </div>
              <div>
                <label className="text-text-3 text-xs uppercase tracking-wider">Questions</label>
                <div className="mt-2 flex gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`flex-1 h-11 rounded-lg border text-sm font-medium transition-colors ${
                        count === n ? "border-accent bg-accent-tint text-text-1" : "border-border text-text-3 hover:border-edge"
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={onStart} disabled={starting}>{starting ? "Loading…" : "Start test"}</Button>
              <span className="text-text-4 text-sm">~{Math.round((count * 72) / 60)} min · {selectedCat?.name}</span>
            </div>
          </Card>

          {history && history.attempts.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-lg font-bold">Recent attempts</h2>
              <div className="mt-4 space-y-2">
                {history.attempts.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                    <Badge>{a.category}</Badge>
                    {a.company && <span className="text-text-4 text-xs">{a.company}</span>}
                    <span className="ml-auto text-text-3 font-mono">{a.correctAnswers}/{a.totalQuestions}</span>
                    <span className={`font-mono font-bold ${scoreTone(a.score) === "easy" ? "text-easy" : scoreTone(a.score) === "medium" ? "text-medium" : "text-hard"}`}>
                      {a.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history && history.attempts.length === 0 && (
            <div className="mt-10">
              <EmptyState title="No attempts yet" description="Your scores and topic breakdown will show up here once you finish your first test." />
            </div>
          )}
        </>
      )}
    </PageMotion>
  );
}
