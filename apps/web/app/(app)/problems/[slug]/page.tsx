"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { EditorialPanel } from "@/components/editorial-panel";
import { BackButton } from "@/components/back-button";
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
  const [lang, setLang] = useState<Lang>("CPP");
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const action = useApiAction();

  useEffect(() => {
    const starter = problem?.starterCode.find((s) => s.language === lang);
    if (starter && !code) setCode(starter.code);
  }, [problem, lang, code]);

  const { data: submission, mutate: refreshSub } = useApi<Submission>(
    pendingId ? `/submissions/${pendingId}` : null,
    {
      refreshInterval: (s) => (s && s.verdict !== "PENDING" ? 0 : 1500),
    },
  );

  async function onSubmit() {
    if (!problem) return;
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
          <Badge tone={tone[problem.difficulty]}>{problem.difficulty}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {problem.patterns.map((p) => (
            <Badge key={p} tone="accent">{p}</Badge>
          ))}
        </div>
        <div className="mt-6 prose prose-invert text-text-2 whitespace-pre-wrap leading-relaxed">
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

        <EditorialPanel slug={problem.slug} />
      </div>

      {/* Editor + verdict panel */}
      <div className="flex flex-col h-[70vh] lg:h-auto">
        <div className="border-b border-border px-4 sm:px-6 h-12 flex items-center gap-3">
          <label className="text-xs text-text-3 uppercase tracking-wider">Language</label>
          <select
            value={lang}
            onChange={(e) => { setLang(e.target.value as Lang); setCode(""); }}
            className="bg-surface border border-border rounded-md px-2 py-1 text-sm"
          >
            {(Object.keys(MONACO_LANG) as Lang[]).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="ml-auto">
            <Button size="sm" onClick={onSubmit} disabled={submission?.verdict === "PENDING"}>
              {submission?.verdict === "PENDING" ? "Judging…" : "Submit"}
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <MonacoEditor
            theme="vs-dark"
            language={MONACO_LANG[lang]}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {submission && (
          <div className="border-t border-border px-6 py-5 bg-surface/40">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-3 uppercase tracking-wider">Verdict</span>
              <span className={
                submission.verdict === "ACCEPTED" ? "text-easy font-bold" :
                submission.verdict === "PENDING"  ? "text-text-3"           :
                "text-hard font-bold"
              }>
                {submission.verdict}
              </span>
              {submission.totalTests ? (
                <span className="text-text-3 text-sm">
                  {submission.passedTests}/{submission.totalTests} tests
                </span>
              ) : null}
              {submission.runtimeMs != null && (
                <span className="text-text-3 text-sm">{submission.runtimeMs}ms</span>
              )}
            </div>
            {submission.errorMsg && (
              <pre className="mt-3 text-xs text-hard font-mono overflow-auto max-h-24">
                {submission.errorMsg}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
