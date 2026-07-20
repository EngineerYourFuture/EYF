"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

const GRID = 5;       // 5x5
const ROUNDS = 6;
const SHOW_MS_START = 2000;
const CELLS_PER_ROUND = (r: number) => 3 + r; // round 0 → 3 cells, … round 5 → 8

type Phase = "idle" | "showing" | "input" | "result" | "done";

export default function Page() {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pattern, setPattern] = useState<Set<number>>(new Set());
  const [picked,  setPicked]  = useState<Set<number>>(new Set());
  const [hits, setHits] = useState(0);
  const [tabSwitch, setTabSwitch] = useState(0);
  const sessionStart = useRef(0);
  const action = useApiAction();

  useEffect(() => {
    const onBlur = () => setTabSwitch((n) => n + 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  function startRound(r: number) {
    if (r === 0) { sessionStart.current = Date.now(); setHits(0); }
    setRound(r);
    setPicked(new Set());
    const cells = new Set<number>();
    while (cells.size < CELLS_PER_ROUND(r)) cells.add(Math.floor(Math.random() * GRID * GRID));
    setPattern(cells);
    setPhase("showing");
    setTimeout(() => setPhase("input"), Math.max(700, SHOW_MS_START - r * 200));
  }

  function pick(i: number) {
    if (phase !== "input") return;
    const next = new Set(picked);
    next.has(i) ? next.delete(i) : next.add(i);
    setPicked(next);
  }

  function submit() {
    if (phase !== "input") return;
    let correct = 0;
    for (const i of picked) if (pattern.has(i)) correct += 1;
    const roundScore = Math.max(0, correct - (picked.size - correct)); // penalise wrong picks
    setHits((h) => h + roundScore);
    setPhase("result");
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        finalize(hits + roundScore);
        setPhase("done");
      } else startRound(round + 1);
    }, 1200);
  }

  async function finalize(totalScore: number) {
    const accuracy = Math.min(100, Math.round((totalScore / ((3 + 4 + 5 + 6 + 7 + 8))) * 100));
    try {
      await action("/cognitive/sessions", {
        method: "POST",
        body: JSON.stringify({
          game: "PATTERN_RECALL",
          score: Math.max(0, totalScore * 50),
          accuracyPct: accuracy,
          tabSwitchCount: tabSwitch,
          durationSeconds: Math.round((Date.now() - sessionStart.current) / 1000),
        }),
      });
    } catch { /* swallow */ }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Pattern Recall</h1>
      <p className="text-text-3 mt-2">Memorize the highlighted cells. Recreate the pattern.</p>

      <div className="mt-6 flex items-center gap-3">
        <Badge>Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</Badge>
        <Badge tone="accent">{hits} hits</Badge>
        {tabSwitch > 0 && <Badge tone="hard">Tab switches: {tabSwitch}</Badge>}
      </div>

      <Card className="mt-6">
        <div
          className="grid mx-auto gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID}, 56px)`, width: GRID * 56 + (GRID - 1) * 8 }}
        >
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const isPattern = phase === "showing" && pattern.has(i);
            const isPicked  = picked.has(i);
            const isRight   = phase === "result" && pattern.has(i);
            const isWrongPick = phase === "result" && isPicked && !pattern.has(i);
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={phase !== "input"}
                className={`h-14 w-14 rounded-md border transition-colors ${(() => {
                  if (isWrongPick) return "bg-hard border-hard";
                  if (isRight) return "bg-easy border-easy";
                  if (isPattern) return "bg-accent border-accent";
                  if (isPicked) return "bg-accent-tint border-accent";
                  return "bg-surface border-border";
                })()}`}
              />
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          {phase === "idle" && <Button onClick={() => startRound(0)}>Start</Button>}
          {phase === "input" && <Button onClick={submit}>Submit</Button>}
          {phase === "showing" && <span className="text-text-3 text-sm">Memorizing…</span>}
          {phase === "result"  && <span className="text-text-3 text-sm">Next round in a moment…</span>}
          {phase === "done"    && <Button onClick={() => { setRound(0); setHits(0); setPhase("idle"); }}>Play again</Button>}
        </div>
      </Card>
    </div>
  );
}
