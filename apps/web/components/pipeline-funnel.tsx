"use client";

type App = { status: string };

// Furthest funnel stage an application reached (you don't move backward;
// rejected/withdrawn are counted as having at least applied).
const FURTHEST: Record<string, number> = {
  SAVED: 0, APPLIED: 1, OA: 2, INTERVIEW: 3, OFFER: 4, REJECTED: 1, WITHDRAWN: 1,
};
const STEPS = [
  { i: 1, label: "Applied" },
  { i: 2, label: "OA" },
  { i: 3, label: "Interview" },
  { i: 4, label: "Offer" },
];

/**
 * Conversion funnel — the Pipeline differentiator. Turns the application tracker
 * into analytics: how many reach each stage, the step-by-step conversion, and
 * the biggest leak. Pure-logic from the student's own applications.
 */
export function PipelineFunnel({ apps }: Readonly<{ apps: App[] }>) {
  if (!apps || apps.length < 2) { return null; }
  const reached = (i: number) => apps.filter((a) => (FURTHEST[a.status] ?? 0) >= i).length;
  const applied = reached(1);
  if (applied === 0) { return null; }

  const stages = STEPS.map((s) => ({ label: s.label, n: reached(s.i) }));
  // step conversion from the previous stage
  const withConv = stages.map((s, i) => ({
    ...s,
    conv: (() => {
      if (i === 0) { return 100; }
      if (stages[i - 1]!.n) { return Math.round((s.n / stages[i - 1]!.n) * 100); }
      return 0;
    })(),
    pctOfApplied: applied ? Math.round((s.n / applied) * 100) : 0,
  }));
  const leak = withConv.slice(1).reduce((lo, s) => (s.conv < lo.conv ? s : lo), withConv[1] ?? withConv[0]!);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="text-xs font-mono uppercase tracking-widest text-text-3">Conversion funnel</div>
      <p className="text-text-1 font-medium mt-1 max-w-2xl">
        {leak && leak.label !== "Applied" && leak.conv < 100
          ? `Your biggest leak: ${STEPS[STEPS.findIndex((x) => x.label === leak.label) - 1]?.label ?? "Applied"} → ${leak.label} — only ${leak.conv}% convert. That's where to focus prep.`
          : "Applications are converting cleanly through the funnel — keep the volume up."}
      </p>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {withConv.map((s, i) => (
          <div key={s.label} className="rounded-xl border border-border p-3">
            <div className="text-sm font-medium text-text-1">{s.label}</div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">{s.n}</div>
            <div className="text-text-4 text-xs">{s.pctOfApplied}% of applied</div>
            {i > 0 && (
              <div className={`mt-2 text-xs font-mono ${(() => { if (s.conv >= 50) { return "text-easy"; } if (s.conv >= 25) { return "text-medium"; } return "text-brand"; })()}`}>
                {s.conv}% from {withConv[i - 1]!.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
