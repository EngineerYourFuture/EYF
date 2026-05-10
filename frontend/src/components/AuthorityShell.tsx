import { type ReactNode, useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { clearSession, getSession } from '../lib/session';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const AUTH_NAV_ITEMS: NavItem[] = [
  { path: '/authority/dashboard', label: 'Operations', icon: 'monitoring' },
  { path: '/authority/queue', label: 'Queue', icon: 'receipt_long' },
  { path: '/authority/problems', label: 'Problems', icon: 'data_object' },
  { path: '/authority/operations', label: 'Admin Ops', icon: 'admin_panel_settings' },
];

interface AuthorityShellProps {
  readonly children: ReactNode;
}

export function AuthorityShell({ children }: AuthorityShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const logout = () => {
    clearSession();
    navigate('/authority/login', { replace: true });
  };

  const initials = session?.email ? session.email[0].toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-surface text-on-surface dark">

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — overlay */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-[#131313] border-r border-white/5 z-50 flex flex-col py-8 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header row */}
        <div className="px-6 mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#E82127] tracking-tighter">EYF PLATFORM</h1>
            <p className="text-[10px] text-on-surface-variant tracking-[0.2em] uppercase font-bold opacity-50 mt-1">Authority Zone</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {AUTH_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 mx-4 py-3 px-6 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#E82127] text-white shadow-[0_0_20px_rgba(232,33,39,0.3)]'
                    : 'text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-[#1F1F1F]'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="font-['Inter'] text-[13px] font-medium tracking-wide uppercase">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 mt-auto pt-6 border-t border-zinc-800/60 space-y-1">
          <button
            onClick={logout}
            className="flex items-center gap-4 text-zinc-500 hover:text-red-400 px-6 py-2 transition-all w-full text-left rounded-full hover:bg-[#1F1F1F]"
          >
            <Icon name="logout" size={16} />
            <span className="font-['Inter'] text-[13px] font-medium tracking-wide uppercase">Logout</span>
          </button>
        </div>
      </aside>

      {/* Top header — full width */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#131313]/80 backdrop-blur-xl h-16 px-6 flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#E82127] transition-all active:scale-95 flex-shrink-0"
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <span className="text-lg font-black tracking-tighter text-[#E82127]">EYF</span>
        <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 ml-2">Authority</span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary-container text-[10px] font-bold uppercase tracking-widest hidden sm:block">
            {session?.role ?? 'staff'}
          </span>
          <p className="text-xs text-zinc-500 hidden md:block">{session?.email}</p>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* Main content — full width */}
      <main className="pt-16 min-h-screen px-6 md:px-12 pb-20">
        {children}
      </main>
    </div>
  );
}
