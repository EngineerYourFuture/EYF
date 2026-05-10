import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface HomeSummary {
  user: { plan: string; email: string };
  summary: { xp: number; streak: number; dsaDailyUsage: number; dsaDailyLimit: number | null };
}
interface ModulesStatus {
  items: Array<{ module: string; unlocked: boolean; progress: number; cta: string }>;
}

const MODULE_CONFIG: Record<string, { icon: string; title: string; desc: string; path: string }> = {
  dsa: { icon: 'data_object', title: 'DSA Mastery', desc: 'Algorithms, Data Structures & Complexity', path: '/app/problems' },
  'core-subjects': { icon: 'terminal', title: 'Core Subjects', desc: 'OS, DBMS, Computer Networks', path: '/app/subjects' },
  placement: { icon: 'work_history', title: 'Placement Prep', desc: 'FAANG-level mock scenarios', path: '/app/placement' },
  'resume-builder': { icon: 'description', title: 'Resume Builder', desc: 'ATS-optimized resume engineering', path: '/app/resume' },
  'tech-skills': { icon: 'psychology', title: 'Tech Skills', desc: 'Languages, frameworks, cloud', path: '/app/skills' },
  mentorship: { icon: 'groups', title: 'Mentorship', desc: 'Learn from industry engineers', path: '/app/mentorship' },
  visualizer: { icon: 'visibility', title: 'Visualizer', desc: 'Step-by-step algorithm traces', path: '/app/visualizer' },
};

function ProgressRing({ pct }: { pct: number }) {
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

  const xp = summary?.summary?.xp ?? 1200;
  const streak = summary?.summary?.streak ?? 7;
  const email = summary?.user?.email ?? session?.email ?? 'User';
  const name = email.split('@')[0];

  const moduleList = modules.length > 0 ? modules : Object.keys(MODULE_CONFIG).map((k) => ({ module: k, unlocked: true, progress: 0, cta: 'Start' }));

  return (
    <AppShell>
      <div className="pt-8">
        {/* Welcome + stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2 p-10 bg-surface-container rounded-xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary-container/20 transition-colors duration-700" />
            <h1 className="text-5xl font-black tracking-tighter mb-2 text-on-surface">
              Welcome back, <span className="text-primary-container capitalize">{name}</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md">
              Your momentum is building. Keep pushing.
            </p>
            <div className="flex gap-8 mt-10">
              <div className="flex flex-col">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant mb-1">Total XP</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-on-surface">{xp.toLocaleString()}</span>
                  <Icon name="bolt" className="text-primary-container" filled />
                </div>
              </div>
              <div className="flex flex-col border-l border-outline-variant/20 pl-8">
                <span className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant mb-1">Streak</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-on-surface">{streak} days</span>
                  <Icon name="local_fire_department" className="text-primary-container" filled />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-surface-container-high rounded-xl p-8 flex flex-col justify-between border-t border-white/5 shadow-[0_0_40px_-10px_rgba(232,33,39,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <h3 className="text-2xl font-bold leading-tight mb-4 text-on-surface">Next: Arrays Medium</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Based on your recent activity, refine your sliding window techniques.
              </p>
            </div>
            <Link to="/app/problems">
              <button className="w-full bg-primary-container text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(232,33,39,0.4)] transition-all">
                Resume Session
                <Icon name="arrow_forward" size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </section>

        {/* Module grid */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-8 ml-2">
          Learning Path
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleList.map((mod) => {
            const cfg = MODULE_CONFIG[mod.module] ?? { icon: 'apps', title: mod.module, desc: '', path: '/app/dashboard' };
            const pct = Math.round(mod.progress * 100);
            return (
              <div key={mod.module} className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors group">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center">
                    <Icon name={cfg.icon} className="text-primary" />
                  </div>
                  <ProgressRing pct={pct} />
                </div>
                <h4 className="text-xl font-bold mb-2">{cfg.title}</h4>
                <p className="text-sm text-on-surface-variant mb-8">{cfg.desc}</p>
                <Link to={cfg.path}>
                  <button className="text-primary-container font-bold flex items-center gap-2 text-sm group-hover:underline font-['Inter'] uppercase tracking-widest text-[10px]">
                    {mod.cta || 'Continue'}
                    <Icon name="play_arrow" size={16} />
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
