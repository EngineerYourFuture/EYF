"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
const LANGS = Object.keys(MONACO_LANG) as Lang[];

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

// ── Layout + draft persistence (keyed per problem, survives refresh) ──
type Prefs = { splitPct: number; collapsed: boolean };
const PREFS_KEY = "eyf:solve-prefs";
const draftKey = (slug: string) => `eyf:solve:${slug}`;
const DEFAULT_PREFS: Prefs = { splitPct: 44, collapsed: false };
const clampSplit = (n: number) => Math.min(75, Math.max(25, n));

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
}

// Minimal inline icons (no dependency on the shared set, which lacks these).
const Icon = {
  collapse: (p: { className?: string }) => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={p.className} aria-hidden="true">
      <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  expand: (p: { className?: string }) => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={p.className} aria-hidden="true">
      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fullscreen: (p: { className?: string }) => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={p.className} aria-hidden="true">
      <path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reset: (p: { className?: string }) => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={p.className} aria-hidden="true">
      <path d="M4 10a6 6 0 1 1 1.8 4.3M4 10V6m0 4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Page() {
  const params = useParams<{ slug: string }>();
  const { data: problem } = useApi<Problem>(`/problems/${params.slug}`);
  const { theme } = useTheme();
  const [lang, setLang] = useState<Lang>("CPP");
  // Per-language buffers so switching language never discards work.
  const [byLang, setByLang] = useState<Partial<Record<Lang, string>>>({});
  const code = byLang[lang] ?? "";
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [isDesktop, setIsDesktop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);

  const blind = useSearchParams().get("blind") === "1";
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!blind) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [blind]);
  const action = useApiAction();

  // Restore saved layout + drafts once, on mount (client only).
  useEffect(() => {
    setPrefs(readJson<Prefs>(PREFS_KEY, DEFAULT_PREFS));
    const saved = readJson<{ lang?: Lang; byLang?: Partial<Record<Lang, string>> }>(draftKey(params.slug), {});
    if (saved.byLang) setByLang(saved.byLang);
    if (saved.lang && LANGS.includes(saved.lang)) setLang(saved.lang);
    setHydrated(true);
  }, [params.slug]);

  // Desktop breakpoint (drag-to-resize only applies ≥ lg).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Track native fullscreen so the toggle icon/state stays in sync (Esc exits).
  useEffect(() => {
    const on = () => setIsFull(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Seed the current language's buffer from starter code when it's still empty.
  useEffect(() => {
    if (!problem || !hydrated) return;
    setByLang((prev) => {
      if (prev[lang] != null) return prev;
      const starter = problem.starterCode.find((s) => s.language === lang)?.code ?? "";
      return { ...prev, [lang]: starter };
    });
  }, [problem, lang, hydrated]);

  // Autosave drafts (debounced) so a refresh never loses work.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => writeJson(draftKey(params.slug), { lang, byLang }), 400);
    return () => clearTimeout(t);
  }, [byLang, lang, hydrated, params.slug]);

  const persistPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    writeJson(PREFS_KEY, next);
  }, []);

  const { data: submission, mutate: refreshSub } = useApi<Submission>(
    pendingId ? `/submissions/${pendingId}` : null,
    { refreshInterval: (s) => (stalled || (s && s.verdict !== "PENDING") ? 0 : 1500) },
  );

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

  const onSubmit = useCallback(async () => {
    if (!problem || judging) return;
    setStalled(false);
    const res = await action<{ id: string }>("/submissions", {
      method: "POST",
      body: JSON.stringify({ problemSlug: problem.slug, language: lang, code: byLang[lang] ?? "" }),
    });
    track(Events.SubmissionCreated, { slug: problem.slug, language: lang, difficulty: problem.difficulty });
    setPendingId(res.id);
    setTimeout(() => refreshSub(), 200);
  }, [problem, judging, action, lang, byLang, refreshSub]);

  // Keep a live ref so the Monaco keybinding always calls the latest handler.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  function resetToStarter() {
    if (!problem) return;
    const starter = problem.starterCode.find((s) => s.language === lang)?.code ?? "";
    setByLang((prev) => ({ ...prev, [lang]: starter }));
  }

  async function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch { /* fullscreen unsupported / denied — no-op */ }
  }

  // Drag-to-resize the split (desktop only).
  function startDrag(e: React.PointerEvent) {
    if (!isDesktop) return;
    e.preventDefault();
    let latest = prefs.splitPct;
    const move = (ev: PointerEvent) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      latest = clampSplit(((ev.clientX - rect.left) / rect.width) * 100);
      setPrefs((p) => ({ ...p, splitPct: latest })); // live update, no disk write
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      persistPrefs({ ...prefs, splitPct: latest }); // persist once, on release
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  if (!problem) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  const collapsed = prefs.collapsed;
  const leftStyle = isDesktop && !collapsed ? { width: `${prefs.splitPct}%`, flex: "0 0 auto" as const } : undefined;

  return (
    <div ref={rootRef} className="flex flex-col lg:flex-row lg:h-screen bg-bg">
      {/* Problem panel */}
      {!collapsed && (
        <div
          style={leftStyle}
          className="overflow-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 border-b border-border lg:border-b-0 lg:border-r"
        >
          <div className="flex items-center justify-between gap-3">
            <BackButton className="mb-4" />
            <button
              type="button"
              onClick={() => persistPrefs({ ...prefs, collapsed: true })}
              aria-label="Collapse problem panel"
              title="Focus editor"
              className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-3 hover:text-text-1 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon.collapse />
            </button>
          </div>
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
      )}

      {/* Drag handle (desktop, only when the problem panel is visible) */}
      {isDesktop && !collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onPointerDown={startDrag}
          className="hidden lg:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border hover:bg-accent/60 transition-colors"
        >
          <span className="h-8 w-px bg-text-4/40" />
        </div>
      )}

      {/* Editor + verdict panel */}
      <div className="flex flex-col flex-1 min-h-0 h-[70vh] lg:h-auto bg-surface/30">
        <div className="border-b border-border px-3 sm:px-6 h-12 flex items-center gap-2 sm:gap-3 bg-surface-2/60">
          {collapsed && (
            <button
              type="button"
              onClick={() => persistPrefs({ ...prefs, collapsed: false })}
              aria-label="Show problem panel"
              title="Show problem"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-3 hover:text-text-1 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon.expand />
            </button>
          )}
          <label htmlFor="solve-lang" className="text-xs text-text-3 uppercase tracking-wider hidden sm:inline">Language</label>
          <select
            id="solve-lang"
            aria-label="Programming language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-surface border border-border rounded-md px-2 h-8 text-sm focus:outline-none focus:border-accent"
          >
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <button
            type="button"
            onClick={resetToStarter}
            aria-label="Reset code to starter"
            title="Reset to starter"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-3 hover:text-text-1 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon.reset />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFull ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFull}
            title={isFull ? "Exit fullscreen" : "Fullscreen"}
            className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-text-3 hover:text-text-1 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon.fullscreen />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline text-[11px] text-text-4 font-mono">⌘/Ctrl + ↵</span>
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
            onChange={(v) => setByLang((prev) => ({ ...prev, [lang]: v ?? "" }))}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => submitRef.current());
            }}
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
          <div className="border-t border-border px-4 sm:px-6 py-4 bg-surface-2/60" aria-live="polite">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-text-3 uppercase tracking-wider">Verdict</span>
              <Badge tone={(() => {
                if (submission.verdict === "ACCEPTED") return "easy" as const;
                if (submission.verdict === "PENDING") return stalled ? "medium" as const : "default" as const;
                return "hard" as const;
              })()}>
                {(() => {
                  if (submission.verdict === "PENDING") return stalled ? "Timed out" : "Judging…";
                  return submission.verdict.replaceAll("_", " ");
                })()}
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
