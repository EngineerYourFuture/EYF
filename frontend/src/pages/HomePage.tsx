import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface RecentAchievement { key: string; name: string; icon: string }
interface HomeSummary {
  user: { plan: string; email: string; name: string | null };
  summary: {
    xp: number;
    weeklyXp: number;
    streak: number;
    longestStreak: number;
    level: number;
    dsaDailyUsage: number;
    dsaDailyLimit: number | null;
    achievementsEarned: number;
    recentAchievements: RecentAchievement[];
  };
}
interface ModulesStatus {
  items: Array<{ module: string; unlocked: boolean; progress: number; cta: string }>;
}

const LEVEL_NAMES = ['Newcomer', 'Learner', 'Explorer', 'Builder', 'Practitioner', 'Engineer', 'Senior', 'Lead', 'Architect', 'Expert', 'Legend'];
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000, 100000];

const MODULE_CONFIG: Record<string, { icon: string; title: string; desc: string; path: string; color: string }> = {
  dsa:              { icon: 'data_object',       title: 'DSA Mastery',      desc: 'Algorithms, Data Structures & Complexity', path: '/app/problems',       color: 'text-blue-400' },
  'core-subjects':  { icon: 'terminal',          title: 'Core Subjects',    desc: 'OS, DBMS, Computer Networks',              path: '/app/subjects',       color: 'text-green-400' },
  oop:              { icon: 'account_tree',       title: 'OOP & Patterns',   desc: 'GoF patterns, SOLID, Architecture',        path: '/app/oop',            color: 'text-purple-400' },
  security:         { icon: 'shield',             title: 'Cybersecurity',    desc: 'OWASP, CTF Challenges, Certs',             path: '/app/security',       color: 'text-red-400' },
  'system-design':  { icon: 'architecture',       title: 'System Design',    desc: 'Scalability, Distributed Systems',         path: '/app/system-design',  color: 'text-cyan-400' },
  placement:        { icon: 'work_history',       title: 'Placement Prep',   desc: 'FAANG-level mock scenarios',               path: '/app/placement',      color: 'text-orange-400' },
  'resume-builder': { icon: 'description',        title: 'Resume Builder',   desc: 'ATS-optimized resume engineering',         path: '/app/resume',         color: 'text-yellow-400' },
  'tech-skills':    { icon: 'psychology',         title: 'Tech Skills',      desc: 'Languages, frameworks, cloud',             path: '/app/skills',         color: 'text-teal-400' },
  mentorship:       { icon: 'groups',             title: 'Mentorship',       desc: 'Learn from industry engineers',            path: '/app/mentorship',     color: 'text-pink-400' },
  experts:          { icon: 'workspace_premium',  title: 'Expert Network',   desc: '1:1 sessions with FAANG engineers',       path: '/app/experts',        color: 'text-amber-400' },
  community:        { icon: 'forum',              title: 'Community',        desc: 'Discuss, ask, and share knowledge',       path: '/app/community',      color: 'text-indigo-400' },
  visualizer:       { icon: 'visibility',         title: 'Visualizer',       desc: 'Step-by-step algorithm traces',           path: '/app/visualizer',     color: 'text-lime-400' },
};

function ProgressRing({ pct }: { readonly pct: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="transparent" stroke="#353535" strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="transparent" stroke="#e82127" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{pct}%</span>
    </div>
  );
}

export function HomePage() {
  const session = getSession();
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [modules, setModules] = useState<ModulesStatus['items']>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<HomeSummary>('/home/summary', { token: session.accessToken })
      .then(setSummary)
      .catch(() => {});
    apiRequest<ModulesStatus>('/modules/status', { token: session.accessToken })
      .then((d) => setModules(d.items))
      .catch(() => {});
  }, [session?.accessToken]);

  const xp = summary?.summary?.xp ?? 0;
  const weeklyXp = summary?.summary?.weeklyXp ?? 0;
  const streak = summary?.summary?.streak ?? 0;
  const level = summary?.summary?.level ?? 0;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const recentAchievements = summary?.summary?.recentAchievements ?? [];
  const achievementsEarned = summary?.summary?.achievementsEarned ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const currThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpPct = nextThreshold > currThreshold
    ? Math.min(100, Math.round(((xp - currThreshold) / (nextThreshold - currThreshold)) * 100))
    : 100;
  const email = summary?.user?.email ?? session?.email ?? 'User';
  const displayName = summary?.user?.name ?? email.split('@')[0];
  const name = displayName;

  const defaultModules = Object.keys(MODULE_CONFIG).map((k) => ({ module: k, unlocked: true, progress: 0, cta: 'Start' }));
  const moduleList = modules.length > 0
    ? [...modules, ...defaultModules.filter((d) => !modules.some((m) => m.module === d.module))]
    : defaultModules;

  return (
    <AppShell>
      <div className="pt-8">
        {/* Welcome + stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-10 bg-surface-container rounded-xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary-container/20 transition-colors duration-700" />
            <h1 className="text-5xl font-black tracking-tighter mb-2 text-on-surface">
              Welcome back, <span className="text-primary-container capitalize">{name}</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md">
              Your momentum is building. Keep pushing.
            </p>
            <div className="flex flex-wrap gap-8 mt-8">
              <div className="flex flex-col">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant mb-1">Total XP</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-on-surface">{xp.toLocaleString()}</span>
                  <Icon name="bolt" className="text-primary-container" filled />
                </div>
              </div>
              <div className="flex flex-col border-l border-outline-variant/20 pl-8">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant mb-1">This Week</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-on-surface">+{weeklyXp.toLocaleString()}</span>
                  <Icon name="trending_up" className="text-green-400" size={22} />
                </div>
              </div>
              <div className="flex flex-col border-l border-outline-variant/20 pl-8">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant mb-1">Streak</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-on-surface">{streak}d</span>
                  <Icon name="local_fire_department" className="text-orange-400" filled />
                </div>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant">
                  Lv.{level} {levelName}
                </span>
                <span className="text-[10px] font-bold text-zinc-500">{xpPct}% → {LEVEL_NAMES[level + 1] ?? 'Max'}</span>
              </div>
              <div className="h-1.5 w-full max-w-sm bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-red-400 rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right column: recommendation + recent achievements */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-high rounded-xl p-6 flex flex-col justify-between border-t border-white/5 shadow-[0_0_40px_-10px_rgba(232,33,39,0.15)] flex-1">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-tight mb-3 text-on-surface">Next: Arrays Medium</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                  Refine your sliding window techniques.
                </p>
              </div>
              <Link to="/app/problems">
                <button className="w-full bg-primary-container text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(232,33,39,0.4)] transition-all">
                  Resume Session
                  <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>

            {/* Recent achievements */}
            <div className="bg-surface-container rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">
                  Badges · {achievementsEarned} earned
                </span>
                <Link to="/app/achievements" className="text-[10px] font-bold text-primary-container hover:underline uppercase tracking-widest">
                  View all
                </Link>
              </div>
              {recentAchievements.length > 0 ? (
                <div className="flex gap-3">
                  {recentAchievements.map((a) => (
                    <div key={a.key} title={a.name} className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-xl border border-zinc-700 hover:scale-110 transition-transform cursor-default">
                      {a.icon}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">Solve problems to earn your first badge!</p>
              )}
            </div>
          </div>
        </section>

        {/* Career track CTA */}
        <div className="mb-8 bg-gradient-to-r from-surface-container to-surface-container-high rounded-xl p-6 flex items-center justify-between gap-4 border border-outline-variant/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center">
              <Icon name="route" className="text-primary-container" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pick Your Career Track</h3>
              <p className="text-xs text-on-surface-variant">Student · Working Professional · Industry Expert — get a personalized learning path</p>
            </div>
          </div>
          <Link to="/app/career">
            <button className="flex-shrink-0 bg-primary-container text-white font-bold py-2.5 px-5 rounded-full text-xs hover:brightness-110 transition-all flex items-center gap-2">
              Set Track <Icon name="arrow_forward" size={14} />
            </button>
          </Link>
        </div>

        {/* Module grid */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-8 ml-2">
          All Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {moduleList.map((mod) => {
            const cfg = MODULE_CONFIG[mod.module] ?? { icon: 'apps', title: mod.module, desc: '', path: '/app/dashboard', color: 'text-zinc-400' };
            const pct = Math.round(mod.progress * 100);
            return (
              <div key={mod.module} className="bg-surface-container rounded-xl p-7 hover:bg-surface-container-high transition-colors group relative overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-11 h-11 bg-surface-container-highest rounded-xl flex items-center justify-center">
                    <Icon name={cfg.icon} className={cfg.color} size={22} />
                  </div>
                  <ProgressRing pct={pct} />
                </div>
                <h4 className="text-base font-bold mb-1.5">{cfg.title}</h4>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">{cfg.desc}</p>
                <Link to={cfg.path}>
                  <button className={`${cfg.color} font-bold flex items-center gap-1.5 group-hover:underline font-['Inter'] uppercase tracking-widest text-[10px]`}>
                    {mod.cta || 'Continue'}
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
