import { useEffect, useState } from 'react';
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

const RARITY_STYLES: Record<string, { border: string; badge: string; glow: string; label: string }> = {
  common:    { border: 'border-zinc-700',   badge: 'bg-zinc-700 text-zinc-200',   glow: '',                              label: 'Common' },
  rare:      { border: 'border-blue-500/60', badge: 'bg-blue-500/20 text-blue-300', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', label: 'Rare' },
  epic:      { border: 'border-purple-500/60', badge: 'bg-purple-500/20 text-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]', label: 'Epic' },
  legendary: { border: 'border-yellow-500/60', badge: 'bg-yellow-500/20 text-yellow-300', glow: 'shadow-[0_0_25px_rgba(234,179,8,0.25)]', label: 'Legendary' },
};

const CATEGORY_ICONS: Record<string, string> = {
  all: 'emoji_events',
  dsa: 'code',
  oop: 'account_tree',
  security: 'shield',
  'system-design': 'architecture',
  community: 'forum',
  consistency: 'local_fire_department',
  career: 'route',
};

const LEVEL_NAMES = ['Newcomer', 'Learner', 'Explorer', 'Builder', 'Practitioner', 'Engineer', 'Senior', 'Lead', 'Architect', 'Expert', 'Legend'];
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000, 100000];

function AchievementCard({ a }: { readonly a: Achievement }) {
  const rarity = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common;
  const earned = a.earnedAt !== null;

  return (
    <div
      className={`relative bg-surface-container rounded-2xl p-5 border ${rarity.border} transition-all duration-300 ${
        earned ? `${rarity.glow} hover:scale-[1.02]` : 'opacity-50 grayscale'
      }`}
    >
      {earned && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <Icon name="check" size={12} className="text-white" />
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${earned ? 'bg-surface-container-high' : 'bg-surface-container-highest'}`}>
        {a.icon}
      </div>

      <h3 className="font-bold text-sm mb-1 text-on-surface">{a.name}</h3>
      <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{a.description}</p>

      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${rarity.badge}`}>
          {rarity.label}
        </span>
        <span className="text-[10px] font-bold text-primary-container flex items-center gap-0.5">
          +{a.xpReward} <Icon name="bolt" size={12} className="text-primary-container" filled />
        </span>
      </div>

      {earned && a.earnedAt && (
        <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-widest">
          {new Date(a.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

export function AchievementsPage() {
  const session = getSession();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<AchievementsData>('/achievements', { token: session.accessToken })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const categories = ['all', 'dsa', 'oop', 'security', 'system-design', 'community', 'consistency', 'career'];

  const filtered = data?.achievements.filter(
    (a) => category === 'all' || a.category === category
  ) ?? [];

  const level = data?.level ?? 0;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const xp = data?.xp ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS.at(-1)!;
  const currThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold > currThreshold
    ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100))
    : 100;

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter mb-1">Achievements</h1>
          <p className="text-on-surface-variant">Collect badges, earn XP, and climb the ranks.</p>
        </div>

        {/* Level + XP bar */}
        <div className="bg-surface-container rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-red-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-900/30">
              {level}
            </div>
            <div>
              <p className="font-['Inter'] uppercase tracking-[0.2em] text-[9px] font-bold text-zinc-500">Level {level}</p>
              <p className="text-xl font-black text-on-surface">{levelName}</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextThreshold.toLocaleString()} XP</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-red-400 rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 font-bold uppercase tracking-widest">
              {xpPct}% to {LEVEL_NAMES[level + 1] ?? 'Max Level'}
            </p>
          </div>

          <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-on-surface">{data?.earnedCount ?? 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Earned</p>
            </div>
            <div className="text-center border-l border-zinc-800 pl-6">
              <p className="text-2xl font-black text-on-surface">{data?.totalCount ?? 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Total</p>
            </div>
            <div className="text-center border-l border-zinc-800 pl-6">
              <p className="text-2xl font-black text-on-surface">{data?.streak ?? 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Streak</p>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                category === cat
                  ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                  : 'bg-surface-container text-zinc-500 hover:text-zinc-200 hover:bg-surface-container-high'
              }`}
            >
              <Icon name={CATEGORY_ICONS[cat] ?? 'star'} size={13} />
              {cat === 'system-design' ? 'Sys Design' : cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['sk-1','sk-2','sk-3','sk-4','sk-5','sk-6','sk-7','sk-8'].map((id) => (
              <div key={id} className="bg-surface-container rounded-2xl p-5 h-44 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((a) => <AchievementCard key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
