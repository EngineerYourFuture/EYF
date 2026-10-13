"use client";
import { useEffect, useState } from "react";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { LoadError } from "./shared";

type Run = { runId: string; name: string; durationMin: number; questionCount: number; myStatus: string; myScore: number | null };
type Attempt = { attemptId: string; expiresAt: string; questions: { id: string; prompt: string; choices: string[] }[] };
export function LearnerAssessments({ orgId }: Readonly<{ orgId: string }>) {
  const base = `/orgs/${orgId}`;
  const runs = useApi<Run[]>(`${base}/work/assessments`);
  const action = useApiAction();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [time, setTime] = useState(Date.now());
  useEffect(() => { if (!attempt) { return; } const timer = setInterval(() => setTime(Date.now()), 1000); return () => clearInterval(timer); }, [attempt]);
  async function start(runId: string) {
    setBusy(true); setResult(null);
    try { const a = await action<Attempt>(`${base}/runs/${runId}/start`, { method: "POST" }); setAttempt(a); setTime(Date.now()); try { setAnswers(JSON.parse(sessionStorage.getItem(`lms-attempt-${a.attemptId}`) ?? "{}")); } catch { setAnswers({}); } }
    catch { /* action supplies the error */ } finally { setBusy(false); }
  }
  const seconds = attempt ? Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - time) / 1000)) : 0;
  return <section className="mt-6 space-y-4" aria-labelledby="my-assessments"><h2 id="my-assessments" className="text-xl font-semibold">My assessments</h2>
    <LoadError error={runs.error} retry={runs.mutate} />{runs.isLoading && <SkeletonRows rows={2} />}
    {result && <output  className="block rounded-lg border border-border p-4"><span className="block font-semibold">{result.passed ? "Assessment passed" : "Assessment submitted"} — {result.score}%</span><span className="block mt-2 text-text-2">Any certificate earned is available in Certificates.</span></output>}
    {!attempt && runs.data?.length === 0 && <p className="text-text-2">No assessments are open right now.</p>}
    {!attempt && runs.data?.map((r) => { const attemptAction = r.myStatus === "EXPIRED" ? <Badge tone="medium">Time expired</Badge> : <Button disabled={busy} onClick={() => void start(r.runId)}>{r.myStatus === "IN_PROGRESS" ? "Resume assessment" : "Start assessment"}</Button>; return (<div key={r.runId} className="border-b border-border py-4 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-0"><p className="font-medium">{r.name}</p><p className="text-sm text-text-2">{r.questionCount} questions · {r.durationMin} minutes</p></div>{r.myStatus === "SUBMITTED" ? <Badge>{r.myScore}%</Badge> : attemptAction}</div>); })}
    {attempt && <form className="space-y-6" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { const score = await action<{ score: number; passed: boolean }>(`${base}/attempts/${attempt.attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers: attempt.questions.map((q) => ({ questionId: q.id, choice: answers[q.id] ?? -1 })) }) }); setResult(score); try { sessionStorage.removeItem(`lms-attempt-${attempt.attemptId}`); } catch { /* optional persistence */ } setAttempt(null); await runs.mutate(); } catch { /* retain answers for retry */ } finally { setBusy(false); } }}>
      <p className="font-medium">Time remaining: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p>
      {seconds === 0 && <p role="alert">Time has expired. Submit to close this attempt, then return to your assessments.</p>}
      {attempt.questions.map((q, n) => <fieldset key={q.id} className="border-b border-border pb-4"><legend className="font-semibold mb-3">{n + 1}. {q.prompt}</legend>{q.choices.map((c, i) => <label key={i} className="flex gap-3 items-start min-h-11 py-2"><input className="mt-1" type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => { const next = { ...answers, [q.id]: i }; setAnswers(next); try { sessionStorage.setItem(`lms-attempt-${attempt.attemptId}`, JSON.stringify(next)); } catch { /* optional persistence */ } }} /><span>{c}</span></label>)}</fieldset>)}
      <div className="flex flex-wrap gap-3"><Button disabled={busy}>Submit assessment</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => { setAttempt(null); void runs.mutate(); }}>Return to assessments</Button></div>
      <p className="text-sm text-text-2">Answers are kept in this browser tab until you submit. The timer continues if you leave.</p>
    </form>}
  </section>;
}
