"use client";
/**
 * GitHub-style activity heatmap. Pure SVG, no deps.
 * Expects 365 days of {date, problemsSolved}.
 */
type Day = { date: string; problemsSolved: number };

const CELL = 12;
const GAP = 3;
const WEEKS = 53;

export function Heatmap({ days }: Readonly<{ days: Day[] }>) {
  const byDate = new Map(days.map((d) => [d.date.slice(0, 10), d.problemsSolved]));
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 365);
  while (start.getUTCDay() !== 0) start.setUTCDate(start.getUTCDate() - 1); // back to Sun

  const cells: { x: number; y: number; count: number; date: string }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + w * 7 + d);
      if (day > new Date()) continue;
      const key = day.toISOString().slice(0, 10);
      cells.push({ x: w * (CELL + GAP), y: d * (CELL + GAP), count: byDate.get(key) ?? 0, date: key });
    }
  }

  // Theme-aware ramp via Tailwind fill utilities (adapts dark↔light).
  const tone = (n: number) => {
    if (n === 0) return "fill-surface-3";
    if (n < 2) return "fill-accent/25";
    if (n < 5) return "fill-accent/50";
    if (n < 9) return "fill-accent/75";
    return "fill-accent";
  };

  return (
    <div className="overflow-x-auto">
      <svg
        width={WEEKS * (CELL + GAP)}
        height={7 * (CELL + GAP)}
        className="block"
      >
        {cells.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x} y={c.y}
            width={CELL} height={CELL} rx={2}
            className={tone(c.count)}
          >
            <title>{c.date}: {c.count} solved</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}
