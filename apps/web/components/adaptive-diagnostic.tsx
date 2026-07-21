"use client";
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

type Q = { id: string; topic: string; area: string; difficulty: string; prompt: string; choices: string[] };
type Res = {
  correct: boolean | null; correctIndex: number | null; level: number;
  next: Q | null; answered: number; total: number; done: boolean; boundary: string;
};

const LETTERS = ["A", "B", "C", "D"];
const READ: Record<string, string> = {
  easy: "Solid on fundamentals — medium-difficulty patterns are your next frontier.",
  medium: "You're medium-comfortable. Hard problems are the gap to top offers — drill them next.",
  hard: "You're operating at hard difficulty. Now sharpen speed and edge-case rigour.",
};
const tone = (d: string): "easy" | "medium" | "hard" => { if (d === "easy") { return "easy"; } if (d === "medium") { return "medium"; } return "hard"; };

/**
 * Adaptive diagnostic — the Assessment differentiator. Questions harden on a
 * correct answer and soften on a wrong one, converging on the student's exact
 * mastery boundary in ~12 questions instead of a flat quiz.
 */
export function AdaptiveDiagnostic({ onExit }: Readonly<{ onExit: () => void }>) {
  const action = useApiAction();
  const [q, setQ] = useState<Q | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [answered, setAnswered] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [boundary, setBoundary] = useState("medium");
  const [trend, setTrend] = useState<"up" | "down" | null>(null);

  const post = useCallback(
    (payload: object) => action<Res>("/assessment/adaptive", { method: "POST", body: JSON.stringify(payload) }),
    [action],
  );

  useEffect(() => {
    post({ seen: [], level: 1 }).then((d) => { setQ(d.next); setLevel(d.level); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function answer(choice: number) {
    if (!q || busy) { return; }
    setBusy(true);
    const nextSeen = [...seen, q.id];
    try {
      const d = await post({ seen: nextSeen, level, current: { questionId: q.id, choice } });
      setTrend(d.correct ? "up" : "down");
      setSeen(nextSeen); setLevel(d.level); setAnswered(d.answered);
      if (d.done || !d.next) { setDone(true); setBoundary(d.boundary); }
      else setQ(d.next);
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card text-center">
        <div className="text-xs font-mono uppercase tracking-widest text-text-3">Diagnostic complete</div>
        <div className="mt-3 font-display text-2xl font-bold">Your mastery boundary: <span className="text-brand capitalize">{boundary}</span></div>
        <p className="text-text-3 text-sm mt-2 max-w-md mx-auto leading-relaxed">{READ[boundary]}</p>
        <button onClick={onExit} className="mt-6 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium">Done</button>
      </div>
    );
  }
  if (!q) { return <div className="rounded-2xl border border-border bg-surface p-8 shadow-card text-text-3 text-sm">Loading diagnostic…</div>; }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-3">Question {answered + 1} of 12</span>
        <span className="flex items-center gap-2">
          <Badge tone={tone(q.difficulty)}>{q.difficulty}</Badge>
          {trend && <span className={`text-xs ${trend === "up" ? "text-easy" : "text-medium"}`}>{trend === "up" ? "harder ↑" : "easier ↓"}</span>}
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${(answered / 12) * 100}%` }} />
      </div>

      <p className="mt-5 text-text-1 font-medium">{q.prompt}</p>
      <div className="mt-4 grid gap-2">
        {q.choices.map((c, i) => (
          <button key={i} disabled={busy} onClick={() => answer(i)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-accent hover:bg-surface-2 text-left text-sm transition-colors disabled:opacity-50">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-3 text-text-3 font-mono text-xs font-bold">{LETTERS[i]}</span>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
