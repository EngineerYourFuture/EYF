import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';
import { LevelUpModal } from '../components/LevelUpModal';
import { StreakToast } from '../components/StreakToast';

interface ModulesStatus { items: Array<{ module: string; progress: number; cta: string }> }

const LEVEL_NAMES      = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

const MODULE_CONFIG: Record<string, { icon: string; title: string; path: string; hex: string }> = {
  dsa:              { icon: 'code',              title: 'DSA',           path: '/app/problems',       hex: '#3B82F6' },
  'core-subjects':  { icon: 'terminal',          title: 'Core CS',       path: '/app/subjects',       hex: '#22C55E' },
  oop:              { icon: 'account_tree',       title: 'OOP',           path: '/app/oop',            hex: '#A855F7' },
  security:         { icon: 'shield',             title: 'Security',      path: '/app/cybersecurity',  hex: '#EF4444' },
  'system-design':  { icon: 'architecture',       title: 'Sys Design',    path: '/app/system-design',  hex: '#06B6D4' },
  placement:        { icon: 'work_history',        title: 'Placement',     path: '/app/placement',      hex: '#F97316' },
  'resume-builder': { icon: 'description',         title: 'Resume',        path: '/app/resume',         hex: '#EAB308' },
  'tech-skills':    { icon: 'psychology',          title: 'Tech Skills',   path: '/app/skills',         hex: '#14B8A6' },
  mentorship:       { icon: 'groups',              title: 'Mentorship',    path: '/app/mentorship',     hex: '#EC4899' },
  experts:          { icon: 'workspace_premium',   title: 'Experts',       path: '/app/experts',        hex: '#F59E0B' },
  community:        { icon: 'forum',               title: 'Community',     path: '/app/community',      hex: '#6366F1' },
  visualizer:       { icon: 'visibility',          title: 'Visualizer',    path: '/app/visualizer',     hex: '#84CC16' },
  cheatsheets:      { icon: 'quick_reference_all', title: 'Cheat Sheets',  path: '/app/cheatsheets',    hex: '#0EA5E9' },
  flashcards:       { icon: 'style',               title: 'Flashcards',    path: '/app/flashcards',     hex: '#8B5CF6' },
  'study-plan':     { icon: 'calendar_month',       title: 'Study Plan',    path: '/app/study-plan',     hex: '#6366F1' },
  tracker:          { icon: 'track_changes',         title: 'Job Tracker',   path: '/app/tracker',        hex: '#10B981' },
};

const ENGINEERING_INSIGHTS = [
  { tip: "Prefer composition over inheritance. Wrapping objects is more flexible than subclassing — you can swap behaviors at runtime without changing class hierarchies.", category: 'OOP', icon: 'account_tree', hex: '#A855F7' },
  { tip: "Never use SELECT * in production queries. Fetching unnecessary columns increases I/O, breaks covering indexes, and leaks schema changes to callers.", category: 'DBMS', icon: 'storage', hex: '#A855F7' },
  { tip: "When interviewing at Amazon, every behavioral answer must map to at least one Leadership Principle. Name it explicitly — it signals pattern recognition.", category: 'Career', icon: 'work', hex: '#F97316' },
  { tip: "In system design, state your assumptions out loud. Interviewers can't see your mental model — saying 'I'll assume 100M DAU' shows senior thinking.", category: 'System Design', icon: 'architecture', hex: '#06B6D4' },
  { tip: "The sliding window pattern applies any time you need the 'best contiguous subarray'. Trigger words: 'subarray/substring', 'at most K', 'contiguous'.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
  { tip: "Don't store raw passwords, ever. Use bcrypt (cost ≥ 12), Argon2id, or scrypt. MD5 and SHA-256 are NOT password hashing algorithms — they're too fast.", category: 'Security', icon: 'shield', hex: '#EF4444' },
  { tip: "BFS = shortest path (unweighted). Dijkstra = weighted (non-negative). Bellman-Ford = negative edges. Floyd-Warshall = all-pairs shortest paths.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
  { tip: "Rate limiting: token bucket (bursty, smooth average), sliding window log (precise), fixed window counter (simple, edge-case spikes at boundaries).", category: 'System Design', icon: 'architecture', hex: '#06B6D4' },
  { tip: "Page faults are expensive — each is a trip to disk (µs → ms). If active pages exceed RAM, performance collapses through thrashing.", category: 'OS', icon: 'terminal', hex: '#22C55E' },
  { tip: "DP heuristic: if you see 'minimum/maximum', 'count ways', or 'is it possible' — suspect DP. Start with recursion + memo, then optimize to tabulation.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
];

/* ── Glass card ───────────────────────────────────────────────────────────── */
function GlassCard({ children, style, className, glow }: {
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
  readonly className?: string;
  readonly glow?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        boxShadow: glow
          ? `0 0 40px ${glow}12, inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)`
          : `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.35)`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Inner top shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}

/* ── Progress ring ────────────────────────────────────────────────────────── */
function ProgressRing({ pct, hex }: { readonly pct: number; readonly hex: string }) {
  const r = 16; const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-9 h-9 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <motion.circle cx="19" cy="19" r={r} fill="none" stroke={hex} strokeWidth="2"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} strokeLinecap="butt" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 8, fontWeight: 700, color: hex }}>
        {pct}%
      </span>
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
  if (streak === 0) recs.push({ icon: 'local_fire_department', hex: '#F97316', title: 'Start your streak', reason: "Haven't solved anything today — start now!", path: '/app/problems', xpLabel: '+10 XP', priority: 10 });
  else if (streak < 3) recs.push({ icon: 'local_fire_department', hex: '#F97316', title: `Extend your ${streak}-day streak`, reason: 'Solve one problem before midnight.', path: '/app/problems', xpLabel: '+25 XP', priority: 9 });
  if (progressOf('flashcards') === 0) recs.push({ icon: 'style', hex: '#8B5CF6', title: 'Try Flashcards', reason: 'SM-2 spaced repetition — never forget a concept.', path: '/app/flashcards', xpLabel: '+40 XP', priority: 7 });
  if (progressOf('oop') < 20) recs.push({ icon: 'account_tree', hex: '#A855F7', title: 'Learn a GoF Design Pattern', reason: 'Design patterns come up in 60% of senior interviews.', path: '/app/oop', xpLabel: '+50 XP', priority: 5 });
  if (progressOf('system-design') < 10) recs.push({ icon: 'architecture', hex: '#06B6D4', title: 'Start System Design', reason: 'Begin with URL shortener. Essential for L4+ roles.', path: '/app/system-design', xpLabel: '+30 XP', priority: 4 });
  if (progressOf('core-subjects') < 15) recs.push({ icon: 'terminal', hex: '#22C55E', title: 'Complete a Core CS topic', reason: 'OS, DBMS, Networks — asked in every FAANG loop.', path: '/app/subjects', xpLabel: '+15 XP', priority: 3 });
  if (!localStorage.getItem('eyf.studyPlanConfig') && xp > 50) recs.push({ icon: 'calendar_month', hex: '#6366F1', title: 'Build your Study Plan', reason: 'Get a day-by-day schedule for your target company.', path: '/app/study-plan', xpLabel: 'Free', priority: 6 });
  return recs.toSorted((a, b) => b.priority - a.priority).slice(0, 4);
}

/* ── Section label ────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { readonly children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 2, height: 14, background: '#E82127', flexShrink: 0, boxShadow: '0 0 6px rgba(232,25,44,0.5)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t3)', fontFamily: 'Space Grotesk' }}>
        {children}
      </span>
    </div>
  );
}

/* ── Fade-up wrapper ──────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }: {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export function HomePage() {
  const session = getSession();
  const { summary, displayName, refresh } = useUser();
  const [modules, setModules] = useState<ModulesStatus['items']>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [levelUpFor, setLevelUpFor] = useState<number | null>(null);
  const [streakToast, setStreakToast] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) { setModulesLoaded(true); return; }
    apiRequest<ModulesStatus>('/modules/status', { token: session.accessToken })
      .then((d) => { setModules(d.items); setModulesLoaded(true); })
      .catch(() => { setModulesLoaded(true); });
  }, [session?.accessToken]);

  useEffect(() => {
    if (!summary) return;
    const stored = Number(localStorage.getItem('eyf.lastLevel') ?? 0);
    localStorage.setItem('eyf.lastLevel', String(summary.level));
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('eyf.lastStreakToastDay');
    const shouldLevelUp = stored > 0 && summary.level > stored;
    const shouldStreak = [7, 14, 30, 60, 100, 200, 365].includes(summary.streak) && lastDay !== today;
    if (shouldStreak) localStorage.setItem('eyf.lastStreakToastDay', today);
    if (!shouldLevelUp && !shouldStreak) return;
    const raf = requestAnimationFrame(() => {
      if (shouldLevelUp) setLevelUpFor(summary.level);
      if (shouldStreak) setStreakToast(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [summary]);

  const xp        = summary?.xp ?? 0;
  const weeklyXp  = summary?.weeklyXp ?? 0;
  const streak    = summary?.streak ?? 0;
  const level     = summary?.level ?? 0;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const achievementsEarned = summary?.achievementsEarned ?? 0;
  const recentAchievements = summary?.recentAchievements ?? [];
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS.at(-1)!;
  const currThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold > currThreshold
    ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100))
    : 100;

  const defaultModules = Object.keys(MODULE_CONFIG).map((k) => ({ module: k, progress: 0, cta: 'Start' }));
  const moduleList = modules.length > 0
    ? [...modules, ...defaultModules.filter((d) => !modules.some((m) => m.module === d.module))]
    : defaultModules;

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });
  const [dayOfYear] = useState(() =>
    Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000),
  );
  const insight = ENGINEERING_INSIGHTS[dayOfYear % ENGINEERING_INSIGHTS.length];
  const [insightDismissed, setInsightDismissed] = useState(
    () => localStorage.getItem('eyf.insightDay') === String(dayOfYear),
  );

  const recs = buildRecommendations(xp, streak, moduleList);

  // Daily challenge pool
  const POOL = [
    { title: 'Two Sum',                    type: 'DSA',           diff: 'easy' as const,   hex: '#22C55E' },
    { title: 'Design a URL Shortener',     type: 'System Design', diff: 'medium' as const, hex: '#EAB308' },
    { title: 'Valid Parentheses',          type: 'DSA',           diff: 'easy' as const,   hex: '#22C55E' },
    { title: 'Maximum Subarray',           type: 'DSA',           diff: 'medium' as const, hex: '#EAB308' },
    { title: 'SQL Injection Defense',      type: 'Security',      diff: 'medium' as const, hex: '#EAB308' },
    { title: 'Design a Rate Limiter',      type: 'System Design', diff: 'medium' as const, hex: '#EAB308' },
    { title: 'Number of Islands',          type: 'DSA',           diff: 'medium' as const, hex: '#EAB308' },
    { title: 'Coin Change',                type: 'DSA',           diff: 'medium' as const, hex: '#EAB308' },
    { title: 'LRU Cache',                  type: 'DSA',           diff: 'hard' as const,   hex: '#EF4444' },
    { title: 'Design Notification System', type: 'System Design', diff: 'hard' as const,   hex: '#EF4444' },
  ];
  const todayChallenge = POOL[(new Date().getDate() - 1) % POOL.length];
  const todayKey = `eyf.daily.${new Date().toISOString().split('T')[0]}`;
  const challengeDone = localStorage.getItem(todayKey) === 'done';

  return (
    <AppShell>
      <AnimatePresence>
        {levelUpFor && <LevelUpModal level={levelUpFor} onClose={() => { setLevelUpFor(null); refresh(); }} />}
      </AnimatePresence>
      {streakToast && streak > 0 && <StreakToast streak={streak} onClose={() => setStreakToast(false)} />}

      {/* Page-wide ambient glows */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(232,25,44,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-28" style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════════════
            HERO BANNER
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <GlassCard
            glow="#E82127"
            style={{
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(30,8,14,0.75) 0%, rgba(14,12,24,0.8) 100%)',
              border: '1px solid rgba(232,25,44,0.14)',
            }}
          >
            {/* Top shimmer line — red tint */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.5) 30%, rgba(232,25,44,0.3) 70%, transparent)' }} />

            {/* Noise texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            <AnimatePresence mode="wait">
              {summary === null ? (
                <motion.div
                  key="hero-sk"
                  className="flex flex-wrap items-center justify-between gap-6 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <Skeleton width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width={220} height={42} borderRadius={8} style={{ marginBottom: 12 }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Skeleton width={130} height={28} borderRadius={100} />
                      <Skeleton width={104} height={28} borderRadius={100} />
                      <Skeleton width={94} height={28} borderRadius={100} />
                    </div>
                  </div>
                  <div style={{ minWidth: 220, flex: '0 0 auto' }}>
                    <Skeleton width="100%" height={74} borderRadius={4} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="hero-content"
                  className="flex flex-wrap items-center justify-between gap-6 w-full"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Left: greeting + name */}
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Space Grotesk', marginBottom: 8 }}>
                      {greeting}
                    </p>
                    <h1 style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 800,
                      fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1.05,
                      color: '#fff',
                      margin: 0,
                      marginBottom: 12,
                    }}>
                      {displayName || 'Engineer'}
                    </h1>
                    {/* Status pill row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                        padding: '5px 14px',
                        fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E82127', display: 'inline-block', boxShadow: '0 0 6px rgba(232,25,44,0.8)', flexShrink: 0 }} />
                        Level {level} · {levelName}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(249,115,22,0.12)',
                        border: '1px solid rgba(249,115,22,0.25)',
                        backdropFilter: 'blur(8px)',
                        padding: '5px 12px',
                        fontSize: 12, fontWeight: 700, color: '#FDBA74',
                      }}>
                        🔥 {streak}d streak
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(232,25,44,0.1)',
                        border: '1px solid rgba(232,25,44,0.2)',
                        backdropFilter: 'blur(8px)',
                        padding: '5px 12px',
                        fontSize: 12, fontWeight: 700, color: '#FDA4AF',
                      }}>
                        ✦ {xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>

                  {/* Right: level progress */}
                  <div style={{ minWidth: 220, flex: '0 0 auto' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '16px 20px',
                      backdropFilter: 'blur(12px)',
                    }}>
                      <div className="flex justify-between mb-2" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                        <span>Lv.{level} {levelName}</span>
                        <span>{(nextThreshold - xp).toLocaleString()} XP to go</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${xpPct}%` }}
                          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #E82127, #FF6B7A)',
                            boxShadow: '0 0 12px rgba(232,25,44,0.7), 0 0 24px rgba(232,25,44,0.3)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        <span>{xpPct}% complete</span>
                        <Link to="/app/progress" style={{ color: '#E82127', fontWeight: 600, fontSize: 10 }}>
                          View progress →
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            STAT TILES
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {summary === null
            ? [0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '18px 20px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Skeleton width={28} height={28} borderRadius={8} />
                    <Skeleton width={48} height={9} borderRadius={4} />
                  </div>
                  <Skeleton width={72} height={30} borderRadius={6} />
                </motion.div>
              ))
            : [
                { label: 'Total XP',  value: xp.toLocaleString(),            icon: 'bolt',                  color: '#E82127' },
                { label: 'This Week', value: `+${weeklyXp.toLocaleString()}`, icon: 'trending_up',           color: '#22C55E' },
                { label: 'Streak',    value: `${streak}d`,                    icon: 'local_fire_department', color: '#F97316' },
                { label: 'Badges',    value: String(achievementsEarned),      icon: 'emoji_events',          color: '#EAB308' },
              ].map(({ label, value, icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2, boxShadow: `0 12px 40px rgba(0,0,0,0.4)` }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    backdropFilter: 'blur(16px)',
                    padding: '18px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Top shimmer */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14, color }}>{icon}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', fontFamily: 'Space Grotesk' }}>{label}</span>
                  </div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', lineHeight: 1, color, marginBottom: 0 }}>
                    {value}
                  </p>
                </motion.div>
              ))
          }
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN CONTENT — Daily Challenge (left) + Sidebar (right)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

          {/* Daily challenge — featured card (2/5) */}
          <FadeUp delay={0.07} className="lg:col-span-2">
            <Link to="/app/daily" className="block h-full">
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                style={{
                  height: '100%',
                  minHeight: 260,
                  background: `linear-gradient(145deg, rgba(80,8,14,0.7) 0%, rgba(14,10,22,0.9) 55%, rgba(9,10,20,0.95) 100%)`,
                  border: '1px solid rgba(232,25,44,0.22)',
                  borderRadius: 16,
                  backdropFilter: 'blur(24px)',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 50px rgba(232,25,44,0.1), inset 0 1px 0 rgba(255,100,100,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Radial glow top-left */}
                <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(232,25,44,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
                {/* Grid pattern */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }} />

                {/* Top shimmer */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, rgba(232,25,44,0.6), rgba(232,25,44,0.2) 60%, transparent)' }} />

                <div className="flex items-center justify-between mb-auto">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: challengeDone ? '#22C55E' : '#E82127', boxShadow: challengeDone ? '0 0 8px rgba(34,197,94,0.8)' : '0 0 8px rgba(232,25,44,0.8)', animation: challengeDone ? 'none' : 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', fontFamily: 'Space Grotesk' }}>
                      Daily Challenge
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#FCD34D', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', padding: '3px 10px', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    +50 XP
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 20, paddingBottom: 20 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 11, fontWeight: 700, color: todayChallenge.hex, background: `${todayChallenge.hex}18`, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Space Grotesk' }}>
                      {todayChallenge.diff}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{todayChallenge.type}</span>
                  </div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '-0.02em', lineHeight: 1.2, color: '#fff', margin: 0 }}>
                    {todayChallenge.title}
                  </h2>
                </div>

                <motion.div
                  className="flex items-center justify-center gap-2 py-3"
                  style={challengeDone
                    ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86EFAC', fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em' }
                    : { background: 'linear-gradient(135deg, #E82127, #FF4D52)', color: '#000', fontSize: 12, fontWeight: 800, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 20px rgba(232,25,44,0.4)' }
                  }
                  whileHover={challengeDone ? {} : { boxShadow: '0 6px 28px rgba(232,25,44,0.55)' }}
                >
                  {challengeDone
                    ? <><span className="material-symbols-rounded text-sm">check_circle</span>Completed</>
                    : <>Solve now <span className="material-symbols-rounded text-sm">arrow_forward</span></>
                  }
                </motion.div>
              </motion.div>
            </Link>
          </FadeUp>

          {/* Right sidebar: recommendations + insight (3/5) */}
          <div className="lg:col-span-3 flex flex-col gap-3">

            {/* Recommendations */}
            <FadeUp delay={0.1}>
              <GlassCard style={{ padding: '18px 20px' }}>
                <SectionLabel>Recommended next</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recs.map((rec, i) => (
                    <Link key={rec.path} to={rec.path} style={{ textDecoration: 'none' }}>
                      <motion.div
                        className="flex items-center gap-3"
                        style={{
                          padding: '11px 12px',
                          background: 'transparent',
                          borderLeft: `2px solid transparent`,
                          borderTop: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                        }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        whileHover={{
                          background: `${rec.hex}08`,
                          borderLeftColor: rec.hex,
                          x: 3,
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, background: `${rec.hex}18`, border: `1px solid ${rec.hex}30`,
                        }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: rec.hex }}>{rec.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'Space Grotesk', marginBottom: 2, letterSpacing: '-0.01em' }}>{rec.title}</p>
                          <p style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.4 }} className="truncate">{rec.reason}</p>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#22C55E',
                          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
                          padding: '3px 8px', fontFamily: 'Space Grotesk',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{rec.xpLabel}</span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            </FadeUp>

            {/* Engineering insight */}
            {!insightDismissed && (
              <FadeUp delay={0.14}>
                <GlassCard
                  glow={insight.hex}
                  style={{
                    padding: '16px 20px',
                    border: `1px solid ${insight.hex}25`,
                    flex: 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${insight.hex}15` }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 12, color: insight.hex }}>{insight.icon}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: insight.hex, opacity: 0.75, fontFamily: 'Space Grotesk' }}>{insight.category}</span>
                    </div>
                    <button
                      onClick={() => { setInsightDismissed(true); localStorage.setItem('eyf.insightDay', String(dayOfYear)); }}
                      style={{ color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                      aria-label="Dismiss"
                    >
                      <span className="material-symbols-rounded text-sm">close</span>
                    </button>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--t2)' }}>{insight.tip}</p>
                </GlassCard>
              </FadeUp>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECOND ROW — Quick access + readiness + badges
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Quick access (2/3) */}
          <FadeUp delay={0.12} className="lg:col-span-2">
            <GlassCard style={{ padding: '18px 20px' }}>
              <SectionLabel>Quick access</SectionLabel>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { label: 'DSA',        icon: 'code',              path: '/app/problems',       hex: '#3B82F6' },
                  { label: 'Design',     icon: 'architecture',      path: '/app/system-design',  hex: '#06B6D4' },
                  { label: 'Companies',  icon: 'business',          path: '/app/companies',      hex: '#E82127' },
                  { label: 'Community',  icon: 'forum',             path: '/app/community',      hex: '#6366F1' },
                  { label: 'Mock',       icon: 'record_voice_over', path: '/app/mock-interview', hex: '#F97316' },
                  { label: 'Flashcards', icon: 'style',             path: '/app/flashcards',     hex: '#8B5CF6' },
                  { label: 'Notes',      icon: 'sticky_note_2',     path: '/app/notes',          hex: '#EAB308' },
                  { label: 'Contests',   icon: 'emoji_events',      path: '/app/contests',       hex: '#22C55E' },
                ].map((a, i) => (
                  <Link key={a.path} to={a.path}>
                    <motion.div
                      className="flex flex-col items-center gap-2 py-3"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                      }}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.18 + i * 0.03, duration: 0.35 }}
                      whileHover={{
                        background: `${a.hex}12`,
                        borderColor: `${a.hex}35`,
                        y: -3,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
                      }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: a.hex, filter: `drop-shadow(0 0 4px ${a.hex}60)` }}>{a.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.02em' }}>{a.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </FadeUp>

          {/* Readiness + badges (1/3) */}
          <FadeUp delay={0.15} className="flex flex-col gap-3">
            {/* Readiness CTA */}
            <Link to="/app/readiness">
              <motion.div
                whileHover={{ y: -2, boxShadow: '0 0 24px rgba(232,25,44,0.1), 0 8px 24px rgba(0,0,0,0.4)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: 'rgba(232,25,44,0.07)', border: '1px solid rgba(232,25,44,0.15)',
                  backdropFilter: 'blur(12px)', cursor: 'pointer', transition: 'transform 0.2s',
                }}
              >
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,25,44,0.15)', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ color: '#E82127', fontSize: 18 }}>speed</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 2, fontFamily: 'Space Grotesk' }}>Placement Readiness</p>
                  <p style={{ fontSize: 11, color: 'var(--t3)' }}>Check your score & skill gaps</p>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--t4)', flexShrink: 0 }}>arrow_forward</span>
              </motion.div>
            </Link>

            {/* Recent badges */}
            {recentAchievements.length > 0 && (
              <GlassCard style={{ padding: '16px 18px', flex: 1 }}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Badges</SectionLabel>
                  <Link to="/app/achievements" style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>
                    {achievementsEarned} total →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentAchievements.map((a) => (
                    <motion.div
                      key={a.key}
                      title={a.name}
                      style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'default' }}
                      whileHover={{ scale: 1.15, boxShadow: '0 0 16px rgba(232,25,44,0.25)' }}
                    >{a.icon}</motion.div>
                  ))}
                </div>
              </GlassCard>
            )}
          </FadeUp>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MODULES
        ═══════════════════════════════════════════════════════════════ */}
        <FadeUp>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Modules</SectionLabel>
            <Link to="/app/career" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {modulesLoaded
              ? moduleList.slice(0, 8).map((mod, i) => {
                  const cfg = MODULE_CONFIG[mod.module];
                  if (!cfg) return null;
                  const rawPct = mod.progress;
                  let pct: number;
                  if (typeof rawPct !== 'number') { pct = 0; }
                  else if (rawPct > 1) { pct = Math.round(rawPct); }
                  else { pct = Math.round(rawPct * 100); }
                  return (
                    <motion.div
                      key={mod.module}
                      initial={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
                      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      viewport={{ once: true, margin: '-10px' }}
                      transition={{ duration: 0.4, delay: (i % 6) * 0.04 }}
                    >
                      <Link to={cfg.path}>
                        <motion.div
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            backdropFilter: 'blur(12px)',
                            padding: '14px',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                          }}
                          whileHover={{
                            background: `${cfg.hex}0d`,
                            borderColor: `${cfg.hex}30`,
                            y: -3,
                            boxShadow: `0 12px 40px rgba(0,0,0,0.4)`,
                          }}
                        >
                          <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: `radial-gradient(circle at top right, ${cfg.hex}15, transparent 70%)`, pointerEvents: 'none' }} />
                          <div className="flex items-center justify-between mb-3">
                            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cfg.hex}18` }}>
                              <span className="material-symbols-rounded" style={{ fontSize: 15, color: cfg.hex }}>{cfg.icon}</span>
                            </div>
                            <ProgressRing pct={pct} hex={cfg.hex} />
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', marginBottom: 3, fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }} className="truncate">{cfg.title}</p>
                          <p style={{ fontSize: 9, fontWeight: 700, color: cfg.hex, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{mod.cta || 'Start'}</p>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })
              : Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={`skel-${i}`}
                    initial={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.4, delay: (i % 6) * 0.04 }}
                  >
                    <div style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '14px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                    }}>
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton width={30} height={30} borderRadius={4} />
                        <Skeleton width={36} height={36} borderRadius={18} />
                      </div>
                      <Skeleton width={80} height={11} borderRadius={4} style={{ marginBottom: 6 }} />
                      <Skeleton width={36} height={9} borderRadius={4} />
                    </div>
                  </motion.div>
                ))
            }
          </div>
        </FadeUp>

      </div>
    </AppShell>
  );
}
