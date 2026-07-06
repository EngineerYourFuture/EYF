"use client";
import Link from "next/link";
import { useApi } from "@/lib/use-api";

type Slot = {
  id: string; org: string; role: string; location?: string | null;
  seats: number; unpaid?: boolean; locked: boolean;
  inContention?: boolean; spotsFromCutoff?: number;
};
type Exchange = { isElite: boolean; eliteRank: number | null; totalElite: number; slots: Slot[] };

/**
 * Partner-internship exchange (the LMS↔internship flywheel payoff). Internships
 * are unpaid + seats-limited; the top Elite members by EYF score earn them.
 * Non-Elite see them locked with the upsell.
 */
export function InternshipExchange() {
  const { data } = useApi<Exchange>("/org/student/internships");
  if (!data || data.slots.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-brand">Partner internships · Elite</div>
          <h2 className="font-display text-xl font-bold mt-1">Internships from EYF partner companies</h2>
          <p className="text-text-3 text-sm mt-1 max-w-xl">
            Unpaid and seats-limited — the top Elite members by EYF score earn them.
            {data.isElite && data.eliteRank && <> You&apos;re <span className="text-text-1 font-medium">#{data.eliteRank} of {data.totalElite}</span> Elite members.</>}
          </p>
        </div>
        {!data.isElite && <Link href="/billing" className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium shrink-0">Upgrade to Elite</Link>}
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {data.slots.map((s) => (
          <div key={s.id} className="min-w-0 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{s.role}</div>
                <div className="text-text-4 text-xs truncate">
                  {s.org}{!s.locked && s.location ? ` · ${s.location}` : ""} · {s.seats} seat{s.seats === 1 ? "" : "s"} · Unpaid
                </div>
              </div>
              {s.locked ? <span className="text-text-4 text-xs shrink-0">🔒 Elite</span>
                : s.inContention ? <span className="text-easy text-xs font-medium shrink-0">In contention</span>
                : <span className="text-medium text-xs shrink-0">#{(s.spotsFromCutoff ?? 0) + s.seats}</span>}
            </div>
            {!s.locked && (
              <div className={`text-[11px] mt-1 ${s.inContention ? "text-easy/80" : "text-text-4"}`}>
                {s.inContention
                  ? `You're in the top ${s.seats} — this one's within reach.`
                  : `Top ${s.seats} earn it — you're ${s.spotsFromCutoff} spot${s.spotsFromCutoff === 1 ? "" : "s"} away. Climb the score.`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
