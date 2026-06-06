"use client";
/**
 * BST visualizer — insert sequence + in-order traversal highlight.
 */
import { useMemo, useState } from "react";
import { Button } from "@eyf/ui";

type Node = { value: number; left: Node | null; right: Node | null };

function insert(root: Node | null, v: number): Node {
  if (!root) return { value: v, left: null, right: null };
  if (v < root.value) root.left  = insert(root.left, v);
  else if (v > root.value) root.right = insert(root.right, v);
  return root;
}

function inorder(root: Node | null, out: number[] = []): number[] {
  if (!root) return out;
  inorder(root.left, out);
  out.push(root.value);
  inorder(root.right, out);
  return out;
}

function layout(root: Node | null) {
  const positions = new Map<number, { x: number; y: number }>();
  let order = 0;
  function visit(node: Node | null, depth: number) {
    if (!node) return;
    visit(node.left, depth + 1);
    positions.set(node.value, { x: order++, y: depth });
    visit(node.right, depth + 1);
  }
  visit(root, 0);
  return positions;
}

const W = 600, H = 280, PAD = 24;

export function TreeViz() {
  const [src, setSrc] = useState("50,30,70,20,40,60,80,10");
  const [highlightIdx, setHighlight] = useState(-1);

  const { root, traversal, positions } = useMemo(() => {
    const arr = src.split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
    let r: Node | null = null;
    for (const v of arr) r = insert(r, v);
    return { root: r, traversal: inorder(r), positions: layout(r) };
  }, [src]);

  const maxX = Math.max(1, ...[...positions.values()].map((p) => p.x));
  const maxY = Math.max(1, ...[...positions.values()].map((p) => p.y));
  const scaleX = (W - PAD * 2) / Math.max(1, maxX);
  const scaleY = (H - PAD * 2) / Math.max(1, maxY);
  const xy = (v: number) => {
    const p = positions.get(v);
    if (!p) return { x: 0, y: 0 };
    return { x: PAD + p.x * scaleX, y: PAD + p.y * scaleY };
  };

  function lines(node: Node | null, acc: { x1: number; y1: number; x2: number; y2: number }[] = []) {
    if (!node) return acc;
    if (node.left) { const a = xy(node.value), b = xy(node.left.value);  acc.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }); lines(node.left, acc); }
    if (node.right){ const a = xy(node.value), b = xy(node.right.value); acc.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }); lines(node.right, acc); }
    return acc;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        <input
          value={src}
          onChange={(e) => { setSrc(e.target.value); setHighlight(-1); }}
          className="flex-1 bg-bg border border-border rounded-md px-2 py-1 font-mono"
        />
        <Button
          size="sm"
          onClick={async () => {
            for (let i = 0; i < traversal.length; i++) {
              setHighlight(i);
              await new Promise((r) => setTimeout(r, 400));
            }
          }}
        >Inorder play</Button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-bg border border-border rounded-md">
        {lines(root).map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#1C1C1C" strokeWidth={1.5} />
        ))}
        {[...positions.entries()].map(([v]) => {
          const p = xy(v);
          const isHighlighted = highlightIdx >= 0 && traversal[highlightIdx] === v;
          return (
            <g key={v}>
              <circle cx={p.x} cy={p.y} r={14} fill={isHighlighted ? "#E8FF47" : "#111111"} stroke="#E8FF47" strokeWidth={isHighlighted ? 2 : 1} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill={isHighlighted ? "#0A0A0A" : "#FAFAF9"} fontFamily="JetBrains Mono">{v}</text>
            </g>
          );
        })}
      </svg>
      <div className="text-text-3 text-xs mt-2 font-mono">Inorder: {traversal.join(" · ")}</div>
    </div>
  );
}
