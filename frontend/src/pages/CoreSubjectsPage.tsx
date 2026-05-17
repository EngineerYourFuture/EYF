import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface SubjectProgress {
  subjectId: string;
  completedTopics: number;
  progress: number;
  lastAccessedAt?: string;
}

interface SubjectDef {
  id: string;
  icon: string;
  title: string;
  desc: string;
  topicCount: number;
  color: string;
  bg: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  tags: string[];
  recommended?: boolean;
  route?: string;
}

const SUBJECTS: SubjectDef[] = [
  {
    id: 'os',
    icon: 'terminal',
    title: 'Operating Systems',
    desc: 'Processes, threads, memory management, scheduling, and file systems. Essential for system-level interviews.',
    topicCount: 42,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    difficulty: 'Intermediate',
    estimatedHours: 18,
    tags: ['Processes', 'Memory', 'Scheduling', 'Deadlock'],
    recommended: true,
  },
  {
    id: 'dbms',
    icon: 'storage',
    title: 'Database Systems',
    desc: 'SQL mastery, normalization, indexing, transactions, ACID properties, and query optimization.',
    topicCount: 38,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    difficulty: 'Intermediate',
    estimatedHours: 16,
    tags: ['SQL', 'Normalization', 'Indexing', 'Transactions'],
    recommended: true,
  },
  {
    id: 'networks',
    icon: 'wifi',
    title: 'Computer Networks',
    desc: 'OSI/TCP-IP model, routing, TCP vs UDP, HTTP/HTTPS, DNS, sockets, and network security basics.',
    topicCount: 35,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    difficulty: 'Intermediate',
    estimatedHours: 14,
    tags: ['TCP/IP', 'HTTP', 'DNS', 'Routing'],
  },
  {
    id: 'oop',
    icon: 'code_blocks',
    title: 'Object-Oriented Design',
    desc: 'Encapsulation, inheritance, polymorphism, SOLID principles, and 23 classic design patterns.',
    topicCount: 28,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    difficulty: 'Foundational',
    estimatedHours: 10,
    tags: ['SOLID', 'Design Patterns', 'UML', 'Principles'],
    route: '/app/oop',
  },
  {
    id: 'sd',
    icon: 'architecture',
    title: 'System Design',
    desc: 'Scalability, load balancing, caching, CDNs, databases at scale, microservices, and real-world case studies.',
    topicCount: 24,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    difficulty: 'Advanced',
    estimatedHours: 22,
    tags: ['Scalability', 'Caching', 'Microservices', 'CDN'],
    route: '/app/system-design',
  },
  {
    id: 'cybersecurity',
    icon: 'security',
    title: 'Cybersecurity',
    desc: 'Cryptography, authentication, OWASP Top 10, network security, CTF skills, and secure coding practices.',
    topicCount: 30,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    difficulty: 'Intermediate',
    estimatedHours: 14,
    tags: ['Cryptography', 'OWASP', 'Auth', 'CTF'],
    route: '/app/cybersecurity',
  },
  {
    id: 'discrete',
    icon: 'calculate',
    title: 'Discrete Mathematics',
    desc: 'Graph theory, combinatorics, logic, proofs, and probability — the mathematical backbone of CS.',
    topicCount: 32,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    difficulty: 'Foundational',
    estimatedHours: 12,
    tags: ['Graph Theory', 'Combinatorics', 'Logic', 'Proofs'],
  },
  {
    id: 'compilers',
    icon: 'data_object',
    title: 'Compilers & Languages',
    desc: 'Lexing, parsing, ASTs, type systems, runtime environments, and language design fundamentals.',
    topicCount: 20,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    difficulty: 'Advanced',
    estimatedHours: 16,
    tags: ['Parsing', 'AST', 'Type Systems', 'Runtime'],
  },
];

const DIFFICULTY_META = {
  Foundational: { color: 'text-green-400', bg: 'bg-green-400/10' },
  Intermediate: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  Advanced:     { color: 'text-red-400',    bg: 'bg-red-400/10' },
};

const STUDY_PATH = ['oop', 'discrete', 'os', 'dbms', 'networks', 'cybersecurity', 'sd', 'compilers'];

export function CoreSubjectsPage() {
  const navigate = useNavigate();
  const { fireXP } = useUser();
  const session = getSession();

  const [progressMap, setProgressMap] = useState<Record<string, SubjectProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'not_started' | 'completed'>('all');
  const [dailyGoal] = useState(3);
  const [topicsToday] = useState(1);

  useEffect(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    apiRequest<{ subjects: SubjectProgress[] }>('/subjects/progress', { token: session.accessToken })
      .then((d) => {
        const map: Record<string, SubjectProgress> = {};
        for (const s of d.subjects) map[s.subjectId] = s;
        setProgressMap(map);
      })
      .catch(() => {
        // Fallback static progress
        setProgressMap({
          os:    { subjectId: 'os',    completedTopics: 15, progress: 35, lastAccessedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          dbms:  { subjectId: 'dbms',  completedTopics: 8,  progress: 20, lastAccessedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          oop:   { subjectId: 'oop',   completedTopics: 14, progress: 50, lastAccessedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
          networks: { subjectId: 'networks', completedTopics: 5, progress: 15 },
          sd:    { subjectId: 'sd',    completedTopics: 3,  progress: 12 },
          cybersecurity: { subjectId: 'cybersecurity', completedTopics: 0, progress: 0 },
          discrete: { subjectId: 'discrete', completedTopics: 0, progress: 0 },
          compilers: { subjectId: 'compilers', completedTopics: 0, progress: 0 },
        });
      })
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const totalTopics = SUBJECTS.reduce((s, sub) => s + sub.topicCount, 0);
  const completedTotal = SUBJECTS.reduce((s, sub) => s + (progressMap[sub.id]?.completedTopics ?? 0), 0);
  const masteryScore = Math.round((completedTotal / totalTopics) * 100);
  const totalHoursLeft = SUBJECTS.reduce((s, sub) => {
    const prog = progressMap[sub.id]?.progress ?? 0;
    return s + Math.round(sub.estimatedHours * (1 - prog / 100));
  }, 0);

  const lastActive = SUBJECTS
    .filter((s) => progressMap[s.id]?.lastAccessedAt)
    .sort((a, b) => {
      const aDate = new Date(progressMap[a.id]?.lastAccessedAt ?? 0).getTime();
      const bDate = new Date(progressMap[b.id]?.lastAccessedAt ?? 0).getTime();
      return bDate - aDate;
    })[0];

  const nextInPath = STUDY_PATH.find((id) => {
    const prog = progressMap[id]?.progress ?? 0;
    return prog < 100;
  });
  const nextSubject = SUBJECTS.find((s) => s.id === nextInPath);

  const filtered = SUBJECTS.filter((s) => {
    const prog = progressMap[s.id]?.progress ?? 0;
    if (filter === 'in_progress') return prog > 0 && prog < 100;
    if (filter === 'not_started') return prog === 0;
    if (filter === 'completed') return prog === 100;
    return true;
  });

  function goToSubject(sub: SubjectDef) {
    if (sub.route) {
      navigate(sub.route);
    } else {
      navigate(`/app/subjects/${sub.id}`);
    }
  }

  function handleStartTopic() {
    fireXP(10, 'Topic completed!');
    if (nextSubject) goToSubject(nextSubject);
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Core <span className="text-primary-container">Subjects.</span>
          </h1>
          <p className="text-on-surface-variant">
            Master the CS fundamentals that top companies interview on.
          </p>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: 'school', label: 'Overall Mastery', value: `${masteryScore}%`, color: 'text-primary-container' },
              { icon: 'task_alt', label: 'Topics Done', value: `${completedTotal}/${totalTopics}`, color: 'text-green-400' },
              { icon: 'schedule', label: 'Hours Remaining', value: `~${totalHoursLeft}h`, color: 'text-yellow-400' },
              { icon: 'bolt', label: 'Today\'s Goal', value: `${topicsToday}/${dailyGoal}`, color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container rounded-xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name={s.icon} className={s.color} size={20} filled={s.icon === 'bolt' || s.icon === 'task_alt'} />
                </div>
                <div>
                  <p className="text-xl font-black text-on-surface">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mastery progress bar */}
        {!loading && (
          <div className="bg-surface-container rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="workspace_premium" size={18} className="text-primary-container" filled />
                <span className="text-sm font-bold text-on-surface">CS Mastery Progress</span>
              </div>
              <span className="text-xs font-bold text-primary-container">{masteryScore}%</span>
            </div>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-blue-400 rounded-full transition-all duration-700"
                style={{ width: `${masteryScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-zinc-600 font-bold">Beginner</span>
              <span className="text-[10px] text-yellow-500 font-bold">Intermediate — 40%</span>
              <span className="text-[10px] text-green-500 font-bold">Expert — 80%</span>
            </div>
          </div>
        )}

        {/* Continue / Next in path */}
        {!loading && (lastActive || nextSubject) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {lastActive && progressMap[lastActive.id] && (progressMap[lastActive.id]?.progress ?? 0) > 0 && (progressMap[lastActive.id]?.progress ?? 0) < 100 && (
              <button
                type="button"
                onClick={() => goToSubject(lastActive)}
                className="bg-surface-container rounded-xl p-5 text-left hover:bg-surface-container-high transition-all group border border-surface-container-high hover:border-primary-container/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">Continue Learning</span>
                  <Icon name="arrow_forward" size={12} className="text-primary-container group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${lastActive.bg} rounded-xl flex items-center justify-center`}>
                    <Icon name={lastActive.icon} size={20} className={lastActive.color} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{lastActive.title}</p>
                    <p className="text-xs text-zinc-500">{progressMap[lastActive.id]?.completedTopics} of {lastActive.topicCount} topics done</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-12 h-12 relative">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="currentColor"
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(progressMap[lastActive.id]?.progress ?? 0) * 0.942} 94.2`}
                          className={lastActive.color}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-on-surface">
                        {progressMap[lastActive.id]?.progress ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {nextSubject && (
              <button
                type="button"
                onClick={handleStartTopic}
                className="bg-surface-container rounded-xl p-5 text-left hover:bg-surface-container-high transition-all group border border-surface-container-high hover:border-zinc-600"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recommended Next</span>
                  <Icon name="recommend" size={12} className="text-zinc-500" filled />
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${nextSubject.bg} rounded-xl flex items-center justify-center`}>
                    <Icon name={nextSubject.icon} size={20} className={nextSubject.color} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{nextSubject.title}</p>
                    <p className="text-xs text-zinc-500">~{nextSubject.estimatedHours}h · {nextSubject.difficulty}</p>
                  </div>
                  <div className="ml-auto w-8 h-8 bg-primary-container/10 rounded-full flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
                    <Icon name="play_arrow" size={16} className="text-primary-container" filled />
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Study path hint */}
        <div className="bg-surface-container rounded-xl p-4 mb-8 flex items-center gap-3">
          <Icon name="route" size={18} className="text-primary-container flex-shrink-0" />
          <p className="text-sm text-zinc-400">
            <span className="font-bold text-on-surface">Recommended path:</span>{' '}
            {STUDY_PATH.map((id) => SUBJECTS.find((s) => s.id === id)?.title).filter(Boolean).join(' → ')}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center p-1 bg-surface-container rounded-full">
            {([
              { key: 'all', label: 'All' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'not_started', label: 'Not Started' },
              { key: 'completed', label: 'Completed' },
            ] as const).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f.key ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-500 font-bold ml-auto">{filtered.length} subject{filtered.length === 1 ? '' : 's'}</span>
        </div>

        {/* Subject grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...new Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-64 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((sub) => {
              const prog = progressMap[sub.id]?.progress ?? 0;
              const done = progressMap[sub.id]?.completedTopics ?? 0;
              const diffMeta = DIFFICULTY_META[sub.difficulty];
              const isCompleted = prog === 100;
              const isInProgress = prog > 0 && prog < 100;
              let subBtnLabel = 'Start Learning';
              if (isCompleted) subBtnLabel = 'Review';
              else if (isInProgress) subBtnLabel = 'Continue';

              return (
                <button
                  key={sub.id}
                  type="button"
                  className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all group cursor-pointer flex flex-col text-left w-full"
                  onClick={() => goToSubject(sub)}
                >
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 ${sub.bg} rounded-xl flex items-center justify-center ${sub.color}`}>
                      <Icon name={sub.icon} size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.recommended && !isInProgress && !isCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Icon name="check_circle" size={10} filled /> Done
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary-container transition-colors">{sub.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4 flex-1">{sub.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {sub.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-surface-container-high px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-bold text-zinc-500">
                    <span className={`px-2 py-0.5 rounded-full ${diffMeta.color} ${diffMeta.bg}`}>{sub.difficulty}</span>
                    <span className="flex items-center gap-1"><Icon name="schedule" size={11} /> ~{sub.estimatedHours}h</span>
                    <span className="flex items-center gap-1"><Icon name="topic" size={11} /> {sub.topicCount} topics</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1.5">
                      <span>{done}/{sub.topicCount} completed</span>
                      <span className={prog > 0 ? sub.color : ''}>{prog}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${prog}%`, background: prog === 0 ? undefined : 'var(--color-primary-container)' }}
                      />
                    </div>
                  </div>

                  <div className="w-full py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-surface-container-high group-hover:bg-primary-container text-zinc-400 group-hover:text-white text-center">
                    {subBtnLabel}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Icon name="school" size={48} className="text-zinc-700 mx-auto mb-3" />
            <p className="font-bold text-zinc-500">No subjects match this filter.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
