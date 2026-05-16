import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';
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

function generateFakeDailyActivity(): DailyActivity[] {
  const days: DailyActivity[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    // Simulate sparse activity with occasional hot streaks
    const rand = Math.random();
    const active = rand > 0.55;
    days.push({
      date: dateStr,
      xp: active ? Math.floor(Math.random() * 150 + 20) : 0,
      problems: active ? Math.floor(Math.random() * 4) : 0,
      topics: active ? Math.floor(Math.random() * 2) : 0,
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
    { id: 'os',      title: 'Operating Systems', icon: 'terminal',    color: 'text-blue-400',   completed: 5,  total: 19 },
    { id: 'dbms',    title: 'DBMS',              icon: 'storage',     color: 'text-purple-400', completed: 6,  total: 14 },
    { id: 'networks',title: 'Networks',           icon: 'wifi',        color: 'text-cyan-400',   completed: 4,  total: 16 },
    { id: 'oop',     title: 'OOP',               icon: 'code_blocks', color: 'text-green-400',  completed: 8,  total: 14 },
    { id: 'sd',      title: 'System Design',     icon: 'architecture',color: 'text-orange-400', completed: 9,  total: 19 },
    { id: 'discrete',title: 'Discrete Math',     icon: 'calculate',   color: 'text-teal-400',   completed: 2,  total: 15 },
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

const INTENSITY_CLASSES = [
  'bg-zinc-800',
  'bg-blue-900/70',
  'bg-blue-600/70',
  'bg-blue-500/80',
  'bg-blue-400',
];

function groupByWeek(days: DailyActivity[]): DailyActivity[][] {
  const weeks: DailyActivity[][] = [];
  // Pad so first day aligns to correct weekday (0=Sun)
  const firstDay = new Date(days[0].date);
  const padDays = firstDay.getDay(); // 0-6
  const padded: (DailyActivity | null)[] = [
    ...Array(padDays).fill(null),
    ...days,
  ];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7).filter((d): d is DailyActivity => d !== null));
  }
  return weeks;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
        </div>
        <span className={`material-symbols-outlined text-2xl opacity-60 ${color}`}>{icon}</span>
      </div>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function WeeklyXPChart({ days }: { days: DailyActivity[] }) {
  const last14 = days.slice(-14);
  const maxXP = Math.max(...last14.map(d => d.xp), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">XP — Last 14 Days</p>
      <div className="flex items-end gap-1 h-24">
        {last14.map((day, i) => {
          const pct = (day.xp / maxXP) * 100;
          const label = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    day.xp > 0 ? 'bg-blue-500 group-hover:bg-blue-400' : 'bg-zinc-800'
                  }`}
                  style={{ height: `${Math.max(pct, day.xp > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-600 hidden sm:block">{label[0]}</span>
              {/* tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10
                bg-zinc-800 text-zinc-100 text-xs rounded px-2 py-1 whitespace-nowrap border border-zinc-700 pointer-events-none">
                {day.xp} XP · {day.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ days }: { days: DailyActivity[] }) {
  const weeks = groupByWeek(days);

  // Get month labels positioned by week index
  const monthMarkers: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  days.forEach((day, di) => {
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) {
      const weekIdx = Math.floor(di / 7);
      monthMarkers.push({ label: MONTH_LABELS[m], weekIdx });
      lastMonth = m;
    }
  });

  const totalXP = days.reduce((s, d) => s + d.xp, 0);
  const activeDays = days.filter(d => d.xp > 0).length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Activity Heatmap — Last 52 Weeks</p>
        <p className="text-xs text-zinc-500">{activeDays} active days · {totalXP.toLocaleString()} total XP</p>
      </div>

      {/* Month labels */}
      <div className="flex gap-[2px] mb-1 ml-6">
        {weeks.map((_, wi) => {
          const marker = monthMarkers.find(m => m.weekIdx === wi);
          return (
            <div key={wi} className="w-3 flex-shrink-0 text-[9px] text-zinc-600 text-center">
              {marker ? marker.label[0] : ''}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[2px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="h-3 w-4 text-[9px] text-zinc-600 flex items-center">{i % 2 === 1 ? d : ''}</div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {/* Pad to 7 cells */}
            {Array(7).fill(null).map((_, di) => {
              const day = week[di];
              const intensity = day ? xpToIntensity(day.xp) : 0;
              return (
                <div
                  key={di}
                  title={day ? `${day.date}: ${day.xp} XP, ${day.problems} problems` : ''}
                  className={`w-3 h-3 rounded-[2px] flex-shrink-0 ${INTENSITY_CLASSES[intensity]} transition-colors cursor-default`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-zinc-600">Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[10px] text-zinc-600">More</span>
      </div>
    </div>
  );
}

// ─── Subject progress bars ────────────────────────────────────────────────────

function SubjectProgressPanel({ subjects }: { subjects: SubjectProgress[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subject Completion</p>
      {subjects.map(s => {
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <Link key={s.id} to={`/app/subjects/${s.id}`} className="block group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${s.color}`}>{s.icon}</span>
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{s.title}</span>
              </div>
              <span className="text-xs text-zinc-500">{s.completed}/{s.total}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-zinc-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Rank card ────────────────────────────────────────────────────────────────

function RankCard({ percentile, streak, longestStreak }: { percentile: number; streak: number; longestStreak: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Your Standing</p>

      <div className="text-center py-2">
        <p className="text-4xl font-black text-yellow-400">Top {100 - percentile}%</p>
        <p className="text-xs text-zinc-500 mt-1">among all EYF users this week</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-orange-400">{streak}</p>
          <p className="text-[11px] text-zinc-500">Current Streak</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-orange-300">{longestStreak}</p>
          <p className="text-[11px] text-zinc-500">Longest Streak</p>
        </div>
      </div>

      <Link
        to="/app/leaderboard"
        className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors pt-1"
      >
        <span className="material-symbols-outlined text-sm">leaderboard</span>
        View Full Leaderboard
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const { user } = useUser();
  const session = getSession();
  const [stats, setStats] = useState<StatsData>(STATIC_STATS);

  useEffect(() => {
    if (!session) return;
    apiRequest('/progress/stats')
      .then((data: StatsData) => setStats(data))
      .catch(() => { /* keep static */ });
  }, [session]);

  const levelPct = useMemo(() => {
    const curr = LEVEL_THRESHOLDS[stats.level] ?? 0;
    const next = LEVEL_THRESHOLDS[stats.level + 1] ?? curr + 1000;
    return Math.round(((stats.totalXP - curr) / (next - curr)) * 100);
  }, [stats]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Progress</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Your engineering journey at a glance</p>
          </div>
          <Link
            to="/app/achievements"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">emoji_events</span>
            Achievements
          </Link>
        </div>

        {/* XP & Level hero */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/30 border border-zinc-700 rounded-2xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-black text-blue-400">{stats.totalXP.toLocaleString()} XP</span>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">
                  Level {stats.level} · {LEVEL_NAMES[stats.level] ?? 'Legend'}
                </span>
              </div>
              <p className="text-zinc-500 text-sm">{stats.xpToNext} XP to Level {stats.level + 1} · {LEVEL_NAMES[stats.level + 1] ?? 'Max'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">This Week</p>
              <p className="text-xl font-bold text-green-400">+{stats.weeklyXP} XP</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
              <span>Level {stats.level}</span>
              <span>{levelPct}%</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${levelPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon="code"
            label="Problems Solved"
            value={stats.problemsSolved}
            sub={`of ${stats.totalProblems} total`}
            color="text-orange-400"
          />
          <StatCard
            icon="auto_stories"
            label="Topics Done"
            value={stats.topicsCompleted}
            sub={`of ${stats.totalTopics} total`}
            color="text-blue-400"
          />
          <StatCard
            icon="style"
            label="Flashcards Reviewed"
            value={stats.flashcardsReviewed}
            sub="all time"
            color="text-purple-400"
          />
          <StatCard
            icon="record_voice_over"
            label="Mock Interviews"
            value={stats.mockInterviews}
            sub="completed"
            color="text-pink-400"
          />
        </div>

        {/* Heatmap */}
        <ActivityHeatmap days={stats.dailyActivity} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeeklyXPChart days={stats.dailyActivity} />
          <RankCard
            percentile={stats.rankPercentile}
            streak={stats.streak}
            longestStreak={stats.longestStreak}
          />
        </div>

        {/* Subject progress */}
        <SubjectProgressPanel subjects={stats.subjectProgress} />

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/app/daily', icon: 'today', label: 'Extend Your Streak', color: 'text-orange-400', desc: 'Solve today\'s challenge' },
            { to: '/app/roadmap', icon: 'map', label: 'Follow the Roadmap', color: 'text-green-400', desc: 'Structured week-by-week plan' },
            { to: '/app/pattern-quiz', icon: 'quiz', label: 'Test Your Patterns', color: 'text-indigo-400', desc: '20-question algorithm quiz' },
          ].map(cta => (
            <Link
              key={cta.to}
              to={cta.to}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-colors group"
            >
              <span className={`material-symbols-outlined text-2xl ${cta.color} group-hover:scale-110 transition-transform`}>
                {cta.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{cta.label}</p>
                <p className="text-xs text-zinc-500">{cta.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
