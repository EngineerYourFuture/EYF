import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { EYFMark } from './EYFLogo';
import { clearSession, getSession } from '../lib/session';
import { SearchModal } from './SearchModal';
import { NotificationsPanel, type Notification } from './NotificationsPanel';
import { useUser } from '../contexts/UserContext';
import { apiRequest } from '../lib/api';
import { getTheme, toggleTheme, type ThemeMode } from '../lib/theme';

interface NavItem  { path: string; label: string; icon: string }
interface NavGroup { label: string; icon: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Home', icon: 'home',
    items: [
      { path: '/app/dashboard', label: 'Dashboard',       icon: 'home' },
      { path: '/app/daily',     label: 'Daily Challenge', icon: 'today' },
      { path: '/app/career',    label: 'Career Path',     icon: 'route' },
    ],
  },
  {
    label: 'Learn', icon: 'auto_stories',
    items: [
      { path: '/app/problems',      label: 'DSA Problems',      icon: 'code' },
      { path: '/app/subjects',      label: 'Core Subjects',     icon: 'auto_stories' },
      { path: '/app/oop',           label: 'OOP & Patterns',    icon: 'account_tree' },
      { path: '/app/cybersecurity', label: 'Cybersecurity',     icon: 'shield' },
      { path: '/app/system-design', label: 'System Design',     icon: 'architecture' },
      { path: '/app/visualizer',    label: 'Visualizer',        icon: 'visibility' },
      { path: '/app/playground',    label: 'Playground',        icon: 'play_circle' },
      { path: '/app/cheatsheets',   label: 'Cheat Sheets',      icon: 'quick_reference_all' },
      { path: '/app/flashcards',    label: 'Flashcards',        icon: 'style' },
      { path: '/app/pattern-quiz',  label: 'Pattern Quiz',      icon: 'quiz' },
      { path: '/app/assessments',   label: 'Skill Assessments', icon: 'fact_check' },
      { path: '/app/roadmap',       label: 'Roadmap',           icon: 'map' },
      { path: '/app/study-plan',    label: 'Study Plan',        icon: 'calendar_month' },
    ],
  },
  {
    label: 'Career', icon: 'business',
    items: [
      { path: '/app/companies',      label: 'Company Prep',      icon: 'business' },
      { path: '/app/placement',      label: 'Placement',         icon: 'work' },
      { path: '/app/resume',         label: 'Resume',            icon: 'description' },
      { path: '/app/skills',         label: 'Tech Skills',       icon: 'psychology' },
      { path: '/app/mentorship',     label: 'Mentorship',        icon: 'groups' },
      { path: '/app/experts',        label: 'Expert Network',    icon: 'workspace_premium' },
      { path: '/app/mock-interview', label: 'Mock Interview',    icon: 'record_voice_over' },
      { path: '/app/tracker',        label: 'Interview Tracker', icon: 'track_changes' },
    ],
  },
  {
    label: 'Community', icon: 'forum',
    items: [
      { path: '/app/community',   label: 'Community',             icon: 'forum' },
      { path: '/app/leaderboard', label: 'Leaderboard',           icon: 'leaderboard' },
      { path: '/app/contests',    label: 'Weekly Contests',       icon: 'emoji_events' },
      { path: '/app/experiences', label: 'Interview Experiences', icon: 'article' },
    ],
  },
  {
    label: 'Progress', icon: 'insights',
    items: [
      { path: '/app/readiness',    label: 'Readiness Score', icon: 'speed' },
      { path: '/app/progress',     label: 'Progress',        icon: 'insights' },
      { path: '/app/achievements', label: 'Achievements',    icon: 'emoji_events' },
      { path: '/app/notes',        label: 'My Notes',        icon: 'sticky_note_2' },
    ],
  },
];

const ALL_GROUPS_OPEN = Object.fromEntries(NAV_GROUPS.map((g) => [g.label, true]));

const LEVEL_NAMES      = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
const LEVEL_THRESHOLDS = [0,100,300,700,1500,3000,6000,12000,25000,50000,100000];

/* ── Nav link ──────────────────────────────────────────────────────────────── */
function NavLink({ item, isActive }: { readonly item: NavItem; readonly isActive: boolean }) {
  return (
    <Link to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="nav-active-bar"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <Icon
        name={item.icon}
        size={15}
        className={`flex-shrink-0 nav-icon transition-colors ${isActive ? 'text-[#E82127]' : ''}`}
      />
      <span>{item.label}</span>
    </Link>
  );
}

/* ── Keyboard shortcuts modal ──────────────────────────────────────────────── */
function ShortcutsModal({ onClose }: { readonly onClose: () => void }) {
  const groups = [
    { label: 'Navigation', items: [
      { keys: ['⌘', 'K'], desc: 'Open search' },
      { keys: ['?'],       desc: 'Toggle shortcuts' },
      { keys: ['Esc'],     desc: 'Close any modal' },
    ]},
    { label: 'Flashcards', items: [
      { keys: ['Space'], desc: 'Flip card' },
      { keys: ['1'],     desc: 'Again (forgot)' },
      { keys: ['2'],     desc: 'Hard' },
      { keys: ['3'],     desc: 'Good' },
      { keys: ['4'],     desc: 'Easy' },
    ]},
    { label: 'Editor', items: [
      { keys: ['↑', '↓'], desc: 'Navigate results' },
      { keys: ['↵'],      desc: 'Open selected' },
    ]},
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close shortcuts"
        className="absolute inset-0 w-full"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      />
      <motion.div
        className="shortcuts-modal relative w-full max-w-md mx-4 overflow-hidden"
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Keyboard Shortcuts</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--t3)' }}>
            <Icon name="close" size={15} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="nav-group-label mb-2.5">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--t3)' }}>{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k) => <kbd key={k}>{k}</kbd>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 text-center">
          <span className="text-xs" style={{ color: 'var(--t4)' }}>Press <kbd>?</kbd> anytime to toggle</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Sidebar collapsed icon rail ──────────────────────────────────────────── */
interface CollapsedRailProps {
  readonly location: { pathname: string };
  readonly onExpand: () => void;
}

function CollapsedRail({ location, onExpand }: CollapsedRailProps) {
  return (
    <>
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.6) 40%, rgba(232,25,44,0.6) 60%, transparent)', flexShrink: 0 }} />

      {/* Logo */}
      <div
        className="flex items-center justify-center"
        style={{ height: 56, borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0 }}
      >
        <div style={{ filter: 'drop-shadow(0 0 6px rgba(232,25,44,0.5))' }}>
          <EYFMark size={20} />
        </div>
      </div>

      {/* 5 group icons — one per section */}
      <nav className="flex-1 flex flex-col items-center justify-center gap-1 py-4">
        {NAV_GROUPS.map((group) => {
          const isGroupActive = group.items.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'),
          );
          return (
            <button
              key={group.label}
              type="button"
              onClick={onExpand}
              title={group.label}
              className="relative flex items-center justify-center transition-all"
              style={{
                width: 40, height: 40,
                color: isGroupActive ? '#E82127' : 'var(--t3)',
                background: isGroupActive ? 'rgba(232,25,44,0.1)' : 'transparent',
                border: isGroupActive ? '1px solid rgba(232,25,44,0.25)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isGroupActive) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--t1)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGroupActive) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--t3)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {isGroupActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 2, height: 20, background: '#E82127',
                  boxShadow: '2px 0 8px rgba(232,25,44,0.6)',
                }} />
              )}
              <Icon name={group.icon} size={18} />
            </button>
          );
        })}
      </nav>

      {/* Expand button */}
      <div
        className="flex items-center justify-center py-3"
        style={{ borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}
      >
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center justify-center transition-all"
          style={{ width: 40, height: 36, color: 'var(--t4)' }}
          title="Expand sidebar"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t4)'; }}
        >
          <Icon name="chevron_right" size={17} />
        </button>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: -20, left: '10%', right: '10%', height: 120,
          background: 'radial-gradient(ellipse, rgba(232,25,44,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
    </>
  );
}

/* ── Sidebar full body ─────────────────────────────────────────────────────── */
interface SidebarBodyProps {
  readonly location: { pathname: string };
  readonly level: number;
  readonly levelName: string;
  readonly xp: number;
  readonly xpPct: number;
  readonly streak: number;
  readonly displayName: string;
  readonly initials: string;
  readonly isPro: boolean;
  readonly showClose?: boolean;
  readonly onClose?: () => void;
  readonly onCollapse?: () => void;
  readonly onLogout: () => void;
  readonly openGroups: Record<string, boolean>;
  readonly onToggleGroup: (label: string) => void;
  readonly mounted: boolean;
}

function SidebarBody({
  location, level, levelName, xp, xpPct, streak, displayName, initials, isPro,
  showClose, onClose, onCollapse, onLogout, openGroups, onToggleGroup, mounted,
}: SidebarBodyProps) {
  return (
    <>
      {/* Top red accent line */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.6) 40%, rgba(232,25,44,0.6) 60%, transparent)', flexShrink: 0 }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div style={{ filter: 'drop-shadow(0 0 6px rgba(232,25,44,0.5))' }}>
            <EYFMark size={18} className="flex-shrink-0" />
          </div>
          <div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em', color: 'var(--t1)' }}>EYF</span>
            <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t4)', marginTop: 1 }}>
              Engineer Your Future
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Collapse button — only on desktop (not in mobile drawer) */}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="w-7 h-7 flex items-center justify-center transition-all"
              style={{ color: 'var(--t4)' }}
              title="Collapse sidebar"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t4)'; }}
            >
              <Icon name="chevron_left" size={15} />
            </button>
          )}
          {showClose && onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'var(--t3)' }}
              aria-label="Close menu"
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
      </div>

      {/* User profile card */}
      <Link
        to="/app/progress"
        className="mx-3 mt-3 mb-1 p-3 block transition-all"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        }}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="avatar avatar-sm">{initials}</div>
          <div className="min-w-0 flex-1">
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: 'var(--t1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName || 'Engineer'}
            </p>
            <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>
              Lv.{level} · {levelName}
            </p>
          </div>
          {streak > 0 && (
            <div className="streak-badge shrink-0">
              <span>🔥</span>
              <span>{streak}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between" style={{ fontSize: 9, color: 'var(--t4)', fontFamily: 'Space Grotesk', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>{xp.toLocaleString()} XP</span>
            <span>{xpPct}%</span>
          </div>
          <div className="xp-bar-track">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </Link>

      {/* Nav groups with accordion */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] ?? true;
          return (
            <div key={group.label} className="mb-1">
              <button
                type="button"
                onClick={() => onToggleGroup(group.label)}
                className="nav-group-label flex items-center justify-between w-full cursor-pointer"
                style={{ paddingRight: 2 }}
              >
                <span>{group.label}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', color: 'var(--t4)' }}
                >
                  <Icon name="keyboard_arrow_down" size={13} />
                </motion.span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    key={group.label}
                    initial={mounted ? { height: 0, opacity: 0 } : false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="space-y-0.5 pb-2">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return <NavLink key={item.path} item={item} isActive={isActive} />;
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-3 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {!isPro && (
          <Link
            to="/plans"
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 transition-all"
            style={{
              background: 'var(--red)',
              color: '#000',
              fontFamily: 'Space Grotesk',
              fontWeight: 800,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '0 4px 20px rgba(232,25,44,0.35)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(232,25,44,0.5)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(232,25,44,0.35)'; }}
          >
            <Icon name="workspace_premium" size={14} />
            Upgrade to Pro
          </Link>
        )}
        <div className="flex gap-1">
          <Link to="/app/support" className="btn btn-ghost btn-sm flex-1 justify-center">
            <Icon name="help" size={14} /> Help
          </Link>
          <Link to="/plans" className="btn btn-ghost btn-sm flex-1 justify-center">
            <Icon name="payments" size={14} /> Plans
          </Link>
          <button onClick={onLogout} className="btn btn-ghost btn-sm flex-1 justify-center" style={{ color: 'var(--t3)' }}>
            <Icon name="logout" size={14} /> Out
          </button>
        </div>
      </div>

      {/* Ambient red glow at bottom */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: -20, left: '20%', right: '20%', height: 120,
          background: 'radial-gradient(ellipse, rgba(232,25,44,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
    </>
  );
}

/* ── App Shell ─────────────────────────────────────────────────────────────── */
const SIDEBAR_TRANSITION = 'width 0.25s cubic-bezier(0.16,1,0.3,1)';

export function AppShell({ children }: { readonly children: ReactNode }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const session   = getSession();
  const { summary, displayName, plan } = useUser();

  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('eyf.sidebar') === 'true');
  const [openGroups,      setOpenGroups]      = useState<Record<string, boolean>>(ALL_GROUPS_OPEN);
  const [mounted,         setMounted]         = useState(false);
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [shortcutsOpen,   setShortcutsOpen]   = useState(false);
  const [notifications,   setNotifications]   = useState<Notification[]>([]);
  const [scrolled,        setScrolled]        = useState(false);
  const [theme,           setThemeState]      = useState<ThemeMode>(getTheme);

  useEffect(() => { setMounted(true); }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('eyf.sidebar', String(next));
      return next;
    });
  }, []);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? true) }));
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
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
  const isPro     = plan === 'pro' || plan === 'elite';

  // Close mobile sidebar on navigation
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '?' && !isInput) { e.preventDefault(); setShortcutsOpen((o) => !o); }
      if (e.key === 'Escape') { setSidebarOpen(false); setSearchOpen(false); setShortcutsOpen(false); setNotifOpen(false); }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [navigate]);

  const sidebarBodyProps: SidebarBodyProps = {
    location,
    level,
    levelName,
    xp,
    xpPct,
    streak,
    displayName: displayName ?? '',
    initials,
    isPro,
    onLogout: logout,
    openGroups,
    onToggleGroup: toggleGroup,
    mounted,
  };

  const SIDEBAR_STYLE = {
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-border)',
    boxShadow: '8px 0 48px rgba(0,0,0,0.4)',
  } as const;

  const desktopWidth = sidebarCollapsed ? 56 : 256;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--t1)' }}
      data-sidebar-collapsed={String(sidebarCollapsed)}
    >
      {/* Film grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9998]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
          mixBlendMode: 'overlay',
        }}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <AnimatePresence>
        {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      </AnimatePresence>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen z-30 flex-col overflow-hidden"
        style={{ ...SIDEBAR_STYLE, width: desktopWidth, transition: SIDEBAR_TRANSITION }}
      >
        {sidebarCollapsed
          ? <CollapsedRail location={location} onExpand={toggleSidebarCollapsed} />
          : <SidebarBody {...sidebarBodyProps} showClose={false} onCollapse={toggleSidebarCollapsed} />
        }
      </aside>

      {/* ── Mobile sidebar backdrop ────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            aria-hidden="true"
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 h-screen w-64 z-50 flex flex-col lg:hidden"
            style={SIDEBAR_STYLE}
          >
            <SidebarBody
              {...sidebarBodyProps}
              showClose
              onClose={() => setSidebarOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header
        className="shell-header fixed top-0 left-0 right-0 z-40 h-14 px-4 md:px-6 flex items-center gap-3"
        style={{
          background: scrolled ? 'var(--header-bg-scrolled)' : 'var(--header-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid var(--header-border)',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Header top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.4) 30%, rgba(232,25,44,0.4) 70%, transparent)',
        }} />

        {/* Menu button — mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-8 h-8 flex items-center justify-center transition-all lg:hidden"
          style={{ color: 'var(--t3)', border: '1px solid var(--border)', borderRadius: 0 }}
          aria-label="Open menu"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; (e.currentTarget as HTMLElement).style.background = 'var(--border)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Icon name="menu" size={16} />
        </button>

        {/* Logo — mobile only */}
        <Link to="/app/dashboard" className="flex items-center gap-2 shrink-0 mr-2 lg:hidden">
          <div style={{ filter: 'drop-shadow(0 0 5px rgba(232,25,44,0.4))' }}>
            <EYFMark size={17} />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em', color: 'var(--t1)' }}>EYF</span>
        </Link>

        {/* Search bar */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-sm flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-all"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--t4)',
            borderRadius: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--t3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--t4)'; }}
        >
          <Icon name="search" size={14} className="flex-shrink-0" />
          <span className="flex-1 text-sm">Search EYF…</span>
          <kbd className="hidden sm:flex">⌘K</kbd>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {streak > 0 && (
            <div className="hidden sm:flex streak-badge">
              <span>🔥</span>
              <span>{streak}d</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => { const next = toggleTheme(); setThemeState(next); }}
            className="w-8 h-8 flex items-center justify-center transition-all"
            style={{ color: 'var(--t3)', border: '1px solid var(--border)', borderRadius: 0 }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; (e.currentTarget as HTMLElement).style.background = 'var(--border)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden md:flex w-8 h-8 items-center justify-center text-xs font-bold transition-all"
            style={{ color: 'var(--t4)', border: '1px solid var(--border)', borderRadius: 0, fontFamily: 'Space Grotesk' }}
            title="Keyboard shortcuts (?)"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t2)'; (e.currentTarget as HTMLElement).style.background = 'var(--border)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            ?
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center transition-all relative"
              style={{ color: 'var(--t3)', border: '1px solid var(--border)', borderRadius: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; (e.currentTarget as HTMLElement).style.background = 'var(--border)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--t3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon name="notifications" size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: '#E82127', border: '1.5px solid var(--header-bg-scrolled)', boxShadow: '0 0 6px rgba(232,25,44,0.6)' }}
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
            <div
              className="avatar avatar-sm cursor-pointer transition-all hover:scale-105"
              title={displayName ?? session?.email ?? 'Profile'}
            >
              {initials}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="shell-main pt-14 min-h-screen pb-20 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '100%', margin: '0 auto' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden flex h-16"
        style={{
          background: 'var(--bottomnav-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid var(--bottomnav-border)',
        }}
      >
        {[
          { path: '/app/dashboard', icon: 'home',         label: 'Home' },
          { path: '/app/problems',  icon: 'code',         label: 'Practice' },
          { path: '/app/subjects',  icon: 'auto_stories', label: 'Learn' },
          { path: '/app/community', icon: 'forum',        label: 'Community' },
          { path: '/app/progress',  icon: 'insights',     label: 'Progress' },
        ].map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative"
              style={{ color: isActive ? '#E82127' : 'var(--t4)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  style={{ width: 24, height: 2, background: '#E82127', borderRadius: '0 0 3px 3px', boxShadow: '0 2px 8px rgba(232,25,44,0.6)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
