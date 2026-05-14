import { type ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Icon } from './Icon';
import { EYFMark } from './EYFLogo';
import { clearSession, getSession } from '../lib/session';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/app/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/app/problems', label: 'Problems', icon: 'code' },
  { path: '/app/subjects', label: 'Subjects', icon: 'auto_stories' },
  { path: '/app/placement', label: 'Placement', icon: 'work' },
  { path: '/app/resume', label: 'Resume', icon: 'description' },
  { path: '/app/skills', label: 'Skills', icon: 'psychology' },
  { path: '/app/mentorship', label: 'Mentorship', icon: 'groups' },
  { path: '/app/visualizer', label: 'Visualizer', icon: 'visibility' },
];

interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const logout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const initials = session?.email ? session.email[0].toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-surface text-on-surface dark">

      {/* Backdrop overlay — only shown when sidebar is open */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slides in from left as overlay */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-[#1B1B1B] shadow-[40px_0_80px_-10px_rgba(0,0,0,0.6)] z-50 flex flex-col py-8 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header row: logo + close button */}
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EYFMark size={36} className="text-[#0E0E0E] flex-shrink-0" />
            <div>
              <h1 className="text-base font-black text-white leading-none">EYF PLATFORM</h1>
              <p className="font-['Inter'] uppercase tracking-widest text-[9px] font-bold text-zinc-500 mt-0.5">Engineer Your Future</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all flex-shrink-0"
            aria-label="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3 mx-4 rounded-full transition-all duration-300 hover:translate-x-1 ${
                  isActive
                    ? 'bg-[#E82127] text-white shadow-lg shadow-red-900/20'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#353535]'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 mt-auto space-y-4">
          <div className="bg-surface-container rounded-xl p-5 mx-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Daily Progress</p>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full" style={{ width: '65%' }} />
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">65% of daily goal</p>
          </div>

          <Link
            to="/plans"
            className="block w-full bg-primary-container text-white rounded-full py-3.5 px-6 font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-center shadow-lg shadow-red-900/10 hover:brightness-110 transition-all active:scale-95"
          >
            Upgrade to Pro
          </Link>

          <div className="pt-3 border-t border-zinc-800/50 space-y-1">
            <Link to="/app/support" className="flex items-center gap-4 text-zinc-500 hover:text-zinc-200 px-6 py-2 transition-all rounded-full hover:bg-[#353535]">
              <Icon name="help" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Support</span>
            </Link>
            <Link to="/plans" className="flex items-center gap-4 text-zinc-500 hover:text-zinc-200 px-6 py-2 transition-all rounded-full hover:bg-[#353535]">
              <Icon name="payments" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Billing</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-4 text-zinc-500 hover:text-red-400 px-6 py-2 transition-all w-full text-left rounded-full hover:bg-[#353535]"
            >
              <Icon name="logout" size={16} />
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top header — full width, always visible */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#131313]/80 backdrop-blur-xl h-16 px-6 flex items-center gap-4">
        {/* Hamburger menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all active:scale-95 flex-shrink-0"
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Logo mark */}
        <EYFMark size={28} className="text-[#0E0E0E] mr-2 flex-shrink-0" />

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary-container transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-11 pr-5 text-on-surface focus:outline-none focus:ring-0 placeholder:text-zinc-600 text-sm focus:shadow-[0_0_20px_rgba(232,33,39,0.1)] transition-all"
            />
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <Icon name="notifications" size={20} />
          </button>
          <Link to="/app/profile">
            <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <Icon name="settings" size={20} />
            </button>
          </Link>
          <Link to="/app/profile">
            <div className="w-10 h-10 rounded-full border-2 border-primary-container/40 bg-primary-container flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:brightness-110 transition-all">
              {initials}
            </div>
          </Link>
        </div>
      </header>

      {/* Main content — full width, offset only for top header */}
      <main className="pt-16 min-h-screen px-6 md:px-12 pb-20">
        {children}
      </main>
    </div>
  );
}
