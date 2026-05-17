import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SkillArea {
  id: string;
  label: string;
  icon: string;
  score: number;        // 0–100
  maxScore: number;
  weight: number;       // % contribution to overall score
  status: 'strong' | 'moderate' | 'weak' | 'critical';
  insights: string[];
  action: { label: string; path: string };
}

interface SprintTask {
  day: number;
  title: string;
  type: 'practice' | 'learn' | 'mock' | 'review';
  path: string;
  done: boolean;
}

// ─── Score Engine ─────────────────────────────────────────────────────────────

function scoreToStatus(score: number): SkillArea['status'] {
  if (score >= 75) return 'strong';
  if (score >= 55) return 'moderate';
  if (score >= 35) return 'weak';
  return 'critical';
}

function computeOverall(areas: SkillArea[]): number {
  const total = areas.reduce((sum, a) => sum + a.weight, 0);
  const weighted = areas.reduce((sum, a) => sum + (a.score / a.maxScore) * a.weight, 0);
  return Math.round((weighted / total) * 100);
}

// ─── Static Data (backed by localStorage signals) ────────────────────────────

function buildReadinessData(): SkillArea[] {
  // Read local signals
  const roadmapDone: string[]     = JSON.parse(localStorage.getItem('eyf.roadmap.done') ?? '[]');
  const assessScores: Record<string, number> = JSON.parse(localStorage.getItem('eyf.assessment.scores') ?? '{}');
  const trackerApps: unknown[]    = JSON.parse(localStorage.getItem('eyf.tracker.apps') ?? '[]');
  const streakRaw                 = Number.parseInt(localStorage.getItem('eyf.streak') ?? '0', 10);
  const xpRaw                     = Number.parseInt(localStorage.getItem('eyf.xp') ?? '0', 10);

  // Derive scores from real signals + realistic static defaults
  const dsaScore   = Math.min(100, Math.max(20, (roadmapDone.length * 4) + (xpRaw > 500 ? 20 : 0) + 15));
  const sqlScore   = assessScores['sql']    ?? 28;
  const systemScore = Math.min(100, Math.max(18, (xpRaw > 1000 ? 35 : 20) + (roadmapDone.length > 5 ? 15 : 0)));
  const oopScore   = assessScores['react']  ?? 42;
  const behavScore = trackerApps.length > 0 ? Math.min(85, 40 + trackerApps.length * 8) : 35;
  const consistScore = Math.min(100, streakRaw * 7 + (xpRaw > 200 ? 20 : 5));
  const aptScore   = 38;  // static for now — actual test integration later

  return [
    {
      id: 'dsa',
      label: 'Data Structures & Algorithms',
      icon: 'code',
      score: dsaScore,
      maxScore: 100,
      weight: 25,
      status: scoreToStatus(dsaScore),
      insights: dsaScore < 50
        ? ['Complete at least 50 problems across all difficulties', 'Focus on Arrays, Trees, and Graphs first', 'Practice 1 hard problem per week']
        : ['Good foundation — now target company-specific patterns', 'Solve 5 more system-design-adjacent problems', 'Practice under timed conditions (45 min per problem)'],
      action: { label: 'Practice DSA', path: '/app/problems' },
    },
    {
      id: 'sql',
      label: 'SQL & Databases',
      icon: 'storage',
      score: sqlScore,
      maxScore: 100,
      weight: 15,
      status: scoreToStatus(sqlScore),
      insights: sqlScore < 50
        ? ['SQL is tested in 80% of product company interviews', 'Start with JOINs, GROUP BY, and window functions', 'Take the SQL Skill Assessment to benchmark yourself']
        : ['Strong SQL — practice query optimization and EXPLAIN', 'Learn indexing strategies and when to use which index'],
      action: { label: 'SQL Assessment', path: '/app/assessments' },
    },
    {
      id: 'system-design',
      label: 'System Design',
      icon: 'architecture',
      score: systemScore,
      maxScore: 100,
      weight: 20,
      status: scoreToStatus(systemScore),
      insights: systemScore < 40
        ? ['Critical gap — system design is asked in all SDE-II+ interviews', 'Learn CAP theorem, consistent hashing, and load balancing first', 'Study 2 case studies: URL shortener and Twitter feed']
        : ['Cover distributed databases and real-time systems', 'Practice end-to-end design in 40-minute mock sessions'],
      action: { label: 'System Design', path: '/app/system-design' },
    },
    {
      id: 'oop',
      label: 'OOP & Design Patterns',
      icon: 'account_tree',
      score: oopScore,
      maxScore: 100,
      weight: 10,
      status: scoreToStatus(oopScore),
      insights: oopScore < 50
        ? ['Design patterns appear in senior and Flipkart/Adobe interviews', 'Master SOLID principles before memorizing pattern names', 'Practice: Factory, Observer, Strategy, and Singleton first']
        : ['Learn structural patterns: Adapter, Decorator, Composite', 'Practice LLD: design a parking lot or library management system'],
      action: { label: 'OOP & Patterns', path: '/app/oop' },
    },
    {
      id: 'aptitude',
      label: 'Aptitude & Reasoning',
      icon: 'psychology',
      score: aptScore,
      maxScore: 100,
      weight: 10,
      status: scoreToStatus(aptScore),
      insights: [
        'Aptitude filters 60–70% of candidates in service companies (TCS, Infosys, Deloitte)',
        'Focus on: Time & Speed, Percentages, Number Series, Logical Reasoning',
        'Take 1 timed aptitude test per day for 2 weeks before OA season',
      ],
      action: { label: 'Skill Assessments', path: '/app/assessments' },
    },
    {
      id: 'behavioral',
      label: 'Behavioral & Communication',
      icon: 'record_voice_over',
      score: behavScore,
      maxScore: 100,
      weight: 10,
      status: scoreToStatus(behavScore),
      insights: behavScore < 50
        ? ['Track every application and interview in Interview Tracker', 'Prepare 3 strong STAR stories per Amazon Leadership Principle', 'Record yourself answering behavioral questions — watch it back']
        : ['You have good interview experience — now refine your narratives', 'Practice with a peer or use AI Mock Interview for feedback'],
      action: { label: 'Mock Interview', path: '/app/mock-interview' },
    },
    {
      id: 'consistency',
      label: 'Practice Consistency',
      icon: 'local_fire_department',
      score: consistScore,
      maxScore: 100,
      weight: 10,
      status: scoreToStatus(consistScore),
      insights: consistScore < 40
        ? ['Consistency is the #1 predictor of placement success', 'Start with a 30-minute daily commitment — non-negotiable', 'Use the Roadmap to get a structured daily checklist']
        : ['Strong habit — protect your streak during exam seasons', 'Increase to 60-90 minutes/day in the 4 weeks before OA season'],
      action: { label: 'My Roadmap', path: '/app/roadmap' },
    },
  ];
}

function buildSprintTasks(areas: SkillArea[]): SprintTask[] {
  // Find the 2 most critical areas and generate a 7-day sprint
  const sorted = [...areas].sort((a, b) => a.score - b.score);
  const [worst, second] = sorted;

  const taskTemplates: SprintTask[] = [
    { day: 1, title: `Assess your ${worst.label} baseline`, type: 'learn',    path: worst.action.path,   done: false },
    { day: 1, title: 'Review daily challenge',              type: 'practice', path: '/app/daily',        done: false },
    { day: 2, title: `Study weak ${worst.label} concepts`,  type: 'learn',    path: worst.action.path,   done: false },
    { day: 2, title: `Solve 3 ${worst.id.toUpperCase()} problems`, type: 'practice', path: '/app/problems', done: false },
    { day: 3, title: `${second.label} focus session`,       type: 'learn',    path: second.action.path,  done: false },
    { day: 3, title: 'Flashcard review — weak topics',      type: 'review',   path: '/app/flashcards',   done: false },
    { day: 4, title: 'Pattern Quiz — 15 questions',         type: 'practice', path: '/app/pattern-quiz', done: false },
    { day: 5, title: `${worst.label} assessment`,           type: 'mock',     path: '/app/assessments',  done: false },
    { day: 5, title: 'System Design case study',            type: 'learn',    path: '/app/system-design', done: false },
    { day: 6, title: 'AI Mock Interview (behavioral)',      type: 'mock',     path: '/app/mock-interview', done: false },
    { day: 7, title: 'Full re-assessment — track improvement', type: 'review', path: '/app/progress',    done: false },
    { day: 7, title: 'Update Interview Tracker',            type: 'review',   path: '/app/tracker',      done: false },
  ];

  // Load completion state
  const doneKey = `eyf.sprint.done.${new Date().toISOString().slice(0, 7)}`;
  const doneTasks: Set<number> = new Set(JSON.parse(localStorage.getItem(doneKey) ?? '[]'));
  return taskTemplates.map((t, i) => ({ ...t, done: doneTasks.has(i) }));
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const STATUS_META = {
  strong:   { label: 'Strong',   icon: 'verified',          bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  moderate: { label: 'Moderate', icon: 'trending_up',       bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   bar: 'bg-amber-400' },
  weak:     { label: 'Weak',     icon: 'warning',           bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400',  bar: 'bg-orange-400' },
  critical: { label: 'Critical', icon: 'error',             bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400',     bar: 'bg-red-500' },
};

const TASK_TYPE_META = {
  practice: { icon: 'code',               color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  learn:    { icon: 'auto_stories',       color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  mock:     { icon: 'record_voice_over',  color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  review:   { icon: 'fact_check',         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

function RadialScore({ score, size = 140 }: { readonly score: number; readonly size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  let color = '#ef4444';
  if (score >= 75) color = '#10b981';
  else if (score >= 55) color = '#f59e0b';
  else if (score >= 35) color = '#f97316';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f1f1f" strokeWidth={size * 0.08} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.08}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white" style={{ fontSize: size * 0.22 }}>{score}%</span>
        <span className="text-zinc-500" style={{ fontSize: size * 0.08 }}>READINESS</span>
      </div>
    </div>
  );
}

function SkillBar({ area }: { readonly area: SkillArea }) {
  const meta = STATUS_META[area.status];
  const pct = Math.round((area.score / area.maxScore) * 100);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border ${meta.border} ${meta.bg} overflow-hidden`}>
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center ${meta.text}`}>
            <Icon name={area.icon} className="text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{area.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.text}`}>
                {meta.label}
              </span>
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">{area.weight}% of total score</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-sm font-bold ${meta.text}`}>{pct}%</span>
            <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-zinc-600 text-lg" />
          </div>
        </div>
        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full ${meta.bar} rounded-full transition-all duration-1000`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div className="space-y-2">
            {area.insights.map((insight) => (
              <div key={insight} className="flex gap-2 text-xs text-zinc-400 leading-relaxed">
                <Icon name={area.status === 'strong' ? 'check_circle' : 'arrow_right'} className={`text-sm shrink-0 mt-0.5 ${meta.text}`} />
                <span>{insight}</span>
              </div>
            ))}
          </div>
          <Link
            to={area.action.path}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.text} hover:underline`}
          >
            <Icon name="arrow_forward" className="text-sm" />
            {area.action.label}
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReadinessPage() {
  useUser();
  const [areas,  setAreas]  = useState<SkillArea[]>([]);
  const [sprint, setSprint] = useState<SprintTask[]>([]);
  const [overall, setOverall] = useState(0);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const a = buildReadinessData();
    setAreas(a);
    setOverall(computeOverall(a));
    setSprint(buildSprintTasks(a));
  }, []);

  const sprintKey = `eyf.sprint.done.${new Date().toISOString().slice(0, 7)}`;

  function toggleTask(idx: number) {
    setSprint(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], done: !next[idx].done };
      const done = next.reduce((set: number[], t, i) => { if (t.done) { set.push(i); } return set; }, []);
      localStorage.setItem(sprintKey, JSON.stringify(done));
      return next;
    });
  }

  const strong   = areas.filter(a => a.status === 'strong');
  const critical = areas.filter(a => a.status === 'critical' || a.status === 'weak');

  let overallStatus = 'Getting Started';
  if (overall >= 75) overallStatus = 'Interview Ready';
  else if (overall >= 55) overallStatus = 'Getting There';
  else if (overall >= 35) overallStatus = 'Needs Work';

  let overallColor = 'text-red-400';
  if (overall >= 75) overallColor = 'text-emerald-400';
  else if (overall >= 55) overallColor = 'text-amber-400';
  else if (overall >= 35) overallColor = 'text-orange-400';

  let overallDesc = 'Strong profile. Target top companies and refine your narratives.';
  if (overall < 40) overallDesc = 'You are in the early stages. Follow the 7-day sprint below to close critical gaps fast.';
  else if (overall < 60) overallDesc = 'Good progress. Focus on your weakest 2 areas to unlock significant score gains.';
  else if (overall < 75) overallDesc = 'You are close to interview-ready. Tighten system design and behavioral gaps.';

  const sprintDays = Array.from(new Set(sprint.map(t => t.day))).sort((a, b) => a - b);
  const dayTasks = sprint.filter(t => t.day === activeDay);
  const sprintPct = sprint.length ? Math.round((sprint.filter(t => t.done).length / sprint.length) * 100) : 0;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Hero: Overall Score ── */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-3xl border border-white/8 p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RadialScore score={overall} size={160} />
            <div className="flex-1 text-center md:text-left">
              <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Placement Readiness</div>
              <h1 className={`text-3xl font-black mb-1 ${overallColor}`}>{overallStatus}</h1>
              <p className="text-zinc-500 text-sm mb-4">{overallDesc}</p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {strong.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs">
                    <span className="text-emerald-400 font-bold">✓ Strong:</span>
                    <span className="text-zinc-400 ml-1">{strong.map(a => a.label).join(', ')}</span>
                  </div>
                )}
                {critical.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs">
                    <span className="text-red-400 font-bold">⚠ Fix first:</span>
                    <span className="text-zinc-400 ml-1">{critical.slice(0, 2).map(a => a.label).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Score breakdown mini */}
            <div className="shrink-0 grid grid-cols-2 gap-2 w-full md:w-52">
              {areas.slice(0, 4).map(a => {
                const pct = Math.round((a.score / a.maxScore) * 100);
                const m = STATUS_META[a.status];
                return (
                  <div key={a.id} className={`${m.bg} border ${m.border} rounded-xl p-2.5`}>
                    <div className="text-[9px] text-zinc-600 mb-1 truncate">{a.label.split(' ')[0]}</div>
                    <div className={`text-base font-black ${m.text}`}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Gap Analysis ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Skill Gap Analysis</h2>
            <span className="text-xs text-zinc-600">Click any area to see insights + action plan</span>
          </div>
          <div className="space-y-3">
            {[...areas].sort((a, b) => a.score - b.score).map(area => (
              <SkillBar key={area.id} area={area} />
            ))}
          </div>
        </section>

        {/* ── 7-Day Improvement Sprint ── */}
        <section className="bg-[#1a1a1a] rounded-3xl border border-white/5 p-6">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">7-Day Improvement Sprint</h2>
              <p className="text-xs text-zinc-500">
                AI-generated action plan targeting your weakest areas.
                Complete tasks to improve your readiness score.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-black text-white">{sprintPct}%</div>
              <div className="text-[10px] text-zinc-600">completed</div>
            </div>
          </div>

          {/* Day tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {sprintDays.map(d => {
              const dayDone = sprint.filter(t => t.day === d && t.done).length;
              const dayTotal = sprint.filter(t => t.day === d).length;
              const allDone = dayDone === dayTotal;
              return (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    activeDay === d
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {allDone && <Icon name="check_circle" className="text-emerald-400 text-sm" />}
                  Day {d}
                  <span className={`text-[9px] ${allDone ? 'text-emerald-600' : 'text-zinc-700'}`}>
                    {dayDone}/{dayTotal}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tasks for selected day */}
          <div className="space-y-2">
            {dayTasks.map((task, _i) => {
              const globalIdx = sprint.indexOf(task);
              const m = TASK_TYPE_META[task.type];
              return (
                <div
                  key={`${task.day}-${task.title}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    task.done
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(globalIdx)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      task.done
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {task.done && <Icon name="check" className="text-white text-xs" />}
                  </button>

                  <div className={`w-6 h-6 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                    <Icon name={m.icon} className={`text-xs ${m.color}`} />
                  </div>

                  <span className={`flex-1 text-sm transition-colors ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                    {task.title}
                  </span>

                  {!task.done && (
                    <Link
                      to={task.path}
                      className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                    >
                      Start →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Recommended Actions ── */}
        <section>
          <h2 className="text-base font-bold text-white mb-4">Top Recommendations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: 'psychology',
                title: 'Take Skill Assessments',
                body: 'Get accurate baseline scores for JS, SQL, Python, and OS. Takes 10 min each.',
                path: '/app/assessments',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
              },
              {
                icon: 'architecture',
                title: 'Study 2 System Design Cases',
                body: 'URL shortener + Twitter feed. Learn CAP, consistent hashing, and load balancing.',
                path: '/app/system-design',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/20',
              },
              {
                icon: 'track_changes',
                title: 'Log Your Applications',
                body: 'Start tracking OAs and interviews. EYF detects patterns and recommends fixes.',
                path: '/app/tracker',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
              {
                icon: 'record_voice_over',
                title: 'Run a Mock Interview',
                body: 'Behavioral round for {critical[0]?.label ?? "your weakest area"}. 30-minute session.',
                path: '/app/mock-interview',
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/20',
              },
              {
                icon: 'business',
                title: 'Target Your Companies',
                body: 'See focus topics, top problems, and interview patterns for your dream companies.',
                path: '/app/companies',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
              },
              {
                icon: 'map',
                title: 'Follow Your Roadmap',
                body: 'Week-by-week structured plan — shows exactly what to do today, this week, this month.',
                path: '/app/roadmap',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
              },
            ].map((rec) => (
              <Link
                key={rec.path}
                to={rec.path}
                className={`${rec.bg} border ${rec.border} rounded-2xl p-4 flex gap-3 hover:border-white/20 transition-all group`}
              >
                <div className={`w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center ${rec.color} shrink-0`}>
                  <Icon name={rec.icon} className="text-base" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1 group-hover:underline">{rec.title}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{rec.body}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Score explanation ── */}
        <section className="bg-[#141414] rounded-2xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">How Your Score Is Calculated</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {areas.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs text-zinc-500">
                <Icon name={a.icon} className="text-sm text-zinc-700" />
                <span className="flex-1">{a.label}</span>
                <span className="text-zinc-700">{a.weight}% weight</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-700 mt-3 leading-relaxed">
            Scores are calculated from your assessment results, roadmap progress, streak, XP, and interview tracker data.
            Complete more activities to get a more accurate score.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
