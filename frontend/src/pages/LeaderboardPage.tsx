import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
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
    { rank: 1,  userId: 'u1',  name: 'Arjun Kumar',    xp: 14820, streak: 47, isCurrentUser: false },
    { rank: 2,  userId: 'u2',  name: 'Priya Sharma',   xp: 13290, streak: 32, isCurrentUser: false },
    { rank: 3,  userId: 'u3',  name: 'Rohit Verma',    xp: 11750, streak: 28, isCurrentUser: false },
    { rank: 4,  userId: 'u4',  name: 'Sneha Patel',    xp: 10400, streak: 21, isCurrentUser: false },
    { rank: 5,  userId: 'u5',  name: 'Vikram Das',     xp:  9870, streak: 19, isCurrentUser: false },
    { rank: 6,  userId: 'u6',  name: 'Kavya Reddy',    xp:  8930, streak: 15, isCurrentUser: false },
    { rank: 7,  userId: 'u7',  name: 'Ankit Joshi',    xp:  8210, streak: 14, isCurrentUser: false },
    { rank: 8,  userId: 'u8',  name: 'Divya Nair',     xp:  7650, streak: 12, isCurrentUser: false },
    { rank: 9,  userId: 'u9',  name: 'Rahul Mehta',    xp:  7100, streak:  9, isCurrentUser: false },
    { rank: 10, userId: 'u10', name: 'Isha Gupta',     xp:  6540, streak:  7, isCurrentUser: false },
    { rank: 11, userId: 'u11', name: 'Kiran Rao',      xp:  5980, streak:  6, isCurrentUser: false },
    { rank: 12, userId: 'u12', name: 'Meera Iyer',     xp:  5410, streak:  5, isCurrentUser: false },
    { rank: 13, userId: 'u13', name: 'Siddharth B',    xp:  4920, streak:  4, isCurrentUser: false },
    { rank: 14, userId: 'u14', name: 'Tanvi Shah',     xp:  4310, streak:  3, isCurrentUser: false },
    { rank: 15, userId: 'u15', name: 'Aditya Singh',   xp:  3870, streak:  2, isCurrentUser: false },
  ],
  currentUserRank: null,
};

const MEDAL: Record<number, { icon: string; color: string; glow: string }> = {
  1: { icon: '🥇', color: '#facc15', glow: 'rgba(250,204,21,0.2)' },
  2: { icon: '🥈', color: '#d4d4d8', glow: 'rgba(212,212,216,0.1)' },
  3: { icon: '🥉', color: '#fb923c', glow: 'rgba(251,146,60,0.15)' },
};

const GLASS = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'blur(16px) saturate(180%)',
} as const;

const XP_CHALLENGES = [
  { icon: 'code',              color: '#60a5fa', glow: 'rgba(96,165,250,0.14)',   title: 'Solve 5 DSA Problems',         xp: '+150 XP', link: '/app/problems' },
  { icon: 'style',             color: '#c084fc', glow: 'rgba(192,132,252,0.14)', title: 'Complete a Flashcard Session',  xp: '+50 XP',  link: '/app/flashcards' },
  { icon: 'architecture',      color: '#22d3ee', glow: 'rgba(34,211,238,0.14)',   title: 'Submit a System Design',        xp: '+100 XP', link: '/app/system-design' },
  { icon: 'record_voice_over', color: '#fb923c', glow: 'rgba(251,146,60,0.14)',   title: 'Practice 3 Behavioral Answers', xp: '+75 XP',  link: '/app/placement' },
  { icon: 'account_tree',      color: '#fbbf24', glow: 'rgba(251,191,36,0.14)',   title: 'Master 2 GoF Design Patterns',  xp: '+100 XP', link: '/app/oop' },
  { icon: 'shield',            color: '#f87171', glow: 'rgba(248,113,113,0.14)', title: 'Complete a Security Lesson',    xp: '+60 XP',  link: '/app/cybersecurity' },
];

function EntryRow({ entry, i }: { readonly entry: LeaderboardEntry; readonly i: number }) {
  const medal = MEDAL[entry.rank];
  return (
    <motion.div
      className="flex items-center gap-4 px-5 py-4"
      style={{
        ...GLASS,
        borderColor: entry.isCurrentUser ? 'rgba(232,25,44,0.3)' : 'rgba(255,255,255,0.07)',
        boxShadow: entry.isCurrentUser ? '0 0 24px rgba(232,25,44,0.08)' : 'none',
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {/* Rank */}
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-sm font-black"
        style={{
          background: medal ? `${medal.glow}` : 'rgba(255,255,255,0.05)',
          border: medal ? `1px solid ${medal.color}30` : '1px solid rgba(255,255,255,0.08)',
          color: medal ? medal.color : 'rgba(255,255,255,0.35)',
        }}
      >
        {medal ? medal.icon : entry.rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
        {entry.name[0]?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: entry.isCurrentUser ? '#ff4d5a' : 'rgba(255,255,255,0.85)' }}>
          {entry.name}
          {entry.isCurrentUser && <span className="ml-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(232,25,44,0.7)' }}>(you)</span>}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Icon name="local_fire_department" size={14} filled style={{ color: '#fb923c' }} />
        <span className="text-xs font-bold" style={{ color: 'var(--t2)' }}>{entry.streak}d</span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-base font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>{entry.xp.toLocaleString()}</span>
        <Icon name="bolt" size={16} filled style={{ color: '#E82127' }} />
      </div>
    </motion.div>
  );
}

export function LeaderboardPage() {
  const session = getSession();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState<'alltime' | 'weekly'>('alltime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) {
      const raf = requestAnimationFrame(() => { setData(STATIC_LEADERBOARD); setLoading(false); });
      return () => cancelAnimationFrame(raf);
    }
    setLoading(true);
    apiRequest<LeaderboardData>(`/leaderboard?period=${period}`, { token: session.accessToken })
      .then(setData)
      .catch(() => { setData(STATIC_LEADERBOARD); })
      .finally(() => setLoading(false));
  }, [session?.accessToken, period]);

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Rankings"
          title="Leaderboard."
          subtitle="The top engineers on EYF — ranked by XP."
          accentColor="#facc15"
          actions={
            <div className="flex p-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              {(['alltime', 'weekly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: period === p ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: period === p ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {p === 'alltime' ? 'All Time' : 'This Week'}
                </button>
              ))}
            </div>
          }
        />

        {/* Top 3 podium */}
        {!loading && data && data.entries.length >= 3 && (
          <motion.div
            className="grid grid-cols-3 gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {[data.entries[1], data.entries[0], data.entries[2]].map((entry, i) => {
              if (!entry) return null;
              const heights = [112, 144, 96];
              const medal = MEDAL[entry.rank];
              const isChamp = entry.rank === 1;
              return (
                <div key={entry.userId} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                    {entry.name[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-center truncate w-full" style={{ color: 'rgba(255,255,255,0.75)' }}>{entry.name}</p>
                  <p className="text-[10px] font-bold" style={{ color: '#E82127' }}>{entry.xp.toLocaleString()} XP</p>
                  <div
                    className="w-full flex items-center justify-center text-2xl"
                    style={{
                      height: heights[i],
                      background: isChamp ? 'linear-gradient(to top, rgba(250,204,21,0.15), rgba(250,204,21,0.05))' : 'rgba(255,255,255,0.04)',
                      border: isChamp ? '1px solid rgba(250,204,21,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isChamp ? '0 0 30px rgba(250,204,21,0.1)' : 'none',
                    }}
                  >
                    {medal?.icon ?? '🏅'}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Entries list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }, (_, n) => (
              <div key={n} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data?.entries.map((entry, i) => <EntryRow key={entry.userId} entry={entry} i={i} />)}
          </div>
        )}

        {/* Current user rank separator */}
        {!loading && data?.currentUserRank && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Your Rank</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <EntryRow entry={{ ...data.currentUserRank, isCurrentUser: true, name: session?.email?.split('@')[0] ?? 'You' }} i={0} />
          </div>
        )}

        {!loading && (!data || data.entries.length === 0) && (
          <div className="text-center py-16">
            <Icon name="emoji_events" size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-bold mt-4" style={{ color: 'var(--t3)' }}>No data yet. Start solving to appear here!</p>
          </div>
        )}

        {/* Weekly XP Challenges */}
        <motion.div
          className="mt-10 p-6"
          style={GLASS}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{ height: 1, marginBottom: 24, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.6) 40%, rgba(232,25,44,0.3) 70%, transparent)' }}
          />
          <div className="flex items-center gap-3 mb-6">
            <Icon name="bolt" size={20} filled style={{ color: '#E82127' }} />
            <h2 className="font-black text-lg" style={{ color: 'rgba(255,255,255,0.88)' }}>This Week's XP Challenges</h2>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Resets Sunday</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {XP_CHALLENGES.map((ch) => (
              <Link key={ch.title} to={ch.link}>
                <motion.div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: ch.glow }}>
                    <Icon name={ch.icon} size={18} style={{ color: ch.color }} />
                  </div>
                  <p className="text-sm font-bold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{ch.title}</p>
                  <span className="text-[10px] font-black flex-shrink-0" style={{ color: '#4ade80' }}>{ch.xp}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* XP guide */}
        <motion.div
          className="mt-4 p-6"
          style={GLASS}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="font-black text-sm mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>How to Earn XP</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
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
              <div key={item.action} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--t2)' }}>{item.action}</span>
                <span className="font-black" style={{ color: '#4ade80' }}>{item.xp}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
