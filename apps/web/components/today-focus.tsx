"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const GOALS = [
  { key: "dsa",       label: "Crack DSA",      detail: "Solve problems in your weakest pattern.", href: "/problems" },
  { key: "interview", label: "Interview reps", detail: "Do a mock or an HR drill today.",         href: "/mocks" },
  { key: "core",      label: "Core CS",        detail: "Clear due flashcards + a weak concept.",  href: "/subjects" },
  { key: "aptitude",  label: "Aptitude speed", detail: "A timed MCQ set against the clock.",       href: "/mcq" },
  { key: "career",    label: "Career prep",    detail: "Sharpen your resume or work the pipeline.", href: "/resume" },
];
const keyFor = () => `eyf-today-focus-${new Date().toISOString().slice(0, 10)}`;

/**
 * Micro-commitment (spec 1.1) — pick ONE focus for the day so the day orients
 * around a single goal instead of a scattered list. Persists per-day locally.
 */
export function TodayFocus() {
  const [goal, setGoal] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { setGoal(localStorage.getItem(keyFor())); } catch { /* */ }
    setLoaded(true);
  }, []);

  const pick = (k: string) => { setGoal(k); try { localStorage.setItem(keyFor(), k); } catch { /* */ } };
  const reset = () => { setGoal(null); try { localStorage.removeItem(keyFor()); } catch { /* */ } };

  if (!loaded) return null;
  const g = GOALS.find((x) => x.key === goal);

  if (!g) {
    return (
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-5 sm:p-6">
        <div className="text-xs font-mono uppercase tracking-widest text-brand">Commit to one thing</div>
        <h2 className="font-display text-xl font-bold mt-1">What&apos;s your one focus today?</h2>
        <p className="text-text-3 text-sm mt-1">Pick a single goal and the day orients around it — beats a scattered to-do list.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GOALS.map((x) => (
            <button key={x.key} onClick={() => pick(x.key)}
              className="px-3.5 py-2 rounded-lg border border-border bg-surface text-sm hover:border-accent hover:bg-surface-2 transition-colors">
              {x.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-5 sm:p-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-brand">Today&apos;s focus</div>
        <h2 className="font-display text-xl font-bold mt-1">{g.label}</h2>
        <p className="text-text-3 text-sm mt-1">{g.detail}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Link href={g.href} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium">Start →</Link>
        <button onClick={reset} className="text-text-4 text-xs hover:text-text-2">Change</button>
      </div>
    </div>
  );
}
