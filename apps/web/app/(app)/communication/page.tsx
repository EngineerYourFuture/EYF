"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, MetricTile, Meter, PageHeader, Skeleton, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { useRecorder } from "@/lib/use-recorder";
import { track, Events } from "@/lib/analytics";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { ReadinessNudge } from "@/components/readiness-nudge";

type Kind = "INTRO" | "HR" | "BEHAVIORAL" | "SITUATIONAL";
type KindMeta = { id: Kind; name: string; blurb: string };
type Prompt = { id: string; kind: Kind; question: string; tip: string };
type Catalog = { kinds: KindMeta[]; prompts: Prompt[] };

type Feedback = {
  overallScore: number;
  dimensions: { clarity: number; structure: number; relevance: number; confidence: number; conciseness: number };
  strengths: string[];
  improvements: string[];
  fillerWords: string[];
  modelAnswer: string;
};
type Drill = { id: string; promptId: string; kind: Kind; score: number; durationSeconds: number; createdAt: string };
type History = { drills: Drill[]; bestByKind: Partial<Record<Kind, number>> };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const scoreTone = (p: number) => (p >= 70 ? "easy" : p >= 40 ? "medium" : "hard");
const DIMENSIONS: [keyof Feedback["dimensions"], string][] = [
  ["clarity", "Clarity"], ["structure", "Structure"], ["relevance", "Relevance"],
  ["confidence", "Confidence"], ["conciseness", "Conciseness"],
];

export default function Page() {
  const { data: catalog } = useApi<Catalog>("/communication/prompts");
  const { data: history, mutate: refetchHistory } = useApi<History>("/communication/history");
  const action = useApiAction();
  const { getToken } = useAuth();

  const [kind, setKind] = useState<Kind>("INTRO");
  const [active, setActive] = useState<Prompt | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [grading, setGrading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const { state: recState, blob, start, stop, reset, error: recError } = useRecorder();

  function openPrompt(p: Prompt) {
    setActive(p); setAnswer(""); setFeedback(null); reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function transcribe() {
    if (!blob) return;
    setTranscribing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/communication/transcribe`, {
        method: "POST",
        headers: { "content-type": blob.type || "audio/webm", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: blob,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Transcription failed");
      setAnswer((prev) => (prev ? prev + " " : "") + json.data.text);
      reset();
    } catch (e) {
      const { toast } = await import("sonner");
      toast.error((e as Error).message);
    } finally { setTranscribing(false); }
  }

  async function submit() {
    if (!active || !answer.trim()) return;
    setGrading(true);
    try {
      const data = await action<{ drillId: string; feedback: Feedback }>("/communication/feedback", {
        method: "POST",
        body: JSON.stringify({ promptId: active.id, transcript: answer.trim() }),
      });
      track(Events.CommunicationDrilled, { kind: active.kind, score: data.feedback.overallScore });
      setFeedback(data.feedback);
      refetchHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setGrading(false); }
  }

  /* ─── FEEDBACK ─────────────────────────────────────── */
  if (active && feedback) {
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <PageHeader eyebrow={active.kind} title="Coach feedback" subtitle={active.question} />

        <div className="mt-8 grid grid-cols-3 gap-4">
          <MetricTile label="Overall" value={feedback.overallScore} unit="%" tone={scoreTone(feedback.overallScore)} />
          <MetricTile label="Clarity" value={feedback.dimensions.clarity} unit="%" tone={scoreTone(feedback.dimensions.clarity)} />
          <MetricTile label="Structure" value={feedback.dimensions.structure} unit="%" tone={scoreTone(feedback.dimensions.structure)} />
        </div>

        <Card className="mt-5">
          <h2 className="font-display text-lg font-bold">How you scored</h2>
          <div className="mt-4 space-y-3">
            {DIMENSIONS.map(([k, label]) => (
              <Meter key={k} tone={scoreTone(feedback.dimensions[k]) as "easy" | "medium" | "hard"}
                pct={feedback.dimensions[k] / 100} label={label} value={`${feedback.dimensions[k]}%`} />
            ))}
          </div>
        </Card>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Card className="border-easy/30">
            <h3 className="font-medium text-easy flex items-center gap-2"><Icons.target width={16} height={16} /> Strengths</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-2 list-disc pl-4">
              {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Card>
          <Card className="border-medium/30">
            <h3 className="font-medium text-medium flex items-center gap-2"><Icons.activity width={16} height={16} /> Improve</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-2 list-disc pl-4">
              {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Card>
        </div>

        {feedback.fillerWords.length > 0 && (
          <Card className="mt-5">
            <h3 className="font-medium text-text-1">Filler words to cut</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {feedback.fillerWords.map((w, i) => <Badge key={i} tone="hard">{w}</Badge>)}
            </div>
          </Card>
        )}

        <Card variant="glow" className="mt-5">
          <h3 className="font-medium text-accent flex items-center gap-2"><Icons.sparkle width={16} height={16} /> Model answer</h3>
          <p className="mt-3 text-sm text-text-2 leading-relaxed whitespace-pre-line">{feedback.modelAnswer}</p>
        </Card>

        <ReadinessNudge label="This drill just moved your communication score" />

        <div className="mt-8 flex gap-3">
          <Button onClick={() => setActive(null)}>Back to prompts</Button>
          <Button variant="ghost" onClick={() => openPrompt(active)}>Try this again</Button>
        </div>
      </PageMotion>
    );
  }

  /* ─── DRILL (answering) ─────────────────────────────── */
  if (active) {
    const recording = recState === "recording";
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setActive(null)} className="text-text-4 text-sm hover:text-text-2 mb-4">← All prompts</button>
        <PageHeader eyebrow={active.kind} title={active.question} />

        <Card className="mt-6 border-accent/20 bg-accent-tint/40">
          <p className="text-sm text-text-2 flex items-start gap-2">
            <span className="text-accent mt-0.5"><Icons.sparkle width={15} height={15} /></span>
            <span><span className="font-medium text-text-1">Tip:</span> {active.tip}</span>
          </p>
        </Card>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-text-3 text-xs uppercase tracking-wider">Your answer</label>
            <div className="flex items-center gap-2">
              {!recording ? (
                <Button size="sm" variant="secondary" onClick={start} disabled={transcribing}>
                  <Icons.mic width={14} height={14} /> Record
                </Button>
              ) : (
                <Button size="sm" variant="danger" onClick={stop}>■ Stop</Button>
              )}
              {blob && !recording && (
                <Button size="sm" variant="ghost" onClick={transcribe} disabled={transcribing}>
                  {transcribing ? "Transcribing…" : "Add transcription"}
                </Button>
              )}
            </div>
          </div>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8}
            placeholder="Speak your answer with the mic, or type it here. Aim for 60–120 seconds of spoken content."
            className="w-full rounded-lg bg-surface border border-border text-text-1 p-3.5 text-sm leading-relaxed focus:outline-none focus:border-accent placeholder:text-text-4" />
          {recError && <p className="text-hard text-xs mt-1.5">Mic error: {recError}. You can type instead.</p>}
          {recording && <p className="text-accent text-xs mt-1.5 animate-pulse">● Recording… speak naturally, then Stop.</p>}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={submit} disabled={grading || !answer.trim()}>
            {grading ? "Coach is reviewing…" : "Get feedback"}
          </Button>
          <span className="text-text-4 text-sm">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </PageMotion>
    );
  }

  /* ─── HUB (list) ────────────────────────────────────── */
  const prompts = catalog?.prompts.filter((p) => p.kind === kind) ?? [];
  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Communication"
        title="Speak like you'll get the offer"
        subtitle="Placement rounds are won on how you communicate, not just what you know. Drill the HR & behavioural answers with an AI coach, and sharpen verbal ability with timed MCQs."
      />

      {/* Verbal ability → reuses the MCQ engine */}
      <Link href="/mcq" className="mt-8 block">
        <Card className="card-interactive flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
            <Icons.book width={20} height={20} />
          </span>
          <div className="flex-1">
            <div className="font-medium text-text-1">Verbal Ability</div>
            <div className="text-text-4 text-xs mt-0.5">Grammar, vocabulary, para-jumbles & RC — timed, in the MCQ Tests section.</div>
          </div>
          <span className="text-accent"><Icons.arrow width={16} height={16} /></span>
        </Card>
      </Link>

      {/* Spoken / HR drills */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Icons.mic width={18} height={18} className="text-accent" /> Spoken & HR drills
        </h2>
        <p className="text-text-4 text-sm mt-1">Answer out loud, get scored on clarity, structure & confidence.</p>

        {!catalog ? (
          <div className="mt-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {catalog.kinds.map((k) => {
                const best = history?.bestByKind?.[k.id];
                return (
                  <button key={k.id} onClick={() => setKind(k.id)}
                    className={`px-3.5 h-9 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                      kind === k.id ? "border-accent bg-accent-tint text-text-1" : "border-border text-text-3 hover:border-edge"
                    }`}>
                    {k.name}
                    {best != null && <span className="text-xs text-text-4 font-mono">{best}%</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-text-4 text-xs mt-3">{catalog.kinds.find((k) => k.id === kind)?.blurb}</p>

            <div className="mt-4 space-y-2">
              {prompts.map((p) => (
                <button key={p.id} onClick={() => openPrompt(p)}
                  className="w-full text-left rounded-xl border border-border bg-surface hover:border-edge hover:bg-surface-2 transition-colors px-4 py-3.5 flex items-center gap-3">
                  <Icons.chat width={16} height={16} className="text-text-4 shrink-0" />
                  <span className="text-sm text-text-1 flex-1">{p.question}</span>
                  <Icons.arrow width={15} height={15} className="text-text-4" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* History */}
      {history && history.drills.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold">Recent drills</h2>
          <div className="mt-4 space-y-2">
            {history.drills.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                <Badge>{d.kind}</Badge>
                <span className="text-text-4 text-xs truncate flex-1">{catalog?.prompts.find((p) => p.id === d.promptId)?.question}</span>
                <span className={`font-mono font-bold ${scoreTone(d.score) === "easy" ? "text-easy" : scoreTone(d.score) === "medium" ? "text-medium" : "text-hard"}`}>
                  {d.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history && history.drills.length === 0 && catalog && (
        <div className="mt-10"><EmptyState title="No drills yet" description="Pick a prompt above and record your first answer — your scores show up here." /></div>
      )}
    </PageMotion>
  );
}
