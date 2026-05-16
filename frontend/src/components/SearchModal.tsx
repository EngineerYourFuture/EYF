import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { title: 'Study Plan',        subtitle: 'Personalized day-by-day interview prep schedule', icon: 'calendar_month', path: '/app/study-plan', color: 'text-indigo-400' },
  { title: 'Interview Tracker', subtitle: 'Log applications, track rounds, celebrate offers', icon: 'track_changes', path: '/app/tracker', color: 'text-emerald-400' },
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
    if (open) {
      setQuery('');
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, go, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <Icon name="search" size={20} className="text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, tools, pages…"
            className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No results for "{query}"</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${
                  i === selected ? 'bg-white/8' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <Icon name={item.icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{item.title}</p>
                  <p className="text-zinc-500 text-xs truncate">{item.subtitle}</p>
                </div>
                {i === selected && (
                  <Icon name="arrow_forward" size={16} className="text-zinc-500 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/8">
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3 ml-auto text-[10px] text-zinc-700 font-mono">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
