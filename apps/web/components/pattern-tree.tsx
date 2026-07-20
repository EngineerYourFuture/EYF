"use client";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { masteryBarClass } from "@/lib/ui-helpers";

type Mastery = { patterns: { pattern: string; total: number; solved: number; mastery: number }[] };

// Curated DSA prerequisite DAG — levels flow left→right, edges are prereqs.
const NODES: Record<string, { level: number; row: number; label: string }> = {
  "hash-map":           { level: 0, row: 0, label: "Hashing" },
  "binary-search":      { level: 0, row: 1, label: "Binary Search" },
  "linked-list":        { level: 0, row: 2, label: "Linked List" },
  "stack":              { level: 0, row: 3, label: "Stack" },
  "two-pointers":       { level: 1, row: 0, label: "Two Pointers" },
  "fast-slow-pointers": { level: 1, row: 2, label: "Fast / Slow" },
  "bfs":                { level: 1, row: 3, label: "BFS" },
  "dfs":                { level: 1, row: 1, label: "DFS" },
  "sliding-window":     { level: 2, row: 0, label: "Sliding Window" },
  "heap":               { level: 2, row: 1, label: "Heap" },
  "backtracking":       { level: 2, row: 2, label: "Backtracking" },
  "graph":              { level: 2, row: 3, label: "Graph" },
  "dp":                 { level: 3, row: 1, label: "DP" },
  "greedy":             { level: 3, row: 2, label: "Greedy" },
  "bitmask":            { level: 3, row: 3, label: "Bitmask" },
};
const EDGES: [string, string][] = [
  ["binary-search", "two-pointers"],
  ["linked-list", "fast-slow-pointers"],
  ["stack", "dfs"],
  ["two-pointers", "sliding-window"],
  ["dfs", "backtracking"],
  ["bfs", "graph"], ["dfs", "graph"],
  ["backtracking", "dp"],
];

const COL = 210, ROW = 68, NW = 150, NH = 50;
const W = 3 * COL + NW, H = 3 * ROW + NH;
const pos = (k: string) => ({ x: NODES[k]!.level * COL, y: NODES[k]!.row * ROW });
const toneCls = (m: number, has: boolean) => {
  if (!has) return "border-border bg-surface text-text-4";
  if (m >= 70) return "border-easy/50 bg-easy/[0.08] text-text-1";
  if (m >= 40) return "border-medium/50 bg-medium/[0.08] text-text-1";
  return "border-brand/50 bg-brand/[0.06] text-text-1";
};

/**
 * Pattern prerequisite tree — the Skill Graph differentiator. A DAG of the core
 * DSA patterns coloured by your mastery, so you see which weak *foundation* is
 * blocking everything downstream. Reuses /problems/mastery.
 */
export function PatternTree() {
  const { data } = useApi<Mastery>("/problems/mastery");
  if (!data) return null;
  const byPat = new Map(data.patterns.map((p) => [p.pattern, p]));

  // weakest node that is a prerequisite for others (has outgoing edges)
  const prereqs = new Set(EDGES.map(([a]) => a));
  const rootFix = [...prereqs]
    .map((k) => ({ k, label: NODES[k]?.label ?? k, m: byPat.get(k)?.mastery ?? 0 }))
    .filter((n) => NODES[n.k])
    .sort((a, b) => a.m - b.m)[0];

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <h2 className="font-display text-xl font-bold">Pattern prerequisite map</h2>
      <p className="text-text-3 text-sm mt-1 max-w-2xl">
        Patterns build on each other. A weak foundation caps everything downstream — fix roots first.
        {rootFix && rootFix.m < 70 && <> Your weakest root: <span className="text-brand font-medium">{rootFix.label}</span> ({rootFix.m}%).</>}
      </p>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="relative" style={{ width: W, height: H }}>
          <svg width={W} height={H} className="absolute inset-0 pointer-events-none">
            {EDGES.map(([a, b], i) => {
              const pa = pos(a), pb = pos(b);
              const x1 = pa.x + NW, y1 = pa.y + NH / 2, x2 = pb.x, y2 = pb.y + NH / 2;
              const mid = (x1 + x2) / 2;
              return <path key={i} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                fill="none" stroke="rgb(var(--text-1) / 0.14)" strokeWidth="1.5" />;
            })}
          </svg>
          {Object.keys(NODES).map((k) => {
            const p = byPat.get(k);
            const m = p?.mastery ?? 0;
            const { x, y } = pos(k);
            return (
              <Link key={k} href={`/problems?pattern=${k}`}
                className={`absolute rounded-lg border px-3 py-2 transition-colors hover:border-accent ${toneCls(m, !!p)}`}
                style={{ left: x, top: y, width: NW, height: NH }}>
                <div className="text-sm font-medium leading-tight truncate">{NODES[k]!.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full ${masteryBarClass(m)}`} style={{ width: `${Math.max(3, m)}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-text-4 shrink-0">{p ? `${p.solved}/${p.total}` : "—"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
