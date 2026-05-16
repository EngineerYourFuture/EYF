import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const STATIC_LEADERBOARD: LeaderboardData = {
  period: 'alltime',
  entries: [
    { rank: 1, userId: 'u1', name: 'Arjun Kumar',    xp: 14820, streak: 47, isCurrentUser: false },
    { rank: 2, userId: 'u2', name: 'Priya Sharma',   xp: 13290, streak: 32, isCurrentUser: false },
    { rank: 3, userId: 'u3', name: 'Rohit Verma',    xp: 11750, streak: 28, isCurrentUser: false },
    { rank: 4, userId: 'u4', name: 'Sneha Patel',    xp: 10400, streak: 21, isCurrentUser: false },
    { rank: 5, userId: 'u5', name: 'Vikram Das',     xp:  9870, streak: 19, isCurrentUser: false },
    { rank: 6, userId: 'u6', name: 'Kavya Reddy',    xp:  8930, streak: 15, isCurrentUser: false },
    { rank: 7, userId: 'u7', name: 'Ankit Joshi',    xp:  8210, streak: 14, isCurrentUser: false },
    { rank: 8, userId: 'u8', name: 'Divya Nair',     xp:  7650, streak: 12, isCurrentUser: false },
    { rank: 9, userId: 'u9', name: 'Rahul Mehta',    xp:  7100, streak:  9, isCurrentUser: false },
    { rank: 10, userId: 'u10', name: 'Isha Gupta',   xp:  6540, streak:  7, isCurrentUser: false },
    { rank: 11, userId: 'u11', name: 'Kiran Rao',    xp:  5980, streak:  6, isCurrentUser: false },
    { rank: 12, userId: 'u12', name: 'Meera Iyer',   xp:  5410, streak:  5, isCurrentUser: false },
    { rank: 13, userId: 'u13', name: 'Siddharth B',  xp:  4920, streak:  4, isCurrentUser: false },
    { rank: 14, userId: 'u14', name: 'Tanvi Shah',   xp:  4310, streak:  3, isCurrentUser: false },
    { rank: 15, userId: 'u15', name: 'Aditya Singh', xp:  3870, streak:  2, isCurrentUser: false },
  ],
  currentUserRank: null,
};

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
    if (!session?.accessToken) {
      setData(STATIC_LEADERBOARD);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest<LeaderboardData>(`/leaderboard?period=${period}`, { token: session.accessToken })
      .then(setData)
      .catch(() => { setData(STATIC_LEADERBOARD); })
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
              const podiumHeights = ['h-28', 'h-36', 'h-24'] as const;
              const podiumHeight = podiumHeights[i] ?? 'h-28';
              const isChampion = entry.rank === 1;
              const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
              const champClass = 'bg-gradient-to-t from-yellow-600/30 to-yellow-400/10 border border-yellow-500/30';
              const normalClass = 'bg-surface-container border border-zinc-800';
              return (
                <div key={entry.userId} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-lg font-bold">
                    {entry.name[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full">{entry.name}</p>
                  <p className="text-[10px] text-primary-container font-bold">{entry.xp.toLocaleString()} XP</p>
                  <div className={`w-full ${podiumHeight} rounded-t-xl flex items-center justify-center ${isChampion ? champClass : normalClass}`}>
                    <span className="text-2xl">{MEDAL[entry.rank] ?? '🏅'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Entries list */}
        {loading ? (
          <div className="space-y-2">
            {['sk-1','sk-2','sk-3','sk-4','sk-5','sk-6','sk-7','sk-8','sk-9','sk-10'].map((id) => (
              <div key={id} className="h-16 bg-surface-container rounded-xl animate-pulse" />
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
          <div className="text-center py-16 text-zinc-600">
            <Icon name="emoji_events" size={48} className="mb-4 opacity-30" />
            <p className="font-bold">No data yet. Start solving to appear here!</p>
          </div>
        )}

        {/* Weekly XP Challenges */}
        <div className="mt-10 bg-surface-container rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="bolt" size={20} className="text-[#E82127]" filled />
            <h2 className="font-black text-lg text-on-surface">This Week's XP Challenges</h2>
            <span className="ml-auto text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Resets Sunday</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: 'code',              color: 'text-blue-400',   bg: 'bg-blue-500/10',   title: 'Solve 5 DSA Problems',         xp: '+150 XP', link: '/app/problems' },
              { icon: 'style',             color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Complete a Flashcard Session',  xp: '+50 XP',  link: '/app/flashcards' },
              { icon: 'architecture',      color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   title: 'Submit a System Design',        xp: '+100 XP', link: '/app/system-design' },
              { icon: 'record_voice_over', color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Practice 3 Behavioral Answers', xp: '+75 XP',  link: '/app/placement' },
              { icon: 'account_tree',      color: 'text-amber-400',  bg: 'bg-amber-500/10',  title: 'Master 2 GoF Design Patterns',  xp: '+100 XP', link: '/app/oop' },
              { icon: 'shield',            color: 'text-red-400',    bg: 'bg-red-500/10',    title: 'Complete a Security Lesson',    xp: '+60 XP',  link: '/app/cybersecurity' },
            ].map((challenge) => (
              <Link key={challenge.title} to={challenge.link}>
                <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3 hover:bg-surface-container-highest transition-all cursor-pointer group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${challenge.bg} ${challenge.color}`}>
                    <Icon name={challenge.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{challenge.title}</p>
                  </div>
                  <span className="text-[10px] font-black text-green-400 flex-shrink-0">{challenge.xp}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* XP guide */}
        <div className="mt-6 bg-surface-container rounded-2xl p-6">
          <h3 className="font-black text-sm text-on-surface mb-4">How to Earn XP</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { action: 'Solve an Easy problem',      xp: '+10 XP' },
              { action: 'Solve a Medium problem',     xp: '+25 XP' },
              { action: 'Solve a Hard problem',       xp: '+50 XP' },
              { action: 'Complete flashcard session', xp: '+5–40 XP' },
              { action: 'Master a GoF pattern',       xp: '+50 XP' },
              { action: 'Submit system design',       xp: '+30 XP' },
              { action: 'Practice behavioral Q',      xp: '+20 XP' },
              { action: 'Complete subject topic',     xp: '+15 XP' },
              { action: 'Daily challenge bonus',      xp: '+50 XP' },
              { action: 'Log an offer received',      xp: '+100 XP' },
            ].map((item) => (
              <div key={item.action} className="flex items-center justify-between text-xs py-1.5 border-b border-white/4 last:border-0">
                <span className="text-zinc-400">{item.action}</span>
                <span className="font-black text-green-400">{item.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
