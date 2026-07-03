"use client";

type S = { level: string; completed: boolean; confidence: number | null; anxietyBefore: number | null; anxietyAfter: number | null };

const ORDER = ["LOW", "NORMAL", "HIGH", "EXTREME"];
const LABEL: Record<string, string> = { LOW: "Low", NORMAL: "Normal", HIGH: "High", EXTREME: "Extreme" };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const nn = (x: number | null): x is number => x != null;

/**
 * Pressure resilience — the Pressure Mode differentiator. Reads the student's
 * own sessions to quantify how much they degrade under pressure (completion +
 * confidence, calm vs high-pressure). That gap is the interview risk.
 */
export function PressureResilience({ sessions }: { sessions: S[] }) {
  if (!sessions || sessions.length < 2) return null;

  const byLevel = new Map<string, S[]>();
  for (const s of sessions) {
    const arr = byLevel.get(s.level) ?? [];
    arr.push(s);
    byLevel.set(s.level, arr);
  }
  const stat = (arr: S[]) => ({
    n: arr.length,
    completion: arr.length ? Math.round((arr.filter((x) => x.completed).length / arr.length) * 100) : 0,
    conf: Math.round(avg(arr.map((x) => x.confidence).filter(nn)) * 10) / 10,
  });

  const calm = [...(byLevel.get("LOW") ?? []), ...(byLevel.get("NORMAL") ?? [])];
  const heat = [...(byLevel.get("HIGH") ?? []), ...(byLevel.get("EXTREME") ?? [])];
  const c = stat(calm), h = stat(heat);
  const gap = c.completion - h.completion;

  const read =
    heat.length === 0 ? "Run a High or Extreme session to measure how you hold up under real pressure."
    : calm.length === 0 ? "Run a Normal session too, so we can compare calm vs pressure."
    : gap >= 25 ? `Under pressure your completion drops ${gap} points (${c.completion}% → ${h.completion}%). That gap is your interview risk — drill Extreme to close it.`
    : gap >= 10 ? `You hold up fairly well — a ${gap}-point dip under pressure. Keep drilling High to erase it.`
    : `Rock steady — barely a ${Math.max(0, gap)}-point dip under pressure. You perform when it counts.`;

  const levels = ORDER.map((lv) => ({ lv, ...stat(byLevel.get(lv) ?? []) })).filter((x) => x.n > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="text-xs font-mono uppercase tracking-widest text-text-3">Pressure resilience</div>
      <p className="text-text-1 font-medium mt-1 max-w-2xl">{read}</p>

      <div className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3">
        {levels.map((l) => (
          <div key={l.lv}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-2">{LABEL[l.lv]} <span className="text-text-4 text-xs">· {l.n}</span></span>
              <span className="text-text-4 text-xs font-mono">{l.completion}% done{l.conf ? ` · conf ${l.conf}` : ""}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className={`h-full rounded-full ${l.completion >= 70 ? "bg-easy" : l.completion >= 40 ? "bg-medium" : "bg-brand"}`} style={{ width: `${Math.max(3, l.completion)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
