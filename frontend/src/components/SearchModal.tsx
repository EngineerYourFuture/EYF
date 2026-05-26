import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface SearchResult {
  title: string;
  subtitle: string;
  icon: string;
  path: string;
  color: string;
}

const ALL_ITEMS: SearchResult[] = [
  { title: 'DSA Problems',      subtitle: 'Algorithms & Data Structures', icon: 'code',              path: '/app/problems',       color: 'text-blue-400' },
  { title: 'OOP & Patterns',    subtitle: 'All 23 GoF design patterns',   icon: 'account_tree',      path: '/app/oop',            color: 'text-purple-400' },
  { title: 'Cybersecurity',     subtitle: 'OWASP, CTF challenges',        icon: 'shield',            path: '/app/cybersecurity',  color: 'text-red-400' },
  { title: 'System Design',     subtitle: 'Scalability & architecture',   icon: 'architecture',      path: '/app/system-design',  color: 'text-cyan-400' },
  { title: 'Core Subjects',     subtitle: 'OS, DBMS, Networks',           icon: 'auto_stories',      path: '/app/subjects',       color: 'text-green-400' },
  { title: 'Career Path',       subtitle: 'Structured learning tracks',   icon: 'route',             path: '/app/career',         color: 'text-pink-400' },
  { title: 'Placement Prep',    subtitle: 'Mock interviews & scenarios',  icon: 'work',              path: '/app/placement',      color: 'text-orange-400' },
  { title: 'Resume Builder',    subtitle: 'ATS-optimized resume',         icon: 'description',       path: '/app/resume',         color: 'text-yellow-400' },
  { title: 'Tech Skills',       subtitle: 'Languages, frameworks, cloud', icon: 'psychology',        path: '/app/skills',         color: 'text-teal-400' },
  { title: 'Expert Network',    subtitle: '1:1 sessions with engineers',  icon: 'workspace_premium', path: '/app/experts',        color: 'text-amber-400' },
  { title: 'Mentorship',        subtitle: 'Learn from senior engineers',  icon: 'groups',            path: '/app/mentorship',     color: 'text-pink-400' },
  { title: 'Community',         subtitle: 'Discuss and collaborate',      icon: 'forum',             path: '/app/community',      color: 'text-indigo-400' },
  { title: 'Leaderboard',       subtitle: 'Top engineers by XP',         icon: 'leaderboard',       path: '/app/leaderboard',    color: 'text-cyan-400' },
  { title: 'Achievements',      subtitle: 'Your badges and milestones',   icon: 'emoji_events',      path: '/app/achievements',   color: 'text-yellow-400' },
  { title: 'Visualizer',        subtitle: 'Step-by-step algorithm traces',icon: 'visibility',        path: '/app/visualizer',     color: 'text-lime-400' },
  { title: 'Cheat Sheets',     subtitle: 'Algorithm patterns, Big-O, System Design quick ref', icon: 'quick_reference_all', path: '/app/cheatsheets', color: 'text-cyan-400' },
  { title: 'Flashcards',      subtitle: 'Spaced repetition review for OS, DBMS, DSA, Security', icon: 'style', path: '/app/flashcards', color: 'text-purple-400' },
  { title: 'Upgrade to Pro',    subtitle: 'Unlock all features',          icon: 'rocket_launch',     path: '/plans',              color: 'text-[#E82127]' },
  { title: 'Mock Interview',     subtitle: 'Behavioral, DSA, System Design simulators', icon: 'record_voice_over', path: '/app/mock-interview', color: 'text-orange-400' },
  { title: 'Daily Challenge',   subtitle: 'One DSA/SD/behavioral problem per day — build a streak', icon: 'today', path: '/app/daily', color: 'text-[#E82127]' },
  { title: 'Pattern Quiz',      subtitle: 'Test your algorithm pattern recognition instinct', icon: 'quiz', path: '/app/pattern-quiz', color: 'text-indigo-400' },
  { title: 'Interview Roadmap', subtitle: 'Week-by-week structured plan for campus, FAANG, or backend roles', icon: 'map', path: '/app/roadmap', color: 'text-emerald-400' },
  { title: 'My Progress',       subtitle: 'XP chart, activity heatmap, subject completion, and rank', icon: 'insights', path: '/app/progress', color: 'text-blue-400' },
  { title: 'Study Plan',        subtitle: 'Personalized day-by-day interview prep schedule', icon: 'calendar_month', path: '/app/study-plan', color: 'text-indigo-400' },
  { title: 'Interview Tracker',      subtitle: 'Log applications, track rounds, celebrate offers', icon: 'track_changes', path: '/app/tracker', color: 'text-emerald-400' },
  { title: 'Placement Readiness',   subtitle: 'Your overall readiness %, skill gap analysis, 7-day improvement sprint', icon: 'speed', path: '/app/readiness', color: 'text-[#E82127]' },
  { title: 'My Notes',              subtitle: 'Personal study notes saved locally — tag by subject, pin important ones', icon: 'sticky_note_2', path: '/app/notes', color: 'text-yellow-400' },
  { title: 'Code Playground',       subtitle: 'Write and run JS, TS, Python, Java, C++, SQL — JS/TS runs locally, no server needed', icon: 'play_circle', path: '/app/playground', color: 'text-emerald-400' },
  { title: 'Skill Assessments',     subtitle: 'Test your JS, Python, SQL, React, OS, System Design — earn grade badges and XP', icon: 'fact_check', path: '/app/assessments', color: 'text-teal-400' },
  { title: 'Real-World Challenges', subtitle: 'Debug broken code, fix APIs, design schemas — skills that matter in your first job', icon: 'build', path: '/app/real-world', color: 'text-orange-400' },
  { title: 'Company Prep',          subtitle: 'Google, Amazon, Meta, Microsoft — focus topics, top problems, CTC data, tips', icon: 'business', path: '/app/companies', color: 'text-blue-400' },
  { title: 'Weekly Contests',        subtitle: '90-min timed contests every Sunday — 4 problems, global leaderboard, free', icon: 'emoji_events', path: '/app/contests', color: 'text-red-400' },
  { title: 'Interview Experiences', subtitle: 'Real reports from engineers — questions asked, tips, outcomes', icon: 'article', path: '/app/experiences', color: 'text-amber-400' },
  { title: 'Profile & Security',subtitle: 'Account settings & 2FA',      icon: 'manage_accounts',   path: '/app/profile',        color: 'text-zinc-400' },
  { title: 'Support',           subtitle: 'Get help',                     icon: 'help',              path: '/app/support',        color: 'text-zinc-400' },
];

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim()
    ? ALL_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_ITEMS.slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setQuery('');
      setSelected(0);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) go(results[selected].path);
      if (e.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [open, results, selected, go, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            role="none"
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl mx-4 overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(32px) saturate(160%)',
              boxShadow: '0 48px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            initial={{ opacity: 0, y: -20, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top red accent */}
            <div style={{
              height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.7) 40%, rgba(232,25,44,0.3) 70%, transparent)',
            }} />

            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Icon name="search" size={20} className="text-zinc-500 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search modules, tools, pages…"
                className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-600 focus:outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[10px] text-zinc-600 font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">No results for "{query}"</p>
              ) : (
                results.map((item, i) => (
                  <motion.button
                    key={item.path}
                    type="button"
                    onClick={() => go(item.path)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left"
                    style={{
                      background: i === selected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: i === selected ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                      boxShadow: i === selected ? '0 0 20px rgba(232,25,44,0.06)' : 'none',
                    }}
                    animate={{
                      background: i === selected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0)',
                    }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${item.color}`} style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--t1)' }} className="truncate">{item.title}</p>
                      <p className="text-zinc-500 text-xs truncate">{item.subtitle}</p>
                    </div>
                    {i === selected && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Icon name="arrow_forward" size={16} className="text-zinc-500 flex-shrink-0" />
                      </motion.div>
                    )}
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t4)' }}>
                {results.length} result{results.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-3 ml-auto" style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'JetBrains Mono, monospace' }}>
                <span>↑↓ navigate</span>
                <span>↵ open</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
