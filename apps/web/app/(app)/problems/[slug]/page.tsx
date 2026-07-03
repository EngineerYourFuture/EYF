"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { EditorialPanel } from "@/components/editorial-panel";
import { BackButton } from "@/components/back-button";
import { useTheme } from "@/components/theme";
import { track, Events } from "@/lib/analytics";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Lang = "CPP" | "JAVA" | "PYTHON" | "JAVASCRIPT" | "TYPESCRIPT";
const MONACO_LANG: Record<Lang, string> = {
  CPP: "cpp", JAVA: "java", PYTHON: "python", JAVASCRIPT: "javascript", TYPESCRIPT: "typescript",
};

type Problem = {
  id: string; slug: string; title: string; description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  patterns: string[]; companies: string[];
  starterCode: { language: Lang; code: string }[];
  testCases: { input: string; expected: string }[];
};

type Submission = {
  id: string;
  verdict: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT" | "MEMORY_LIMIT" | "RUNTIME_ERROR" | "COMPILE_ERROR" | "INTERNAL_ERROR";
  passedTests?: number; totalTests?: number;
  runtimeMs?: number | null; memoryKb?: number | null;
  errorMsg?: string | null;
};

const tone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

export default function Page({ params }: { params: { slug: string } }) {
  const { data: problem } = useApi<Problem>(`/problems/${params.slug}`);
  const { theme } = useTheme();
  const [lang, setLang] = useState<Lang>("CPP");
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);
  // Blind mode — no tags/hints/difficulty, timer always on. Real-interview reps.
  const blind = useSearchParams().get("blind") === "1";
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!blind) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [blind]);
  const action = useApiAction();

  useEffect(() => {
    const starter = problem?.starterCode.find((s) => s.language === lang);
    if (starter && !code) setCode(starter.code);
  }, [problem, lang, code]);

  const { data: submission, mutate: refreshSub } = useApi<Submission>(
    pendingId ? `/submissions/${pendingId}` : null,
    {
      // Stop polling once judged — or after we've given up waiting.
      refreshInterval: (s) => (stalled || (s && s.verdict !== "PENDING") ? 0 : 1500),
    },
  );

  // If the judge never reports back (worker/Judge0 down), don't hang forever.
  useEffect(() => {
    if (!pendingId) { setStalled(false); return; }
    setStalled(false);
    const t = setTimeout(() => setStalled(true), 30000);
    return () => clearTimeout(t);
  }, [pendingId]);
  useEffect(() => {
    if (submission && submission.verdict !== "PENDING") setStalled(false);
  }, [submission?.verdict]); // eslint-disable-line react-hooks/exhaustive-deps

  const judging = submission?.verdict === "PENDING" && !stalled;

  async function onSubmit() {
    if (!problem) return;
    setStalled(false);
    const res = await action<{ id: string }>("/submissions", {
      method: "POST",
      body: JSON.stringify({ problemSlug: problem.slug, language: lang, code }),
    });
    track(Events.SubmissionCreated, { slug: problem.slug, language: lang, difficulty: problem.difficulty });
    setPendingId(res.id);
    setTimeout(() => refreshSub(), 200);
  }

  if (!problem) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-screen lg:divide-x divide-border">
      {/* Problem panel */}
      <div className="overflow-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 border-b border-border lg:border-b-0">
        <BackButton className="mb-4" />
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{problem.title}</h1>
          {!blind && <Badge tone={tone[problem.difficulty]}>{problem.difficulty}</Badge>}
          {blind && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/[0.06] px-2.5 py-1 font-mono text-sm text-brand tabular-nums">
              ● {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        {blind ? (
          <div className="mt-3 text-xs font-mono uppercase tracking-wider text-text-4">Blind mode · no tags, no hints — commit like the real thing</div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {problem.patterns.map((p) => (
              <Badge key={p} tone="accent">{p}</Badge>
            ))}
            {problem.companies?.map((c) => <Badge key={c}>{c}</Badge>)}
          </div>
        )}
        <div className="mt-6 text-text-2 whitespace-pre-wrap leading-relaxed">
          {problem.description}
        </div>

        {problem.testCases.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg font-bold mb-3">Example</h3>
            <pre className="bg-surface p-4 rounded-md font-mono text-sm overflow-auto">
              <span className="text-text-3">Input:  </span>{problem.testCases[0]!.input}
              {"\n"}
              <span className="text-text-3">Output: </span>{problem.testCases[0]!.expected}
            </pre>
          </div>
        )}

        {!blind && <EditorialPanel slug={problem.slug} />}
      </div>

      {/* Editor + verdict panel */}
      <div className="flex flex-col h-[70vh] lg:h-auto bg-surface/30">
        <div className="border-b border-border px-4 sm:px-6 h-12 flex items-center gap-3 bg-surface-2/60">
          <label className="text-xs text-text-3 uppercase tracking-wider hidden sm:inline">Language</label>
          <select
            value={lang}
            onChange={(e) => { setLang(e.target.value as Lang); setCode(""); }}
            className="bg-surface border border-border rounded-md px-2 h-8 text-sm focus:outline-none focus:border-accent"
          >
            {(Object.keys(MONACO_LANG) as Lang[]).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="ml-auto">
            <Button size="sm" glow onClick={onSubmit} disabled={judging}>
              {judging ? "Judging…" : "Submit"}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <MonacoEditor
            theme={theme === "light" ? "light" : "vs-dark"}
            language={MONACO_LANG[lang]}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        </div>

        {submission && (
          <div className="border-t border-border px-4 sm:px-6 py-4 bg-surface-2/60">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-text-3 uppercase tracking-wider">Verdict</span>
              <Badge tone={
                submission.verdict === "ACCEPTED" ? "easy" :
                submission.verdict === "PENDING" ? (stalled ? "medium" : "default") : "hard"
              }>
                {submission.verdict === "PENDING" ? (stalled ? "Timed out" : "Judging…") : submission.verdict.replace(/_/g, " ")}
              </Badge>
              {stalled && (
                <span className="text-text-3 text-sm">The judge didn&apos;t respond — it may be offline. Submit again to retry.</span>
              )}
              {submission.totalTests ? (
                <span className="text-text-3 text-sm font-mono">
                  {submission.passedTests}/{submission.totalTests} tests
                </span>
              ) : null}
              {submission.runtimeMs != null && (
                <span className="text-text-3 text-sm font-mono">{submission.runtimeMs}ms</span>
              )}
            </div>
            {submission.errorMsg && (
              <pre className="mt-3 text-xs text-hard font-mono overflow-auto max-h-24 bg-hard/5 border border-hard/20 rounded-md p-3">
                {submission.errorMsg}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
