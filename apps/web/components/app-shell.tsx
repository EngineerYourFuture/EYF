"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link href="/" onClick={onNavigate} className="px-6 h-16 flex items-center font-display font-bold text-xl border-b border-border shrink-0">
        EYF
      </Link>
      <SearchTrigger />
      <AppSidebar onNavigate={onNavigate} />
      <AccountFooter />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar — fixed left, hidden on mobile */}
      <aside className="hidden lg:flex border-r border-border bg-surface/40 flex-col h-screen sticky top-0">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center gap-3 border-b border-border bg-bg/90 backdrop-blur-md">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 -ml-1 text-text-2 hover:text-text-1">
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

      <main className="min-h-screen min-w-0 overflow-x-hidden">
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
