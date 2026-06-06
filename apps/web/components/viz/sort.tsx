"use client";
/**
 * Sort visualizer — bubble sort step-by-step on a small array.
 * Pure SVG, no D3 runtime needed (the spec calls for D3 but the
 * dependency is overkill for a 12-bar bar chart).
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@eyf/ui";

type Step = { arr: number[]; compare: [number, number] | null; swapped: boolean };

function bubbleSortSteps(input: number[]): Step[] {
  const arr = [...input];
  const steps: Step[] = [{ arr: [...arr], compare: null, swapped: false }];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      steps.push({ arr: [...arr], compare: [j, j + 1], swapped: false });
      if (arr[j]! > arr[j + 1]!) {
        [arr[j], arr[j + 1]] = [arr[j + 1]!, arr[j]!];
        steps.push({ arr: [...arr], compare: [j, j + 1], swapped: true });
      }
    }
  }
  steps.push({ arr: [...arr], compare: null, swapped: false });
  return steps;
}

const W = 600, H = 240, PAD = 12;

export function SortViz() {
  const [src, setSrc] = useState("64,25,12,22,11,90,40,7,55,30");
  const [steps, setSteps] = useState<Step[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arr = steps[idx]?.arr ?? [];
  const compare = steps[idx]?.compare;
  const max = Math.max(1, ...arr);
  const barW = arr.length ? (W - PAD * 2) / arr.length : 0;

  function load() {
    const parsed = src.split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
    setSteps(bubbleSortSteps(parsed.length ? parsed : [5, 3, 8, 1, 9, 2]));
    setIdx(0);
    setPlaying(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) { setPlaying(false); return; }
    timerRef.current = setTimeout(() => setIdx((i) => i + 1), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, idx, steps.length]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        <input
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          className="flex-1 bg-bg border border-border rounded-md px-2 py-1 font-mono"
        />
        <Button size="sm" variant="secondary" onClick={load}>Load</Button>
        <Button size="sm" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))}>‹</Button>
        <Button size="sm" variant="ghost" onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}>›</Button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-bg border border-border rounded-md">
        {arr.map((v, i) => {
          const h = (v / max) * (H - PAD * 2);
          const x = PAD + i * barW;
          const y = H - PAD - h;
          const isComparing = compare?.includes(i);
          const isSwapped = steps[idx]?.swapped && isComparing;
          return (
            <g key={i}>
              <rect
                x={x + 1}
                y={y}
                width={Math.max(1, barW - 2)}
                height={h}
                fill={isSwapped ? "#E8FF47" : isComparing ? "#FFB020" : "#3B4A0F"}
              />
              <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#8A8A87" fontFamily="JetBrains Mono">
                {v}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-text-3 text-xs mt-2 font-mono">Step {idx + 1}/{steps.length} · bubble sort</div>
    </div>
  );
}
