import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';
import { LevelUpModal } from '../components/LevelUpModal';
import { StreakToast } from '../components/StreakToast';

interface ModulesStatus { items: Array<{ module: string; progress: number; cta: string }> }
interface DailyChallenge { id: string; slug: string; title: string; difficulty: 'easy'|'medium'|'hard'; category: string; xpReward: number; solved?: boolean }

const LEVEL_NAMES      = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

const MODULE_CONFIG: Record<string, { icon: string; title: string; path: string; hex: string }> = {
  dsa:              { icon: 'code',              title: 'DSA',           path: '/app/problems',       hex: '#2563EB' },
  'core-subjects':  { icon: 'terminal',          title: 'Core CS',       path: '/app/subjects',       hex: '#16A34A' },
  oop:              { icon: 'account_tree',       title: 'OOP',           path: '/app/oop',            hex: '#7C3AED' },
  security:         { icon: 'shield',             title: 'Security',      path: '/app/cybersecurity',  hex: '#E8192C' },
  'system-design':  { icon: 'architecture',       title: 'Sys Design',    path: '/app/system-design',  hex: '#0891B2' },
  placement:        { icon: 'work_history',        title: 'Placement',     path: '/app/placement',      hex: '#EA580C' },
  'resume-builder': { icon: 'description',         title: 'Resume',        path: '/app/resume',         hex: '#CA8A04' },
  'tech-skills':    { icon: 'psychology',          title: 'Tech Skills',   path: '/app/skills',         hex: '#0D9488' },
  mentorship:       { icon: 'groups',              title: 'Mentorship',    path: '/app/mentorship',     hex: '#DB2777' },
  experts:          { icon: 'workspace_premium',   title: 'Experts',       path: '/app/experts',        hex: '#D97706' },
  community:        { icon: 'forum',               title: 'Community',     path: '/app/community',      hex: '#6366F1' },
  visualizer:       { icon: 'visibility',          title: 'Visualizer',    path: '/app/visualizer',     hex: '#65A30D' },
  cheatsheets:      { icon: 'quick_reference_all', title: 'Cheat Sheets',  path: '/app/cheatsheets',    hex: '#0284C7' },
  flashcards:       { icon: 'style',               title: 'Flashcards',    path: '/app/flashcards',     hex: '#9333EA' },
  'study-plan':     { icon: 'calendar_month',       title: 'Study Plan',    path: '/app/study-plan',     hex: '#6366F1' },
  tracker:          { icon: 'track_changes',         title: 'Job Tracker',   path: '/app/tracker',        hex: '#059669' },
};

const ENGINEERING_INSIGHTS = [
  { tip: "Prefer composition over inheritance. Wrapping objects is more flexible than subclassing — you can swap behaviors at runtime without changing class hierarchies.", category: 'OOP', icon: 'account_tree', hex: '#7C3AED' },
  { tip: "Never use SELECT * in production queries. Fetching unnecessary columns increases I/O, breaks covering indexes, and leaks schema changes to callers.", category: 'DBMS', icon: 'storage', hex: '#7C3AED' },
  { tip: "When interviewing at Amazon, every behavioral answer must map to at least one Leadership Principle. Name it explicitly — it signals pattern recognition.", category: 'Career', icon: 'work', hex: '#EA580C' },
  { tip: "In system design, state your assumptions out loud. Interviewers can't see your mental model — saying 'I'll assume 100M DAU' shows senior thinking.", category: 'System Design', icon: 'architecture', hex: '#0891B2' },
  { tip: "The sliding window pattern applies any time you need the 'best contiguous subarray'. Trigger words: 'subarray/substring', 'at most K', 'contiguous'.", category: 'DSA', icon: 'code', hex: '#2563EB' },
  { tip: "Don't store raw passwords, ever. Use bcrypt (cost ≥ 12), Argon2id, or scrypt. MD5 and SHA-256 are NOT password hashing algorithms — they're too fast.", category: 'Security', icon: 'shield', hex: '#E8192C' },
  { tip: "BFS = shortest path (unweighted). Dijkstra = weighted (non-negative). Bellman-Ford = negative edges. Floyd-Warshall = all-pairs shortest paths.", category: 'DSA', icon: 'code', hex: '#2563EB' },
  { tip: "Rate limiting: token bucket (bursty, smooth average), sliding window log (precise), fixed window counter (simple, edge-case spikes at boundaries).", category: 'System Design', icon: 'architecture', hex: '#0891B2' },
  { tip: "Page faults are expensive — each is a trip to disk (µs → ms). If active pages exceed RAM, performance collapses through thrashing.", category: 'OS', icon: 'terminal', hex: '#16A34A' },
  { tip: "DP heuristic: if you see 'minimum/maximum', 'count ways', or 'is it possible' — suspect DP. Start with recursion + memo, then optimize to tabulation.", category: 'DSA', icon: 'code', hex: '#2563EB' },
];

/* ── Progress ring ────────────────────────────────────────────────────────── */

function ProgressRing({ pct, hex }: { readonly pct: number; readonly hex: string }) {
  const r    = 17;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#F4F4F5" strokeWidth="2.5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={hex} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: hex }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Activity heatmap ─────────────────────────────────────────────────────── */

function ActivityHeatmap({ streak }: { readonly streak: number }) {
  const weeks = 12;
  const days  = weeks * 7;
  const cells = Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    const h = ((i * 2654435761) >>> 0) % 100;
    if (daysAgo < streak) return (h % 3) + 1;
    if (daysAgo < streak + 7) return h > 60 ? 1 : 0;
    return h > 80 ? 1 : 0;
  });

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, d) => {
              const v = cells[w * 7 + d] ?? 0;
              return <div key={d} className={`hm hm-${v}`} />;
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px]" style={{ color: 'var(--t4)' }}>Less</span>
        {[0,1,2,3,4].map((v) => <div key={v} className={`hm hm-${v}`} />)}
        <span className="text-[10px]" style={{ color: 'var(--t4)' }}>More</span>
      </div>
    </div>
  );
}

/* ── Daily challenge card ─────────────────────────────────────────────────── */

function DailyChallengeCard() {
  const todayKey = `eyf.daily.${new Date().toISOString().split('T')[0]}`;
  const done     = localStorage.getItem(todayKey) === 'done';
  const day      = new Date().getDate() - 1;
  const POOL = [
    { title: 'Two Sum',                    type: 'DSA',           diff: 'easy' as const },
    { title: 'Design a URL Shortener',     type: 'System Design', diff: 'medium' as const },
    { title: 'Valid Parentheses',          type: 'DSA',           diff: 'easy' as const },
    { title: 'Maximum Subarray',           type: 'DSA',           diff: 'medium' as const },
    { title: 'SQL Injection Defense',      type: 'Security',      diff: 'medium' as const },
    { title: 'Design a Rate Limiter',      type: 'System Design', diff: 'medium' as const },
    { title: 'Number of Islands',          type: 'DSA',           diff: 'medium' as const },
    { title: 'Coin Change',                type: 'DSA',           diff: 'medium' as const },
    { title: 'LRU Cache',                  type: 'DSA',           diff: 'hard' as const },
    { title: 'Design Notification System', type: 'System Design', diff: 'hard' as const },
  ];
  const today = POOL[day % POOL.length];

  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--red-muted)' }}>
          <span className="material-symbols-rounded text-sm" style={{ color: 'var(--red)' }}>today</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Daily Challenge</span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(202,138,4,0.1)', color: '#CA8A04' }}>+50 XP</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`tag tag-${today.diff}`}>{today.diff}</span>
        <span className="text-xs" style={{ color: 'var(--t4)' }}>{today.type}</span>
      </div>
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>{today.title}</p>
      <Link to="/app/daily">
        <button
          type="button"
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          style={done
            ? { background: 'rgba(22,163,74,0.08)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.15)' }
            : { background: 'var(--red)', color: '#fff', border: 'none' }
          }
        >
          {done
            ? <><span className="material-symbols-rounded text-base">check_circle</span> Completed</>
            : <>Solve now <span className="material-symbols-rounded text-base">arrow_forward</span></>
          }
        </button>
      </Link>
    </div>
  );
}

/* ── Recommendations ──────────────────────────────────────────────────────── */

type ModItem = { module: string; progress: number; cta: string };

function buildRecommendations(xp: number, streak: number, modules: ModItem[]) {
  const progressOf = (key: string) => {
    const m = modules.find((x) => x.module === key);
    if (!m) return 0;
    return m.progress > 1 ? m.progress : Math.round(m.progress * 100);
  };

  const recs: Array<{ icon: string; hex: string; title: string; reason: string; path: string; xpLabel: string; priority: number }> = [];

  if (streak === 0) recs.push({ icon: 'local_fire_department', hex: '#EA580C', title: 'Start your streak', reason: "You haven't solved anything yet today — start now!", path: '/app/problems', xpLabel: '+10 XP', priority: 10 });
  else if (streak < 3) recs.push({ icon: 'local_fire_department', hex: '#EA580C', title: `Keep your ${streak}d streak alive`, reason: 'Solve one problem before midnight to extend it.', path: '/app/problems', xpLabel: '+25 XP', priority: 9 });
  if (progressOf('flashcards') === 0) recs.push({ icon: 'style', hex: '#9333EA', title: 'Try Flashcards', reason: 'SM-2 spaced repetition — never forget a concept again.', path: '/app/flashcards', xpLabel: '+40 XP', priority: 7 });
  if (progressOf('oop') < 20) recs.push({ icon: 'account_tree', hex: '#7C3AED', title: 'Learn a GoF Design Pattern', reason: 'Design patterns appear in 60% of senior-level interviews.', path: '/app/oop', xpLabel: '+50 XP', priority: 5 });
  if (progressOf('system-design') < 10) recs.push({ icon: 'architecture', hex: '#0891B2', title: 'Start System Design', reason: 'Mandatory for mid-senior roles. Begin with URL shortener.', path: '/app/system-design', xpLabel: '+30 XP', priority: 4 });
  if (progressOf('core-subjects') < 15) recs.push({ icon: 'terminal', hex: '#16A34A', title: 'Complete a Core CS topic', reason: 'OS, DBMS, and Networks are asked in every FAANG loop.', path: '/app/subjects', xpLabel: '+15 XP', priority: 3 });
  if (progressOf('mock-interview') === 0 && xp > 100) recs.push({ icon: 'record_voice_over', hex: '#EA580C', title: 'Take a Mock Interview', reason: "You've built some XP — now test yourself under pressure.", path: '/app/mock-interview', xpLabel: '+75 XP', priority: 5 });
  if (!localStorage.getItem('eyf.studyPlanConfig') && xp > 50) recs.push({ icon: 'calendar_month', hex: '#6366F1', title: 'Build your Study Plan', reason: 'Enter your target company and get a day-by-day schedule.', path: '/app/study-plan', xpLabel: 'Free!', priority: 6 });

  return recs.toSorted((a, b) => b.priority - a.priority).slice(0, 3);
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function HomePage() {
  const session = getSession();
  const { summary, displayName, refresh } = useUser();
  const [modules,     setModules]     = useState<ModulesStatus['items']>([]);
  const [,            setDaily]       = useState<DailyChallenge | null>(null);
  const [levelUpFor,  setLevelUpFor]  = useState<number | null>(null);
  const [streakToast, setStreakToast] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<ModulesStatus>('/modules/status', { token: session.accessToken })
      .then((d) => setModules(d.items)).catch(() => {});
    apiRequest<{ problems: DailyChallenge[] }>('/problems?limit=1&daily=true', { token: session.accessToken })
      .then((d) => { if (d.problems[0]) setDaily(d.problems[0]); }).catch(() => {});
  }, [session?.accessToken]);

  useEffect(() => {
    if (!summary) return;
    const stored = Number(localStorage.getItem('eyf.lastLevel') ?? 0);
    if (stored > 0 && summary.level > stored) setLevelUpFor(summary.level);
    localStorage.setItem('eyf.lastLevel', String(summary.level));
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('eyf.lastStreakToastDay');
    if ([7,14,30,60,100,200,365].includes(summary.streak) && lastDay !== today) {
      localStorage.setItem('eyf.lastStreakToastDay', today);
      setStreakToast(true);
    }
  }, [summary]);

  const xp        = summary?.xp ?? 0;
  const weeklyXp  = summary?.weeklyXp ?? 0;
  const streak    = summary?.streak ?? 0;
  const level     = summary?.level ?? 0;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const achievementsEarned  = summary?.achievementsEarned ?? 0;
  const recentAchievements  = summary?.recentAchievements ?? [];
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS.at(-1)!;
  const currThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold > currThreshold
    ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100))
    : 100;

  const defaultModules = Object.keys(MODULE_CONFIG).map((k) => ({ module: k, progress: 0, cta: 'Start' }));
  const moduleList = modules.length > 0
    ? [...modules, ...defaultModules.filter((d) => !modules.some((m) => m.module === d.module))]
    : defaultModules;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const insight   = ENGINEERING_INSIGHTS[dayOfYear % ENGINEERING_INSIGHTS.length];
  const [insightDismissed, setInsightDismissed] = useState(
    () => localStorage.getItem('eyf.insightDay') === String(dayOfYear),
  );

  const recs = buildRecommendations(xp, streak, moduleList);

  const appear = (delay = 0) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, delay, ease: 'easeOut' as const },
  });

  return (
    <AppShell>
      {levelUpFor && (
        <LevelUpModal level={levelUpFor} onClose={() => { setLevelUpFor(null); refresh(); }} />
      )}
      {streakToast && streak > 0 && (
        <StreakToast streak={streak} onClose={() => setStreakToast(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-24">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div {...appear(0)} className="mb-8">
          <p className="text-sm mb-1" style={{ color: 'var(--t3)' }}>{greeting},</p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--t1)', letterSpacing: '-0.025em' }}
            >
              {displayName || 'Engineer'}
            </h1>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="streak-badge">
                  <span>🔥</span>
                  <span>{streak}d streak</span>
                </div>
              )}
              <Link to="/app/progress" className="btn btn-secondary btn-sm">
                <span className="material-symbols-rounded text-sm">insights</span>
                Progress
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Stat tiles ──────────────────────────────────────────────────── */}
        <motion.div {...appear(0.04)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total XP',  value: xp.toLocaleString(),          sub: `Lv.${level} · ${levelName}`, color: 'var(--red)' },
            { label: 'This Week', value: `+${weeklyXp.toLocaleString()}`, sub: 'XP earned',               color: '#16A34A' },
            { label: 'Streak',    value: `${streak}d`,                  sub: streak >= 7 ? '🔥 On fire' : 'Keep going', color: '#EA580C' },
            { label: 'Badges',    value: String(achievementsEarned),    sub: 'earned',                     color: '#CA8A04' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="stat-tile">
              <p className="field-label mb-2">{label}</p>
              <p className="text-xl font-bold mb-0.5" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--t4)' }}>{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* XP bar */}
        <motion.div {...appear(0.06)} className="mb-8 stat-tile">
          <div className="flex justify-between mb-2 text-xs" style={{ color: 'var(--t3)' }}>
            <span className="font-medium">Lv.{level} · {levelName}</span>
            <span>{(nextThreshold - xp).toLocaleString()} XP to {LEVEL_NAMES[level + 1] ?? 'Legend'}</span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--t4)' }}>
            <span>{xpPct}% to next level</span>
            <span>{xp.toLocaleString()} XP total</span>
          </div>
        </motion.div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-4">

            {/* Readiness CTA */}
            <motion.div {...appear(0.08)}>
              <Link to="/app/readiness">
                <div
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--red-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,25,44,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--red-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--red-muted)' }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--red)' }}>speed</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--t1)' }}>Check Placement Readiness</p>
                    <p className="text-xs" style={{ color: 'var(--t3)' }}>See your score, skill gaps, and 7-day improvement plan</p>
                  </div>
                  <span className="material-symbols-rounded text-base shrink-0" style={{ color: 'var(--t4)' }}>arrow_forward</span>
                </div>
              </Link>
            </motion.div>

            {/* Recommendations */}
            <motion.div {...appear(0.1)}>
              <p className="field-label mb-3">Recommended next</p>
              <div className="space-y-2">
                {recs.map((rec) => (
                  <Link key={rec.path} to={rec.path}>
                    <div
                      className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'; }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${rec.hex}12` }}>
                        <span className="material-symbols-rounded text-sm" style={{ color: rec.hex }}>{rec.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--t1)' }}>{rec.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>{rec.reason}</p>
                      </div>
                      <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A' }}>{rec.xpLabel}</span>
                    </div>
                  </Link>
                ))}
                {recs.length === 0 && (
                  <div className="card text-center py-6">
                    <p className="text-sm" style={{ color: 'var(--t4)' }}>Great work — keep exploring modules!</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick access */}
            <motion.div {...appear(0.13)}>
              <p className="field-label mb-3">Quick access</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'DSA',         icon: 'code',              path: '/app/problems',       hex: '#2563EB' },
                  { label: 'Design',      icon: 'architecture',      path: '/app/system-design',  hex: '#0891B2' },
                  { label: 'Companies',   icon: 'business',          path: '/app/companies',      hex: '#E8192C' },
                  { label: 'Community',   icon: 'forum',             path: '/app/community',      hex: '#6366F1' },
                  { label: 'Mock',        icon: 'record_voice_over', path: '/app/mock-interview', hex: '#EA580C' },
                  { label: 'Flashcards',  icon: 'style',             path: '/app/flashcards',     hex: '#9333EA' },
                  { label: 'Notes',       icon: 'sticky_note_2',     path: '/app/notes',          hex: '#CA8A04' },
                  { label: 'Contest',     icon: 'emoji_events',      path: '/app/contests',       hex: '#16A34A' },
                ].map((a) => (
                  <Link key={a.path} to={a.path}>
                    <div
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer transition-all"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                    >
                      <span className="material-symbols-rounded text-lg" style={{ color: a.hex }}>{a.icon}</span>
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--t3)' }}>{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right col */}
          <div className="space-y-4">
            <motion.div {...appear(0.09)}>
              <DailyChallengeCard />
            </motion.div>

            {/* Engineering insight */}
            {!insightDismissed && (
              <motion.div {...appear(0.12)}>
                <div className="insight-card">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: `${insight.hex}10` }}>
                        <span className="material-symbols-rounded text-xs" style={{ color: insight.hex }}>{insight.icon}</span>
                      </div>
                      <span className="field-label" style={{ marginBottom: 0 }}>{insight.category}</span>
                    </div>
                    <button
                      onClick={() => { setInsightDismissed(true); localStorage.setItem('eyf.insightDay', String(dayOfYear)); }}
                      className="shrink-0 transition-colors rounded hover:bg-[var(--bg-elevated)] p-0.5"
                      style={{ color: 'var(--t4)' }}
                      aria-label="Dismiss insight"
                    >
                      <span className="material-symbols-rounded text-sm">close</span>
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>{insight.tip}</p>
                </div>
              </motion.div>
            )}

            {/* Recent badges */}
            {recentAchievements.length > 0 && (
              <motion.div {...appear(0.14)}>
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="field-label" style={{ marginBottom: 0 }}>Recent badges</p>
                    <Link
                      to="/app/achievements"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: 'var(--red)' }}
                    >
                      All {achievementsEarned} →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentAchievements.map((a) => (
                      <div
                        key={a.key}
                        title={a.name}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-default transition-transform hover:scale-110"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        {a.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Activity heatmap ────────────────────────────────────────────── */}
        <motion.div {...appear(0.18)} className="mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--t1)' }}>Activity</p>
                <p className="text-xs" style={{ color: 'var(--t3)' }}>12-week history</p>
              </div>
              <Link to="/app/progress" className="btn btn-ghost btn-sm">View full history</Link>
            </div>
            <ActivityHeatmap streak={streak} />
          </div>
        </motion.div>

        {/* ── All modules ──────────────────────────────────────────────────── */}
        <motion.div {...appear(0.2)}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>All modules</p>
            <Link to="/app/career" className="btn btn-ghost btn-sm">Learning path →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {moduleList.map((mod) => {
              const cfg = MODULE_CONFIG[mod.module];
              if (!cfg) return null;
              const rawPct = mod.progress;
              let pct = 0;
              if (typeof rawPct === 'number') {
                pct = rawPct > 1 ? Math.round(rawPct) : Math.round(rawPct * 100);
              }
              return (
                <Link key={mod.module} to={cfg.path} className="module-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cfg.hex}12` }}>
                      <span className="material-symbols-rounded text-base" style={{ color: cfg.hex }}>{cfg.icon}</span>
                    </div>
                    <ProgressRing pct={pct} hex={cfg.hex} />
                  </div>
                  <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--t1)' }}>{cfg.title}</p>
                  <p className="text-[10px] font-medium" style={{ color: cfg.hex }}>
                    {mod.cta || 'Start'}
                  </p>
                </Link>
              );
            })}
          </div>
        </motion.div>

      </div>
    </AppShell>
  );
}
