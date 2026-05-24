import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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
  return d.toISOString().split('T')[0];
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface DayBuildContext {
  wi: number;
  weekNum: number;
  numWeeks: number;
  isLastWeek: boolean;
  isSdWeek: boolean;
  weights: { dsa: number; sd: number; beh: number };
  pools: { dsa: DayTask[]; sd: DayTask[]; beh: DayTask[]; oop: DayTask[] };
  idx: { dsa: number; sd: number; beh: number; oop: number };
  now: Date;
}

function addSundayTask(tasks: DayTask[], ctx: DayBuildContext): void {
  const { isLastWeek, weekNum, numWeeks } = ctx;
  if (isLastWeek || weekNum >= numWeeks - 1) {
    tasks.push(MOCK_TASKS[2]);
  } else if (weekNum > 2) {
    tasks.push(MOCK_TASKS[1]);
  }
}

function addMainTask(tasks: DayTask[], di: number, rand: number, dsaWeight: number, sdWeight: number, ctx: DayBuildContext): void {
  const { isLastWeek, pools, idx } = ctx;
  if (isLastWeek) {
    if (di % 3 === 0 && idx.beh < pools.beh.length) {
      tasks.push(pools.beh[idx.beh++ % pools.beh.length]);
    } else {
      tasks.push(MOCK_TASKS[di % 2]);
    }
  } else if (rand < dsaWeight && idx.dsa < pools.dsa.length * 2) {
    tasks.push(pools.dsa[idx.dsa++ % pools.dsa.length]);
    if (di % 3 === 2 && idx.oop < pools.oop.length) {
      tasks.push(pools.oop[idx.oop++ % pools.oop.length]);
    }
  } else if (rand < dsaWeight + sdWeight && idx.sd < pools.sd.length * 2) {
    tasks.push(pools.sd[idx.sd++ % pools.sd.length]);
  } else if (idx.beh < pools.beh.length * 2) {
    tasks.push(pools.beh[idx.beh++ % pools.beh.length]);
  } else {
    tasks.push(pools.dsa[idx.dsa++ % pools.dsa.length]);
  }
}

function buildDay(di: number, ctx: DayBuildContext): { date: string; label: string; tasks: DayTask[] } {
  const { wi, now, weights, isLastWeek, isSdWeek } = ctx;
  const date = addDays(now, wi * 7 + di);
  const tasks: DayTask[] = [];

  if (di === 0 || di === 2 || di === 4) {
    tasks.push(REVIEW_TASKS[di === 4 ? 1 : 0]);
  }

  if (di === 6) {
    addSundayTask(tasks, ctx);
    return { date: formatDate(date), label: formatDateLabel(date), tasks };
  }

  const dsaWeight = weights.dsa;
  let sdWeight = weights.sd - 10;
  if (isLastWeek) sdWeight = 0;
  else if (isSdWeek) sdWeight = weights.sd + 15;
  const behWeight = isLastWeek ? 50 : weights.beh;
  const total = dsaWeight + sdWeight + behWeight;
  const rand = (di * 7 + wi * 3) % total;

  addMainTask(tasks, di, rand, dsaWeight, sdWeight, ctx);
  return { date: formatDate(date), label: formatDateLabel(date), tasks };
}

function getThemes(weeks: number): string[] {
  if (weeks <= 4) return WEEK_THEMES_4;
  if (weeks <= 8) return WEEK_THEMES_8;
  return WEEK_THEMES_12;
}

function buildPlan(config: PlanConfig): WeekPlan[] {
  const weeks = weeksUntil(config.interviewDate);
  const themes = getThemes(weeks);
  const numWeeks = Math.min(weeks, themes.length);
  const weights = COMPANY_DSA_WEIGHT[config.company] ?? COMPANY_DSA_WEIGHT['Other'];
  const pools = { dsa: [...DSA_TOPICS], sd: [...SD_TOPICS], beh: [...BEH_TOPICS], oop: [...OOP_TOPICS] };
  const idx = { dsa: 0, sd: 0, beh: 0, oop: 0 };
  const now = new Date();

  return Array.from({ length: numWeeks }, (_, wi) => {
    const weekNum = wi + 1;
    const isLastWeek = weekNum === numWeeks;
    const isSdWeek = weekNum > numWeeks * 0.5 && weekNum <= numWeeks * 0.8;
    const ctx: DayBuildContext = { wi, weekNum, numWeeks, isLastWeek, isSdWeek, weights, pools, idx, now };
    const days = Array.from({ length: 7 }, (__, di) => buildDay(di, ctx));
    return { weekNum, theme: themes[wi % themes.length] ?? `Week ${weekNum}`, days };
  });
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<DayTask['type'], { color: string; bg: string; border: string }> = {
  dsa:             { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)'   },
  'system-design': { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.2)'   },
  behavioral:      { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.2)'   },
  review:          { color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.2)'  },
  mock:            { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
  oop:             { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'   },
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

  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fff', outline: 'none', cursor: 'pointer',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 8,
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Hero + config ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ paddingTop: 56, marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            Personalized Prep
          </p>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12,
          }}>
            STUDY PLAN.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Personalized day-by-day prep schedule based on your target company, role, and interview date.
          </p>

          {/* Config form */}
          <div style={{ ...GLASS, borderRadius: 20, padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18, marginBottom: 24 }}>
              <div>
                <label htmlFor="sp-company" style={labelStyle}>Target Company</label>
                <select id="sp-company" value={config.company} onChange={(e) => setConfig((p) => ({ ...p, company: e.target.value }))} style={selectStyle}>
                  {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sp-role" style={labelStyle}>Role</label>
                <select id="sp-role" value={config.role} onChange={(e) => setConfig((p) => ({ ...p, role: e.target.value as PlanConfig['role'] }))} style={selectStyle}>
                  <option value="sde">SDE / Software Engineer</option>
                  <option value="sre">SRE / DevOps</option>
                  <option value="ds">Data Science / ML</option>
                  <option value="pm">Product Management</option>
                </select>
              </div>
              <div>
                <label htmlFor="sp-level" style={labelStyle}>Level</label>
                <select id="sp-level" value={config.level} onChange={(e) => setConfig((p) => ({ ...p, level: e.target.value as PlanConfig['level'] }))} style={selectStyle}>
                  <option value="entry">Entry / Fresher (0-2 yrs)</option>
                  <option value="mid">Mid-level (2-5 yrs)</option>
                  <option value="senior">Senior (5+ yrs)</option>
                </select>
              </div>
              <div>
                <label htmlFor="sp-date" style={labelStyle}>Interview Date</label>
                <input id="sp-date" type="date" min={minDateStr} max={maxDateStr} value={config.interviewDate} onChange={(e) => setConfig((p) => ({ ...p, interviewDate: e.target.value }))} style={selectStyle} />
                {weeksLeft !== null && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', marginTop: 6 }}>{weeksLeft} week{weeksLeft === 1 ? '' : 's'} to go</p>
                )}
              </div>
            </div>

            <motion.button
              onClick={generate}
              disabled={config.interviewDate === ''}
              whileHover={config.interviewDate !== '' ? { scale: 1.03, boxShadow: '0 0 28px rgba(232,33,39,0.4)' } : {}}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #e82127, #c41a1f)', border: 'none', borderRadius: 999,
                padding: '12px 28px', color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.14em', cursor: config.interviewDate !== '' ? 'pointer' : 'not-allowed',
                opacity: config.interviewDate !== '' ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name="auto_awesome" size={15} />
              Generate My Study Plan
            </motion.button>
          </div>
        </motion.div>

        {/* ── Plan display ── */}
        <AnimatePresence>
          {plan && generated && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Progress card */}
              <div style={{ ...GLASS, borderRadius: 18, padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Overall Progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>{completedCount}/{totalTasks} tasks · {progressPct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #818cf8, #c084fc)', borderRadius: 4 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 0, ...GLASS, borderRadius: 14, overflow: 'hidden' }}>
                  {[
                    { label: 'Weeks', value: String(plan.length) },
                    { label: 'Tasks',  value: String(totalTasks) },
                    { label: 'Done',   value: String(completedCount), color: '#818cf8' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: '12px 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', textAlign: 'center' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color: s.color ?? '#fff' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Week selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
                {plan.map((w, i) => (
                  <motion.button
                    key={w.weekNum}
                    onClick={() => setActiveWeek(i)}
                    whileHover={{ scale: 1.04 }}
                    style={{
                      flexShrink: 0, padding: '7px 16px', borderRadius: 999,
                      fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer',
                      background: i === activeWeek ? 'rgba(129,140,248,0.12)' : 'transparent',
                      border: i === activeWeek ? '1px solid rgba(129,140,248,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      color: i === activeWeek ? '#818cf8' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    Week {w.weekNum}
                  </motion.button>
                ))}
              </div>

              {/* Week content */}
              {currentWeek && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#818cf8', flexShrink: 0 }}>
                      {currentWeek.weekNum}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{currentWeek.theme}</h2>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {config.company} · {config.role.toUpperCase()} · {currentWeek.days[0]?.label} – {currentWeek.days[6]?.label}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {currentWeek.days.map((day) => (
                      <div key={day.date} style={{ ...GLASS, borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{day.label}</p>
                          {day.tasks.length === 0 && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>Rest</span>}
                        </div>
                        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {day.tasks.length === 0 ? (
                            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.2)' }}>
                              <Icon name="weekend" size={20} />
                              <p style={{ fontSize: 11, fontWeight: 700 }}>Take a break!</p>
                            </div>
                          ) : (
                            day.tasks.map((task, ti) => {
                              const taskKey = `${day.date}-${ti}`;
                              const done = completedTasks.has(taskKey);
                              const tc = TYPE_COLORS[task.type];
                              return (
                                <button
                                  key={taskKey}
                                  type="button"
                                  onClick={() => toggleTask(taskKey)}
                                  style={{
                                    width: '100%', textAlign: 'left', borderRadius: 10, border: done ? '1px solid rgba(74,222,128,0.2)' : `1px solid ${tc.border}`,
                                    padding: '8px 10px', background: done ? 'rgba(74,222,128,0.05)' : tc.bg,
                                    cursor: 'pointer', opacity: done ? 0.6 : 1, transition: 'opacity 0.15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                                    <Icon name={done ? 'check_circle' : task.icon} size={12} style={{ color: done ? '#4ade80' : tc.color, flexShrink: 0, marginTop: 1 }} filled={done} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4, color: done ? 'rgba(255,255,255,0.35)' : '#fff', textDecoration: done ? 'line-through' : 'none' }}>
                                        {task.topic}
                                      </p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: done ? 'rgba(255,255,255,0.2)' : tc.color }}>
                                          {TYPE_LABELS[task.type]}
                                        </span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>· {task.duration}m</span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                          {day.tasks.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{day.tasks.reduce((s, t) => s + t.duration, 0)}m total</span>
                              {day.tasks[0]?.link && (
                                <Link to={day.tasks[0].link} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
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
              <div style={{ ...GLASS, borderRadius: 18, padding: '18px 22px', marginTop: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Legend</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(Object.entries(TYPE_LABELS) as Array<[DayTask['type'], string]>).map(([type, label]) => {
                    const tc = TYPE_COLORS[type];
                    return (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, border: `1px solid ${tc.border}`, background: tc.bg, fontSize: 11, fontWeight: 700, color: tc.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
                        {label}
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    <Icon name="check_circle" size={11} style={{ color: '#4ade80' }} filled />
                    Click to mark done
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {!generated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ ...GLASS, borderRadius: 22, padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Icon name="calendar_month" size={28} style={{ color: '#818cf8' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Build your personalized roadmap</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 460, lineHeight: 1.7 }}>
              Select your target company and interview date above. EYF generates a day-by-day study plan weighted for that company's interview style.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' }}>
              {['Google (algo-first)', 'Amazon (LP-heavy)', 'Netflix (SD-first)'].map((c) => (
                <span key={c} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999 }}>{c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
