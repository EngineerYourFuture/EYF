"use client";
import { useState } from "react";
import { useApi } from "@/lib/use-api";

type Review = { allTopics: { subject: string; topic: string; mastery: number }[] };
type Node = { level: number; row: number; label: string };
type Subj = { label: string; nodes: Record<string, Node>; edges: [string, string][] };

// Curated theory prerequisite DAGs — concepts flow left→right; edges are prereqs.
const SUBJECTS: Record<string, Subj> = {
  OS: {
    label: "Operating Systems",
    nodes: {
      process: { level: 0, row: 0, label: "Process" }, memory: { level: 0, row: 2, label: "Memory" },
      threads: { level: 1, row: 0, label: "Threads" }, scheduling: { level: 1, row: 1, label: "Scheduling" }, vmem: { level: 1, row: 2, label: "Virtual Memory" },
      concurrency: { level: 2, row: 0, label: "Concurrency" }, paging: { level: 2, row: 2, label: "Paging" },
      deadlock: { level: 3, row: 0, label: "Deadlock" }, sync: { level: 3, row: 1, label: "Synchronization" },
    },
    edges: [["process", "threads"], ["process", "scheduling"], ["memory", "vmem"], ["threads", "concurrency"], ["vmem", "paging"], ["concurrency", "deadlock"], ["concurrency", "sync"]],
  },
  DBMS: {
    label: "Database Management",
    nodes: {
      relational: { level: 0, row: 0, label: "Relational Model" }, er: { level: 0, row: 2, label: "ER Model" },
      keys: { level: 1, row: 0, label: "Keys" }, sql: { level: 1, row: 1, label: "SQL" }, normalization: { level: 1, row: 2, label: "Normalization" },
      transactions: { level: 2, row: 0, label: "Transactions" }, indexing: { level: 2, row: 2, label: "Indexing" },
      acid: { level: 3, row: 0, label: "ACID" }, cc: { level: 3, row: 1, label: "Concurrency Control" }, recovery: { level: 3, row: 2, label: "Recovery" },
    },
    edges: [["relational", "keys"], ["relational", "sql"], ["keys", "normalization"], ["sql", "transactions"], ["sql", "indexing"], ["transactions", "acid"], ["transactions", "cc"], ["transactions", "recovery"]],
  },
  CN: {
    label: "Computer Networks",
    nodes: {
      osi: { level: 0, row: 0, label: "OSI Model" }, ip: { level: 0, row: 2, label: "IP Addressing" },
      tcp: { level: 1, row: 0, label: "TCP" }, udp: { level: 1, row: 1, label: "UDP" }, routing: { level: 1, row: 2, label: "Routing" },
      http: { level: 2, row: 0, label: "HTTP" }, dns: { level: 2, row: 2, label: "DNS" },
      congestion: { level: 3, row: 1, label: "Congestion" }, tls: { level: 3, row: 0, label: "TLS" },
    },
    edges: [["osi", "tcp"], ["osi", "udp"], ["ip", "routing"], ["tcp", "http"], ["ip", "dns"], ["tcp", "congestion"], ["http", "tls"]],
  },
  OOP: {
    label: "Object-Oriented Programming",
    nodes: {
      classes: { level: 0, row: 1, label: "Classes & Objects" },
      encapsulation: { level: 1, row: 0, label: "Encapsulation" }, inheritance: { level: 1, row: 1, label: "Inheritance" }, abstraction: { level: 1, row: 2, label: "Abstraction" },
      polymorphism: { level: 2, row: 1, label: "Polymorphism" }, interfaces: { level: 2, row: 2, label: "Interfaces" },
      patterns: { level: 3, row: 0, label: "Design Patterns" }, solid: { level: 3, row: 2, label: "SOLID" },
    },
    edges: [["classes", "encapsulation"], ["classes", "inheritance"], ["classes", "abstraction"], ["inheritance", "polymorphism"], ["abstraction", "interfaces"], ["polymorphism", "patterns"], ["polymorphism", "solid"]],
  },
};

const COL = 190, ROW = 66, NW = 150, NH = 48;
const pos = (n: Node) => ({ x: n.level * COL, y: n.row * ROW });
const W = 3 * COL + NW, H = 3 * ROW + NH;

export function ConceptMap() {
  const { data } = useApi<Review>("/subjects/review");
  const [subj, setSubj] = useState("OS");
  const s = SUBJECTS[subj]!;

  const mastery = new Map<string, number>();
  for (const t of data?.allTopics ?? []) mastery.set(`${t.subject}:${t.topic.toLowerCase()}`, t.mastery);
  const masteryOf = (label: string): number | null => {
    const key = label.toLowerCase();
    for (const [k, v] of mastery) if (k.startsWith(`${subj}:`) && (k.endsWith(key) || k.includes(key.split(" ")[0]!))) return v;
    return null;
  };

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">Concept map</h2>
          <p className="text-text-3 text-sm mt-1">Theory builds on itself — learn left to right. Coloured by your flashcard mastery.</p>
        </div>
        <select value={subj} onChange={(e) => setSubj(e.target.value)}
          className="h-9 px-3 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-accent">
          {Object.entries(SUBJECTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="relative" style={{ width: W, height: H }}>
          <svg width={W} height={H} className="absolute inset-0 pointer-events-none">
            {s.edges.map(([a, b], i) => {
              const pa = pos(s.nodes[a]!), pb = pos(s.nodes[b]!);
              const x1 = pa.x + NW, y1 = pa.y + NH / 2, x2 = pb.x, y2 = pb.y + NH / 2, mid = (x1 + x2) / 2;
              return <path key={i} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} fill="none" stroke="rgb(var(--text-1) / 0.14)" strokeWidth="1.5" />;
            })}
          </svg>
          {Object.entries(s.nodes).map(([k, n]) => {
            const m = masteryOf(n.label);
            const { x, y } = pos(n);
            const tone = m == null ? "border-border bg-surface text-text-3"
              : m >= 70 ? "border-easy/50 bg-easy/[0.08] text-text-1"
              : m >= 40 ? "border-medium/50 bg-medium/[0.08] text-text-1"
              : "border-brand/50 bg-brand/[0.06] text-text-1";
            return (
              <div key={k} className={`absolute rounded-lg border px-3 py-2 ${tone}`} style={{ left: x, top: y, width: NW, height: NH }}>
                <div className="text-sm font-medium leading-tight truncate">{n.label}</div>
                {m == null
                  ? <div className="text-[10px] text-text-4 mt-0.5">not tracked</div>
                  : <div className="mt-1 h-1 rounded-full bg-surface-3 overflow-hidden"><div className={`h-full ${m >= 70 ? "bg-easy" : m >= 40 ? "bg-medium" : "bg-brand"}`} style={{ width: `${Math.max(4, m)}%` }} /></div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
