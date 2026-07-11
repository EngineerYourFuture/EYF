"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppSidebar } from "./app-sidebar";
import { BackButton } from "./back-button";
import { ThemeToggle } from "./theme";
import { CommandPalette, openCommandPalette } from "./command-palette";
import { Watermark } from "./protection/watermark";
import { ProtectionGuard } from "./protection/protection-guard";
import { Icons } from "./icons";

function SearchTrigger() {
  return (
    <button
      onClick={openCommandPalette}
      className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm text-text-3 hover:border-edge hover:text-text-2 transition-colors"
    >
      <Icons.search width={15} height={15} />
      <span>Search…</span>
      <kbd className="ml-auto text-[10px] font-mono border border-border rounded px-1.5 py-0.5">⌘K</kbd>
    </button>
  );
}

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";

const UserButton = HAS_REAL_CLERK
  ? dynamic(() => import("@clerk/nextjs").then((m) => m.UserButton), { ssr: false })
  : null;

function AccountFooter() {
  return (
    <div className="border-t border-border p-4 flex items-center gap-3 shrink-0">
      {UserButton
        ? <UserButton afterSignOutUrl="/" />
        : <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 shrink-0" />}
      <div className="text-sm min-w-0 flex-1">
        <div className="text-text-1 truncate">Account</div>
        <div className="text-text-3 text-xs truncate">{HAS_REAL_CLERK ? "Manage profile" : "Dev mode · no Clerk"}</div>
      </div>
      <ThemeToggle className="shrink-0" />
    </div>
  );
}

function SidebarInner({ onNavigate, onCollapse }: { onNavigate?: () => void; onCollapse?: () => void }) {
  return (
    <>
      <div className="px-6 h-16 flex items-center justify-between border-b border-border shrink-0">
        <Link href="/" onClick={onNavigate} className="font-display font-bold text-xl">EYF</Link>
        {onCollapse && (
          <button onClick={onCollapse} aria-label="Collapse sidebar" title="Collapse sidebar"
            className="hidden lg:inline-flex items-center justify-center h-8 w-8 -mr-2 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-3 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
      </div>
      <SearchTrigger />
      <AppSidebar onNavigate={onNavigate} />
      <AccountFooter />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Restore the collapsed preference (desktop sidebar).
  useEffect(() => { try { setCollapsed(localStorage.getItem("eyf-sidebar-collapsed") === "1"); } catch {} }, []);
  const setCol = (v: boolean) => { setCollapsed(v); try { localStorage.setItem("eyf-sidebar-collapsed", v ? "1" : "0"); } catch {} };

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Drawer focus management: trap Tab within the dialog, Escape closes, and
  // focus returns to the trigger on close (WCAG 2.4.3 / 2.1.2).
  useEffect(() => {
    if (!open) return;
    const opener = menuBtnRef.current;
    const sel = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(sel) ?? []);
    focusables()[0]?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0]!, last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  return (
    <div className={`min-h-screen lg:grid ${collapsed ? "lg:grid-cols-[0_1fr]" : "lg:grid-cols-[248px_1fr]"}`}>
      {/* Skip link — first focusable element, visible only on keyboard focus (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:text-accent-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-card"
      >
        Skip to content
      </a>
      {/* Desktop sidebar — collapsible, hidden on mobile (mobile uses the drawer) */}
      <aside className={`${collapsed ? "hidden" : "hidden lg:flex"} border-r border-border glass flex-col h-screen sticky top-0`}>
        <SidebarInner onCollapse={() => setCol(true)} />
      </aside>

      {/* Desktop: floating button to reopen the collapsed sidebar */}
      {collapsed && (
        <button onClick={() => setCol(false)} aria-label="Open sidebar" title="Open sidebar"
          className="hidden lg:inline-flex fixed top-4 left-4 z-40 items-center justify-center h-9 w-9 rounded-lg border border-border glass text-text-2 hover:text-text-1 shadow-card transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center gap-3 border-b border-border glass">
        <button ref={menuBtnRef} onClick={() => setOpen(true)} aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} className="p-1 -ml-1 text-text-2 hover:text-text-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <Link href="/" className="font-display font-bold text-lg tracking-tight">EYF</Link>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={openCommandPalette} aria-label="Search" className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-3">
            <Icons.search width={18} height={18} />
          </button>
          <ThemeToggle />
          <BackButton />
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[78%] max-w-xs bg-bg border-r border-border flex flex-col"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-border h-14 px-4 shrink-0">
                <span className="font-display font-bold text-lg">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1 text-text-3 hover:text-text-1">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AppSidebar onNavigate={() => setOpen(false)} />
              <AccountFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main id="main-content" tabIndex={-1} className="min-h-screen min-w-0 overflow-x-hidden lg:col-start-2 pb-20 lg:pb-0 focus:outline-none">
        <DesktopBackBar />
        {/* Route transition — content fades + rises in on every navigation. */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile bottom tab bar — the core daily loop one thumb-tap away.
          The 5th tab opens the full drawer for everything else. */}
      <MobileTabBar onMenu={() => setOpen(true)} />

      <CommandPalette />
      {/* Content protection: forensic watermark + client deterrents. */}
      <Watermark />
      <ProtectionGuard />
    </div>
  );
}

// Desktop-only back affordance (mobile has it in the top bar). Renders nothing
// on top-level pages; the BackButton itself hides on non-detail routes.
function DesktopBackBar() {
  const pathname = usePathname();
  const isDetail = pathname.split("/").filter(Boolean).length >= 2;
  // Editor-style full-bleed pages manage their own back button.
  const fullBleed = /^\/problems\/[^/]+$|^\/mocks\/[^/]+$/.test(pathname);
  if (!isDetail || fullBleed) return null;
  return (
    <div className="hidden lg:block px-6 lg:px-10 pt-6 -mb-2">
      <BackButton />
    </div>
  );
}

/**
 * Mobile bottom tab bar — app-grade navigation for the daily loop. Fixed,
 * glass, safe-area aware; the Menu tab opens the full drawer. Hidden on lg+
 * where the sidebar owns navigation.
 */
function MobileTabBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/today", label: "Today", icon: Icons.bolt },
    { href: "/problems", label: "Solve", icon: Icons.code },
    { href: "/readiness", label: "Score", icon: Icons.target },
    { href: "/ask", label: "Ask", icon: Icons.sparkle },
  ];
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border glass"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wide transition-colors ${active ? "text-text-1" : "text-text-4 hover:text-text-2"}`}>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-surface-3" : ""}`}>
                <Icon width={19} height={19} />
              </span>
              {t.label}
            </Link>
          );
        })}
        <button onClick={onMenu}
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wide text-text-4 hover:text-text-2 transition-colors"
          aria-label="Open full menu">
          <span className="flex h-7 w-12 items-center justify-center rounded-full">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </span>
          Menu
        </button>
      </div>
    </nav>
  );
}
