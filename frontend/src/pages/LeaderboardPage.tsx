import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  streak: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  period: string;
  entries: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
}

const RANK_BADGE: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: 'bg-yellow-500/20 border border-yellow-500/40', text: 'text-yellow-400', icon: '🥇' },
  2: { bg: 'bg-zinc-400/10 border border-zinc-400/30', text: 'text-zinc-300', icon: '🥈' },
  3: { bg: 'bg-orange-600/20 border border-orange-600/30', text: 'text-orange-400', icon: '🥉' },
};

function RankBadge({ rank }: { readonly rank: number }) {
  const badge = RANK_BADGE[rank];
  if (badge) {
    return (
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${badge.bg}`}>
        {badge.icon}
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-surface-container-high text-zinc-400">
      {rank}
    </span>
  );
}

function EntryRow({ entry }: { readonly entry: LeaderboardEntry }) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
        entry.isCurrentUser
          ? 'bg-primary-container/10 border border-primary-container/30 shadow-[0_0_20px_rgba(232,33,39,0.08)]'
          : 'bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-bold text-on-surface flex-shrink-0">
        {entry.name[0]?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-primary-container' : 'text-on-surface'}`}>
          {entry.name}
          {entry.isCurrentUser && (
            <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-primary-container/70">(you)</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
        <Icon name="local_fire_department" size={14} className="text-orange-400" filled />
        <span className="text-xs font-bold">{entry.streak}d</span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-base font-black text-on-surface">{entry.xp.toLocaleString()}</span>
        <Icon name="bolt" size={16} className="text-primary-container" filled />
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  const session = getSession();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState<'alltime' | 'weekly'>('alltime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiRequest<LeaderboardData>(`/leaderboard?period=${period}`, { token: session.accessToken })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken, period]);

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">Leaderboard</h1>
            <p className="text-on-surface-variant">The top engineers on EYF — ranked by XP.</p>
          </div>

          {/* Period toggle */}
          <div className="flex bg-surface-container rounded-full p-1">
            {(['alltime', 'weekly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  period === p
                    ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {p === 'alltime' ? 'All Time' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 podium */}
        {!loading && data && data.entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[data.entries[1], data.entries[0], data.entries[2]].map((entry, i) => {
              if (!entry) return null;
              const heights = ['h-28', 'h-36', 'h-24'];
              const isChampion = entry.rank === 1;
              return (
                <div key={entry.userId} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-lg font-bold">
                    {entry.name[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full text-center">{entry.name}</p>
                  <p className="text-[10px] text-primary-container font-bold">{entry.xp.toLocaleString()} XP</p>
                  <div
                    className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center ${
                      isChampion
                        ? 'bg-gradient-to-t from-yellow-600/30 to-yellow-400/10 border border-yellow-500/30'
                        : 'bg-surface-container border border-zinc-800'
                    }`}
                  >
                    <span className="text-2xl">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Entries list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data?.entries.map((entry) => <EntryRow key={entry.userId} entry={entry} />)}
          </div>
        )}

        {/* Current user rank if not in top 50 */}
        {!loading && data?.currentUserRank && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Your Rank</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <EntryRow entry={{ ...data.currentUserRank, isCurrentUser: true, name: session?.email?.split('@')[0] ?? 'You' }} />
          </div>
        )}

        {!loading && (!data || data.entries.length === 0) && (
          <div className="text-center py-20 text-zinc-600">
            <Icon name="emoji_events" size={48} className="mb-4 opacity-30" />
            <p className="font-bold">No data yet. Start solving to appear here!</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
