"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Button, Badge } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

type Phase = "idle" | "waiting" | "go" | "tooSoon" | "done";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [tabSwitch, setTabSwitch] = useState(0);
  const startedAtRef = useRef(0);
  const goTsRef      = useRef(0);
  const sessionStart = useRef(Date.now());
  const action = useApiAction();

  const ROUNDS = 5;

  useEffect(() => {
    function onBlur() { setTabSwitch((n) => n + 1); }
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  function start() {
    setPhase("waiting");
    const delay = 1200 + Math.random() * 2500;
    setTimeout(() => {
      goTsRef.current = performance.now();
      setPhase("go");
    }, delay);
  }

  function onClick() {
    if (phase === "waiting") { setPhase("tooSoon"); return; }
    if (phase === "go") {
      const ms = Math.round(performance.now() - goTsRef.current);
      const next = [...times, ms];
      setTimes(next);
      const r = round + 1;
      setRound(r);
      if (r >= ROUNDS) {
        setPhase("done");
        submit(next);
      } else {
        start();
      }
    } else if (phase === "tooSoon") {
      start();
    } else if (phase === "idle" || phase === "done") {
      setTimes([]); setRound(0); sessionStart.current = Date.now(); start();
    }
  }

  async function submit(arr: number[]) {
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    // Lower ms = higher score. 1000 - avg, clamped.
    const score = Math.max(0, 1000 - avg);
    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000);
    try {
      await action("/cognitive/sessions", {
        method: "POST",
        body: JSON.stringify({
          game: "REACTION",
          score,
          accuracyPct: 100,
          tabSwitchCount: tabSwitch,
          durationSeconds,
        }),
      });
    } catch { /* swallow — UI still shows */ }
    startedAtRef.current = 0;
  }

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  let bg: string;
  if (phase === "go") bg = "bg-easy";
  else if (phase === "waiting") bg = "bg-hard";
  else if (phase === "tooSoon") bg = "bg-medium";
  else bg = "bg-surface";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Reaction Time</h1>
      <p className="text-text-3 mt-2">Click as soon as the box turns green. 5 rounds. Don&apos;t jump the gun.</p>

      <button
        type="button"
        className={`mt-10 w-full cursor-pointer select-none rounded-xl border border-border h-80 flex items-center justify-center transition-colors ${bg}`}
        onClick={onClick}
      >
        <div className="text-center">
          {phase === "idle"    && <div className="font-display text-3xl">Click to start</div>}
          {phase === "waiting" && <div className="font-display text-3xl text-text-1">Wait for green…</div>}
          {phase === "go"      && <div className="font-display text-3xl text-bg">CLICK!</div>}
          {phase === "tooSoon" && <div className="font-display text-3xl text-bg">Too soon — click to retry</div>}
          {phase === "done"    && <div className="font-display text-3xl text-text-1">Avg {avg}ms</div>}
        </div>
      </button>

      <div className="mt-6 flex items-center gap-3">
        <Badge>Round {Math.min(round, ROUNDS)}/{ROUNDS}</Badge>
        {tabSwitch > 0 && <Badge tone="hard">Tab switches: {tabSwitch}</Badge>}
        {times.length > 0 && (
          <span className="text-text-3 text-sm font-mono">{times.join(" · ")} ms</span>
        )}
      </div>

      {phase === "done" && (
        <Card className="mt-8">
          <div className="font-mono text-xs text-text-3 uppercase">Score</div>
          <div className="mt-2 font-display text-5xl font-bold">{Math.max(0, 1000 - avg)}</div>
          <Button className="mt-4" onClick={onClick}>Play again</Button>
        </Card>
      )}
    </div>
  );
}
