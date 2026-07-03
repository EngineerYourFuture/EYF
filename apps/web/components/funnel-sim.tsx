"use client";

type PillarLite = { key: string; score: number };

/**
 * Hiring-funnel simulation — resume → OA → tech → HR. Each stage's readiness is
 * a weighted blend of the pillars it actually tests, so the student sees the
 * exact stage they'd fail at today. Pure-logic; reuses the readiness pillars.
 */
const STAGES: { name: string; blurb: string; weights: Record<string, number> }[] = [
  { name: "Resume screen",     blurb: "ATS + recruiter scan",          weights: { resume: 0.6, projects: 0.4 } },
  { name: "Online assessment", blurb: "Timed coding + aptitude",       weights: { dsa: 0.6, aptitude: 0.4 } },
  { name: "Tech round 1",      blurb: "Live problem solving",          weights: { dsa: 0.6, interview: 0.4 } },
  { name: "Tech round 2",      blurb: "Harder + design discussion",    weights: { dsa: 0.5, interview: 0.5 } },
  { name: "HR / behavioural",  blurb: "Fit + communication",           weights: { interview: 0.6, consistency: 0.4 } },
];
const PASS = 50; // stage readiness below this = likely fail

export function FunnelSim({ pillars }: { pillars: PillarLite[] }) {
  const score = (k: string) => pillars.find((p) => p.key === k)?.score ?? 0;
  const stages = STAGES.map((s) => ({
    ...s,
    val: Math.round(Object.entries(s.weights).reduce((a, [k, w]) => a + score(k) * w, 0)),
  }));
  const failIdx = stages.findIndex((s) => s.val < PASS);
  const clears = failIdx === -1;

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold mb-1">Where you&apos;d fall out of the funnel</h2>
      <p className="text-text-3 text-sm mb-4 max-w-2xl">
        {clears
          ? "You clear every stage at today's readiness — time to apply with confidence."
          : `At today's readiness you'd likely stall at ${stages[failIdx]!.name.toLowerCase()}. Clear it and the rest opens up.`}
      </p>

      <div className="grid sm:grid-cols-5 gap-3">
        {stages.map((s, i) => {
          const isFail = i === failIdx;
          const cleared = failIdx === -1 || i < failIdx;
          const tone = s.val >= 70 ? "bg-easy" : s.val >= PASS ? "bg-medium" : "bg-hard";
          return (
            <div key={s.name} className={`rounded-xl border p-4 ${isFail ? "border-hard/50 bg-hard/[0.04]" : "border-border bg-surface"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-4">Stage {i + 1}</span>
                {cleared && <span className="text-easy text-xs">✓</span>}
                {isFail && <span className="text-hard text-[11px] font-medium">You&apos;d stall</span>}
              </div>
              <div className="mt-1 font-medium text-sm text-text-1">{s.name}</div>
              <div className="text-text-4 text-xs mt-0.5">{s.blurb}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-xl font-bold tabular-nums">{s.val}</span>
                <span className="text-text-4 text-xs">/100</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${Math.max(3, s.val)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
