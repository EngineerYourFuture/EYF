import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanConfig {
  company: string;
  role: 'sde' | 'sre' | 'ds' | 'pm';
  level: 'entry' | 'mid' | 'senior';
  interviewDate: string;
  hoursPerDay: number;
}

interface DayTask {
  topic: string;
  type: 'dsa' | 'system-design' | 'behavioral' | 'review' | 'mock' | 'oop';
  duration: number; // minutes
  icon: string;
  link?: string;
  color: string;
}

interface WeekPlan {
  weekNum: number;
  theme: string;
  days: Array<{ date: string; label: string; tasks: DayTask[] }>;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix',
  'Uber', 'Airbnb', 'Stripe', 'Flipkart', 'Swiggy', 'Zomato', 'Other',
];

const COMPANY_DSA_WEIGHT: Record<string, { dsa: number; sd: number; beh: number }> = {
  Google:    { dsa: 50, sd: 30, beh: 20 },
  Amazon:    { dsa: 35, sd: 25, beh: 40 },
  Microsoft: { dsa: 40, sd: 30, beh: 30 },
  Meta:      { dsa: 50, sd: 30, beh: 20 },
  Apple:     { dsa: 40, sd: 30, beh: 30 },
  Netflix:   { dsa: 30, sd: 50, beh: 20 },
  Uber:      { dsa: 40, sd: 40, beh: 20 },
  Airbnb:    { dsa: 35, sd: 35, beh: 30 },
  Stripe:    { dsa: 35, sd: 40, beh: 25 },
  Flipkart:  { dsa: 45, sd: 35, beh: 20 },
  Swiggy:    { dsa: 50, sd: 30, beh: 20 },
  Zomato:    { dsa: 50, sd: 30, beh: 20 },
  Other:     { dsa: 40, sd: 35, beh: 25 },
};

const WEEK_THEMES_8 = [
  'Arrays, Strings & Hash Maps',
  'Linked Lists, Stacks & Queues',
  'Trees, Binary Search & Recursion',
  'Graphs, BFS/DFS & Dynamic Programming',
  'System Design Fundamentals',
  'System Design Advanced + OOP Patterns',
  'Behavioral Deep Dive + Mock Interviews',
  'Full-Stack Review & Interview Simulation',
];

const WEEK_THEMES_4 = [
  'DSA Foundations: Arrays, Trees, Graphs',
  'System Design + OOP Patterns',
  'Behavioral Stories + Company Research',
  'Mock Interviews + Gap Filling',
];

const WEEK_THEMES_12 = [
  'Big-O, Arrays & Strings',
  'Hash Maps, Two Pointers & Sliding Window',
  'Linked Lists, Stacks & Queues',
  'Trees: BST, DFS, BFS & Trie',
  'Graphs: BFS, DFS, Topological Sort',
  'Dynamic Programming: 1D & 2D',
  'Greedy, Intervals & Advanced Patterns',
  'System Design: Scalability & Databases',
  'System Design: Caching, Queues & CDN',
  'OOP Patterns: GoF + SOLID Deep Dive',
  'Behavioral: STAR Stories + LP Prep',
  'Full Mock Interviews + Final Review',
];

const DSA_TOPICS: DayTask[] = [
  { topic: 'Two Pointers & Sliding Window problems', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Binary Search variations (rotated array, 2D matrix)', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Linked List: reverse, merge, cycle detection', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Stack & Queue: monotonic stack, LRU cache', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Tree DFS: path sum, diameter, LCA', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Tree BFS: level order, zigzag, right view', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Graph BFS/DFS: islands, connected components', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Topological Sort & Cycle Detection', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Dynamic Programming: Fibonacci variants & climb stairs', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'DP: 0/1 Knapsack, House Robber, Coin Change', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Heap & Priority Queue: top-K problems', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Trie: autocomplete, word search', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Backtracking: permutations, subsets, N-queens', type: 'dsa', duration: 90, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Greedy: intervals, gas station, jump game', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
  { topic: 'Hash Map patterns: group anagrams, top-K frequent', type: 'dsa', duration: 75, icon: 'code', link: '/app/problems', color: 'text-blue-400' },
];

const SD_TOPICS: DayTask[] = [
  { topic: 'Design a URL Shortener (tinyurl)', type: 'system-design', duration: 60, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'Design a Rate Limiter', type: 'system-design', duration: 60, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'Design Twitter / News Feed', type: 'system-design', duration: 75, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'Design YouTube video upload pipeline', type: 'system-design', duration: 75, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'Design a distributed key-value store', type: 'system-design', duration: 60, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'Design a chat system (WhatsApp scale)', type: 'system-design', duration: 75, icon: 'architecture', link: '/app/system-design', color: 'text-cyan-400' },
  { topic: 'CAP theorem, PACELC & consistency models', type: 'system-design', duration: 45, icon: 'architecture', link: '/app/cheatsheets', color: 'text-cyan-400' },
  { topic: 'Caching strategies: CDN, Redis, write-through vs write-back', type: 'system-design', duration: 45, icon: 'architecture', link: '/app/cheatsheets', color: 'text-cyan-400' },
  { topic: 'Database sharding, replication, indexing', type: 'system-design', duration: 60, icon: 'storage', link: '/app/subjects', color: 'text-cyan-400' },
  { topic: 'Message queues: Kafka vs RabbitMQ vs SQS', type: 'system-design', duration: 45, icon: 'architecture', link: '/app/cheatsheets', color: 'text-cyan-400' },
];

const BEH_TOPICS: DayTask[] = [
  { topic: 'Write 3 STAR stories: leadership & conflict', type: 'behavioral', duration: 45, icon: 'record_voice_over', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Write 3 STAR stories: technical achievements', type: 'behavioral', duration: 45, icon: 'record_voice_over', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Practice: "Tell me about yourself" (2-min version)', type: 'behavioral', duration: 30, icon: 'record_voice_over', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Amazon Leadership Principles — prepare 1 story per LP', type: 'behavioral', duration: 60, icon: 'record_voice_over', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Research target company: products, culture, recent news', type: 'behavioral', duration: 30, icon: 'business', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Practice "Why this company?" — make it specific', type: 'behavioral', duration: 20, icon: 'record_voice_over', link: '/app/placement', color: 'text-orange-400' },
  { topic: 'Mock behavioral: failure, disagreement, ambiguity stories', type: 'behavioral', duration: 45, icon: 'record_voice_over', link: '/app/mock-interview', color: 'text-orange-400' },
];

const OOP_TOPICS: DayTask[] = [
  { topic: 'SOLID principles with code examples', type: 'oop', duration: 45, icon: 'account_tree', link: '/app/oop', color: 'text-amber-400' },
  { topic: 'Creational patterns: Singleton, Factory, Builder', type: 'oop', duration: 45, icon: 'account_tree', link: '/app/oop', color: 'text-amber-400' },
  { topic: 'Structural patterns: Adapter, Decorator, Facade', type: 'oop', duration: 45, icon: 'account_tree', link: '/app/oop', color: 'text-amber-400' },
  { topic: 'Behavioral patterns: Observer, Strategy, Command', type: 'oop', duration: 45, icon: 'account_tree', link: '/app/oop', color: 'text-amber-400' },
];

const REVIEW_TASKS: DayTask[] = [
  { topic: 'Flashcard review session (30 min spaced repetition)', type: 'review', duration: 30, icon: 'style', link: '/app/flashcards', color: 'text-purple-400' },
  { topic: 'Cheat sheet review: Big-O & algorithm patterns', type: 'review', duration: 20, icon: 'quick_reference_all', link: '/app/cheatsheets', color: 'text-purple-400' },
];

const MOCK_TASKS: DayTask[] = [
  { topic: 'Mock DSA interview (45 min timed)', type: 'mock', duration: 60, icon: 'record_voice_over', link: '/app/mock-interview', color: 'text-rose-400' },
  { topic: 'Mock system design interview (45 min)', type: 'mock', duration: 60, icon: 'record_voice_over', link: '/app/mock-interview', color: 'text-rose-400' },
  { topic: 'Full mock interview: DSA + SD + Behavioral', type: 'mock', duration: 90, icon: 'record_voice_over', link: '/app/mock-interview', color: 'text-rose-400' },
];

// ─── Plan Generator ───────────────────────────────────────────────────────────

function weeksUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(1, Math.min(16, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildPlan(config: PlanConfig): WeekPlan[] {
  const weeks = weeksUntil(config.interviewDate);
  const themes = weeks <= 4 ? WEEK_THEMES_4 : weeks <= 8 ? WEEK_THEMES_8 : WEEK_THEMES_12;
  const numWeeks = Math.min(weeks, themes.length);
  const weights = COMPANY_DSA_WEIGHT[config.company] ?? COMPANY_DSA_WEIGHT['Other']!;

  const dsaPool = [...DSA_TOPICS];
  const sdPool = [...SD_TOPICS];
  const behPool = [...BEH_TOPICS];
  const oopPool = [...OOP_TOPICS];
  let dsaIdx = 0, sdIdx = 0, behIdx = 0, oopIdx = 0;

  const now = new Date();

  return Array.from({ length: numWeeks }, (_, wi) => {
    const weekNum = wi + 1;
    const isLastWeek = weekNum === numWeeks;
    const isSdWeek = weekNum > numWeeks * 0.5 && weekNum <= numWeeks * 0.8;

    const days = Array.from({ length: 7 }, (__, di) => {
      const date = addDays(now, wi * 7 + di);
      const dayLabel = formatDateLabel(date);
      const tasks: DayTask[] = [];

      // Always add a review task on Mon/Wed/Fri
      if (di === 0 || di === 2 || di === 4) {
        tasks.push(REVIEW_TASKS[di === 4 ? 1 : 0]!);
      }

      // Sunday = mock or rest
      if (di === 6) {
        if (isLastWeek || weekNum >= numWeeks - 1) {
          tasks.push(MOCK_TASKS[2]!);
        } else if (weekNum > 2) {
          tasks.push(MOCK_TASKS[di % 2 === 0 ? 0 : 1]!);
        }
        return { date: formatDate(date), label: dayLabel, tasks };
      }

      // Determine focus for the day
      const dsaWeight = weights.dsa;
      const sdWeight = isLastWeek ? 0 : isSdWeek ? weights.sd + 15 : weights.sd - 10;
      const behWeight = isLastWeek ? 50 : weights.beh;
      const total = dsaWeight + sdWeight + behWeight;
      const rand = (di * 7 + wi * 3) % total;

      if (isLastWeek) {
        // Last week = alternating mock + behavioral
        if (di % 3 === 0 && behIdx < behPool.length) {
          tasks.push(behPool[behIdx++ % behPool.length]!);
        } else {
          tasks.push(MOCK_TASKS[di % 2]!);
        }
      } else if (rand < dsaWeight && dsaIdx < dsaPool.length * 2) {
        tasks.push(dsaPool[dsaIdx++ % dsaPool.length]!);
        // Add OOP every 3 days
        if (di % 3 === 2 && oopIdx < oopPool.length) {
          tasks.push(oopPool[oopIdx++ % oopPool.length]!);
        }
      } else if (rand < dsaWeight + sdWeight && sdIdx < sdPool.length * 2) {
        tasks.push(sdPool[sdIdx++ % sdPool.length]!);
      } else if (behIdx < behPool.length * 2) {
        tasks.push(behPool[behIdx++ % behPool.length]!);
      } else {
        tasks.push(dsaPool[dsaIdx++ % dsaPool.length]!);
      }

      return { date: formatDate(date), label: dayLabel, tasks };
    });

    return {
      weekNum,
      theme: themes[wi % themes.length] ?? `Week ${weekNum}`,
      days,
    };
  });
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<DayTask['type'], string> = {
  dsa:           'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'system-design': 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  behavioral:    'bg-orange-500/10 border-orange-500/20 text-orange-400',
  review:        'bg-purple-500/10 border-purple-500/20 text-purple-400',
  mock:          'bg-rose-500/10 border-rose-500/20 text-rose-400',
  oop:           'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

const TYPE_LABELS: Record<DayTask['type'], string> = {
  dsa: 'DSA',
  'system-design': 'System Design',
  behavioral: 'Behavioral',
  review: 'Review',
  mock: 'Mock Interview',
  oop: 'OOP',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StudyPlanPage() {
  const { fireXP } = useUser();
  const [config, setConfig] = useState<PlanConfig>({
    company: 'Google',
    role: 'sde',
    level: 'entry',
    interviewDate: '',
    hoursPerDay: 2,
  });
  const [plan, setPlan] = useState<WeekPlan[] | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateStr = formatDate(minDate);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = formatDate(maxDate);

  const weeksLeft = config.interviewDate ? weeksUntil(config.interviewDate) : null;

  const generate = () => {
    if (!config.interviewDate) return;
    const newPlan = buildPlan(config);
    setPlan(newPlan);
    setActiveWeek(0);
    setCompletedTasks(new Set());
    setGenerated(true);
    fireXP(15, 'Study plan generated!');
  };

  const toggleTask = (key: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else { next.add(key); fireXP(5, 'Task completed!'); }
      return next;
    });
  };

  const totalTasks = useMemo(() => plan?.flatMap((w) => w.days.flatMap((d) => d.tasks)).length ?? 0, [plan]);
  const completedCount = completedTasks.size;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const currentWeek = plan?.[activeWeek];

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -mr-24 -mt-24" />
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="calendar_month" className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-on-surface">Study Plan Generator</h1>
              <p className="text-on-surface-variant text-sm mt-1">
                Personalized day-by-day prep schedule based on your target company, role, and interview date.
              </p>
            </div>
          </div>

          {/* Config form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Company */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Target Company</label>
              <select
                value={config.company}
                onChange={(e) => setConfig((p) => ({ ...p, company: e.target.value }))}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Role</label>
              <select
                value={config.role}
                onChange={(e) => setConfig((p) => ({ ...p, role: e.target.value as PlanConfig['role'] }))}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="sde">SDE / Software Engineer</option>
                <option value="sre">SRE / DevOps</option>
                <option value="ds">Data Science / ML</option>
                <option value="pm">Product Management</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Level</label>
              <select
                value={config.level}
                onChange={(e) => setConfig((p) => ({ ...p, level: e.target.value as PlanConfig['level'] }))}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="entry">Entry / Fresher (0-2 yrs)</option>
                <option value="mid">Mid-level (2-5 yrs)</option>
                <option value="senior">Senior (5+ yrs)</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Interview Date</label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={config.interviewDate}
                onChange={(e) => setConfig((p) => ({ ...p, interviewDate: e.target.value }))}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              />
              {weeksLeft !== null && (
                <p className="text-[10px] text-indigo-400 mt-1 font-bold">{weeksLeft} week{weeksLeft !== 1 ? 's' : ''} to go</p>
              )}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!config.interviewDate}
            className="bg-[#E82127] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-full hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-red-900/30 flex items-center gap-2"
          >
            <Icon name="auto_awesome" size={16} />
            Generate My Study Plan
          </button>
        </div>

        {/* Plan display */}
        {plan && generated && (
          <>
            {/* Progress bar */}
            <div className="bg-surface-container rounded-2xl p-6 mb-6 flex items-center gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-400">Overall Progress</span>
                  <span className="text-xs font-bold text-indigo-400">{completedCount}/{totalTasks} tasks · {progressPct}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Weeks</p>
                  <p className="text-xl font-black text-on-surface">{plan.length}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Tasks</p>
                  <p className="text-xl font-black text-on-surface">{totalTasks}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Done</p>
                  <p className="text-xl font-black text-indigo-400">{completedCount}</p>
                </div>
              </div>
            </div>

            {/* Week selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {plan.map((w, i) => (
                <button
                  key={w.weekNum}
                  onClick={() => setActiveWeek(i)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    i === activeWeek
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-surface-container text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Week {w.weekNum}
                </button>
              ))}
            </div>

            {/* Week content */}
            {currentWeek && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400">
                    {currentWeek.weekNum}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-on-surface">{currentWeek.theme}</h2>
                    <p className="text-xs text-zinc-500">
                      {config.company} · {config.role.toUpperCase()} · {currentWeek.days[0]?.label} – {currentWeek.days[6]?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentWeek.days.map((day) => (
                    <div key={day.date} className="bg-surface-container rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <p className="text-xs font-black text-on-surface">{day.label}</p>
                        {day.tasks.length === 0 && (
                          <span className="text-[9px] text-zinc-600 font-bold uppercase">Rest Day</span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {day.tasks.length === 0 ? (
                          <div className="py-4 flex flex-col items-center gap-2 text-zinc-700">
                            <Icon name="weekend" size={22} />
                            <p className="text-xs font-bold">Take a break!</p>
                          </div>
                        ) : (
                          day.tasks.map((task, ti) => {
                            const taskKey = `${day.date}-${ti}`;
                            const done = completedTasks.has(taskKey);
                            return (
                              <button
                                key={taskKey}
                                type="button"
                                onClick={() => toggleTask(taskKey)}
                                className={`w-full text-left rounded-xl border p-3 transition-all ${
                                  done
                                    ? 'bg-green-500/8 border-green-500/15 opacity-60'
                                    : `${TYPE_COLORS[task.type]} hover:opacity-80`
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <Icon
                                    name={done ? 'check_circle' : task.icon}
                                    size={13}
                                    className={done ? 'text-green-400 flex-shrink-0 mt-0.5' : `${TYPE_COLORS[task.type].split(' ')[2]} flex-shrink-0 mt-0.5`}
                                    filled={done}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold leading-tight ${done ? 'line-through text-zinc-500' : 'text-on-surface'}`}>
                                      {task.topic}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[9px] font-bold uppercase tracking-widest ${done ? 'text-zinc-600' : TYPE_COLORS[task.type].split(' ')[2]}`}>
                                        {TYPE_LABELS[task.type]}
                                      </span>
                                      <span className="text-[9px] text-zinc-600">· {task.duration} min</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                        {day.tasks.length > 0 && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[9px] text-zinc-700">
                              {day.tasks.reduce((s, t) => s + t.duration, 0)} min total
                            </span>
                            {day.tasks[0]?.link && (
                              <Link to={day.tasks[0].link} className="text-[9px] text-zinc-600 hover:text-zinc-400 flex items-center gap-0.5 transition-colors">
                                Go <Icon name="arrow_forward" size={9} />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-8 bg-surface-container rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Legend</p>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(TYPE_LABELS) as Array<[DayTask['type'], string]>).map(([type, label]) => (
                  <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${TYPE_COLORS[type]}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {label}
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 text-xs font-bold text-zinc-500">
                  <Icon name="check_circle" size={12} className="text-green-400" filled />
                  Click task to mark done
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!generated && (
          <div className="bg-surface-container rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2">
              <Icon name="calendar_month" className="text-indigo-400" size={30} />
            </div>
            <h3 className="text-xl font-black text-on-surface">Build your personalized roadmap</h3>
            <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
              Select your target company and interview date above. EYF will generate a day-by-day study plan
              weighted for that company's interview style — DSA-heavy for Google, LP-focused for Amazon, System
              Design-first for Netflix.
            </p>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {['Google (algo-first)', 'Amazon (LP-heavy)', 'Netflix (SD-first)'].map((c) => (
                <span key={c} className="bg-zinc-800 text-zinc-400 text-xs px-4 py-2 rounded-full font-bold">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
