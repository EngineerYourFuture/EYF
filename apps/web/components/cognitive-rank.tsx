"use client";
import { useApi } from "@/lib/use-api";

type Rank = {
  overall: number | null;
  games: { game: string; best: number; players: number; percentile: number | null }[];
};

const GAME_LABEL: Record<string, string> = {
  REACTION: "Reaction Time",
  N_BACK: "N-Back",
  PATTERN_RECALL: "Pattern Recall",
  SPATIAL: "Mental Rotation",
  STROOP: "Stroop",
};

/**
 * Peer percentile — the Cognitive Games differentiator. Competitors' brain
 * games (or ours, before this) give a lonely score. EYF turns it into a
 * competitive signal: "faster than 82% of aspirants." Drives replay.
 */
export function CognitiveRank() {
  const { data } = useApi<Rank>("/cognitive/percentile");
  if (!data) return null;
  const rated = data.games.filter((g) => g.percentile !== null);
  if (rated.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-text-3">Where you rank</div>
        {data.overall !== null && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums">Top {Math.max(1, 100 - data.overall)}%</span>
            <span className="text-text-3 text-sm">of aspirants overall</span>
          </div>
        )}
      </div>

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5">
        {rated.map((g) => (
          <div key={g.game}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-2">{GAME_LABEL[g.game] ?? g.game}</span>
              <span className="text-brand font-medium tabular-nums">faster than {g.percentile}%</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(g.percentile ?? 0) >= 66 ? "bg-easy" : (g.percentile ?? 0) >= 33 ? "bg-medium" : "bg-brand"}`}
                style={{ width: `${Math.max(3, g.percentile ?? 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
