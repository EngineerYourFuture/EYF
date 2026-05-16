import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
      { path: '/app/cheatsheets',   label: 'Cheat Sheets',   icon: 'quick_reference_all' },
      { path: '/app/flashcards',    label: 'Flashcards',     icon: 'style' },
      { path: '/app/pattern-quiz',  label: 'Pattern Quiz',   icon: 'quiz' },
      { path: '/app/study-plan',    label: 'Study Plan',     icon: 'calendar_month' },
    ],
  },
  {
    label: 'Career',
    items: [
      { path: '/app/placement',  label: 'Placement',     icon: 'work' },
      { path: '/app/resume',     label: 'Resume',        icon: 'description' },
      { path: '/app/skills',     label: 'Tech Skills',   icon: 'psychology' },
      { path: '/app/mentorship', label: 'Mentorship',    icon: 'groups' },
      { path: '/app/experts',       label: 'Expert Network', icon: 'workspace_premium' },
      { path: '/app/mock-interview', label: 'Mock Interview',  icon: 'record_voice_over' },
      { path: '/app/tracker',        label: 'Interview Tracker', icon: 'track_changes' },
    ],
  },
  {
    label: 'Community',
    items: [
      { path: '/app/community',   label: 'Community',   icon: 'forum' },
      { path: '/app/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { path: '/app/achievements', label: 'Achievements', icon: 'emoji_events' },
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

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Keyboard shortcuts: Cmd+K → search, ? → shortcuts, Escape → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '?' && !isInput) { e.preventDefault(); setShortcutsOpen((o) => !o); }
      if (e.key === 'Escape') { setSidebarOpen(false); setSearchOpen(false); setShortcutsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const isPro = plan === 'pro' || plan === 'elite';

  return (
    <div className="min-h-screen bg-surface text-on-surface dark">

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard shortcuts modal */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <h2 className="text-base font-black text-white">Keyboard Shortcuts</h2>
              <button onClick={() => setShortcutsOpen(false)} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
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
                { label: 'Search & Editor', items: [
                  { keys: ['↑', '↓'], desc: 'Navigate results' },
                  { keys: ['↵'], desc: 'Open selected' },
                  { keys: ['F11'], desc: 'Toggle code fullscreen' },
                ]},
              ].map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.desc} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">{item.desc}</span>
                        <div className="flex gap-1">
                          {item.keys.map((k) => (
                            <kbd key={k} className="px-2 py-1 bg-zinc-800 rounded text-[11px] text-zinc-300 font-mono border border-zinc-700">{k}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 text-[10px] text-zinc-700 text-center">Press <kbd className="bg-zinc-800 px-1.5 rounded font-mono text-zinc-500">?</kbd> anytime to toggle this panel</div>
          </div>
        </div>
      )}

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-[#1B1B1B] shadow-[40px_0_80px_-10px_rgba(0,0,0,0.6)] z-50 flex flex-col py-8 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EYFMark size={34} className="text-[#0E0E0E] flex-shrink-0" />
            <div>
              <h1 className="text-sm font-black text-white leading-none">EYF PLATFORM</h1>
              <p className="font-['Inter'] uppercase tracking-widest text-[9px] font-bold text-zinc-500 mt-0.5">Engineer Your Future</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all"
            aria-label="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mb-6 bg-[#252525] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#E82127] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{displayName || 'Engineer'}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                Lv.{level} · {levelName}
              </p>
            </div>
            {streak > 0 && (
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                <span className="text-orange-400 text-sm">🔥</span>
                <span className="text-orange-400 text-xs font-black">{streak}</span>
              </div>
            )}
          </div>
          {/* XP bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>{xp.toLocaleString()} XP</span>
              <span>{xpPct}% to Lv.{level + 1}</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E82127] to-red-400 rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="font-['Inter'] uppercase tracking-[0.25em] text-[9px] font-bold text-zinc-600 px-2 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:translate-x-0.5 ${
                        isActive
                          ? 'bg-[#E82127] text-white shadow-lg shadow-red-900/20'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#353535]'
                      }`}
                    >
                      <Icon name={item.icon} size={18} />
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-4 mt-4 space-y-3">
          {!isPro && (
            <Link
              to="/plans"
              className="block w-full bg-gradient-to-r from-[#E82127] to-red-500 text-white rounded-full py-3 px-6 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-center shadow-lg shadow-red-900/20 hover:brightness-110 transition-all active:scale-95"
            >
              ✦ Upgrade to Pro
            </Link>
          )}
          <div className="border-t border-zinc-800/50 pt-3 space-y-0.5">
            <Link to="/app/support" className="flex items-center gap-3 text-zinc-500 hover:text-zinc-200 px-4 py-2 transition-all rounded-xl hover:bg-[#353535]">
              <Icon name="help" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Support</span>
            </Link>
            <Link to="/plans" className="flex items-center gap-3 text-zinc-500 hover:text-zinc-200 px-4 py-2 transition-all rounded-xl hover:bg-[#353535]">
              <Icon name="payments" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Billing</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-3 text-zinc-500 hover:text-red-400 px-4 py-2 transition-all w-full text-left rounded-xl hover:bg-[#353535]"
            >
              <Icon name="logout" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#131313]/80 backdrop-blur-xl h-16 px-4 md:px-6 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all active:scale-95 flex-shrink-0"
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Logo */}
        <div className="relative group/logo mr-1 flex-shrink-0">
          <span className="text-lg font-black tracking-tighter text-white cursor-default select-none">EYF</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 opacity-0 scale-90 pointer-events-none group-hover/logo:opacity-100 group-hover/logo:scale-100 transition-all duration-200 origin-top">
            <div className="bg-[#0E0E0E] rounded-2xl shadow-2xl border border-white/10 p-4">
              <EYFLogo animated size={160} />
            </div>
          </div>
        </div>

        {/* Search trigger */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-lg flex items-center gap-3 bg-surface-container-low rounded-full py-2.5 px-4 text-zinc-600 hover:text-zinc-400 hover:bg-surface-container transition-all text-sm text-left group"
        >
          <Icon name="search" size={18} className="flex-shrink-0" />
          <span className="flex-1 text-sm">Search…</span>
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded font-mono group-hover:text-zinc-400 transition-colors">
            ⌘K
          </kbd>
        </button>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5 flex-shrink-0">
            <span className="text-sm">🔥</span>
            <span className="text-orange-400 font-black text-xs">{streak}d</span>
          </div>
        )}

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Keyboard shortcuts hint */}
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden md:flex w-8 h-8 rounded-full bg-surface-container-high items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors font-black text-xs"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative"
              aria-label="Notifications"
            >
              <Icon name="notifications" size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-container rounded-full border-2 border-surface" />
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
            <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Icon name="settings" size={20} />
            </button>
          </Link>
          <Link to="/app/profile">
            <div className="w-10 h-10 rounded-full border-2 border-[#E82127]/40 bg-[#E82127] flex items-center justify-center text-white text-sm font-black cursor-pointer hover:brightness-110 transition-all">
              {initials}
            </div>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="pt-16 min-h-screen px-4 md:px-10 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#131313]/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
        <div className="flex items-stretch h-16">
          {[
            { path: '/app/dashboard',  icon: 'home',         label: 'Home' },
            { path: '/app/problems',   icon: 'code',         label: 'Practice' },
            { path: '/app/subjects',   icon: 'auto_stories', label: 'Learn' },
            { path: '/app/community',  icon: 'forum',        label: 'Community' },
            { path: '/app/profile',    icon: 'person',       label: 'Profile' },
          ].map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-[#E82127]' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Icon name={item.icon} size={22} filled={isActive} />
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
