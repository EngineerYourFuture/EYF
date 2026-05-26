import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
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
  glow: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  tags: string[];
  recommended?: boolean;
  route?: string;
}

const SUBJECTS: SubjectDef[] = [
  {
    id: 'os',       icon: 'terminal',    title: 'Operating Systems',       glow: 'rgba(96,165,250,0.14)',  color: '#60a5fa',
    desc: 'Processes, threads, memory management, scheduling, and file systems. Essential for system-level interviews.',
    topicCount: 42, difficulty: 'Intermediate', estimatedHours: 18, tags: ['Processes', 'Memory', 'Scheduling', 'Deadlock'], recommended: true,
  },
  {
    id: 'dbms',     icon: 'storage',     title: 'Database Systems',        glow: 'rgba(192,132,252,0.14)', color: '#c084fc',
    desc: 'SQL mastery, normalization, indexing, transactions, ACID properties, and query optimization.',
    topicCount: 38, difficulty: 'Intermediate', estimatedHours: 16, tags: ['SQL', 'Normalization', 'Indexing', 'Transactions'], recommended: true,
  },
  {
    id: 'networks', icon: 'wifi',        title: 'Computer Networks',       glow: 'rgba(34,211,238,0.14)',  color: '#22d3ee',
    desc: 'OSI/TCP-IP model, routing, TCP vs UDP, HTTP/HTTPS, DNS, sockets, and network security basics.',
    topicCount: 35, difficulty: 'Intermediate', estimatedHours: 14, tags: ['TCP/IP', 'HTTP', 'DNS', 'Routing'],
  },
  {
    id: 'oop',      icon: 'code_blocks', title: 'Object-Oriented Design',  glow: 'rgba(74,222,128,0.14)',  color: '#4ade80',
    desc: 'Encapsulation, inheritance, polymorphism, SOLID principles, and 23 classic design patterns.',
    topicCount: 28, difficulty: 'Foundational', estimatedHours: 10, tags: ['SOLID', 'Design Patterns', 'UML', 'Principles'], route: '/app/oop',
  },
  {
    id: 'sd',       icon: 'architecture',title: 'System Design',           glow: 'rgba(251,146,60,0.14)',  color: '#fb923c',
    desc: 'Scalability, load balancing, caching, CDNs, databases at scale, microservices, and real-world case studies.',
    topicCount: 24, difficulty: 'Advanced', estimatedHours: 22, tags: ['Scalability', 'Caching', 'Microservices', 'CDN'], route: '/app/system-design',
  },
  {
    id: 'cybersecurity', icon: 'security', title: 'Cybersecurity',         glow: 'rgba(248,113,113,0.14)', color: '#f87171',
    desc: 'Cryptography, authentication, OWASP Top 10, network security, CTF skills, and secure coding practices.',
    topicCount: 30, difficulty: 'Intermediate', estimatedHours: 14, tags: ['Cryptography', 'OWASP', 'Auth', 'CTF'], route: '/app/cybersecurity',
  },
  {
    id: 'discrete', icon: 'calculate',   title: 'Discrete Mathematics',    glow: 'rgba(250,204,21,0.14)',  color: '#facc15',
    desc: 'Graph theory, combinatorics, logic, proofs, and probability — the mathematical backbone of CS.',
    topicCount: 32, difficulty: 'Foundational', estimatedHours: 12, tags: ['Graph Theory', 'Combinatorics', 'Logic', 'Proofs'],
  },
  {
    id: 'compilers', icon: 'data_object', title: 'Compilers & Languages',  glow: 'rgba(244,114,182,0.14)', color: '#f472b6',
    desc: 'Lexing, parsing, ASTs, type systems, runtime environments, and language design fundamentals.',
    topicCount: 20, difficulty: 'Advanced', estimatedHours: 16, tags: ['Parsing', 'AST', 'Type Systems', 'Runtime'],
  },
];

const DIFFICULTY_COLOR: Record<string, { color: string; bg: string }> = {
  Foundational: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  Intermediate: { color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  Advanced:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const STUDY_PATH = ['oop', 'discrete', 'os', 'dbms', 'networks', 'cybersecurity', 'sd', 'compilers'];

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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
    if (!session?.accessToken) {
      const raf = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(raf);
    }
    apiRequest<{ subjects: SubjectProgress[] }>('/subjects/progress', { token: session.accessToken })
      .then((d) => {
        const map: Record<string, SubjectProgress> = {};
        for (const s of d.subjects) map[s.subjectId] = s;
        setProgressMap(map);
      })
      .catch(() => {
        setProgressMap({
          os:    { subjectId: 'os',    completedTopics: 15, progress: 35, lastAccessedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          dbms:  { subjectId: 'dbms',  completedTopics: 8,  progress: 20, lastAccessedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
          oop:   { subjectId: 'oop',   completedTopics: 14, progress: 50, lastAccessedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
          networks:     { subjectId: 'networks',     completedTopics: 5, progress: 15 },
          sd:           { subjectId: 'sd',           completedTopics: 3, progress: 12 },
          cybersecurity:{ subjectId: 'cybersecurity',completedTopics: 0, progress: 0 },
          discrete:     { subjectId: 'discrete',     completedTopics: 0, progress: 0 },
          compilers:    { subjectId: 'compilers',    completedTopics: 0, progress: 0 },
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
    .sort((a, b) => new Date(progressMap[b.id]?.lastAccessedAt ?? 0).getTime() - new Date(progressMap[a.id]?.lastAccessedAt ?? 0).getTime())[0];

  const nextInPath = STUDY_PATH.find((id) => (progressMap[id]?.progress ?? 0) < 100);
  const nextSubject = SUBJECTS.find((s) => s.id === nextInPath);

  const filtered = SUBJECTS.filter((s) => {
    const prog = progressMap[s.id]?.progress ?? 0;
    if (filter === 'in_progress') return prog > 0 && prog < 100;
    if (filter === 'not_started') return prog === 0;
    if (filter === 'completed') return prog === 100;
    return true;
  });

  function goToSubject(sub: SubjectDef) {
    navigate(sub.route ?? `/app/subjects/${sub.id}`);
  }

  function handleStartTopic() {
    fireXP(10, 'Topic completed!');
    if (nextSubject) goToSubject(nextSubject);
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl mx-auto">
        <PageHeader
          eyebrow="CS Fundamentals"
          title="Core Subjects."
          subtitle="Master the CS fundamentals that top companies interview on — OS, DBMS, Networks, and more."
          accentColor="#4ade80"
          stats={!loading ? [
            { value: `${masteryScore}%`, label: 'Overall Mastery', color: '#E82127' },
            { value: `${completedTotal}/${totalTopics}`, label: 'Topics Done', color: '#4ade80' },
            { value: `~${totalHoursLeft}h`, label: 'Hours Left', color: '#facc15' },
          ] : undefined}
        />

        {/* Stats row - now in PageHeader, keeping for compatibility */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" style={{ display: 'none' }}>
            {[
              { icon: 'school',    label: 'Overall Mastery',  value: `${masteryScore}%`,           color: '#E82127', glow: 'rgba(232,25,44,0.15)' },
              { icon: 'task_alt',  label: 'Topics Done',      value: `${completedTotal}/${totalTopics}`, color: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
              { icon: 'schedule',  label: 'Hours Remaining',  value: `~${totalHoursLeft}h`,         color: '#facc15', glow: 'rgba(250,204,21,0.15)' },
              { icon: 'bolt',      label: "Today's Goal",     value: `${topicsToday}/${dailyGoal}`, color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="p-5 flex items-center gap-3"
                style={GLASS}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ boxShadow: `0 8px 32px ${s.glow}` }}
              >
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: s.glow }}>
                  <Icon name={s.icon} size={20} filled={s.icon === 'bolt' || s.icon === 'task_alt'} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Mastery progress bar */}
        {!loading && (
          <motion.div
            className="p-5 mb-8"
            style={GLASS}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="workspace_premium" size={18} filled style={{ color: '#E82127' }} />
                <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>CS Mastery Progress</span>
              </div>
              <span className="text-xs font-bold" style={{ color: '#E82127' }}>{masteryScore}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #E82127, #ff5566)', boxShadow: '0 0 12px rgba(232,25,44,0.4)' }}
                initial={{ width: 0 }}
                animate={{ width: `${masteryScore}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>Beginner</span>
              <span className="text-[10px] font-bold" style={{ color: '#facc15' }}>Intermediate — 40%</span>
              <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>Expert — 80%</span>
            </div>
          </motion.div>
        )}

        {/* Continue / Next in path */}
        {!loading && (lastActive || nextSubject) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {lastActive && (progressMap[lastActive.id]?.progress ?? 0) > 0 && (progressMap[lastActive.id]?.progress ?? 0) < 100 && (
              <motion.button
                type="button"
                onClick={() => goToSubject(lastActive)}
                className="p-5 text-left"
                style={{ ...GLASS, borderColor: `${lastActive.color}30` }}
                whileHover={{ background: 'rgba(255,255,255,0.06)', boxShadow: `0 8px 32px ${lastActive.glow}`, scale: 1.01 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: lastActive.color }}>Continue Learning</span>
                  <Icon name="arrow_forward" size={12} style={{ color: lastActive.color }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: lastActive.glow }}>
                    <Icon name={lastActive.icon} size={20} style={{ color: lastActive.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{lastActive.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{progressMap[lastActive.id]?.completedTopics} of {lastActive.topicCount} topics done</p>
                  </div>
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={lastActive.color}
                        strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${(progressMap[lastActive.id]?.progress ?? 0) * 0.942} 94.2`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {progressMap[lastActive.id]?.progress ?? 0}%
                    </span>
                  </div>
                </div>
              </motion.button>
            )}

            {nextSubject && (
              <motion.button
                type="button"
                onClick={handleStartTopic}
                className="p-5 text-left"
                style={GLASS}
                whileHover={{ background: 'rgba(255,255,255,0.06)', boxShadow: `0 8px 32px ${nextSubject.glow}`, scale: 1.01 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Recommended Next</span>
                  <Icon name="recommend" size={12} filled style={{ color: 'var(--t3)' }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: nextSubject.glow }}>
                    <Icon name={nextSubject.icon} size={20} style={{ color: nextSubject.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{nextSubject.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>~{nextSubject.estimatedHours}h · {nextSubject.difficulty}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,25,44,0.12)', border: '1px solid rgba(232,25,44,0.2)' }}>
                    <Icon name="play_arrow" size={16} filled style={{ color: '#E82127' }} />
                  </div>
                </div>
              </motion.button>
            )}
          </div>
        )}

        {/* Study path hint */}
        <div className="p-4 mb-8 flex items-center gap-3" style={GLASS}>
          <Icon name="route" size={18} style={{ color: '#E82127' }} />
          <p className="text-sm" style={{ color: 'var(--t2)' }}>
            <span className="font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Recommended path: </span>
            {STUDY_PATH.map((id) => SUBJECTS.find((s) => s.id === id)?.title).filter(Boolean).join(' → ')}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {([
              { key: 'all',         label: 'All' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'not_started', label: 'Not Started' },
              { key: 'completed',   label: 'Completed' },
            ] as const).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all"
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: filter === f.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === f.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-bold ml-auto" style={{ color: 'var(--t3)' }}>{filtered.length} subject{filtered.length === 1 ? '' : 's'}</span>
        </div>

        {/* Subject grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map((n) => (
              <div key={`skeleton-${n}`} className="h-64 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((sub, i) => {
              const prog = progressMap[sub.id]?.progress ?? 0;
              const done = progressMap[sub.id]?.completedTopics ?? 0;
              const diffStyle = DIFFICULTY_COLOR[sub.difficulty];
              const isCompleted = prog === 100;
              const isInProgress = prog > 0 && prog < 100;
              let btnLabel: string;
              if (isCompleted) { btnLabel = 'Review'; }
              else if (isInProgress) { btnLabel = 'Continue'; }
              else { btnLabel = 'Start Learning'; }

              return (
                <motion.button
                  key={sub.id}
                  type="button"
                  className="p-6 flex flex-col text-left w-full"
                  style={GLASS}
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    background: 'rgba(255,255,255,0.05)',
                    borderColor: `${sub.color}35`,
                    boxShadow: `0 12px 40px ${sub.glow}`,
                    y: -2,
                  }}
                  onClick={() => goToSubject(sub)}
                >
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 flex items-center justify-center" style={{ background: sub.glow }}>
                      <Icon name={sub.icon} size={24} style={{ color: sub.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.recommended && !isInProgress && !isCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: '#E82127', background: 'rgba(232,25,44,0.1)', border: '1px solid rgba(232,25,44,0.2)' }}>
                          Recommended
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: '#facc15', background: 'rgba(250,204,21,0.1)' }}>
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }}>
                          <Icon name="check_circle" size={10} filled />Done
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>{sub.title}</h3>
                  <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{sub.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {sub.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: 'var(--t3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-bold" style={{ color: 'var(--t3)' }}>
                    <span className="px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>{sub.difficulty}</span>
                    <span className="flex items-center gap-1"><Icon name="schedule" size={11} />~{sub.estimatedHours}h</span>
                    <span className="flex items-center gap-1"><Icon name="topic" size={11} />{sub.topicCount} topics</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span style={{ color: 'var(--t3)' }}>{done}/{sub.topicCount} completed</span>
                      <span style={{ color: prog > 0 ? sub.color : 'rgba(255,255,255,0.28)' }}>{prog}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: prog > 0 ? sub.color : 'transparent', boxShadow: prog > 0 ? `0 0 8px ${sub.color}60` : 'none' }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${prog}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.05 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div
                    className="w-full py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {btnLabel}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Icon name="school" size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-bold mt-3" style={{ color: 'var(--t3)' }}>No subjects match this filter.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
