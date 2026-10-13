"use client";
import { SprintContinuation } from "./sprint-continuation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Skeleton } from "@eyf/ui";
import type { SprintQuestion, SprintReport, SprintState, SprintStep } from "@eyf/types";
import { useApi, useApiAction } from "@/lib/use-api";
import { Icons } from "@/components/icons";

const STEPS: { key: SprintStep; label: string; action: string; detail: string }[] = [
  { key: "baseline", label: "Diagnose", action: "Take the starting check", detail: "Six questions to find your starting point." },
  { key: "drills", label: "Practise", action: "Work on your gaps", detail: "Short lessons and checks selected from your results." },
  { key: "challenge", label: "Build", action: "Repair the backend handler", detail: "Fix a data leak, pagination and validation in a real coding task." },
  { key: "retest", label: "Reassess", action: "Take the follow-up check", detail: "Different questions on the same three topics." },
  { key: "report", label: "Show your work", action: "View your evidence report", detail: "Review your results and choose whether to share them." },
];
const field = "mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-text-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
const assistanceLabels = { none: "No outside help declared", ai: "AI assistance declared", person: "Help from another person declared", both: "AI and help from another person declared" };

export function SprintEntry() {
  const { data, error, mutate } = useApi<SprintState>("/placement-sprint/me");
  const active = STEPS.find((s) => s.key === data?.step);
  const entryAction = data ? <Link href="/sprint" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-ink hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">{data.step === "start" ? "Start placement sprint" : "Continue sprint"}<Icons.Arrow width={16} height={16} /></Link>
          : <Skeleton className="h-11 w-44" />;
  return <section aria-labelledby="sprint-entry" className="mt-7 rounded-2xl border border-border bg-surface p-5 sm:p-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl"><h2 id="sprint-entry" className="font-display text-2xl font-semibold tracking-tight">Build evidence for your first backend role.</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-2">{active ? active.detail : "Find your gaps, repair a backend handler, and leave with a report that shows exactly what you did."}</p>
        {data && <p className="mt-3 text-sm text-text-3">{active ? `Your next step: ${active.label.toLowerCase()}` : "Five steps · self-paced · progress saved"}</p>}
      </div>
      {error ? <div role="alert" className="text-sm text-text-2">Couldn&apos;t load your sprint. <button type="button" className="underline underline-offset-4" onClick={() => void mutate()}>Retry</button></div>
        : entryAction}
    </div>
  </section>;
}

type Run = (path: string, body?: unknown, method?: string) => Promise<boolean>;
export function PlacementSprint() {
  const { data, error: loadError, mutate } = useApi<SprintState>("/placement-sprint/me", { revalidateOnFocus: true });
  const action = useApiAction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run: Run = async (path, body, method = "POST") => {
    setBusy(true); setError("");
    try {
      const result = await action<SprintState>(`/placement-sprint/${path}`, { method, ...(body == null ? {} : { body: JSON.stringify(body) }) }, { silent: true });
      if (method === "PATCH") { await mutate(); } else { await mutate(result, { revalidate: false }); }
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your progress. Try again."); return false; }
    finally { setBusy(false); }
  };
  const step = data?.step ?? "start";
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  const loaded = !!data;
  useEffect(() => { if (loaded) { document.getElementById("sprint-heading")?.focus({ preventScroll: true }); } }, [step, loaded]);
  if (loadError) { return <div role="alert" className="py-12"><h1 className="text-2xl font-semibold">Your sprint couldn&apos;t load</h1><p className="mt-3 text-text-2">Your saved progress is still there. Try again when your connection is ready.</p><Button className="mt-5" onClick={() => void mutate()}>Retry</Button></div>; }
  if (!data) { return <div aria-label="Loading placement sprint" className="space-y-6 py-8"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-72 w-full" /></div>; }
  return <div className="placement-sprint">
    <Link href="/today" className="inline-flex min-h-11 items-center text-sm text-text-2 hover:text-text-1">← Back to Today</Link>
    <h1 id="sprint-heading" tabIndex={-1} className="mt-4 font-display text-3xl font-semibold tracking-tight outline-none sm:text-4xl">Backend placement sprint</h1>
    <p className="mt-3 max-w-2xl text-text-2 leading-relaxed">Practise the work behind the interview. Find your gaps, fix a handler, and show what your code actually passed.</p>
    <ol aria-label="Sprint progress" className="my-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4 text-sm">
      {STEPS.map((s, i) => <li key={s.key} aria-current={step === s.key ? "step" : undefined} className={`flex items-center gap-2 ${step === s.key ? "font-semibold text-text-1" : "text-text-3"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${i < activeIndex ? "border-accent bg-accent text-accent-ink" : "border-border"}`}>{i < activeIndex ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="Complete"><path d="m5 12 4 4L19 6" /></svg> : i + 1}</span>{s.label}</li>)}
    </ol>
    {error && <div role="alert" className="mb-6 rounded-lg border border-hard/40 bg-surface px-4 py-3 text-sm text-text-1">{error}</div>}
    {step === "start" && <section className="max-w-2xl pb-8">
      <h2 className="text-2xl font-semibold">A small piece of work. A clear record of progress.</h2>
      <p className="mt-4 leading-relaxed text-text-2">Start with a short check on API correctness, data access and testing. Your results choose the practice you need before you tackle the ticket-list handler.</p>
      <dl className="mt-7 divide-y divide-border border-y border-border text-sm">
        <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]"><dt className="font-medium">What you&apos;ll build</dt><dd className="text-text-2">An isolated handler with safe ownership rules, validated pagination and stable ordering.</dd></div>
        <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]"><dt className="font-medium">Time to set aside</dt><dd className="text-text-2">About 60–90 minutes, split across sessions if you prefer. There is no countdown.</dd></div>
        <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]"><dt className="font-medium">Your evidence</dt><dd className="text-text-2">Before and after check results, executed code tests, and your written engineering decisions. Sharing is optional.</dd></div>
        <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]"><dt className="font-medium">Using AI</dt><dd className="text-text-2">Allowed. Declare the help you used when you submit. This is unproctored practice.</dd></div>
      </dl>
      <Button className="mt-7" disabled={busy} onClick={() => void run("start")}>{busy ? "Starting…" : "Take the starting check"}</Button>
      <p className="mt-3 text-sm text-text-3">Available during payment preview. No payment step.</p>
    </section>}
    {(step === "baseline" || step === "retest") && <QuestionForm key={step} state={data} run={run} busy={busy} />}
    {step === "drills" && <DrillForm state={data} run={run} busy={busy} />}
    {step === "challenge" && <ChallengeForm state={data} run={run} busy={busy} refresh={() => void mutate()} />}
    {step === "report" && data.report && <><EvidenceReport report={data.report} /><ShareControls state={data} run={run} busy={busy} /><SprintContinuation /></>}
  </div>;
}

function Question({ question, value, onChange }: Readonly<{ question: SprintQuestion; value?: number; onChange: (value: number) => void }>) {
  return <fieldset className="py-6"><legend className="max-w-2xl pt-6 font-medium leading-relaxed">{question.prompt}</legend><div className="mt-3 grid gap-2">{question.choices.map((choice, index) => <label key={choice} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${value === index ? "border-accent bg-accent-tint" : "border-border bg-surface hover:bg-surface-2"}`}><input type="radio" name={question.id} value={index} checked={value === index} onChange={() => onChange(index)} className="mt-1 accent-accent" required /><span>{choice}</span></label>)}</div></fieldset>;
}
function QuestionForm({ state, run, busy }: Readonly<{ state: SprintState; run: Run; busy: boolean }>) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [restored, setRestored] = useState(false);
  const draftKey = `eyf:sprint:${state.startedAt}:${state.step}`;
  useEffect(() => { try { setAnswers(JSON.parse(sessionStorage.getItem(draftKey) ?? "{}")); } catch {} setRestored(true); }, [draftKey]);
  useEffect(() => { if (restored) { try { sessionStorage.setItem(draftKey, JSON.stringify(answers)); } catch {} } }, [answers, restored, draftKey]);
  return <form className="max-w-2xl pb-8" onSubmit={async (e) => { e.preventDefault(); if (await run(state.step, { answers })) { try { sessionStorage.removeItem(draftKey); } catch {} } }}>
    <h2 className="text-2xl font-semibold">{state.step === "baseline" ? "Find your starting point" : "Check what changed"}</h2>
    <p className="mt-3 text-sm leading-relaxed text-text-2">Six questions. Take your time and answer without looking up the solution for a useful comparison. You can submit this check once; your result will be saved.</p>
    <div className="divide-y divide-border">{state.questions.map((q) => <Question key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />)}</div>
    <div className="mt-5 flex flex-wrap items-center gap-4"><Button disabled={busy || Object.keys(answers).length !== state.questions.length} type="submit">{busy ? "Saving result…" : "Submit check"}</Button><span className="text-sm text-text-3">{Object.keys(answers).length} of {state.questions.length} answered</span></div>
  </form>;
}
function DrillForm({ state, run, busy }: Readonly<{ state: SprintState; run: Run; busy: boolean }>) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  return <form className="max-w-2xl pb-8" onSubmit={(e) => { e.preventDefault(); void run("drills", { answers }); }}>
    <h2 className="text-2xl font-semibold">Turn your gaps into practice</h2>
    <p className="mt-3 text-sm leading-relaxed text-text-2">Starting check: {state.baseline?.correct}/{state.baseline?.total}. {state.baseline?.correct === state.baseline?.total ? "You covered the starting questions well. Consolidate these ideas before building." : "These exercises focus on the topics where you missed a question."} Read each explanation, then answer its check. You can retry these practice checks.</p>
    {state.drills.map((d) => <section key={d.topic} className="mt-8 border-t border-border pt-6"><h3 className="text-xl font-semibold">{d.title}</h3><p className="mt-3 leading-relaxed text-text-2">{d.lesson}</p><Question question={d.question} value={answers[d.question.id]} onChange={(v) => setAnswers((a) => ({ ...a, [d.question.id]: v }))} /></section>)}
    <Button type="submit" disabled={busy || Object.keys(answers).length !== state.drills.length}>{busy ? "Checking…" : "Check practice and continue"}</Button>
  </form>;
}
function ChallengeForm({ state, run, busy, refresh }: Readonly<{ state: SprintState; run: Run; busy: boolean; refresh: () => void }>) {
  const { data: execution, error: executionError } = useApi<{ ready: boolean }>("/submissions/status", { refreshInterval: 15_000 });
  const [notes, setNotes] = useState({ explanation: state.notes?.explanation ?? "", sql: state.notes?.sql ?? "", tests: state.notes?.tests ?? "", assistance: state.notes?.assistance ?? "" });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) { return; } const prevent = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload", prevent); return () => window.removeEventListener("beforeunload", prevent); }, [dirty]);
  const edit = (key: keyof typeof notes, value: string) => { setNotes((n) => ({ ...n, [key]: value })); setDirty(true); setSaved(false); };
  const accepted = state.submission?.eligible === true;
  return <section className="pb-8">
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="max-w-2xl"><h2 className="text-2xl font-semibold">{state.challenge.title}</h2><p className="mt-3 leading-relaxed text-text-2">The support dashboard leaks tickets across accounts and counts pages incorrectly. Repair the handler, then explain the decisions behind your fix.</p>
        {(execution?.ready === false || executionError) && <output  className="block mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-1">{execution?.ready === false ? "Code execution is currently unavailable." : "We couldn't confirm code execution availability."} You can still write your solution and save your draft. Passing code checks is required to complete this step.</output>}
        <p className="mt-3 text-sm text-text-2">The editor opens in a new tab so your written draft stays here. Submit your code there, then return to check its result.</p>
        <a href={`/problems/${state.challenge.slug}?sprint=1&lang=JAVASCRIPT`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-ink">Open coding task <span className="sr-only">in a new tab</span></a>
      </div>
      <aside aria-label="Code test result" className="rounded-xl border border-border bg-surface p-5"><h3 className="font-semibold">Automated code checks</h3><p className="mt-3 text-sm text-text-2" aria-live="polite">{state.submission ? `${state.submission.verdict.replaceAll("_", " ")} · ${state.submission.passedTests}/${state.submission.totalTests || state.challenge.testCount} tests` : "No submission yet. Your first run will appear here."}</p><Button variant="secondary" size="sm" className="mt-4" onClick={refresh}>Refresh result</Button><p className="mt-3 text-xs leading-relaxed text-text-3">If execution is pending or unavailable, save your draft and retry the coding submission when the judge is available.</p></aside>
    </div>
    <form className="mt-10 max-w-2xl" onSubmit={async (e) => { e.preventDefault(); if (await run("challenge", notes)) { setDirty(false); } }}>
      <h3 className="text-xl font-semibold">Explain your engineering decisions</h3><p className="mt-2 text-sm leading-relaxed text-text-2">These sections appear as your own statements in the report. EYF does not automatically grade or execute them. Write at least 80 characters in each section.</p>
      {([
        ["explanation", "What did you fix, and why?", "Explain the authorization boundary, validation rules and ordering. Include a trade-off."],
        ["sql", "SQL query and index proposal", "Write a parameterized query for the same filters and ordering. Suggest an index and explain its column order."],
        ["tests", "Regression test plan", "Describe at least three cases, their inputs and expected results. Cover isolation, a pagination boundary and invalid input."],
      ] as const).map(([key, label, help]) => <label key={key} className="mt-6 block"><span className="font-medium">{label}</span><span id={`help-${key}`} className="mt-1 block text-sm text-text-2">{help}</span><textarea value={notes[key]} onChange={(e) => edit(key, e.target.value)} rows={5} minLength={80} maxLength={4000} required aria-describedby={`help-${key}`} className={field} /></label>)}
      <label className="mt-6 block"><span className="font-medium">What help did you use?</span><select required className={field} value={notes.assistance} onChange={(e) => edit("assistance", e.target.value)}><option value="">Choose a declaration</option><option value="none">No outside help</option><option value="ai">AI tools</option><option value="person">Another person</option><option value="both">AI tools and another person</option></select></label>
      <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" type="button" disabled={busy || !notes.assistance} onClick={async () => { if (await run("notes", notes, "PATCH")) { setDirty(false); setSaved(true); } }}>Save written draft</Button><Button type="submit" disabled={busy || !accepted}>{busy ? "Saving…" : "Complete practical and reassess"}</Button></div>
      <output className="block mt-3 text-sm text-text-3" >{draftStatus(saved, dirty)}</output>
    </form>
  </section>;
}

export function EvidenceReport({ report }: Readonly<{ report: SprintReport }>) {
  return <article aria-labelledby="evidence-heading" className="evidence-report pb-8">
    <h2 id="evidence-heading" className="text-2xl font-semibold">A record of the work</h2><p className="mt-2 text-text-2">{report.name} · Backend sprint · completed {new Date(report.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>
    <div className="mt-7 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-3 text-left font-medium">Practice check results</caption><thead className="border-y border-border bg-surface"><tr><th scope="col" className="p-3">Topic</th><th scope="col" className="p-3">Starting check</th><th scope="col" className="p-3">Follow-up</th></tr></thead><tbody>{report.baseline.topics.map((t) => { const after = report.retest.topics.find((a) => a.key === t.key); return <tr key={t.key} className="border-b border-border"><th scope="row" className="p-3 font-normal">{t.label}</th><td className="p-3 tabular-nums">{t.correct}/{t.total}</td><td className="p-3 tabular-nums">{after?.correct}/{after?.total}</td></tr>; })}<tr className="border-b border-border font-semibold"><th scope="row" className="p-3">Total</th><td className="p-3">{report.baseline.correct}/{report.baseline.total}</td><td className="p-3">{report.retest.correct}/{report.retest.total}</td></tr></tbody></table></div>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-2">{report.assessmentMethod}</p>
    <section className="mt-9 border-t border-border pt-6"><h3 className="text-xl font-semibold">{report.challenge.title}</h3><p className="mt-3 font-medium">{report.challenge.evidence.passedTests}/{report.challenge.evidence.totalTests} automated tests passed · {report.challenge.evidence.language} · task v{report.challenge.evidence.taskVersion}</p><p className="mt-2 text-sm text-text-2">Submitted {new Date(report.challenge.evidence.submittedAt).toLocaleString("en-IN", { timeZone: "UTC" })} UTC. {assistanceLabels[report.challenge.notes.assistance]}.</p><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-2">{report.reviewMethod}</p>
      {([ ["Explanation", report.challenge.notes.explanation], ["SQL and index proposal", report.challenge.notes.sql], ["Regression test plan", report.challenge.notes.tests] ] as const).map(([label, content]) => <section key={label} className="mt-6"><h4 className="font-medium">{label} <span className="font-normal text-text-3">· candidate-authored</span></h4><p className="mt-2 max-w-3xl whitespace-pre-wrap break-words text-sm leading-relaxed text-text-2">{content}</p></section>)}
      <details className="mt-7 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-medium">Evidence identifiers</summary><dl className="space-y-3 text-xs text-text-2">{[["Submission", report.challenge.evidence.submissionId], ["Test bank SHA-256", report.challenge.evidence.suiteHash], ["Submitted code SHA-256", report.challenge.evidence.codeHash]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="mt-1 break-all font-mono">{value}</dd></div>)}</dl></details>
    </section>
  </article>;
}
function ShareControls({ state, run, busy }: Readonly<{ state: SprintState; run: Run; busy: boolean }>) {
  const [consent, setConsent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const shareUrl = state.share && typeof window !== "undefined" ? `${window.location.origin}/proof/${state.share.token}` : "";
  return <section className="border-t border-border py-7 print:hidden"><h3 className="text-xl font-semibold">Share on your terms</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-2">A public link includes everything in this report: your display name, results, written answers and assistance declaration. It excludes your email and source code. Anyone with the link can read or copy it. Links expire after 30 days; revoking a link cannot remove copies someone already saved.</p>
    {!state.share ? <><label className="mt-5 flex max-w-2xl items-start gap-3 text-sm"><input className="mt-1 accent-accent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I have reviewed this report and want to make it accessible to anyone with its link.</span></label><Button className="mt-4" disabled={!consent || busy} onClick={() => void run("share", { consent: true })}>Create public link</Button></> : <div className="mt-5"><label className="block text-sm font-medium">Public report link<input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className={`${field} max-w-2xl block`} /></label><div className="mt-3 flex flex-wrap gap-3"><Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? "Link copied" : "Copy link"}</Button><a href={`/proof/${state.share.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-3 text-sm underline underline-offset-4">Open public report</a><Button variant="secondary" disabled={busy} onClick={async () => { if (await run("share", undefined, "DELETE")) { setConsent(false); setCopied(false); } }}>Revoke link</Button></div><output className="block mt-3 text-sm text-text-3" >{copyError ? "Copy wasn't available. Select and copy the link above." : `Link expires ${new Date(state.share.expiresAt).toLocaleDateString()}.`}</output></div>}
    <Button variant="secondary" className="mt-5" onClick={() => window.print()}>Print or save as PDF</Button>
  </section>;
}

function draftStatus(saved: boolean, dirty: boolean) {
  if (saved) return "Draft saved. You can return later.";
  return dirty ? "You have unsaved written changes." : "Written drafts are private until you choose to share your completed report.";
}
