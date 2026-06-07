"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useApi } from "@/lib/use-api";
import { NAV_ITEMS } from "@/lib/nav";
import { Icons } from "./icons";

type Problem = { slug: string; title: string; difficulty: string };
type Row =
  | { kind: "nav"; href: string; label: string; icon: keyof typeof Icons; hint: string }
  | { kind: "problem"; href: string; label: string; difficulty: string };

const OPEN_EVENT = "eyf:open-command";
/** Fire this from anywhere (e.g. a ⌘K hint button) to open the palette. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const diffColor: Record<string, string> = {
  EASY: "text-easy", MEDIUM: "text-medium", HARD: "text-hard", EXPERT: "text-expert",
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // open/close hotkeys + custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setDebounced(""); setActive(0); }
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  // live problem search
  const { data: problems } = useApi<Problem[]>(
    open && debounced.length >= 2 ? `/problems?q=${encodeURIComponent(debounced)}` : null,
  );

  const rows = useMemo<Row[]>(() => {
    const q = debounced.toLowerCase();
    const navMatches: Row[] = NAV_ITEMS
      .filter((n) => !q || n.label.toLowerCase().includes(q) || (n.keywords ?? "").includes(q))
      .map((n) => ({ kind: "nav", href: n.href, label: n.label, icon: n.icon, hint: "Page" }));
    const probMatches: Row[] = (problems ?? []).slice(0, 6).map((p) => ({
      kind: "problem", href: `/problems/${p.slug}`, label: p.title, difficulty: p.difficulty,
    }));
    return [...navMatches.slice(0, q ? 6 : NAV_ITEMS.length), ...probMatches];
  }, [debounced, problems]);

  useEffect(() => { setActive(0); }, [debounced, problems]);

  const go = useCallback((row?: Row) => {
    if (!row) return;
    setOpen(false);
    router.push(row.href);
  }, [router]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(rows[active]); }
  };

  // keep active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl border border-edge bg-surface shadow-card-lg overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <span className="text-text-3"><Icons.search width={18} height={18} /></span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search pages and problems…"
                className="flex-1 h-14 bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none text-[15px]"
              />
              <kbd className="hidden sm:inline text-[10px] font-mono text-text-4 border border-border rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
              {rows.length === 0 && (
                <div className="px-4 py-10 text-center text-text-3 text-sm">No matches for “{debounced}”.</div>
              )}
              {rows.map((row, i) => {
                const Icon = row.kind === "nav" ? Icons[row.icon] : Icons.code;
                const selected = i === active;
                return (
                  <button
                    key={row.href}
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(row)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected ? "bg-accent-tint" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className={selected ? "text-accent" : "text-text-3"}><Icon width={18} height={18} /></span>
                    <span className="flex-1 truncate text-text-1 text-sm">{row.label}</span>
                    {row.kind === "problem"
                      ? <span className={`text-[10px] font-mono uppercase ${diffColor[row.difficulty] ?? "text-text-3"}`}>{row.difficulty}</span>
                      : <span className="text-[10px] font-mono uppercase text-text-4">{row.hint}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-text-4">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span className="ml-auto"><kbd className="font-mono">⌘K</kbd> toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
