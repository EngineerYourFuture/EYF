import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string | null;
}

interface AchievementsData {
  achievements: Achievement[];
  level: number;
  levelName: string;
  xp: number;
  xpToNext: number;
  streak: number;
  longestStreak: number;
  earnedCount: number;
  totalCount: number;
}

const RARITY: Record<string, { border: string; glow: string; badge: string; badgeBg: string; label: string }> = {
  common:    { border: 'rgba(161,161,170,0.2)',  glow: 'none',                               badge: 'rgba(255,255,255,0.7)',  badgeBg: 'rgba(255,255,255,0.06)', label: 'Common' },
  rare:      { border: 'rgba(96,165,250,0.4)',   glow: '0 0 24px rgba(96,165,250,0.15)',     badge: '#93c5fd',               badgeBg: 'rgba(96,165,250,0.1)',   label: 'Rare' },
  epic:      { border: 'rgba(192,132,252,0.4)',  glow: '0 0 28px rgba(192,132,252,0.2)',     badge: '#d8b4fe',               badgeBg: 'rgba(192,132,252,0.1)',  label: 'Epic' },
  legendary: { border: 'rgba(250,204,21,0.5)',   glow: '0 0 32px rgba(250,204,21,0.22)',     badge: '#fde68a',               badgeBg: 'rgba(250,204,21,0.12)', label: 'Legendary' },
};

const STATIC_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', key: 'first_solve',       name: 'Hello, World!',        description: 'Solve your very first DSA problem',                       icon: '🎯', category: 'dsa',           xpReward: 10,  rarity: 'common',    earnedAt: null },
  { id: 'a2', key: 'dsa_10',            name: 'Warm Up',              description: 'Solve 10 problems across any difficulty',                 icon: '💪', category: 'dsa',           xpReward: 25,  rarity: 'common',    earnedAt: null },
  { id: 'a3', key: 'dsa_50',            name: 'Grinder',              description: 'Solve 50 DSA problems',                                   icon: '⚡', category: 'dsa',           xpReward: 75,  rarity: 'rare',      earnedAt: null },
  { id: 'a4', key: 'dsa_100',           name: 'Century',              description: 'Solve 100 DSA problems — you are committed',              icon: '💯', category: 'dsa',           xpReward: 150, rarity: 'rare',      earnedAt: null },
  { id: 'a5', key: 'dsa_hard_5',        name: 'Hard Mode',            description: 'Solve 5 hard difficulty problems',                        icon: '🔥', category: 'dsa',           xpReward: 100, rarity: 'epic',      earnedAt: null },
  { id: 'a6', key: 'dsa_hard_25',       name: 'Pain Enjoyer',         description: 'Solve 25 hard problems — truly unhinged',                 icon: '💀', category: 'dsa',           xpReward: 250, rarity: 'legendary', earnedAt: null },
  { id: 'a7', key: 'first_dp',          name: 'Dynamic Thinker',      description: 'Solve your first dynamic programming problem',            icon: '🧩', category: 'dsa',           xpReward: 30,  rarity: 'common',    earnedAt: null },
  { id: 'a8', key: 'graph_master',      name: 'Graph Master',         description: 'Solve 10 graph problems (BFS, DFS, Dijkstra)',            icon: '🕸️', category: 'dsa',           xpReward: 80,  rarity: 'rare',      earnedAt: null },
  { id: 'b1', key: 'first_pattern',     name: 'Patterned Mind',       description: 'Study your first GoF design pattern',                    icon: '🏗️', category: 'oop',           xpReward: 20,  rarity: 'common',    earnedAt: null },
  { id: 'b2', key: 'all_creational',    name: 'The Creator',          description: 'Master all 5 creational design patterns',                icon: '✨', category: 'oop',           xpReward: 100, rarity: 'rare',      earnedAt: null },
  { id: 'b3', key: 'all_23_patterns',   name: 'GoF Legend',           description: 'Master all 23 Gang of Four design patterns',             icon: '👑', category: 'oop',           xpReward: 500, rarity: 'legendary', earnedAt: null },
  { id: 'b4', key: 'solid_all',         name: 'SOLID Foundation',     description: 'Study all 5 SOLID principles',                           icon: '🧱', category: 'oop',           xpReward: 75,  rarity: 'rare',      earnedAt: null },
  { id: 'c1', key: 'first_ctf',         name: 'Flag Captured',        description: 'Complete your first CTF challenge',                      icon: '🚩', category: 'security',      xpReward: 50,  rarity: 'common',    earnedAt: null },
  { id: 'c2', key: 'ctf_10',            name: 'Ethical Hacker',       description: 'Complete 10 CTF challenges',                             icon: '🕵️', category: 'security',      xpReward: 150, rarity: 'rare',      earnedAt: null },
  { id: 'c3', key: 'owasp_all',         name: 'OWASP Scholar',        description: 'Complete all OWASP Top 10 lessons',                      icon: '🛡️', category: 'security',      xpReward: 200, rarity: 'epic',      earnedAt: null },
  { id: 'c4', key: 'sec_cert_path',     name: 'Security Career',      description: 'Complete the security certification roadmap',            icon: '🏆', category: 'security',      xpReward: 300, rarity: 'legendary', earnedAt: null },
  { id: 'd1', key: 'first_design',      name: 'Architect in Training', description: 'Submit your first system design attempt',              icon: '📐', category: 'system-design', xpReward: 30,  rarity: 'common',    earnedAt: null },
  { id: 'd2', key: 'design_5',          name: 'System Thinker',       description: 'Complete 5 system design problems',                      icon: '🏛️', category: 'system-design', xpReward: 100, rarity: 'rare',      earnedAt: null },
  { id: 'd3', key: 'design_all_hard',   name: 'Grand Architect',      description: 'Complete all hard system design problems',               icon: '🌆', category: 'system-design', xpReward: 400, rarity: 'legendary', earnedAt: null },
  { id: 'e1', key: 'streak_7',          name: 'Week Warrior',         description: 'Maintain a 7-day learning streak',                       icon: '🔥', category: 'consistency',   xpReward: 50,  rarity: 'common',    earnedAt: null },
  { id: 'e2', key: 'streak_30',         name: 'Monthly Monk',         description: 'Maintain a 30-day learning streak',                      icon: '🌙', category: 'consistency',   xpReward: 150, rarity: 'rare',      earnedAt: null },
  { id: 'e3', key: 'streak_100',        name: 'Centurion',            description: 'Maintain a 100-day streak — legendary discipline',       icon: '⚔️', category: 'consistency',   xpReward: 500, rarity: 'legendary', earnedAt: null },
  { id: 'e4', key: 'daily_5',           name: 'On A Roll',            description: 'Complete the daily challenge 5 times',                   icon: '🎲', category: 'consistency',   xpReward: 75,  rarity: 'common',    earnedAt: null },
  { id: 'e5', key: 'xp_1000',           name: 'Rising Engineer',      description: 'Earn 1,000 total XP',                                    icon: '📈', category: 'consistency',   xpReward: 50,  rarity: 'common',    earnedAt: null },
  { id: 'e6', key: 'xp_10000',          name: 'Senior Level',         description: 'Earn 10,000 total XP',                                   icon: '🎖️', category: 'consistency',   xpReward: 200, rarity: 'epic',      earnedAt: null },
  { id: 'f1', key: 'first_post',        name: 'Voice of the Community', description: 'Create your first community post',                    icon: '✍️', category: 'community',     xpReward: 15,  rarity: 'common',    earnedAt: null },
  { id: 'f2', key: 'post_upvoted_10',   name: 'Popular Take',         description: 'Get 10 upvotes on a single post',                        icon: '👍', category: 'community',     xpReward: 50,  rarity: 'rare',      earnedAt: null },
  { id: 'f3', key: 'helped_10',         name: 'Helpful Engineer',     description: 'Reply to 10 community posts',                            icon: '🤝', category: 'community',     xpReward: 40,  rarity: 'common',    earnedAt: null },
  { id: 'g1', key: 'resume_complete',   name: 'Resume Ready',         description: 'Complete your EYF resume profile',                       icon: '📄', category: 'career',        xpReward: 30,  rarity: 'common',    earnedAt: null },
  { id: 'g2', key: 'mock_interview_1',  name: 'First Interview',      description: 'Complete your first mock interview session',             icon: '🎙️', category: 'career',        xpReward: 50,  rarity: 'common',    earnedAt: null },
  { id: 'g3', key: 'mock_interview_10', name: 'Interview Ready',      description: 'Complete 10 mock interview sessions',                    icon: '🎯', category: 'career',        xpReward: 150, rarity: 'rare',      earnedAt: null },
  { id: 'g4', key: 'offer_received',    name: 'Offer Received 🎉',    description: 'Log an offer received in Interview Tracker',             icon: '🎊', category: 'career',        xpReward: 500, rarity: 'legendary', earnedAt: null },
  { id: 'g5', key: 'study_plan_complete', name: 'Plan Executed',      description: 'Complete a full week of your study plan',                icon: '📅', category: 'career',        xpReward: 100, rarity: 'rare',      earnedAt: null },
];

const CATEGORY_ICONS: Record<string, string> = {
  all: 'emoji_events', dsa: 'code', oop: 'account_tree', security: 'shield',
  'system-design': 'architecture', community: 'forum', consistency: 'local_fire_department', career: 'route',
};

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

function AchievementCard({ a, i }: { readonly a: Achievement; readonly i: number }) {
  const r = RARITY[a.rarity] ?? RARITY.common;
  const earned = a.earnedAt !== null;
  return (
    <motion.div
      className="relative rounded-2xl p-5"
      style={{
        background: 'rgba(10,10,10,0.7)',
        border: `1px solid ${r.border}`,
        backdropFilter: 'blur(16px)',
        boxShadow: earned ? r.glow : 'none',
        opacity: earned ? 1 : 0.4,
        filter: earned ? 'none' : 'grayscale(1)',
      }}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: earned ? 1 : 0.4, y: 0, filter: earned ? 'none' : 'grayscale(1)' }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={earned ? { scale: 1.02, boxShadow: r.glow } : {}}
    >
      {earned && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#4ade80' }}>
          <Icon name="check" size={12} style={{ color: 'white' }} />
        </div>
      )}

      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {a.icon}
      </div>

      <h3 className="font-bold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>{a.name}</h3>
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: r.badge, background: r.badgeBg }}>
          {r.label}
        </span>
        <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: '#E8192C' }}>
          +{a.xpReward} <Icon name="bolt" size={12} filled style={{ color: '#E8192C' }} />
        </span>
      </div>

      {earned && a.earnedAt && (
        <p className="text-[9px] mt-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {new Date(a.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  );
}

export function AchievementsPage() {
  const session = getSession();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (!session?.accessToken) {
      const raf = requestAnimationFrame(() => {
        setData({ achievements: STATIC_ACHIEVEMENTS, level: 0, levelName: 'Newcomer', xp: 0, xpToNext: 100, streak: 0, longestStreak: 0, earnedCount: 0, totalCount: STATIC_ACHIEVEMENTS.length });
        setLoading(false);
      });
      return () => cancelAnimationFrame(raf);
    }
    apiRequest<AchievementsData>('/achievements', { token: session.accessToken })
      .then(setData)
      .catch(() => {
        setData({ achievements: STATIC_ACHIEVEMENTS, level: 0, levelName: 'Newcomer', xp: 0, xpToNext: 100, streak: 0, longestStreak: 0, earnedCount: 0, totalCount: STATIC_ACHIEVEMENTS.length });
      })
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const categories = ['all','dsa','oop','security','system-design','community','consistency','career'];
  const filtered = data?.achievements.filter((a) => category === 'all' || a.category === category) ?? [];
  const level = data?.level ?? 0;
  const xp = data?.xp ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS.at(-1)!;
  const currThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold > currThreshold ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100)) : 100;

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <motion.h1
            className="text-5xl font-black tracking-tighter leading-none mb-2"
            style={{
              background: 'linear-gradient(135deg, #E8E8E8 0%, rgba(250,204,21,0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            ACHIEVEMENTS
          </motion.h1>
          <motion.p
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            Collect badges, earn XP, and climb the ranks.
          </motion.p>
        </div>

        {/* Level + XP bar */}
        <motion.div
          className="rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center gap-6"
          style={{
            background: 'rgba(10,10,10,0.85)',
            border: '1px solid rgba(232,25,44,0.18)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(232,25,44,0.05)',
          }}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{ height: 1, position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.6) 40%, rgba(232,25,44,0.3) 70%, transparent)' }}
          />
          <div className="flex items-center gap-4 flex-shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl"
              style={{ background: 'linear-gradient(135deg, #E8192C, #ff5566)', color: 'white', boxShadow: '0 8px 24px rgba(232,25,44,0.4)' }}
            >
              {level}
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.2em] text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Level {level}</p>
              <p className="text-xl font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>{LEVEL_NAMES[level] ?? 'Legend'}</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.28)' }}>
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextThreshold.toLocaleString()} XP</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #E8192C, #ff5566)', boxShadow: '0 0 12px rgba(232,25,44,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {xpPct}% to {LEVEL_NAMES[level + 1] ?? 'Max Level'}
            </p>
          </div>

          <div className="flex gap-6 flex-shrink-0">
            {[
              { value: data?.earnedCount ?? 0, label: 'Earned' },
              { value: data?.totalCount ?? 0,  label: 'Total' },
              { value: data?.streak ?? 0,      label: 'Streak' },
            ].map((s, i) => (
              <div key={s.label} className="text-center" style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 24 } : {}}>
                <p className="text-2xl font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap mb-8">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => setCategory(cat)}
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                  background: active ? 'rgba(232,25,44,0.14)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(232,25,44,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  color: active ? '#ff4d5a' : 'rgba(255,255,255,0.32)',
                  boxShadow: active ? '0 0 16px rgba(232,25,44,0.18)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Icon name={CATEGORY_ICONS[cat] ?? 'star'} size={12} />
                {cat === 'system-design' ? 'Sys Design' : cat}
              </motion.button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, n) => (
              <div key={n} className="rounded-2xl h-44 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((a, i) => <AchievementCard key={a.id} a={a} i={i} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
