"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, Badge } from "@eyf/ui";
import { SortViz } from "@/components/viz/sort";
import { TreeViz } from "@/components/viz/tree";

const Recursion3D = dynamic(
  () => import("@/components/viz/recursion3d").then((m) => m.Recursion3D),
  { ssr: false, loading: () => <div className="h-96 grid place-items-center text-text-3">Loading 3D…</div> },
);
const Graph3D = dynamic(
  () => import("@/components/viz/graph3d").then((m) => m.Graph3D),
  { ssr: false, loading: () => <div className="h-96 grid place-items-center text-text-3">Loading 3D…</div> },
);

const TABS = [
  { id: "sort",       label: "Sorting" },
  { id: "tree",       label: "BST" },
  { id: "recursion3d", label: "Recursion (3D)" },
  { id: "graph3d",    label: "Graph (3D)" },
];

export default function Page() {
  const [tab, setTab] = useState("sort");
  const is3d = tab === "recursion3d" || tab === "graph3d";
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">Visualizer</h1>
        {is3d && <Badge tone="accent">3D · desktop</Badge>}
      </div>
      <p className="text-text-3 mt-2">Step through algorithms. Build intuition that survives the interview.</p>

      <div className="mt-8 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-accent text-text-1" : "border-transparent text-text-3 hover:text-text-2"
            }`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <Card className="mt-6">
        {tab === "sort"        && <SortViz />}
        {tab === "tree"        && <TreeViz />}
        {tab === "recursion3d" && <Recursion3D />}
        {tab === "graph3d"     && <Graph3D />}
      </Card>
    </div>
  );
}
