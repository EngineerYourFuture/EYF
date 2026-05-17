import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';
import { LevelUpModal } from '../components/LevelUpModal';
import { StreakToast } from '../components/StreakToast';

interface ModulesStatus {
  items: Array<{ module: string; progress: number; cta: string }>;
}

interface DailyChallenge {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xpReward: number;
  solved?: boolean;
}

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

const MODULE_CONFIG: Record<string, { icon: string; title: string; path: string; color: string; bg: string }> = {
  dsa:              { icon: 'code',              title: 'DSA',           path: '/app/problems',       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  'core-subjects':  { icon: 'terminal',          title: 'Core CS',       path: '/app/subjects',       color: 'text-green-400',  bg: 'bg-green-500/10' },
  oop:              { icon: 'account_tree',       title: 'OOP',           path: '/app/oop',            color: 'text-purple-400', bg: 'bg-purple-500/10' },
  security:         { icon: 'shield',             title: 'Security',      path: '/app/cybersecurity',  color: 'text-red-400',    bg: 'bg-red-500/10' },
  'system-design':  { icon: 'architecture',       title: 'Sys Design',    path: '/app/system-design',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  placement:        { icon: 'work_history',       title: 'Placement',     path: '/app/placement',      color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'resume-builder': { icon: 'description',        title: 'Resume',        path: '/app/resume',         color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'tech-skills':    { icon: 'psychology',         title: 'Tech Skills',   path: '/app/skills',         color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  mentorship:       { icon: 'groups',             title: 'Mentorship',    path: '/app/mentorship',     color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  experts:          { icon: 'workspace_premium',  title: 'Experts',       path: '/app/experts',        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  community:        { icon: 'forum',              title: 'Community',     path: '/app/community',      color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  visualizer:       { icon: 'visibility',         title: 'Visualizer',    path: '/app/visualizer',     color: 'text-lime-400',   bg: 'bg-lime-500/10' },
  cheatsheets:      { icon: 'quick_reference_all', title: 'Cheat Sheets',  path: '/app/cheatsheets',    color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  flashcards:       { icon: 'style',               title: 'Flashcards',    path: '/app/flashcards',     color: 'text-violet-400', bg: 'bg-violet-500/10' },
  'study-plan':     { icon: 'calendar_month',      title: 'Study Plan',    path: '/app/study-plan',     color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  tracker:          { icon: 'track_changes',        title: 'Job Tracker',   path: '/app/tracker',        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const DIFF_COLOR: Record<string, string> = {
  easy:   'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard:   'text-red-400 bg-red-400/10',
};

function ProgressRing({ pct, color = '#e82127' }: { readonly pct: number; readonly color?: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#2a2a2a" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-zinc-300">{pct}%</span>
    </div>
  );
}

// Simple 12-week activity heatmap (all local, no API needed)
function ActivityHeatmap({ streak }: { readonly streak: number }) {
  const weeks = 12;
  const days  = weeks * 7;
  // Simulate activity — in production this comes from the API
  const cells = Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    if (daysAgo < streak) return Math.floor(Math.random() * 3) + 1;
    if (daysAgo < streak + 7) return Math.random() > 0.6 ? 1 : 0;
    return Math.random() > 0.8 ? 1 : 0;
  });

  const intensity = (v: number) => {
    if (v === 0) return 'bg-zinc-800/60';
    if (v === 1) return 'bg-[#E82127]/30';
    if (v === 2) return 'bg-[#E82127]/60';
    return 'bg-[#E82127]';
  };

  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, d) => {
              const idx = w * 7 + d;
              return (
                <div
                  key={d}
                  className={`w-3 h-3 rounded-sm transition-colors ${intensity(cells[idx] ?? 0)}`}
                  title={`${days - 1 - idx} days ago`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-zinc-700">Less</span>
        {[0,1,2,3].map((v) => (
          <div key={v} className={`w-2.5 h-2.5 rounded-sm ${intensity(v)}`} />
        ))}
        <span className="text-[9px] text-zinc-700">More</span>
      </div>
    </div>
  );
}

// ── Daily Engineering Insight ─────────────────────────────────────────────────

const ENGINEERING_INSIGHTS = [
  { tip: "Prefer composition over inheritance. Wrapping objects is more flexible than subclassing — you can swap behaviors at runtime without changing class hierarchies.", category: 'OOP', icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { tip: "Never use SELECT * in production queries. Fetching unnecessary columns increases I/O, breaks covering indexes, and leaks schema changes to callers.", category: 'DBMS', icon: 'storage', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tip: "When interviewing at Amazon, every behavioral answer must map to at least one Leadership Principle. Name it explicitly — it signals pattern recognition.", category: 'Career', icon: 'work', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { tip: "In system design, state your assumptions out loud. Interviewers can't see your mental model — saying 'I'll assume 100M DAU and 10:1 read-write ratio' shows senior thinking.", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "Use EXPLAIN ANALYZE on your slow queries, not just EXPLAIN. EXPLAIN shows the planner's estimate; ANALYZE runs it and shows actual row counts — mismatches reveal stale statistics.", category: 'DBMS', icon: 'storage', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tip: "The sliding window pattern applies any time you need the 'best contiguous subarray'. The trigger words are: 'subarray/substring', 'at most K', 'contiguous'.", category: 'DSA', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tip: "Don't store raw passwords, ever. Use bcrypt (cost ≥ 12), Argon2id, or scrypt. MD5 and SHA-256 are NOT password hashing algorithms — they're too fast.", category: 'Security', icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10' },
  { tip: "In a distributed system, adding a cache doesn't eliminate consistency issues — it creates two sources of truth. Always define your invalidation strategy before adding a cache.", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "The Observer pattern is the foundation of every reactive framework (React, RxJS, Angular). When you see 'notify subscribers on state change', that's Observer.", category: 'OOP', icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { tip: "Write your behavioral answers from the first person: 'I', not 'we'. Interviewers are assessing your contribution, not your team's. Own every action.", category: 'Career', icon: 'record_voice_over', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { tip: "TCP's 3-way handshake adds 1.5 RTTs of latency before data flows. HTTP/2 multiplexing and QUIC 0-RTT exist specifically to eliminate this penalty at scale.", category: 'Networks', icon: 'wifi', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "For graph problems, identify directed vs undirected and weighted vs unweighted first. These determine whether to use DFS, BFS, Dijkstra, or Bellman-Ford.", category: 'DSA', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tip: "Page faults are expensive — each one is a trip to disk (microseconds → milliseconds). The working set model predicts thrashing: if active pages > RAM, performance collapses.", category: 'OS', icon: 'terminal', color: 'text-green-400', bg: 'bg-green-500/10' },
  { tip: "CSRF protection in 2026: SameSite=Strict cookies eliminate most CSRF risk in modern browsers without CSRF tokens. Set Secure + HttpOnly as well.", category: 'Security', icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10' },
  { tip: "Consistent hashing solves the 'N mod N+1' problem: when you add a node with naive hashing, almost all keys must be remapped. Consistent hashing remaps only K/N.", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "DP tip: if you see 'minimum/maximum', 'count number of ways', or 'is it possible to reach' — suspect DP. Start with recursion + memoization, then optimize to tabulation.", category: 'DSA', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tip: "2NF removes partial dependencies (non-key → part of composite key). 3NF removes transitive dependencies (non-key → non-key). Most systems need 3NF minimum.", category: 'DBMS', icon: 'storage', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tip: "A deadlock requires all four: mutual exclusion, hold-and-wait, no preemption, and circular wait. Eliminate ANY one to prevent deadlocks — not all four.", category: 'OS', icon: 'terminal', color: 'text-green-400', bg: 'bg-green-500/10' },
  { tip: "Factory Method lets subclasses decide which class to instantiate. Abstract Factory creates families of related objects. Know the distinction — it appears in senior interviews.", category: 'OOP', icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { tip: "At Netflix, team fit matters as much as coding. The Keeper Test: 'Would I fight to keep this person?' Research company engineering blogs — it signals you care about their culture.", category: 'Career', icon: 'work', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { tip: "Window functions don't collapse rows like GROUP BY does. ROW_NUMBER + PARTITION BY is the canonical SQL pattern for 'top N per group' — know it cold.", category: 'DBMS', icon: 'storage', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tip: "XSS attack: malicious JS runs in victim's browser. CSRF attack: victim's browser makes forged requests using their credentials. They're opposite attack vectors.", category: 'Security', icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10' },
  { tip: "Binary search beyond sorted arrays: use it whenever you can reduce the search space by half based on a condition. 'Find minimum in rotated array', 'capacity planning' — all binary search.", category: 'DSA', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tip: "Idempotency keys prevent duplicate operations in distributed systems. If your payment API can be retried safely with the same key, that's an idempotent design.", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "AP systems (Cassandra, DynamoDB) return potentially stale data during partitions. CP systems (Zookeeper, HBase) return errors. Pick based on your consistency requirements.", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { tip: "The Builder pattern solves the 'telescoping constructor' anti-pattern: instead of MyClass(a, null, null, b, null, c), use a Builder to set only what matters.", category: 'OOP', icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { tip: "BFS gives shortest path in unweighted graphs. Dijkstra handles weighted (non-negative). Bellman-Ford handles negative edges. Floyd-Warshall handles all-pairs.", category: 'DSA', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { tip: "Interview meta-skill: think out loud and check in. Say 'I'm going to assume X — does that make sense?' Interviewers can redirect you from wrong assumptions before you go too far.", category: 'Career', icon: 'record_voice_over', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { tip: "MVCC (Multi-Version Concurrency Control) is why PostgreSQL reads don't block writes and writes don't block reads. Each transaction sees a snapshot of data at its start time.", category: 'DBMS', icon: 'storage', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { tip: "Rate limiting algorithms: token bucket (bursty, smooth average), sliding window log (precise, memory-intensive), fixed window counter (simple, edge-case spike at boundaries).", category: 'System Design', icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

function DailyChallengeWidget() {
  const todayKey = `eyf.daily.${new Date().toISOString().split('T')[0]}`;
  const done = localStorage.getItem(todayKey) === 'done';

  // Day-of-month maps to a challenge title/type (mirror DailyChallengePage logic)
  const day = new Date().getDate() - 1;
  const TITLES = [
    { title: 'Two Sum', type: 'DSA', diff: 'easy' },
    { title: 'Design a URL Shortener', type: 'System Design', diff: 'medium' },
    { title: 'Tell Me About a Failure', type: 'Behavioral', diff: 'medium' },
    { title: 'Valid Parentheses', type: 'DSA', diff: 'easy' },
    { title: 'Top Earners per Department', type: 'SQL', diff: 'medium' },
    { title: 'Maximum Subarray', type: 'DSA', diff: 'medium' },
    { title: 'SQL Injection Defense', type: 'Security', diff: 'medium' },
    { title: 'Climb Stairs', type: 'DSA', diff: 'easy' },
    { title: 'Design a Parking Lot', type: 'OOP Design', diff: 'medium' },
    { title: 'Reverse a Linked List', type: 'DSA', diff: 'easy' },
    { title: 'Design a Rate Limiter', type: 'System Design', diff: 'medium' },
    { title: 'Number of Islands', type: 'DSA', diff: 'medium' },
    { title: 'Disagreement with a Manager', type: 'Behavioral', diff: 'hard' },
    { title: 'Coin Change', type: 'DSA', diff: 'medium' },
    { title: 'Users With No Orders', type: 'SQL', diff: 'easy' },
    { title: 'Longest Substring Without Repeating', type: 'DSA', diff: 'medium' },
    { title: 'XSS Attack Prevention', type: 'Security', diff: 'medium' },
    { title: 'Binary Search', type: 'DSA', diff: 'easy' },
    { title: 'Design a Notification System', type: 'System Design', diff: 'hard' },
    { title: 'LRU Cache', type: 'DSA', diff: 'hard' },
  ];
  const today = TITLES[day % TITLES.length]!;
  const DIFF_COLOR_MAP: Record<string, string> = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

  // Compute streak
  let streak = 0;
  const now = new Date();
  while (streak < 365) {
    const d = new Date(now);
    d.setDate(d.getDate() - streak);
    if (localStorage.getItem(`eyf.daily.${d.toISOString().split('T')[0]}`) === 'done') streak++;
    else break;
  }

  return (
    <section className="mb-8">
      <div className="bg-surface-container rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E82127]/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="w-12 h-12 bg-[#E82127]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon name="today" size={24} className="text-[#E82127]" />
        </div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E82127]">Daily Challenge</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 ${DIFF_COLOR_MAP[today.diff]}`}>{today.diff}</span>
            <span className="text-[9px] font-bold text-zinc-600 uppercase">{today.type}</span>
          </div>
          <p className="text-white font-bold text-sm">{today.title}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 relative">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Icon name="local_fire_department" size={16} filled />
              <span className="font-black text-sm">{streak}</span>
            </div>
          )}
          <Link to="/app/daily">
            <button
              type="button"
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                done
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-[#E82127] text-white hover:brightness-110'
              }`}
            >
              {done ? '✓ Done' : 'Solve Now'}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function DailyInsightWidget() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const insight = ENGINEERING_INSIGHTS[dayOfYear % ENGINEERING_INSIGHTS.length]!;
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('eyf.insightDay') === String(dayOfYear);
  });

  if (dismissed) return null;

  return (
    <section className="mb-8">
      <div className={`${insight.bg} border border-current/20 rounded-2xl p-6 flex items-start gap-5 relative overflow-hidden`}>
        <div className="absolute right-0 top-0 w-48 h-48 bg-current/5 blur-[60px] rounded-full -mr-12 -mt-12 pointer-events-none" />
        <div className={`w-10 h-10 ${insight.bg} border border-current/30 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon name={insight.icon} size={20} className={insight.color} />
        </div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${insight.color}`}>Engineering Insight</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${insight.bg} ${insight.color} border border-current/20`}>{insight.category}</span>
          </div>
          <p className="text-white text-sm leading-relaxed font-medium">{insight.tip}</p>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('eyf.insightDay', String(dayOfYear)); }}
          className="text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0 relative"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </section>
  );
}

// Smart recommendations based on XP, streak, and module progress
interface ModItem { module: string; progress: number; cta: string }

function buildRecommendations(xp: number, streak: number, modules: ModItem[]): Array<{
  icon: string; color: string; bg: string; title: string; reason: string; path: string; xp: string;
}> {
  const recs: Array<{ icon: string; color: string; bg: string; title: string; reason: string; path: string; xp: string; priority: number }> = [];

  const progressOf = (key: string) => {
    const m = modules.find((x) => x.module === key);
    if (!m) return 0;
    return m.progress > 1 ? m.progress : Math.round(m.progress * 100);
  };

  // Streak at risk
  if (streak === 0) {
    recs.push({ icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Start your streak', reason: "You haven't solved anything yet today — start now!", path: '/app/problems', xp: '+10 XP', priority: 10 });
  } else if (streak > 0 && streak < 3) {
    recs.push({ icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-500/10', title: `Keep your ${streak}d streak alive`, reason: 'Solve one problem before midnight to extend it.', path: '/app/problems', xp: '+25 XP', priority: 9 });
  }

  // Flashcards
  const flashPct = progressOf('flashcards');
  if (flashPct === 0) {
    recs.push({ icon: 'style', color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Try Flashcards', reason: 'SM-2 spaced repetition — never forget a concept again.', path: '/app/flashcards', xp: '+40 XP', priority: 7 });
  } else if (flashPct < 30) {
    recs.push({ icon: 'style', color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Review flashcard deck', reason: `You're at ${flashPct}% — a 10-min session locks in key concepts.`, path: '/app/flashcards', xp: '+20 XP', priority: 6 });
  }

  // OOP / design patterns
  const oopPct = progressOf('oop');
  if (oopPct < 20) {
    recs.push({ icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Learn a GoF Design Pattern', reason: 'Design patterns appear in 60% of senior-level interviews.', path: '/app/oop', xp: '+50 XP', priority: 5 });
  }

  // System design
  const sdPct = progressOf('system-design');
  if (sdPct < 10) {
    recs.push({ icon: 'architecture', color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'Start System Design', reason: 'Mandatory for mid-senior roles. Begin with URL shortener.', path: '/app/system-design', xp: '+30 XP', priority: 4 });
  }

  // Core subjects
  const csPct = progressOf('core-subjects');
  if (csPct < 15) {
    recs.push({ icon: 'terminal', color: 'text-green-400', bg: 'bg-green-500/10', title: 'Complete a Core CS topic', reason: 'OS, DBMS, and Networks are asked in every FAANG loop.', path: '/app/subjects', xp: '+15 XP', priority: 3 });
  }

  // Mock interview
  const mockPct = progressOf('mock-interview' as string);
  if (mockPct === 0 && xp > 100) {
    recs.push({ icon: 'record_voice_over', color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Take a Mock Interview', reason: "You've built some XP — now test yourself under pressure.", path: '/app/mock-interview', xp: '+75 XP', priority: 5 });
  }

  // Study plan
  const planConfig = localStorage.getItem('eyf.studyPlanConfig');
  if (!planConfig && xp > 50) {
    recs.push({ icon: 'calendar_month', color: 'text-indigo-400', bg: 'bg-indigo-500/10', title: 'Build your Study Plan', reason: 'Enter your target company and get a day-by-day schedule.', path: '/app/study-plan', xp: 'Free!', priority: 6 });
  }

  // Cheat sheets
  if (xp < 200) {
    recs.push({ icon: 'quick_reference_all', color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'Explore Cheat Sheets', reason: 'Algorithm patterns, Big-O, SQL, and behavioral templates.', path: '/app/cheatsheets', xp: '+5 XP', priority: 2 });
  }

  // Placement
  const placementPct = progressOf('placement');
  if (placementPct === 0 && xp > 200) {
    recs.push({ icon: 'work_history', color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Research target companies', reason: 'View interview processes, DSA focus, and insider tips.', path: '/app/placement', xp: '+10 XP', priority: 4 });
  }

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

function NextUpWidget({ xp, streak, modules }: { readonly xp: number; readonly streak: number; readonly modules: ModItem[] }) {
  const recs = buildRecommendations(xp, streak, modules);
  if (recs.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="auto_awesome" size={16} className="text-[#E82127]" filled />
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">What to Study Next</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recs.map((rec) => (
          <Link key={rec.path} to={rec.path}>
            <div className="group bg-[#161616] border border-white/5 rounded-2xl p-4 hover:bg-[#1e1e1e] hover:border-white/10 transition-all h-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 ${rec.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon name={rec.icon} size={18} className={rec.color} />
                </div>
                <span className="text-[10px] font-black text-green-400">{rec.xp}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-bold mb-1">{rec.title}</p>
                <p className="text-zinc-600 text-[10px] leading-relaxed">{rec.reason}</p>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${rec.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Go <Icon name="arrow_forward" size={11} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const session  = getSession();
  const { summary, displayName, refresh } = useUser();
  const [modules, setModules]       = useState<ModulesStatus['items']>([]);
  const [daily, setDaily]           = useState<DailyChallenge | null>(null);
  const [levelUpFor, setLevelUpFor] = useState<number | null>(null);
  const [streakToast, setStreakToast] = useState(false);
  const prevLevelRef                = useState<number>(0);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<ModulesStatus>('/modules/status', { token: session.accessToken })
      .then((d) => setModules(d.items))
      .catch(() => {});
    // Try to load daily challenge from problems list
    apiRequest<{ problems: DailyChallenge[] }>('/problems?limit=1&daily=true', { token: session.accessToken })
      .then((d) => { if (d.problems[0]) setDaily(d.problems[0]); })
      .catch(() => {});
  }, [session?.accessToken]);

  // Detect level-up since last visit
  useEffect(() => {
    if (!summary) return;
    const storedLevel = Number(localStorage.getItem('eyf.lastLevel') ?? 0);
    if (storedLevel > 0 && summary.level > storedLevel) setLevelUpFor(summary.level);
    localStorage.setItem('eyf.lastLevel', String(summary.level));

    // Streak milestone toast (once per day)
    const today = new Date().toDateString();
    const lastStreakDay = localStorage.getItem('eyf.lastStreakToastDay');
    const MILESTONES = [7,14,30,60,100,200,365];
    if (MILESTONES.includes(summary.streak) && lastStreakDay !== today) {
      localStorage.setItem('eyf.lastStreakToastDay', today);
      setStreakToast(true);
    }
  }, [summary]);

  const xp        = summary?.xp ?? 0;
  const weeklyXp  = summary?.weeklyXp ?? 0;
  const streak    = summary?.streak ?? 0;
  const level     = summary?.level ?? 0;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const recentAchievements  = summary?.recentAchievements ?? [];
  const achievementsEarned  = summary?.achievementsEarned ?? 0;
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

  return (
    <AppShell>
      {levelUpFor && (
        <LevelUpModal
          level={levelUpFor}
          onClose={() => { setLevelUpFor(null); refresh(); }}
        />
      )}
      {streakToast && streak > 0 && (
        <StreakToast streak={streak} onClose={() => setStreakToast(false)} />
      )}

      <div className="pt-8 max-w-7xl">

        {/* ── Hero welcome ── */}
        <section className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Welcome card */}
          <div className="xl:col-span-2 bg-[#161616] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#E82127]/8 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            <div className="relative">
              <p className="text-zinc-500 text-sm font-medium mb-1">{greeting},</p>
              <h1 className="text-4xl font-black tracking-tighter text-white capitalize mb-6">
                {displayName || 'Engineer'} 👋
              </h1>

              {/* XP Stats */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Total XP</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-white">{xp.toLocaleString()}</span>
                    <Icon name="bolt" size={20} className="text-[#E82127]" filled />
                  </div>
                </div>
                <div className="border-l border-zinc-800 pl-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">This Week</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-green-400">+{weeklyXp.toLocaleString()}</span>
                    <Icon name="trending_up" size={18} className="text-green-400" />
                  </div>
                </div>
                <div className="border-l border-zinc-800 pl-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Streak</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-orange-400">{streak}d</span>
                    <span className="text-xl">{streak >= 7 ? '🔥' : '⚡'}</span>
                  </div>
                </div>
                <div className="border-l border-zinc-800 pl-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Badges</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-yellow-400">{achievementsEarned}</span>
                    <Icon name="emoji_events" size={18} className="text-yellow-400" filled />
                  </div>
                </div>
              </div>

              {/* Level progress */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Level {level} · {levelName}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600">
                    {xp.toLocaleString()} / {nextThreshold.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E82127] to-rose-400 rounded-full transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600 font-medium">
                  {(nextThreshold - xp).toLocaleString()} XP to {LEVEL_NAMES[level + 1] ?? 'Max Level'}
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Daily challenge */}
            {daily ? (
              <div className="bg-gradient-to-br from-[#1a1010] to-[#161616] border border-[#E82127]/25 rounded-2xl p-5 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#E82127] text-[10px] font-black uppercase tracking-widest">Daily Challenge</span>
                  <span className="ml-auto text-[10px] font-bold text-yellow-400">+{daily.xpReward ?? 50} XP</span>
                </div>
                <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit mb-2 ${DIFF_COLOR[daily.difficulty] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
                  {daily.difficulty}
                </p>
                <h3 className="text-base font-black text-white mb-1 leading-snug">{daily.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{daily.category}</p>
                <Link to={`/app/problems/${daily.slug}`}>
                  <button className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    daily.solved
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-[#E82127] text-white hover:brightness-110 shadow-lg shadow-red-900/30'
                  }`}>
                    {daily.solved ? <><Icon name="check_circle" size={14} filled /> Solved!</> : <>Solve Now <Icon name="arrow_forward" size={14} /></>}
                  </button>
                </Link>
              </div>
            ) : (
              <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex-1">
                <p className="text-[#E82127] text-[10px] font-black uppercase tracking-widest mb-3">Daily Challenge</p>
                <Link to="/app/problems">
                  <button className="w-full bg-[#E82127] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2">
                    Pick a Problem <Icon name="arrow_forward" size={14} />
                  </button>
                </Link>
              </div>
            )}

            {/* Recent achievements */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  Recent Badges
                </span>
                <Link to="/app/achievements" className="text-[10px] font-bold text-[#E82127] hover:underline uppercase tracking-widest">
                  All {achievementsEarned}
                </Link>
              </div>
              {recentAchievements.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {recentAchievements.map((a) => (
                    <div
                      key={a.key}
                      title={a.name}
                      className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-default border border-zinc-700"
                    >
                      {a.icon}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">Earn badges by solving problems 🏆</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Today's Focus ── */}
        <section className="mb-8 bg-gradient-to-r from-[#1a1010] to-[#161616] border border-[#E82127]/15 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E82127]/10 rounded-xl flex items-center justify-center">
                <Icon name="target" size={18} className="text-[#E82127]" />
              </div>
              <div>
                <h2 className="font-black text-sm text-white">Today's Focus</h2>
                <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Recommended for you</p>
              </div>
            </div>
            <Link to="/app/career" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-[#E82127] transition-colors">
              Customize →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: 'code', label: 'DSA Practice', desc: 'Solve 1 medium problem', path: '/app/problems', color: 'text-blue-400', bg: 'bg-blue-500/10', xp: '+60 XP' },
              { icon: 'auto_stories', label: 'Core Subjects', desc: 'Complete 1 topic', path: '/app/subjects', color: 'text-green-400', bg: 'bg-green-500/10', xp: '+15 XP' },
              { icon: 'record_voice_over', label: 'Mock Interview', desc: 'Practice 4 questions', path: '/app/mock-interview', color: 'text-orange-400', bg: 'bg-orange-500/10', xp: '+50 XP' },
            ].map((task) => (
              <Link key={task.path} to={task.path}>
                <div className="flex items-center gap-3 bg-[#1e1e1e]/60 rounded-xl px-4 py-3 hover:bg-[#252525] transition-all group">
                  <div className={`w-8 h-8 ${task.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon name={task.icon} size={16} className={task.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{task.label}</p>
                    <p className="text-zinc-600 text-[10px]">{task.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary-container/70 flex-shrink-0">{task.xp}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Daily Challenge ── */}
        <DailyChallengeWidget />

        {/* ── What to Study Next ── */}
        <NextUpWidget xp={xp} streak={streak} modules={moduleList} />

        {/* ── Activity heatmap ── */}
        <section className="mb-8 bg-[#161616] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-sm text-white">Activity</h2>
              <p className="text-[10px] text-zinc-600 font-medium mt-0.5">12-week learning streak</p>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <span>🔥</span>
              <span className="text-orange-400 font-black text-sm">{streak} day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <ActivityHeatmap streak={streak} />
        </section>

        {/* ── Quick actions ── */}
        <section className="mb-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Solve Problem',    icon: 'code',                path: '/app/problems',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
            { label: 'Pattern Quiz',     icon: 'quiz',                path: '/app/pattern-quiz',   color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'System Design',    icon: 'architecture',        path: '/app/system-design',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
            { label: 'Mock Interview',   icon: 'record_voice_over',   path: '/app/mock-interview', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Company Prep',     icon: 'business',            path: '/app/companies',      color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20' },
            { label: 'Weekly Contest',   icon: 'emoji_events',        path: '/app/contests',       color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
            { label: 'My Roadmap',       icon: 'map',                 path: '/app/roadmap',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'My Progress',      icon: 'insights',            path: '/app/progress',       color: 'text-blue-300',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
          ].map((a) => (
            <Link key={a.path} to={a.path}>
              <div className={`${a.bg} border ${a.border} rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:scale-[1.02] transition-all cursor-pointer group`}>
                <div className={`w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center ${a.color} group-hover:scale-110 transition-transform`}>
                  <Icon name={a.icon} size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${a.color}`}>{a.label}</span>
              </div>
            </Link>
          ))}
        </section>

        {/* ── Daily Engineering Insight ── */}
        <DailyInsightWidget />

        {/* ── Career track CTA ── */}
        <div className="mb-8 bg-gradient-to-r from-[#1a1a1a] to-[#161616] border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#E82127]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="route" className="text-[#E82127]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pick Your Career Track</h3>
              <p className="text-xs text-zinc-500">Student · Working Professional · Industry Expert</p>
            </div>
          </div>
          <Link to="/app/career">
            <button className="flex-shrink-0 bg-[#E82127] text-white font-bold py-2.5 px-5 rounded-full text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-red-900/20">
              Set Track <Icon name="arrow_forward" size={14} />
            </button>
          </Link>
        </div>

        {/* ── Module grid ── */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-black text-zinc-600 mb-5">
          All Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
          {moduleList.map((mod) => {
            const cfg = MODULE_CONFIG[mod.module];
            if (!cfg) return null;
            const pct = typeof mod.progress === 'number'
              ? (mod.progress > 1 ? Math.round(mod.progress) : Math.round(mod.progress * 100))
              : 0;
            return (
              <Link key={mod.module} to={cfg.path}>
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 hover:bg-[#1e1e1e] hover:border-white/10 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center ${cfg.color} group-hover:scale-110 transition-transform`}>
                      <Icon name={cfg.icon} size={18} />
                    </div>
                    <ProgressRing pct={pct} />
                  </div>
                  <p className="text-white text-xs font-black truncate">{cfg.title}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${cfg.color}`}>
                    {mod.cta || 'Start'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Community & Leaderboard preview ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/app/leaderboard">
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Icon name="leaderboard" size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Leaderboard</h3>
                  <p className="text-xs text-zinc-600">See how you rank this week</p>
                </div>
                <Icon name="arrow_forward" size={16} className="text-zinc-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="space-y-2">
                {['🥇 Top Engineer','🥈 Rising Star','🥉 Daily Solver'].map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{t}</span>
                    <span className="text-zinc-600 font-mono">{[12450,9870,7230][i]?.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
          <Link to="/app/community">
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Icon name="forum" size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Community</h3>
                  <p className="text-xs text-zinc-600">Join the discussion</p>
                </div>
                <Icon name="arrow_forward" size={16} className="text-zinc-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="space-y-2">
                {['How to approach DP problems?','Best resources for OWASP?','Mock interview experience at Google'].map((t) => (
                  <p key={t} className="text-xs text-zinc-500 truncate hover:text-zinc-300 transition-colors">• {t}</p>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
