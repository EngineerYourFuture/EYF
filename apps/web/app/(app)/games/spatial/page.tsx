"use client";
/**
 * Spatial — mental rotation. Show an L-tetromino at random rotation, ask
 * "is this the same shape as the reference, just rotated?" (mirrored versions
 * are the false case). 10 trials, accuracy + RT scored.
 */
import { useEffect, useRef, useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";

const TRIALS = 10;
const CELL = 30;

// L-tetromino as a set of (x,y) cells. Mirror = flip x.
const L = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }];

function rotate(cells: { x: number; y: number }[], times: number) {
  let out = cells;
  for (let i = 0; i < times; i++) out = out.map((c) => ({ x: c.y, y: -c.x }));
  // Normalise to positive quadrant.
  const minX = Math.min(...out.map((c) => c.x));
  const minY = Math.min(...out.map((c) => c.y));
  return out.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

function mirror(cells: { x: number; y: number }[]) {
  const maxX = Math.max(...cells.map((c) => c.x));
  return cells.map((c) => ({ x: maxX - c.x, y: c.y }));
}

function Tetromino({ cells, color = "#F5F5F5" }: { cells: { x: number; y: number }[]; color?: string }) {
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const w = (maxX + 1) * CELL;
  const h = (maxY + 1) * CELL;
  return (
    <svg width={w + 4} height={h + 4} className="block">
      {cells.map((c, i) => (
        <rect key={i}
          x={c.x * CELL + 2} y={c.y * CELL + 2}
          width={CELL - 2} height={CELL - 2}
          fill={color} rx={3}
        />
      ))}
    </svg>
  );
}

export default function Page() {
  const [trial, setTrial] = useState(0);
  const [reference] = useState(L);
  const [candidate, setCandidate] = useState<{ x: number; y: number }[]>([]);
  const [isSame, setIsSame] = useState(true);
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

  function nextTrial(i: number) {
    if (i >= TRIALS) { finish(); return; }
    setTrial(i);
    const rot = Math.floor(Math.random() * 4);
    const sameShape = Math.random() > 0.5;
    let c = rotate(reference, rot);
    if (!sameShape) c = rotate(mirror(reference), rot);
    setCandidate(c);
    setIsSame(sameShape);
    tStart.current = performance.now();
  }

  function answer(yes: boolean) {
    const rt = performance.now() - tStart.current;
    stats.current.rts.push(rt);
    if ((yes && isSame) || (!yes && !isSame)) stats.current.hits += 1;
    nextTrial(trial + 1);
  }

  function start() {
    setRunning(true); setDone(false);
    stats.current = { hits: 0, rts: [] };
    sStart.current = Date.now();
    nextTrial(0);
  }

  async function finish() {
    setRunning(false); setDone(true);
    const avgRt = stats.current.rts.reduce((a, b) => a + b, 0) / Math.max(1, stats.current.rts.length);
    const accuracy = (stats.current.hits / TRIALS) * 100;
    const score = Math.round(stats.current.hits * 100 - Math.min(500, avgRt));
    try {
      await action("/cognitive/sessions", {
        method: "POST",
        body: JSON.stringify({
          game: "SPATIAL",
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
      <h1 className="font-display text-3xl font-bold tracking-tight">Spatial · Mental Rotation</h1>
      <p className="text-text-3 mt-2">Is the right shape the same as the left, just rotated? Or is it mirrored?</p>

      <div className="mt-6 flex items-center gap-3">
        <Badge>Trial {Math.min(trial + (running ? 1 : 0), TRIALS)}/{TRIALS}</Badge>
        {tabSwitch > 0 && <Badge tone="hard">Tab switches: {tabSwitch}</Badge>}
      </div>

      <Card className="mt-6">
        {!running && !done && <div className="text-center"><Button onClick={start}>Start</Button></div>}

        {running && (
          <>
            <div className="flex items-center justify-around py-6">
              <Tetromino cells={reference} color="#8A8A87" />
              <span className="text-text-3 text-xl">vs</span>
              <Tetromino cells={candidate} />
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={() => answer(true)}>Same shape</Button>
              <Button variant="secondary" onClick={() => answer(false)}>Mirrored</Button>
            </div>
          </>
        )}

        {done && (
          <div className="text-center">
            <div className="font-display text-5xl font-bold">{stats.current.hits}<span className="text-text-3 text-2xl">/{TRIALS}</span></div>
            <div className="text-text-3 text-sm mt-2">Avg RT: {Math.round(stats.current.rts.reduce((a, b) => a + b, 0) / Math.max(1, stats.current.rts.length))}ms</div>
            <Button className="mt-4" onClick={start}>Play again</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
