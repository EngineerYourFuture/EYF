"use client";
/**
 * Stroop — color naming under interference. Word is a color name; ink is a
 * different color. Tap the INK color. 20 trials, accuracy + RT scored.
 */
import { useEffect, useRef, useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

const COLORS = [
  { name: "RED",    hex: "#FF4500" },
  { name: "GREEN",  hex: "#00FF87" },
  { name: "BLUE",   hex: "#4D9DFF" },
  { name: "YELLOW", hex: "#E8FF47" },
] as const;

const TRIALS = 20;

export default function Page() {
  const [trial, setTrial] = useState(0);
  const [word, setWord] = useState<typeof COLORS[number]>(COLORS[0]!);
  const [ink, setInk]   = useState<typeof COLORS[number]>(COLORS[1]!);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [tabSwitch, setTabSwitch] = useState(0);
  const stats = useRef({ hits: 0, rts: [] as number[] });
  const tStart = useRef(0);
  const sStart = useRef(0);
  const action = useApiAction();

  useEffect(() => {
    const onBlur = () => setTabSwitch((n) => n + 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  function present(i: number) {
    if (i >= TRIALS) { finish(); return; }
    setTrial(i);
    // 70% of trials are incongruent (word ≠ ink) — the hard case.
    let w = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    let nk = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    if (Math.random() < 0.7) while (nk.name === w.name) nk = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    else nk = w;
    setWord(w); setInk(nk);
    tStart.current = performance.now();
  }

  function answer(choice: typeof COLORS[number]) {
    const rt = performance.now() - tStart.current;
    stats.current.rts.push(rt);
    if (choice.name === ink.name) stats.current.hits += 1;
    present(trial + 1);
  }

  function start() {
    setRunning(true); setDone(false);
    stats.current = { hits: 0, rts: [] };
    sStart.current = Date.now();
    present(0);
  }

  async function finish() {
    setRunning(false); setDone(true);
    const avgRt = stats.current.rts.reduce((a, b) => a + b, 0) / Math.max(1, stats.current.rts.length);
    const accuracy = (stats.current.hits / TRIALS) * 100;
    const score = Math.round(stats.current.hits * 50 - Math.min(300, avgRt / 2));
    try {
      await action("/cognitive/sessions", {
        method: "POST",
        body: JSON.stringify({
          game: "STROOP",
          score: Math.max(0, score),
          accuracyPct: Math.round(accuracy),
          tabSwitchCount: tabSwitch,
          durationSeconds: Math.round((Date.now() - sStart.current) / 1000),
        }),
      });
    } catch { /* swallow */ }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Stroop</h1>
      <p className="text-text-3 mt-2">Tap the <b>ink</b> color — ignore what the word says.</p>

      <div className="mt-6 flex items-center gap-3">
        <Badge>Trial {Math.min(trial + (running ? 1 : 0), TRIALS)}/{TRIALS}</Badge>
        {tabSwitch > 0 && <Badge tone="hard">Tab switches: {tabSwitch}</Badge>}
      </div>

      <Card className="mt-6">
        {!running && !done && <div className="text-center py-12"><Button onClick={start}>Start</Button></div>}

        {running && (
          <>
            <div className="text-center py-12">
              <div className="font-display font-bold tracking-wide" style={{ fontSize: 64, color: ink.hex }}>{word.name}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <Button key={c.name} onClick={() => answer(c)} variant="secondary">
                  <span style={{ color: c.hex }}>{c.name}</span>
                </Button>
              ))}
            </div>
          </>
        )}

        {done && (
          <div className="text-center py-8">
            <div className="font-display text-5xl font-bold">{stats.current.hits}<span className="text-text-3 text-2xl">/{TRIALS}</span></div>
            <div className="text-text-3 text-sm mt-2">Avg RT: {Math.round(stats.current.rts.reduce((a, b) => a + b, 0) / Math.max(1, stats.current.rts.length))}ms</div>
            <Button className="mt-4" onClick={start}>Play again</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
