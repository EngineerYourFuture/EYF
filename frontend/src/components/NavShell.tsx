import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../lib/session";
import { getTheme, toggleTheme } from "../lib/theme";

export const NavShell = () => {
  const session = getSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());

  const logout = () => {
    clearSession();
    navigate(session?.zone === "authority" ? "/authority/login" : "/login", { replace: true });
  };

  const isAuthority = session?.zone === "authority";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 text-xs uppercase tracking-wider font-bold transition-all ${
      isActive
        ? "bg-[#E82127] text-white shadow-lg shadow-red-900/20"
        : "text-zinc-500 hover:text-zinc-200 hover:bg-[#353535]"
    }`;

  const quickLinks = isAuthority
    ? [{ to: "/authority/queue", label: "Queue", icon: "fa-solid fa-list-check" }]
    : [
        { to: "/app/home", label: "Home", icon: "fa-solid fa-house" },
        { to: "/app/problems", label: "Problems", icon: "fa-solid fa-code" },
        { to: "/app/core-subjects", label: "Subjects", icon: "fa-solid fa-book" },
        { to: "/app/placement", label: "Placement", icon: "fa-solid fa-briefcase" },
        { to: "/app/resume", label: "Resume", icon: "fa-solid fa-file-lines" },
        { to: "/app/tech-skills", label: "Skills", icon: "fa-solid fa-laptop-code" },
        { to: "/app/mentorship", label: "Mentorship", icon: "fa-solid fa-users" }
      ];

  const secondaryLinks = isAuthority
    ? [
        { to: "/authority/queue", label: "Queue", icon: "fa-solid fa-list-check" },
        ...(session?.role === "admin"
          ? [
              { to: "/authority/admin/operations", label: "Operations", icon: "fa-solid fa-screwdriver-wrench" },
              { to: "/authority/admin/billing", label: "Billing", icon: "fa-solid fa-receipt" },
              { to: "/authority/admin/problems", label: "Problems", icon: "fa-solid fa-database" }
            ]
          : [])
      ]
    : [
        { to: "/app/support", label: "Support", icon: "fa-solid fa-circle-question" },
        { to: "/app/billing", label: "Billing", icon: "fa-solid fa-credit-card" },
        { to: "/app/security", label: "Security", icon: "fa-solid fa-shield-halved" }
      ];

  const initials = session?.email
    ? session.email[0].toUpperCase()
    : "?";

  const streak = 14;
  const xp = 2450;
  const sectionName = (() => {
    const path = location.pathname;
    if (path.includes("/authority")) return "Authority Workspace";
    if (path.includes("/problems")) return "DSA Practice";
    if (path.includes("/core-subjects")) return "Core Subjects";
    if (path.includes("/placement")) return "Placement Prep";
    if (path.includes("/resume")) return "Resume Builder";
    if (path.includes("/tech-skills")) return "Tech Skills";
    if (path.includes("/mentorship")) return "Mentorship";
    if (path.includes("/billing")) return "Billing";
    if (path.includes("/support")) return "Support";
    if (path.includes("/security")) return "Security";
    return isAuthority ? "Authority Workspace" : "Module Home";
  })();

  return (
    <div className="min-h-screen bg-[#131313] text-zinc-200">
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-[#1B1B1B] border-r border-white/5 shadow-[40px_0_60px_-15px_rgba(0,0,0,0.3)] z-40 flex-col py-8">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E82127] rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-terminal" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none tracking-tight">EYF PLATFORM</h1>
              <p className="uppercase tracking-[0.18em] text-[10px] font-bold text-zinc-500 mt-1">{isAuthority ? "Authority" : "Learner"} Zone</p>
            </div>
          </div>
        </div>
        <nav className="px-4 space-y-1">
          {quickLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <i className={`${item.icon} w-4 text-center`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-4 pt-6 border-t border-zinc-800/60 space-y-1">
          {secondaryLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <i className={`${item.icon} w-4 text-center`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setTheme(toggleTheme())}
            className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-zinc-200 hover:bg-[#353535] transition-all"
            type="button"
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} w-4 text-center`} />
            {theme === "dark" ? "Light Theme" : "Dark Theme"}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-red-300 hover:bg-[#353535] transition-all"
            type="button"
          >
            <i className="fa-solid fa-right-from-bracket w-4 text-center" />
            {' '}Logout
          </button>
        </div>
      </aside>

      <header className="fixed top-0 md:left-72 left-0 right-0 h-20 bg-[#131313]/85 backdrop-blur-xl border-b border-white/5 z-30 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg text-zinc-300 hover:bg-[#2a2a2a]"
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            <i className={`fa-solid ${mobileOpen ? "fa-xmark" : "fa-bars"}`} />
          </button>
          <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">{sectionName}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isAuthority && (
            <>
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[#1f1f1f] text-zinc-300 border border-white/5">
                <i className="fa-solid fa-fire text-[#E82127]" />
                {streak} DAY
              </span>
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[#1f1f1f] text-zinc-300 border border-white/5">
                <i className="fa-solid fa-star text-amber-400" />
                {xp.toLocaleString()} XP
              </span>
            </>
          )}
          <button
            onClick={() => setTheme(toggleTheme())}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2a] transition-colors"
            type="button"
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
          </button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-[#E82127] flex items-center justify-center text-white text-xs font-semibold"
            aria-label="Open profile menu"
          >
            {initials}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed left-0 right-0 top-20 z-30 bg-[#1B1B1B] border-b border-white/5 p-4 space-y-1">
          {[...quickLinks, ...secondaryLinks].map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <i className={`${item.icon} w-4 text-center`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-[60]">
          <button className="absolute inset-0 bg-black/50" type="button" onClick={() => setProfileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#1B1B1B] border-l border-white/5 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-zinc-100">{session?.email ?? "Profile"}</p>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mt-1">{session?.role ?? "user"}</p>
              </div>
              <button className="w-8 h-8 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2a]" onClick={() => setProfileOpen(false)} type="button">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <nav className="space-y-1">
              {[...quickLinks, ...secondaryLinks].map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => setProfileOpen(false)}>
                  <i className={`${item.icon} w-4 text-center`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-zinc-800/60 space-y-1">
              <button
                onClick={() => setTheme(toggleTheme())}
                className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-zinc-200 hover:bg-[#353535] transition-all"
                type="button"
              >
                <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} w-4 text-center`} />
                {theme === "dark" ? "Light Theme" : "Dark Theme"}
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-red-300 hover:bg-[#353535] transition-all"
                type="button"
              >
                <i className="fa-solid fa-right-from-bracket w-4 text-center" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Page content */}
      <main className="md:ml-72 pt-24 px-6 md:px-10 pb-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
