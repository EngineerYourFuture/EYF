import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { getSession } from '../lib/session';
import { apiRequest } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyActivity {
  date: string; // YYYY-MM-DD
  xp: number;
  problems: number;
  topics: number;
}

interface SubjectProgress {
  id: string;
  title: string;
  icon: string;
  color: string;
  completed: number;
  total: number;
}

interface StatsData {
  totalXP: number;
  level: number;
  levelName: string;
  xpToNext: number;
  streak: number;
  longestStreak: number;
  problemsSolved: number;
  totalProblems: number;
  topicsCompleted: number;
  totalTopics: number;
  dailyActivity: DailyActivity[];
  subjectProgress: SubjectProgress[];
  rankPercentile: number;
  weeklyXP: number;
  flashcardsReviewed: number;
  mockInterviews: number;
}

// ─── Static fallback ──────────────────────────────────────────────────────────

function fakeDet(seed: number, max: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) % max;
}

function generateFakeDailyActivity(): DailyActivity[] {
  const days: DailyActivity[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const seed = i * 31337;
    const active = fakeDet(seed, 100) > 55;
    days.push({
      date: dateStr,
      xp: active ? fakeDet(seed + 1, 150) + 20 : 0,
      problems: active ? fakeDet(seed + 2, 4) : 0,
      topics: active ? fakeDet(seed + 3, 2) : 0,
    });
  }
  return days;
}

const STATIC_STATS: StatsData = {
  totalXP: 2840,
  level: 5,
  levelName: 'Engineer',
  xpToNext: 460,
  streak: 7,
  longestStreak: 14,
  problemsSolved: 38,
  totalProblems: 75,
  topicsCompleted: 18,
  totalTopics: 52,
  dailyActivity: generateFakeDailyActivity(),
  subjectProgress: [
    { id: 'os',      title: 'Operating Systems', icon: 'terminal',    color: '#60a5fa', completed: 5,  total: 19 },
    { id: 'dbms',    title: 'DBMS',              icon: 'storage',     color: '#c084fc', completed: 6,  total: 14 },
    { id: 'networks',title: 'Networks',           icon: 'wifi',        color: '#22d3ee', completed: 4,  total: 16 },
    { id: 'oop',     title: 'OOP',               icon: 'code_blocks', color: '#4ade80', completed: 8,  total: 14 },
    { id: 'sd',      title: 'System Design',     icon: 'architecture',color: '#fb923c', completed: 9,  total: 19 },
    { id: 'discrete',title: 'Discrete Math',     icon: 'calculate',   color: '#2dd4bf', completed: 2,  total: 15 },
  ],
  rankPercentile: 73,
  weeklyXP: 620,
  flashcardsReviewed: 148,
  mockInterviews: 3,
};

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

function xpToIntensity(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 30) return 1;
  if (xp < 70) return 2;
  if (xp < 120) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  'rgba(255,255,255,0.05)',
  'rgba(232,25,44,0.15)',
  'rgba(232,25,44,0.32)',
  'rgba(232,25,44,0.55)',
  'rgba(232,25,44,0.85)',
];

function groupByWeek(days: DailyActivity[]): (DailyActivity | null)[][] {
  const firstDay = new Date(days[0].date);
  const padDays = firstDay.getDay();
  const padded: (DailyActivity | null)[] = [
    ...new Array(padDays).fill(null),
    ...days,
  ];
  const weeks: (DailyActivity | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const GLASS = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'blur(16px) saturate(180%)',
} as const;

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, glow, delay = 0 }: {
  readonly icon: string;
  readonly label: string;
  readonly value: string | number;
  readonly sub?: string;
  readonly color: string;
  readonly glow: string;
  readonly delay?: number;
}) {
  return (
    <motion.div
      className="p-5 flex flex-col gap-3"
      style={{ ...GLASS, background: `${glow.replace('0.15', '0.06')}`, border: `1px solid ${glow.replace('0.15', '0.2')}` }}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ boxShadow: `0 8px 32px ${glow}` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>{label}</p>
        <div className="w-8 h-8 flex items-center justify-center" style={{ background: glow }}>
          <Icon name={icon} size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function WeeklyXPChart({ days }: { readonly days: DailyActivity[] }) {
  const last14 = days.slice(-14);
  const maxXP = Math.max(...last14.map(d => d.xp), 1);

  return (
    <motion.div
      className="p-5"
      style={GLASS}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--t3)' }}>XP — Last 14 Days</p>
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {last14.map((day) => {
          const pct = (day.xp / maxXP) * 100;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                <motion.div
                  className="w-full rounded-sm"
                  style={{
                    background: day.xp > 0 ? 'rgba(232,25,44,0.7)' : 'rgba(255,255,255,0.05)',
                    boxShadow: day.xp > 0 ? '0 0 8px rgba(232,25,44,0.3)' : 'none',
                  }}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${Math.max(pct, day.xp > 0 ? 4 : 0)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ background: 'rgba(232,25,44,1)', boxShadow: '0 0 12px rgba(232,25,44,0.5)' }}
                />
              </div>
              <span className="text-[9px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })[0]}
              </span>
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none" style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}>
                {day.xp} XP · {day.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ days }: { readonly days: DailyActivity[] }) {
  const weeks = groupByWeek(days);
  const monthMarkers: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  days.forEach((day, di) => {
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) {
      monthMarkers.push({ label: MONTH_LABELS[m], weekIdx: Math.floor(di / 7) });
      lastMonth = m;
    }
  });
  const totalXP = days.reduce((s, d) => s + d.xp, 0);
  const activeDays = days.filter(d => d.xp > 0).length;

  return (
    <motion.div
      className="p-5 overflow-x-auto"
      style={GLASS}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Activity Heatmap — Last 52 Weeks</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>{activeDays} active days · {totalXP.toLocaleString()} total XP</p>
      </div>

      <div className="flex gap-[2px] mb-1 ml-6">
        {weeks.map((week, wi) => {
          const validDay = week.find((d): d is DailyActivity => d !== null);
          const marker = monthMarkers.find(m => m.weekIdx === wi);
          return (
            <div key={validDay?.date ?? `month-${wi}`} className="w-3 flex-shrink-0 text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {marker ? marker.label[0] : ''}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[2px]">
        <div className="flex flex-col gap-[2px] mr-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
            <div key={d} className="h-3 w-4 text-[9px] flex items-center" style={{ color: 'rgba(255,255,255,0.18)' }}>{i % 2 === 1 ? d[0] : ''}</div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const validDay = week.find((d): d is DailyActivity => d !== null);
          return (
            <div key={validDay?.date ?? `week-${wi}`} className="flex flex-col gap-[2px]">
              {new Array(7).fill(null).map((_, di) => {
                const day = week[di];
                const intensity = day ? xpToIntensity(day.xp) : 0;
                return (
                  <div
                    key={`cell-${wi}-${di}`}
                    title={day ? `${day.date}: ${day.xp} XP, ${day.problems} problems` : ''}
                    className="w-3 h-3 rounded-[2px] flex-shrink-0 cursor-default transition-colors"
                    style={{ background: INTENSITY_COLORS[intensity] }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Less</span>
        {INTENSITY_COLORS.map((bg) => (
          <div key={bg} className="w-3 h-3 rounded-[2px]" style={{ background: bg }} />
        ))}
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>More</span>
      </div>
    </motion.div>
  );
}

// ─── Subject progress ─────────────────────────────────────────────────────────

function SubjectProgressPanel({ subjects }: { readonly subjects: SubjectProgress[] }) {
  return (
    <motion.div
      className="p-6 space-y-5"
      style={GLASS}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Subject Completion</p>
      {subjects.map((s, i) => {
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <Link key={s.id} to={`/app/subjects/${s.id}`} className="block group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name={s.icon} size={15} style={{ color: s.color }} />
                <span className="text-sm font-semibold transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.title}</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: 'var(--t3)' }}>{s.completed}/{s.total}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color, boxShadow: `0 0 8px ${s.color}60` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

// ─── Rank card ────────────────────────────────────────────────────────────────

function RankCard({ percentile, streak, longestStreak }: {
  readonly percentile: number;
  readonly streak: number;
  readonly longestStreak: number;
}) {
  return (
    <motion.div
      className="p-6 space-y-5"
      style={GLASS}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Your Standing</p>
      <div className="text-center py-2">
        <motion.p
          className="text-4xl font-black"
          style={{ color: '#facc15' }}
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Top {100 - percentile}%
        </motion.p>
        <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>among all EYF users this week</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Current Streak', value: streak, color: '#fb923c' },
          { label: 'Longest Streak', value: longestStreak, color: '#fdba74' },
        ].map((item) => (
          <div key={item.label} className="p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{item.label}</p>
          </div>
        ))}
      </div>
      <Link to="/app/leaderboard" className="flex items-center justify-center gap-2 text-xs font-bold pt-1 transition-colors" style={{ color: 'var(--t3)' }}>
        <Icon name="leaderboard" size={14} />View Full Leaderboard
      </Link>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const session = getSession();
  const [stats, setStats] = useState<StatsData>(STATIC_STATS);

  useEffect(() => {
    if (!session) return;
    apiRequest('/progress/stats')
      .then((data) => setStats(data as StatsData))
      .catch(() => { /* keep static */ });
  }, [session]);

  const levelPct = useMemo(() => {
    const curr = LEVEL_THRESHOLDS[stats.level] ?? 0;
    const next = LEVEL_THRESHOLDS[stats.level + 1] ?? curr + 1000;
    return Math.round(((stats.totalXP - curr) / (next - curr)) * 100);
  }, [stats]);

  return (
    <AppShell>
      <div className="pt-8 max-w-5xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Your journey"
          title="My Progress."
          subtitle="Your engineering journey at a glance — XP, streaks, problems solved, and skill development."
          stats={[
            { value: `${stats.totalXP.toLocaleString()}`, label: 'Total XP', color: '#60a5fa' },
            { value: stats.streak, label: 'Day Streak', color: '#E82127' },
            { value: stats.problemsSolved, label: 'Problems Solved' },
          ]}
          actions={
            <Link to="/app/achievements" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t2)', textDecoration: 'none', border: '1px solid var(--border)', padding: '8px 14px', transition: 'all 0.15s' }}>
              <Icon name="emoji_events" size={14} />Achievements
            </Link>
          }
        />

        {/* XP & Level hero */}
        <motion.div
          style={{
            background: 'linear-gradient(135deg, rgba(8,16,40,0.85) 0%, rgba(10,10,14,0.9) 100%)',
            border: '1px solid rgba(96,165,250,0.2)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 0 60px rgba(96,165,250,0.06), inset 0 1px 0 rgba(96,165,250,0.08), 0 8px 32px rgba(0,0,0,0.5)',
            padding: 24,
            position: 'relative', overflow: 'hidden',
          }}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #60a5fa, transparent)' }} />
          <div
            style={{ height: 1, marginBottom: 24, background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.6) 40%, rgba(96,165,250,0.3) 70%, transparent)' }}
          />
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-black" style={{ color: '#60a5fa' }}>{stats.totalXP.toLocaleString()} XP</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color: '#93c5fd', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  Level {stats.level} · {LEVEL_NAMES[stats.level] ?? 'Legend'}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--t2)' }}>{stats.xpToNext} XP to Level {stats.level + 1} · {LEVEL_NAMES[stats.level + 1] ?? 'Max'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--t3)' }}>This Week</p>
              <p className="text-xl font-black" style={{ color: '#4ade80' }}>+{stats.weeklyXP} XP</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              <span>Level {stats.level}</span>
              <span className="font-bold">{levelPct}%</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', boxShadow: '0 0 12px rgba(96,165,250,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="code"             label="Problems Solved"    value={stats.problemsSolved}    sub={`of ${stats.totalProblems} total`} color="#fb923c" glow="rgba(251,146,60,0.15)"  delay={0} />
          <StatCard icon="auto_stories"     label="Topics Done"        value={stats.topicsCompleted}   sub={`of ${stats.totalTopics} total`}   color="#60a5fa" glow="rgba(96,165,250,0.15)"  delay={0.05} />
          <StatCard icon="style"            label="Flashcards"         value={stats.flashcardsReviewed} sub="reviewed"                         color="#c084fc" glow="rgba(192,132,252,0.15)" delay={0.1} />
          <StatCard icon="record_voice_over" label="Mock Interviews"   value={stats.mockInterviews}    sub="completed"                         color="#f472b6" glow="rgba(244,114,182,0.15)" delay={0.15} />
        </div>

        {/* Heatmap */}
        <ActivityHeatmap days={stats.dailyActivity} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeeklyXPChart days={stats.dailyActivity} />
          <RankCard percentile={stats.rankPercentile} streak={stats.streak} longestStreak={stats.longestStreak} />
        </div>

        {/* Subject progress */}
        <SubjectProgressPanel subjects={stats.subjectProgress} />

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/app/daily',        icon: 'today',         label: "Extend Your Streak",  desc: "Solve today's challenge",         color: '#fb923c', glow: 'rgba(251,146,60,0.12)' },
            { to: '/app/roadmap',      icon: 'map',           label: 'Follow the Roadmap',  desc: 'Structured week-by-week plan',    color: '#4ade80', glow: 'rgba(74,222,128,0.12)' },
            { to: '/app/pattern-quiz', icon: 'quiz',          label: 'Test Your Patterns',  desc: '20-question algorithm quiz',      color: '#818cf8', glow: 'rgba(129,140,248,0.12)' },
          ].map((cta) => (
            <motion.div key={cta.to} whileHover={{ scale: 1.02, boxShadow: `0 8px 32px ${cta.glow}` }} transition={{ duration: 0.15 }}>
              <Link
                to={cta.to}
                className="flex items-center gap-3 p-4 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', display: 'flex', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: cta.glow }}>
                  <Icon name={cta.icon} size={20} style={{ color: cta.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{cta.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{cta.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
