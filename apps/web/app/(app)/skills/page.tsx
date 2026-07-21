"use client";
import Link from "next/link";
import { Card, Meter, PageHeader, Skeleton, ErrorState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Reveal } from "@/components/motion";
import { PatternTree } from "@/components/pattern-tree";
import { Icons } from "@/components/icons";
import { scoreTone } from "@/lib/ui-helpers";

type Dim = { key: string; label: string; group: string; score: number; detail: string; href: string };
type Graph = { dimensions: Dim[]; overall: number; strongest: string | null; weakest: string | null };

// Short labels for the radar axes.
const SHORT: Record<string, string> = {
  dsa: "DSA", aptitude: "Aptitude", os: "OS", dbms: "DBMS", cn: "CN", oop: "OOP",
  projects: "Projects", resume: "Resume", communication: "Comm",
};
const GROUPS = ["Problem Solving", "Core CS", "Career"] as const;

export default function SkillsPage() {
  const { data, isLoading, error, mutate } = useApi<Graph>("/skill-graph/me");

  return (
    <PageMotion className="relative">
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Your engineering skill graph"
          title="Skill Graph"
          subtitle="An honest map of where you stand across everything placements test — so you always know what to fix next, not just what to grind."
        />

        {(() => {
  if (error) return (
          <div className="mt-8"><ErrorState message="Couldn't load your skill graph." retry={() => mutate()} /></div>
        );
  if (isLoading || !data) return (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
            <Skeleton className="h-96 rounded-2xl" />
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          </div>
        );
  return (
          <>
            <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-stretch">
              {/* Radar */}
              <Card variant="glow" className="flex flex-col items-center justify-center py-6">
                <Radar dims={data.dimensions} />
              </Card>

              {/* Summary */}
              <div className="space-y-4">
                <Card className="text-center py-6">
                  <div className="font-display text-6xl font-bold leading-none">{data.overall}</div>
                  <div className="text-text-3 text-xs font-mono mt-1">overall mastery</div>
                  <div className="mt-4 h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${data.overall}%` }} />
                  </div>
                </Card>
                {data.strongest && (
                  <Card className="flex items-center gap-3">
                    <span className="text-easy"><Icons.trophy width={20} height={20} /></span>
                    <div className="text-sm"><span className="text-text-3">Strongest</span><div className="font-medium">{data.strongest}</div></div>
                  </Card>
                )}
                {data.weakest && (
                  <Card className="flex items-center gap-3">
                    <span className="text-hard"><Icons.gauge width={20} height={20} /></span>
                    <div className="text-sm"><span className="text-text-3">Needs work</span><div className="font-medium">{data.weakest}</div></div>
                  </Card>
                )}
              </div>
            </div>

            {/* Pattern prerequisite tree */}
            <Reveal><PatternTree /></Reveal>

            {/* Grouped breakdown */}
            <Reveal className="mt-8 space-y-6">
              {GROUPS.map((g) => {
                const dims = data.dimensions.filter((d) => d.group === g);
                if (dims.length === 0) return null;
                return (
                  <div key={g}>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wider text-text-3 mb-3">{g}</h2>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                      {dims.map((d) => (
                        <Link key={d.key} href={d.href} className="block group">
                          <Meter
                            tone={scoreTone(d.score)}
                            pct={d.score / 100}
                            label={<span className="group-hover:text-text-1">{d.label}</span>}
                            value={`${d.score}`}
                          />
                          <div className="text-text-4 text-xs mt-1">{d.detail}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Reveal>

            <p className="text-text-4 text-xs mt-8 max-w-2xl">
              Your skill graph updates as you solve problems, review flashcards, take assessments and mocks, score your resume,
              and ship projects. It feeds your Placement Readiness — fix the red bars and watch both climb.
            </p>
          </>
        );
})()}
      </div>
    </PageMotion>
  );
}

function Radar({ dims }: Readonly<{ dims: Dim[] }>) {
  const size = 360, cx = size / 2, cy = size / 2, maxR = 130;
  const n = dims.length;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = dims.map((d, i) => pt(i, (d.score / 100) * maxR));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[400px]">
      {/* grid rings */}
      {rings.map((r) => (
        <polygon key={r}
          points={dims.map((_, i) => { const p = pt(i, r * maxR); return `${p.x},${p.y}`; }).join(" ")}
          className="fill-none stroke-edge" strokeWidth="1" opacity={0.4} />
      ))}
      {/* axes */}
      {dims.map((_, i) => { const p = pt(i, maxR); return (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="stroke-edge" strokeWidth="1" opacity={0.3} />
      ); })}
      {/* data polygon */}
      <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        className="fill-accent/20 stroke-accent" strokeWidth="2"
        style={{ transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      <path d={dataPath} className="fill-none stroke-accent" strokeWidth="2" opacity={0} />
      {/* vertices */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-accent" />
      ))}
      {/* labels */}
      {dims.map((d, i) => {
        const p = pt(i, maxR + 18);
        const a = angle(i);
        let anchor: "middle" | "start" | "end";
  if (Math.abs(Math.cos(a)) < 0.35) anchor = "middle";
  else if (Math.cos(a) > 0) anchor = "start";
  else anchor = "end";
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            className="fill-text-3 text-[10px] font-mono">{SHORT[d.key] ?? d.label}</text>
        );
      })}
    </svg>
  );
}
