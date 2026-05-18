import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';
import { LevelUpModal } from '../components/LevelUpModal';
import { StreakToast } from '../components/StreakToast';

interface ModulesStatus { items: Array<{ module: string; progress: number; cta: string }> }
interface DailyChallenge { id: string; slug: string; title: string; difficulty: 'easy'|'medium'|'hard'; category: string; xpReward: number; solved?: boolean }

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

const MODULE_CONFIG: Record<string, { icon: string; title: string; path: string; hex: string }> = {
  dsa:               { icon: 'code',               title: 'DSA',           path: '/app/problems',       hex: '#3B82F6' },
  'core-subjects':   { icon: 'terminal',           title: 'Core CS',       path: '/app/subjects',       hex: '#22C55E' },
  oop:               { icon: 'account_tree',        title: 'OOP',           path: '/app/oop',            hex: '#8B5CF6' },
  security:          { icon: 'shield',              title: 'Security',      path: '/app/cybersecurity',  hex: '#E8192C' },
  'system-design':   { icon: 'architecture',        title: 'Sys Design',    path: '/app/system-design',  hex: '#06B6D4' },
  placement:         { icon: 'work_history',         title: 'Placement',     path: '/app/placement',      hex: '#F97316' },
  'resume-builder':  { icon: 'description',          title: 'Resume',        path: '/app/resume',         hex: '#EAB308' },
  'tech-skills':     { icon: 'psychology',           title: 'Tech Skills',   path: '/app/skills',         hex: '#14B8A6' },
  mentorship:        { icon: 'groups',               title: 'Mentorship',    path: '/app/mentorship',     hex: '#EC4899' },
  experts:           { icon: 'workspace_premium',    title: 'Experts',       path: '/app/experts',        hex: '#F59E0B' },
  community:         { icon: 'forum',                title: 'Community',     path: '/app/community',      hex: '#6366F1' },
  visualizer:        { icon: 'visibility',           title: 'Visualizer',    path: '/app/visualizer',     hex: '#84CC16' },
  cheatsheets:       { icon: 'quick_reference_all',  title: 'Cheat Sheets',  path: '/app/cheatsheets',    hex: '#0EA5E9' },
  flashcards:        { icon: 'style',                title: 'Flashcards',    path: '/app/flashcards',     hex: '#A855F7' },
  'study-plan':      { icon: 'calendar_month',        title: 'Study Plan',    path: '/app/study-plan',     hex: '#6366F1' },
  tracker:           { icon: 'track_changes',          title: 'Job Tracker',   path: '/app/tracker',        hex: '#10B981' },
};

const DIFF_STYLE: Record<string, { text: string; bg: string }> = {
  easy:   { text: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  medium: { text: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  hard:   { text: '#E8192C', bg: 'rgba(232,25,44,0.12)' },
};

const ENGINEERING_INSIGHTS = [
  { tip: "Prefer composition over inheritance. Wrapping objects is more flexible than subclassing — you can swap behaviors at runtime without changing class hierarchies.", category: 'OOP', icon: 'account_tree', hex: '#8B5CF6' },
  { tip: "Never use SELECT * in production queries. Fetching unnecessary columns increases I/O, breaks covering indexes, and leaks schema changes to callers.", category: 'DBMS', icon: 'storage', hex: '#A78BFA' },
  { tip: "When interviewing at Amazon, every behavioral answer must map to at least one Leadership Principle. Name it explicitly — it signals pattern recognition.", category: 'Career', icon: 'work', hex: '#F97316' },
  { tip: "In system design, state your assumptions out loud. Interviewers can't see your mental model — saying 'I'll assume 100M DAU and 10:1 read-write ratio' shows senior thinking.", category: 'System Design', icon: 'architecture', hex: '#06B6D4' },
  { tip: "The sliding window pattern applies any time you need the 'best contiguous subarray'. The trigger words are: 'subarray/substring', 'at most K', 'contiguous'.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
  { tip: "Don't store raw passwords, ever. Use bcrypt (cost ≥ 12), Argon2id, or scrypt. MD5 and SHA-256 are NOT password hashing algorithms — they're too fast.", category: 'Security', icon: 'shield', hex: '#E8192C' },
  { tip: "BFS gives shortest path in unweighted graphs. Dijkstra handles weighted (non-negative). Bellman-Ford handles negative edges. Floyd-Warshall handles all-pairs.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
  { tip: "Rate limiting algorithms: token bucket (bursty, smooth average), sliding window log (precise), fixed window counter (simple, edge-case spikes at boundaries).", category: 'System Design', icon: 'architecture', hex: '#06B6D4' },
  { tip: "Page faults are expensive — each one is a trip to disk (microseconds → milliseconds). If active pages exceed RAM, performance collapses through thrashing.", category: 'OS', icon: 'terminal', hex: '#22C55E' },
  { tip: "DP tip: if you see 'minimum/maximum', 'count number of ways', or 'is it possible to reach' — suspect DP. Start with recursion + memoization, then optimize to tabulation.", category: 'DSA', icon: 'code', hex: '#3B82F6' },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function ProgressRing({ pct, hex }: { readonly pct: number; readonly hex: string }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={hex} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/60">{pct}%</span>
    </div>
  );
}

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
  const intensity = (v: number) => {
    if (v === 0) return 'rgba(255,255,255,0.04)';
    if (v === 1) return 'rgba(232,25,44,0.25)';
    if (v === 2) return 'rgba(232,25,44,0.55)';
    return '#E8192C';
  };
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto">
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, d) => {
              const idx = w * 7 + d;
              return (
                <div
                  key={d}
                  className="w-3 h-3 rounded-sm transition-all duration-200 hover:scale-125"
                  style={{ background: intensity(cells[idx] ?? 0) }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-white/20">Less</span>
        {[0,1,2,3].map((v) => (
          <div key={v} className="w-2.5 h-2.5 rounded-sm" style={{ background: intensity(v) }} />
        ))}
        <span className="text-[9px] text-white/20">More</span>
      </div>
    </div>
  );
}

function DailyChallengeLocal() {
  const todayKey = `eyf.daily.${new Date().toISOString().split('T')[0]}`;
  const done = localStorage.getItem(todayKey) === 'done';
  const day = new Date().getDate() - 1;
  const TITLES = [
    { title: 'Two Sum', type: 'DSA', diff: 'easy' },
    { title: 'Design a URL Shortener', type: 'System Design', diff: 'medium' },
    { title: 'Valid Parentheses', type: 'DSA', diff: 'easy' },
    { title: 'Maximum Subarray', type: 'DSA', diff: 'medium' },
    { title: 'SQL Injection Defense', type: 'Security', diff: 'medium' },
    { title: 'Design a Rate Limiter', type: 'System Design', diff: 'medium' },
    { title: 'Number of Islands', type: 'DSA', diff: 'medium' },
    { title: 'Coin Change', type: 'DSA', diff: 'medium' },
    { title: 'LRU Cache', type: 'DSA', diff: 'hard' },
    { title: 'Design a Notification System', type: 'System Design', diff: 'hard' },
  ];
  const today = TITLES[day % TITLES.length];
  const ds = DIFF_STYLE[today.diff] ?? { text: '#999', bg: 'rgba(153,153,153,0.1)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 relative overflow-hidden border"
      style={{ background: 'rgba(232,25,44,0.06)', borderColor: 'rgba(232,25,44,0.2)' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(232,25,44,0.15)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="today" size={14} className="text-[#E8192C]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#E8192C]">Daily Challenge</span>
          <span className="ml-auto text-[10px] font-bold" style={{ color: '#EAB308' }}>+50 XP</span>
        </div>
        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-2" style={{ color: ds.text, background: ds.bg }}>
          {today.diff} · {today.type}
        </span>
        <h3 className="text-sm font-bold text-white mb-3 leading-snug">{today.title}</h3>
        <Link to="/app/daily">
          <button
            type="button"
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
            style={done
              ? { background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }
              : { background: '#E8192C', color: '#fff', boxShadow: '0 4px 20px rgba(232,25,44,0.3)' }
            }
          >
            {done ? <><Icon name="check_circle" size={14} /> Completed!</> : <>Solve Now <Icon name="arrow_forward" size={14} /></>}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

interface ModItem { module: string; progress: number; cta: string }
function buildRecommendations(xp: number, streak: number, modules: ModItem[]) {
  const recs: Array<{ icon: string; hex: string; title: string; reason: string; path: string; xpLabel: string; priority: number }> = [];
  const progressOf = (key: string) => {
    const m = modules.find((x) => x.module === key);
    if (!m) return 0;
    return m.progress > 1 ? m.progress : Math.round(m.progress * 100);
  };

  if (streak === 0) recs.push({ icon: 'local_fire_department', hex: '#F97316', title: 'Start your streak', reason: "You haven't solved anything yet today — start now!", path: '/app/problems', xpLabel: '+10 XP', priority: 10 });
  else if (streak < 3) recs.push({ icon: 'local_fire_department', hex: '#F97316', title: `Keep your ${streak}d streak alive`, reason: 'Solve one problem before midnight to extend it.', path: '/app/problems', xpLabel: '+25 XP', priority: 9 });
  if (progressOf('flashcards') === 0) recs.push({ icon: 'style', hex: '#A855F7', title: 'Try Flashcards', reason: 'SM-2 spaced repetition — never forget a concept again.', path: '/app/flashcards', xpLabel: '+40 XP', priority: 7 });
  if (progressOf('oop') < 20) recs.push({ icon: 'account_tree', hex: '#8B5CF6', title: 'Learn a GoF Design Pattern', reason: 'Design patterns appear in 60% of senior-level interviews.', path: '/app/oop', xpLabel: '+50 XP', priority: 5 });
  if (progressOf('system-design') < 10) recs.push({ icon: 'architecture', hex: '#06B6D4', title: 'Start System Design', reason: 'Mandatory for mid-senior roles. Begin with URL shortener.', path: '/app/system-design', xpLabel: '+30 XP', priority: 4 });
  if (progressOf('core-subjects') < 15) recs.push({ icon: 'terminal', hex: '#22C55E', title: 'Complete a Core CS topic', reason: 'OS, DBMS, and Networks are asked in every FAANG loop.', path: '/app/subjects', xpLabel: '+15 XP', priority: 3 });
  if (progressOf('mock-interview') === 0 && xp > 100) recs.push({ icon: 'record_voice_over', hex: '#F97316', title: 'Take a Mock Interview', reason: "You've built some XP — now test yourself under pressure.", path: '/app/mock-interview', xpLabel: '+75 XP', priority: 5 });
  if (!localStorage.getItem('eyf.studyPlanConfig') && xp > 50) recs.push({ icon: 'calendar_month', hex: '#6366F1', title: 'Build your Study Plan', reason: 'Enter your target company and get a day-by-day schedule.', path: '/app/study-plan', xpLabel: 'Free!', priority: 6 });

  return recs.toSorted((a, b) => b.priority - a.priority).slice(0, 3);
}

/* ── Main page ────────────────────────────────────────────────────────────── */

export function HomePage() {
  const session  = getSession();
  const { summary, displayName, refresh } = useUser();
  const [modules,     setModules]     = useState<ModulesStatus['items']>([]);
  const [, setDaily]                  = useState<DailyChallenge | null>(null);
  const [levelUpFor,  setLevelUpFor]  = useState<number | null>(null);
  const [streakToast, setStreakToast] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<ModulesStatus>('/modules/status', { token: session.accessToken }).then((d) => setModules(d.items)).catch(() => {});
    apiRequest<{ problems: DailyChallenge[] }>('/problems?limit=1&daily=true', { token: session.accessToken }).then((d) => { if (d.problems[0]) setDaily(d.problems[0]); }).catch(() => {});
  }, [session?.accessToken]);

  useEffect(() => {
    if (!summary) return;
    const storedLevel = Number(localStorage.getItem('eyf.lastLevel') ?? 0);
    if (storedLevel > 0 && summary.level > storedLevel) setLevelUpFor(summary.level);
    localStorage.setItem('eyf.lastLevel', String(summary.level));
    const today = new Date().toDateString();
    const lastStreakDay = localStorage.getItem('eyf.lastStreakToastDay');
    if ([7,14,30,60,100,200,365].includes(summary.streak) && lastStreakDay !== today) {
      localStorage.setItem('eyf.lastStreakToastDay', today);
      setStreakToast(true);
    }
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
  const xpPct = nextThreshold > currThreshold ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100)) : 100;

  const defaultModules = Object.keys(MODULE_CONFIG).map((k) => ({ module: k, progress: 0, cta: 'Start' }));
  const moduleList = modules.length > 0 ? [...modules, ...defaultModules.filter((d) => !modules.some((m) => m.module === d.module))] : defaultModules;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const insight = ENGINEERING_INSIGHTS[dayOfYear % ENGINEERING_INSIGHTS.length];
  const [insightDismissed, setInsightDismissed] = useState(() => localStorage.getItem('eyf.insightDay') === String(dayOfYear));

  const recs = buildRecommendations(xp, streak, moduleList);

  const stagger = (i: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } });

  return (
    <AppShell>
      {levelUpFor && <LevelUpModal level={levelUpFor} onClose={() => { setLevelUpFor(null); refresh(); }} />}
      {streakToast && streak > 0 && <StreakToast streak={streak} onClose={() => setStreakToast(false)} />}

      <div className="pt-8 max-w-7xl mx-auto">

        {/* ── Hero welcome + stats ────────────────────────────────────────── */}
        <motion.section {...stagger(0)} className="mb-6 grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Main welcome card */}
          <div className="xl:col-span-2 relative rounded-2xl p-7 overflow-hidden border border-white/6"
            style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(24px)' }}>
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(232,25,44,0.1)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.06)' }} />

            <div className="relative">
              <p className="text-white/30 text-sm font-medium mb-1">{greeting},</p>
              <h1 className="text-[clamp(28px,4vw,40px)] font-black tracking-tight text-white mb-6">
                {displayName || 'Engineer'} 👋
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total XP', value: xp.toLocaleString(), icon: 'bolt', color: '#E8192C' },
                  { label: 'This Week', value: `+${weeklyXp.toLocaleString()}`, icon: 'trending_up', color: '#22C55E' },
                  { label: 'Streak', value: `${streak}d ${streak >= 7 ? '🔥' : '⚡'}`, icon: null, color: '#F97316' },
                  { label: 'Badges', value: String(achievementsEarned), icon: 'emoji_events', color: '#EAB308' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black" style={{ color }}>{value}</span>
                      {icon && <Icon name={icon} size={16} style={{ color }} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 max-w-sm">
                <div className="flex justify-between text-[9px] font-bold text-white/25 uppercase tracking-widest">
                  <span>Lv.{level} · {levelName}</span>
                  <span>{xpPct}% to Lv.{level + 1}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #E8192C, #ff6b6b)' }}
                  />
                </div>
                <p className="text-[9px] text-white/20">{(nextThreshold - xp).toLocaleString()} XP to {LEVEL_NAMES[level + 1] ?? 'Max'}</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <DailyChallengeLocal />

            {/* Badges preview */}
            <div className="rounded-2xl p-4 border border-white/6 flex-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Recent Badges</span>
                <Link to="/app/achievements" className="text-[9px] font-bold text-[#E8192C] hover:underline">All {achievementsEarned} →</Link>
              </div>
              {recentAchievements.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {recentAchievements.map((a) => (
                    <div key={a.key} title={a.name}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/8 hover:scale-110 transition-transform cursor-default"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {a.icon}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/20">Earn badges by solving problems 🏆</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Daily insight ──────────────────────────────────────────────── */}
        {!insightDismissed && (
          <motion.section {...stagger(1)} className="mb-6">
            <div className="rounded-2xl p-5 flex items-start gap-4 border relative overflow-hidden"
              style={{ background: `${insight.hex}0d`, borderColor: `${insight.hex}25` }}>
              <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: `${insight.hex}15` }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${insight.hex}18`, border: `1px solid ${insight.hex}25` }}>
                <Icon name={insight.icon} size={16} style={{ color: insight.hex }} />
              </div>
              <div className="flex-1 relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: insight.hex }}>Engineering Insight</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${insight.hex}18`, color: insight.hex }}>{insight.category}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{insight.tip}</p>
              </div>
              <button onClick={() => { setInsightDismissed(true); localStorage.setItem('eyf.insightDay', String(dayOfYear)); }} className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 relative">
                <Icon name="close" size={14} />
              </button>
            </div>
          </motion.section>
        )}

        {/* ── Readiness CTA ─────────────────────────────────────────────── */}
        <motion.section {...stagger(2)} className="mb-6">
          <Link to="/app/readiness" className="block group">
            <div className="rounded-2xl p-5 flex items-center gap-4 border border-[rgba(232,25,44,0.15)] transition-all duration-300 group-hover:border-[rgba(232,25,44,0.4)]"
              style={{ background: 'rgba(232,25,44,0.04)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,25,44,0.12)', border: '1px solid rgba(232,25,44,0.2)' }}>
                <Icon name="speed" size={22} style={{ color: '#E8192C' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-semibold text-sm">Placement Readiness Score</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#E8192C', background: 'rgba(232,25,44,0.12)', border: '1px solid rgba(232,25,44,0.2)' }}>Check Now</span>
                </div>
                <p className="text-xs text-white/35">See your overall readiness %, skill gaps, and a personalised 7-day sprint to improve fast.</p>
              </div>
              <Icon name="arrow_forward" size={18} className="text-white/20 group-hover:text-[#E8192C] group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Link>
        </motion.section>

        {/* ── What to study next ─────────────────────────────────────────── */}
        {recs.length > 0 && (
          <motion.section {...stagger(3)} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="auto_awesome" size={14} style={{ color: '#E8192C' }} />
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-white/25">What to Study Next</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recs.map((rec, i) => (
                <motion.div key={rec.path} whileHover={{ y: -4, transition: { duration: 0.25 } }}>
                  <Link to={rec.path}>
                    <div className="rounded-2xl p-4 border border-white/6 h-full flex flex-col gap-3 transition-colors duration-200 hover:border-white/12 cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${rec.hex}15`, border: `1px solid ${rec.hex}20` }}>
                          <Icon name={rec.icon} size={16} style={{ color: rec.hex }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: '#22C55E' }}>{rec.xpLabel}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-semibold mb-1">{rec.title}</p>
                        <p className="text-white/30 text-[10px] leading-relaxed">{rec.reason}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: rec.hex }}>
                        {i === 0 ? 'Start' : 'Continue'} <Icon name="arrow_forward" size={11} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Today's focus ─────────────────────────────────────────────── */}
        <motion.section {...stagger(4)} className="mb-6">
          <div className="rounded-2xl p-5 border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="target" size={14} style={{ color: '#E8192C' }} />
                <span className="text-xs font-semibold text-white">Today's Focus</span>
              </div>
              <Link to="/app/career" className="text-[9px] text-white/25 hover:text-white/50 transition-colors uppercase tracking-widest">Customize →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: 'code', label: 'DSA Practice', desc: 'Solve 1 medium problem', path: '/app/problems', hex: '#3B82F6', xp: '+60 XP' },
                { icon: 'auto_stories', label: 'Core Subjects', desc: 'Complete 1 topic', path: '/app/subjects', hex: '#22C55E', xp: '+15 XP' },
                { icon: 'record_voice_over', label: 'Mock Interview', desc: 'Practice 4 questions', path: '/app/mock-interview', hex: '#F97316', xp: '+50 XP' },
              ].map((task) => (
                <Link key={task.path} to={task.path}>
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/4 hover:border-white/10 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${task.hex}18` }}>
                      <Icon name={task.icon} size={15} style={{ color: task.hex }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{task.label}</p>
                      <p className="text-white/25 text-[10px]">{task.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#22C55E' }}>{task.xp}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <motion.section {...stagger(5)} className="mb-6">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              { label: 'Practice',   icon: 'code',             path: '/app/problems',       hex: '#3B82F6' },
              { label: 'Quiz',       icon: 'quiz',             path: '/app/pattern-quiz',   hex: '#6366F1' },
              { label: 'Design',     icon: 'architecture',     path: '/app/system-design',  hex: '#06B6D4' },
              { label: 'Mock',       icon: 'record_voice_over',path: '/app/mock-interview', hex: '#F97316' },
              { label: 'Companies',  icon: 'business',         path: '/app/companies',      hex: '#E8192C' },
              { label: 'Contest',    icon: 'emoji_events',     path: '/app/contests',       hex: '#EAB308' },
              { label: 'Real World', icon: 'build',            path: '/app/real-world',     hex: '#F97316' },
              { label: 'Community',  icon: 'forum',            path: '/app/community',      hex: '#EC4899' },
            ].map((a) => (
              <motion.div key={a.path} whileHover={{ scale: 1.06, transition: { duration: 0.2 } }}>
                <Link to={a.path}>
                  <div className="rounded-2xl p-3 flex flex-col items-center gap-2 text-center border border-white/4 hover:border-white/10 transition-all cursor-pointer"
                    style={{ background: `${a.hex}0a` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${a.hex}15` }}>
                      <Icon name={a.icon} size={18} style={{ color: a.hex }} />
                    </div>
                    <span className="text-[9px] font-semibold text-white/50 leading-tight">{a.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Activity heatmap ───────────────────────────────────────────── */}
        <motion.section {...stagger(6)} className="mb-6">
          <div className="rounded-2xl p-5 border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Activity</h2>
                <p className="text-[9px] text-white/25 mt-0.5">12-week history</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/20" style={{ background: 'rgba(249,115,22,0.08)' }}>
                <span>🔥</span>
                <span className="text-orange-400 font-bold text-xs">{streak}d streak</span>
              </div>
            </div>
            <ActivityHeatmap streak={streak} />
          </div>
        </motion.section>

        {/* ── All modules grid ───────────────────────────────────────────── */}
        <motion.section {...stagger(7)} className="mb-6">
          <h2 className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-4">All Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {moduleList.map((mod, i) => {
              const cfg = MODULE_CONFIG[mod.module];
              if (!cfg) return null;
              const rawPct = mod.progress;
              let pct = 0;
              if (typeof rawPct === 'number') {
                pct = rawPct > 1 ? Math.round(rawPct) : Math.round(rawPct * 100);
              }
              return (
                <motion.div key={mod.module} whileHover={{ y: -4, transition: { duration: 0.25 } }} custom={i}>
                  <Link to={cfg.path}>
                    <div className="rounded-2xl p-4 border border-white/5 hover:border-white/12 transition-all cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cfg.hex}15` }}>
                          <Icon name={cfg.icon} size={17} style={{ color: cfg.hex }} />
                        </div>
                        <ProgressRing pct={pct} hex={cfg.hex} />
                      </div>
                      <p className="text-white text-xs font-semibold truncate">{cfg.title}</p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: cfg.hex }}>{mod.cta || 'Start'}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Community + leaderboard ────────────────────────────────────── */}
        <motion.section {...stagger(8)} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                path: '/app/leaderboard', icon: 'leaderboard', hex: '#06B6D4',
                title: 'Leaderboard', sub: 'See how you rank this week',
                rows: ['🥇 Top Engineer', '🥈 Rising Star', '🥉 Daily Solver'],
                values: ['12,450 XP', '9,870 XP', '7,230 XP'],
              },
              {
                path: '/app/community', icon: 'forum', hex: '#6366F1',
                title: 'Community', sub: 'Join the discussion',
                rows: ['How to approach DP problems?', 'Best resources for OWASP?', 'Mock interview experience at Google'],
                values: ['', '', ''],
              },
            ].map(({ path, icon, hex, title, sub, rows, values }) => (
              <Link key={path} to={path}>
                <div className="group rounded-2xl p-5 border border-white/5 hover:border-white/12 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${hex}15` }}>
                      <Icon name={icon} size={17} style={{ color: hex }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="text-[10px] text-white/25">{sub}</p>
                    </div>
                    <Icon name="arrow_forward" size={15} className="text-white/15 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="space-y-2">
                    {rows.map((t, i) => (
                      <div key={t} className="flex items-center justify-between text-xs">
                        <span className="text-white/40 truncate">{t}</span>
                        {values[i] && <span className="text-white/25 font-mono text-[10px] ml-2 flex-shrink-0">{values[i]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

      </div>
    </AppShell>
  );
}
