"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageMotion } from "@/components/page-motion";

/**
 * Complexity Blitz (spec 1.7) — classify code fragments by Big-O against the
 * clock. Trains the instant complexity-recognition interviews demand. Self-
 * contained; best score persists locally. (Leaderboard/percentile hookup needs
 * a COMPLEXITY_BLITZ value added to the CognitiveGame enum — a follow-up.)
 */
const OPTS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"] as const;
type Comp = (typeof OPTS)[number];

const BANK: { code: string; answer: Comp }[] = [
  { code: "return a[0] + a[n - 1];", answer: "O(1)" },
  { code: "for (i = 0; i < n; i++)\n  sum += a[i];", answer: "O(n)" },
  { code: "while (n > 1) n = n / 2;", answer: "O(log n)" },
  { code: "for (i = 0; i < n; i++)\n  for (j = 0; j < n; j++)\n    x++;", answer: "O(n²)" },
  { code: "sort(a);  // comparison sort", answer: "O(n log n)" },
  { code: "int fib(n){ return fib(n-1) + fib(n-2); }", answer: "O(2ⁿ)" },
  { code: "map.get(key);  // hash map", answer: "O(1)" },
  { code: "binarySearch(sorted, target);", answer: "O(log n)" },
  { code: "for (i = 0; i < n; i++)\n  for (j = i; j < n; j++)\n    x++;", answer: "O(n²)" },
  { code: "for (i = 1; i < n; i *= 2)\n  x++;", answer: "O(log n)" },
  { code: "mergeSort(a);", answer: "O(n log n)" },
  { code: "let mid = a[a.length >> 1];", answer: "O(1)" },
  { code: "for (const x of a)\n  set.add(x);", answer: "O(n)" },
  { code: "subsets(a);  // all subsets", answer: "O(2ⁿ)" },
  { code: "heap.push(x); heap.pop();", answer: "O(log n)" },
  { code: "for (i=0;i<n;i++)\n  for (j=0;j<n;j++)\n    for (k=0;k<n;k++) x++;", answer: "O(n²)" },
];
const KEY = "eyf-complexity-blitz-best";
const DURATION = 60;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function Page() {
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [remaining, setRemaining] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const deck = useRef<{ code: string; answer: Comp }[]>([]);

  useEffect(() => { try { setBest(Number(localStorage.getItem(KEY) || 0)); } catch { /* */ } }, []);

  useEffect(() => {
    if (phase !== "play") return;
    if (remaining <= 0) { finish(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = deck.current[idx];
  const choices = useMemo(() => {
    if (!q) return [];
    const distract = shuffle(OPTS.filter((o) => o !== q.answer)).slice(0, 3);
    return shuffle([q.answer, ...distract]);
  }, [idx, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    deck.current = shuffle([...BANK, ...BANK]);
    setPhase("play"); setRemaining(DURATION); setScore(0); setStreak(0);
    setCorrect(0); setAttempts(0); setIdx(0); setFlash(null);
  }
  function answer(c: Comp) {
    if (!q || flash) return;
    const ok = c === q.answer;
    setAttempts((a) => a + 1);
    if (ok) {
      const bonus = 10 + Math.min(15, streak * 2);
      setScore((s) => s + bonus); setStreak((s) => s + 1); setCorrect((c2) => c2 + 1);
      setFlash("ok");
    } else { setStreak(0); setFlash("no"); }
    setTimeout(() => { setFlash(null); setIdx((i) => (i + 1) % deck.current.length); }, 220);
  }
  function finish() {
    setPhase("done");
    if (score > best) { setBest(score); try { localStorage.setItem(KEY, String(score)); } catch { /* */ } }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl mx-auto">
      <Link href="/games" className="text-text-4 text-sm hover:text-text-2">← All games</Link>
      <h1 className="font-display text-3xl font-bold tracking-tight mt-3">Complexity Blitz</h1>
      <p className="text-text-3 mt-1">Classify each fragment by Big-O before the clock runs out. Streaks multiply your score.</p>

      {phase === "ready" && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-text-2">60 seconds. As many fragments as you can. {best > 0 && <>Best: <span className="font-bold text-text-1">{best}</span></>}</p>
          <button onClick={start} className="mt-5 px-6 py-2.5 rounded-lg bg-brand text-white text-sm font-medium">Start</button>
        </div>
      )}

      {phase === "play" && q && (
        <>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className={`font-mono ${remaining <= 10 ? "text-hard" : "text-text-3"}`}>⏱ {remaining}s</span>
            <span className="text-text-3">Score <span className="font-bold text-text-1 tabular-nums">{score}</span>{streak > 1 && <span className="text-brand ml-2">×{streak} streak</span>}</span>
          </div>
          <div className={`mt-3 rounded-2xl border p-5 shadow-card transition-colors ${flash === "ok" ? "border-easy/60 bg-easy/[0.06]" : flash === "no" ? "border-hard/60 bg-hard/[0.06]" : "border-border bg-surface"}`}>
            <pre className="font-mono text-sm text-text-1 whitespace-pre-wrap leading-relaxed min-h-[72px]">{q.code}</pre>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {choices.map((c) => (
              <button key={c} onClick={() => answer(c)} disabled={!!flash}
                className="h-12 rounded-xl border border-border bg-surface font-mono text-sm hover:border-accent hover:bg-surface-2 transition-colors disabled:opacity-60">
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Time!</div>
          <div className="mt-2 font-display text-5xl font-bold tabular-nums">{score}</div>
          <p className="text-text-3 text-sm mt-2">{correct}/{attempts} correct · best {best}{score >= best && score > 0 ? " (new best!)" : ""}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={start} className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium">Play again</button>
            <Link href="/games" className="px-5 py-2.5 rounded-lg border border-border text-sm">Back to games</Link>
          </div>
        </div>
      )}
    </PageMotion>
  );
}
