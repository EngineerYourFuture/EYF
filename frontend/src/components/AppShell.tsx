import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { EYFMark, EYFLogo } from './EYFLogo';
import { clearSession, getSession } from '../lib/session';
import { SearchModal } from './SearchModal';
import { NotificationsPanel, type Notification } from './NotificationsPanel';
import { useUser } from '../contexts/UserContext';
import { apiRequest } from '../lib/api';

interface NavItem { path: string; label: string; icon: string }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { path: '/app/dashboard', label: 'Dashboard',       icon: 'home' },
      { path: '/app/daily',     label: 'Daily Challenge', icon: 'today' },
      { path: '/app/career',    label: 'Career Path',     icon: 'route' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { path: '/app/problems',      label: 'DSA Problems',   icon: 'code' },
      { path: '/app/subjects',      label: 'Core Subjects',  icon: 'auto_stories' },
      { path: '/app/oop',           label: 'OOP & Patterns', icon: 'account_tree' },
      { path: '/app/cybersecurity', label: 'Cybersecurity',  icon: 'shield' },
      { path: '/app/system-design', label: 'System Design',  icon: 'architecture' },
      { path: '/app/visualizer',    label: 'Visualizer',     icon: 'visibility' },
      { path: '/app/playground',    label: 'Playground',     icon: 'play_circle' },
      { path: '/app/cheatsheets',   label: 'Cheat Sheets',   icon: 'quick_reference_all' },
      { path: '/app/flashcards',    label: 'Flashcards',     icon: 'style' },
      { path: '/app/pattern-quiz',  label: 'Pattern Quiz',      icon: 'quiz' },
      { path: '/app/assessments',   label: 'Skill Assessments', icon: 'fact_check' },
      { path: '/app/real-world',    label: 'Real-World',        icon: 'build' },
      { path: '/app/roadmap',       label: 'Roadmap',           icon: 'map' },
      { path: '/app/study-plan',    label: 'Study Plan',        icon: 'calendar_month' },
    ],
  },
  {
    label: 'Career',
    items: [
      { path: '/app/companies',     label: 'Company Prep',      icon: 'business' },
      { path: '/app/placement',     label: 'Placement',         icon: 'work' },
      { path: '/app/resume',        label: 'Resume',            icon: 'description' },
      { path: '/app/skills',        label: 'Tech Skills',       icon: 'psychology' },
      { path: '/app/mentorship',    label: 'Mentorship',        icon: 'groups' },
      { path: '/app/experts',       label: 'Expert Network',    icon: 'workspace_premium' },
      { path: '/app/mock-interview',label: 'Mock Interview',    icon: 'record_voice_over' },
      { path: '/app/tracker',       label: 'Interview Tracker', icon: 'track_changes' },
    ],
  },
  {
    label: 'Community',
    items: [
      { path: '/app/community',   label: 'Community',            icon: 'forum' },
      { path: '/app/leaderboard', label: 'Leaderboard',          icon: 'leaderboard' },
      { path: '/app/contests',    label: 'Weekly Contests',      icon: 'emoji_events' },
      { path: '/app/experiences', label: 'Interview Experiences', icon: 'article' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { path: '/app/readiness',    label: 'Readiness Score', icon: 'speed' },
      { path: '/app/progress',     label: 'Progress',        icon: 'insights' },
      { path: '/app/achievements', label: 'Achievements',    icon: 'emoji_events' },
      { path: '/app/notes',        label: 'My Notes',        icon: 'sticky_note_2' },
    ],
  },
];

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

export function AppShell({ children }: { readonly children: ReactNode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const session   = getSession();
  const { summary, displayName, plan } = useUser();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [shortcutsOpen,  setShortcutsOpen]  = useState(false);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [scrolled,       setScrolled]       = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ notifications: Notification[] }>('/notifications', { token: session.accessToken })
      .then((d) => { if (d.notifications) setNotifications(d.notifications); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (session?.accessToken) {
      apiRequest('/notifications/read-all', { token: session.accessToken, method: 'POST', body: {} }).catch(() => {});
    }
  }, [session?.accessToken]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    if (session?.accessToken) {
      apiRequest(`/notifications/${id}/read`, { token: session.accessToken, method: 'POST', body: {} }).catch(() => {});
    }
  }, [session?.accessToken]);

  const level     = summary?.level ?? 0;
  const xp        = summary?.xp ?? 0;
  const streak    = summary?.streak ?? 0;
  const currXP    = LEVEL_THRESHOLDS[level] ?? 0;
  const nextXP    = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS.at(-1)!;
  const xpPct     = nextXP > currXP ? Math.min(100, Math.round(((xp - currXP) / (nextXP - currXP)) * 100)) : 100;
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const initials  = displayName ? displayName[0].toUpperCase() : (session?.email?.[0]?.toUpperCase() ?? '?');

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '?' && !isInput) { e.preventDefault(); setShortcutsOpen((o) => !o); }
      if (e.key === 'Escape') { setSidebarOpen(false); setSearchOpen(false); setShortcutsOpen(false); }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const isPro = plan === 'pro' || plan === 'elite';

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {shortcutsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center"
          >
            <div role="none" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)} onKeyDown={(e) => { if (e.key === 'Escape') setShortcutsOpen(false); }} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative glass-heavy border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
                <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
                <button onClick={() => setShortcutsOpen(false)} className="w-7 h-7 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <Icon name="close" size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { label: 'Navigation', items: [
                    { keys: ['⌘', 'K'], desc: 'Open search' },
                    { keys: ['?'], desc: 'Toggle shortcuts' },
                    { keys: ['Esc'], desc: 'Close modal / panel' },
                  ]},
                  { label: 'Flashcards', items: [
                    { keys: ['Space'], desc: 'Flip card' },
                    { keys: ['1'], desc: 'Again (forgot)' },
                    { keys: ['2'], desc: 'Hard' },
                    { keys: ['3'], desc: 'Good' },
                    { keys: ['4'], desc: 'Easy' },
                  ]},
                  { label: 'Editor', items: [
                    { keys: ['↑', '↓'], desc: 'Navigate results' },
                    { keys: ['↵'], desc: 'Open selected' },
                    { keys: ['F11'], desc: 'Toggle fullscreen' },
                  ]},
                ].map((group) => (
                  <div key={group.label}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">{group.label}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.desc} className="flex items-center justify-between">
                          <span className="text-sm text-white/50">{item.desc}</span>
                          <div className="flex gap-1">
                            {item.keys.map((k) => (
                              <kbd key={k} className="px-2 py-1 glass rounded text-[11px] text-white/50 font-mono border border-white/10">{k}</kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5 text-[10px] text-white/20 text-center">Press <kbd className="glass px-1.5 rounded font-mono text-white/30">?</kbd> anytime</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 h-screen w-72 z-50 flex flex-col border-r border-white/5"
            style={{ background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8192C]/8 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <EYFMark size={30} className="text-[#080808] flex-shrink-0" />
                <div>
                  <h1 className="text-sm font-black text-white tracking-tight">EYF</h1>
                  <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mt-0.5">Engineer Your Future</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-full glass border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all"
                aria-label="Close menu"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* User card */}
            <Link
              to="/app/progress"
              className="mx-4 mt-4 mb-2 rounded-2xl p-4 border border-white/6 hover:border-white/12 transition-all duration-300 group block"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-xl bg-[#E8192C] flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg shadow-red-500/20">
                  {initials}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{displayName || 'Engineer'}</p>
                  <p className="text-[9px] text-white/30 font-semibold uppercase tracking-widest mt-0.5">
                    Lv.{level} · {levelName}
                  </p>
                </div>
                {streak > 0 && (
                  <div className="ml-auto flex items-center gap-1 flex-shrink-0 bg-orange-500/10 rounded-full px-2 py-0.5">
                    <span className="text-sm">🔥</span>
                    <span className="text-orange-400 text-xs font-black">{streak}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-semibold text-white/25 uppercase tracking-widest">
                  <span>{xp.toLocaleString()} XP</span>
                  <span>{xpPct}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #E8192C, #ff6b6b)' }}
                  />
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {NAV_GROUPS.map((group, gi) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: gi * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 px-3 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/nav ${
                            isActive
                              ? 'text-white'
                              : 'text-white/35 hover:text-white/70 hover:bg-white/4'
                          }`}
                          style={isActive ? { background: 'rgba(232, 25, 44, 0.12)' } : {}}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="nav-active"
                              className="nav-active-bar"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                          )}
                          <Icon
                            name={item.icon}
                            size={17}
                            className={`flex-shrink-0 transition-colors ${isActive ? 'text-[#E8192C]' : ''}`}
                          />
                          <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8192C] animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-6 pt-3 space-y-2 border-t border-white/5">
              {!isPro && (
                <Link
                  to="/plans"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-xs font-bold transition-all duration-200 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #E8192C, #ff4444)', boxShadow: '0 4px 20px rgba(232,25,44,0.3)' }}
                >
                  <Icon name="workspace_premium" size={14} />
                  Upgrade to Pro
                </Link>
              )}
              <div className="flex gap-1">
                <Link to="/app/support" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/4 transition-all text-[10px] font-semibold">
                  <Icon name="help" size={14} /> Help
                </Link>
                <Link to="/plans" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/4 transition-all text-[10px] font-semibold">
                  <Icon name="payments" size={14} /> Billing
                </Link>
                <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all text-[10px] font-semibold"
                >
                  <Icon name="logout" size={14} /> Exit
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Top header */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 h-14 px-4 md:px-6 flex items-center gap-3 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5' : ''
        }`}
        style={{
          background: scrolled ? 'rgba(8,8,8,0.85)' : 'rgba(8,8,8,0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl glass border border-white/8 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all duration-200 flex-shrink-0"
          aria-label="Open menu"
        >
          <Icon name="menu" size={18} />
        </button>

        {/* Logo hover */}
        <div className="relative group/logo flex-shrink-0">
          <span className="text-base font-black tracking-tight text-white cursor-default select-none">EYF</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 opacity-0 scale-90 pointer-events-none group-hover/logo:opacity-100 group-hover/logo:scale-100 transition-all duration-200 origin-top">
            <div className="rounded-2xl shadow-2xl border border-white/10 p-4" style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(40px)' }}>
              <EYFLogo animated size={150} />
            </div>
          </div>
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-md flex items-center gap-3 rounded-xl py-2 px-4 text-white/30 hover:text-white/50 hover:border-white/15 transition-all text-sm text-left border border-white/6 hover:bg-white/3"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <Icon name="search" size={16} className="flex-shrink-0" />
          <span className="flex-1 text-sm">Search EYF…</span>
          <kbd className="hidden sm:flex items-center text-[10px] glass px-2 py-0.5 rounded font-mono text-white/25 border border-white/8">⌘K</kbd>
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">
          {streak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 flex-shrink-0 border border-orange-500/20" style={{ background: 'rgba(249,115,22,0.08)' }}>
              <span className="text-sm">🔥</span>
              <span className="text-orange-400 font-black text-xs">{streak}d</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden md:flex w-8 h-8 rounded-lg glass border border-white/8 items-center justify-center text-white/30 hover:text-white/60 transition-colors font-black text-xs"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="w-9 h-9 rounded-xl glass border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all relative"
            >
              <Icon name="notifications" size={18} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8192C] rounded-full border-2 border-[#080808]"
                />
              )}
            </button>
            {notifOpen && (
              <NotificationsPanel
                notifications={notifications}
                onClose={() => setNotifOpen(false)}
                onMarkAllRead={markAllRead}
                onMarkRead={markRead}
              />
            )}
          </div>

          <Link to="/app/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-[#E8192C] flex items-center justify-center text-white text-sm font-black cursor-pointer shadow-lg shadow-red-500/20 relative overflow-hidden"
            >
              {initials}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            </motion.div>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="pt-14 min-h-screen px-4 md:px-8 pb-24 md:pb-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-white/5" style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-stretch h-16">
          {[
            { path: '/app/dashboard',  icon: 'home',         label: 'Home' },
            { path: '/app/problems',   icon: 'code',         label: 'Practice' },
            { path: '/app/subjects',   icon: 'auto_stories', label: 'Learn' },
            { path: '/app/community',  icon: 'forum',        label: 'Community' },
            { path: '/app/progress',   icon: 'insights',     label: 'Progress' },
          ].map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  isActive ? 'text-[#E8192C]' : 'text-white/25 hover:text-white/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8192C] rounded-full"
                    style={{ boxShadow: '0 0 8px rgba(232,25,44,0.8)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon name={item.icon} size={20} />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
