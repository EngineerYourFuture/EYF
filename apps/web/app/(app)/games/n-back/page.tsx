"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Button, Badge } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

const LETTERS = ["A","B","C","D","E","F","G","H","J","K","L"];
const TRIALS = 25;
const SHOW_MS = 700;
const ISI_MS  = 1500;
const N = 2;

export default function Page() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [trial, setTrial] = useState(0);
  const [letter, setLetter] = useState<string | null>(null);
  const [tabSwitch, setTabSwitch] = useState(0);
  const sequenceRef = useRef<string[]>([]);
  const respondedRef = useRef(false);
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejects: 0 });
  const sessionStart = useRef(0);
  const action = useApiAction();

  useEffect(() => {
    function onBlur() { setTabSwitch((n) => n + 1); }
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running || e.code !== "Space") { return; }
      if (respondedRef.current) { return; }
      respondedRef.current = true;
      const idx = sequenceRef.current.length - 1;
      const isMatch = idx >= N && sequenceRef.current[idx] === sequenceRef.current[idx - N];
      if (isMatch) statsRef.current.hits += 1;
      else statsRef.current.falseAlarms += 1;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  async function run() {
    setRunning(true); setDone(false);
    setTrial(0); statsRef.current = { hits: 0, misses: 0, falseAlarms: 0, correctRejects: 0 };
    sequenceRef.current = [];
    sessionStart.current = Date.now();
    for (let i = 0; i < TRIALS; i++) {
      respondedRef.current = false;
      const isMatch = i >= N && Math.random() < 0.3;
      const ch = isMatch
        ? sequenceRef.current[i - N]!
        : LETTERS[Math.floor(Math.random() * LETTERS.length)]!;
      sequenceRef.current.push(ch);
      setLetter(ch); setTrial(i + 1);
      await sleep(SHOW_MS);
      setLetter(null);
      await sleep(ISI_MS);
      // grade past-trial silence
      const idx = sequenceRef.current.length - 1;
      const wasMatch = idx >= N && sequenceRef.current[idx] === sequenceRef.current[idx - N];
      if (!respondedRef.current) {
        if (wasMatch) statsRef.current.misses += 1;
        else statsRef.current.correctRejects += 1;
      }
    }
    setRunning(false); setDone(true);
    submit();
  }

  async function submit() {
    const s = statsRef.current;
    const total = s.hits + s.misses + s.falseAlarms + s.correctRejects;
    const accuracy = total === 0 ? 0 : ((s.hits + s.correctRejects) / total) * 100;
    const score = Math.round(s.hits * 100 - s.falseAlarms * 50);
    try {
      await action("/cognitive/sessions", {
        method: "POST",
        body: JSON.stringify({
          game: "N_BACK",
          score: Math.max(0, score),
          accuracyPct: Math.round(accuracy),
          tabSwitchCount: tabSwitch,
          durationSeconds: Math.round((Date.now() - sessionStart.current) / 1000),
        }),
      });
    } catch { /* swallow */ }
  }

  const s = statsRef.current;
  const acc = s.hits + s.misses + s.falseAlarms + s.correctRejects;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">2-Back</h1>
      <p className="text-text-3 mt-2">Press <kbd className="font-mono bg-surface border border-border px-1.5 py-0.5 rounded">SPACE</kbd> when the current letter matches the one shown 2 steps ago.</p>

      <Card className="mt-10 h-72 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-[8rem] leading-none">
            {(() => { if (running) { return letter ?? "•"; } if (done) { return "✓"; } return "—"; })()}
          </div>
          {running && <div className="mt-2 text-text-3">Trial {trial}/{TRIALS}</div>}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        {!running && !done && <Button onClick={run}>Start</Button>}
        {done && <Button onClick={run}>Play again</Button>}
        {tabSwitch > 0 && <Badge tone="hard">Tab switches: {tabSwitch}</Badge>}
      </div>

      {done && (
        <Card className="mt-6">
          <h3 className="font-display text-lg font-bold mb-2">Result</h3>
          <Row label="Hits"            value={s.hits} />
          <Row label="Misses"          value={s.misses} />
          <Row label="False alarms"    value={s.falseAlarms} />
          <Row label="Correct rejects" value={s.correctRejects} />
          <Row label="Accuracy"        value={`${Math.round(((s.hits + s.correctRejects) / Math.max(1, acc)) * 100)}%`} />
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: number | string }>) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-text-3">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
