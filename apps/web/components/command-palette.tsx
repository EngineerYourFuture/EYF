"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
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
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setDebounced(""); setActive(0); }
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
    const q = query.trim().toLowerCase();
    const navMatches: Row[] = NAV_ITEMS
      .filter((n) => !q || n.label.toLowerCase().includes(q) || (n.keywords ?? "").includes(q))
      .map((n) => ({ kind: "nav", href: n.href, label: n.label, icon: n.icon, hint: "Page" }));
    const probMatches: Row[] = (query.trim() === debounced ? problems ?? [] : []).slice(0, 6).map((p) => ({
      kind: "problem", href: `/problems/${p.slug}`, label: p.title, difficulty: p.difficulty,
    }));
    return [...navMatches.slice(0, q ? 6 : NAV_ITEMS.length), ...probMatches];
  }, [query, debounced, problems]);

  useEffect(() => { setActive(0); }, [query, debounced, problems]);

  const go = useCallback((row?: Row) => {
    if (!row) return;
    setOpen(false);
    router.push(row.href);
  }, [router]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, Math.max(0, rows.length - 1))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(rows[active]); }
  };

  // keep active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Search EYF" placement="top"
      panelClassName="relative w-full max-w-xl rounded-2xl border border-edge glass-strong shadow-card-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <span className="text-text-3"><Icons.Search width={18} height={18} /></span>
              <input
                data-autofocus
                role="combobox"
                aria-label="Search pages and problems"
                aria-expanded="true"
                aria-controls="command-results"
                aria-autocomplete="list"
                aria-activedescendant={rows[active] ? `command-result-${active}` : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search pages and problems…"
                className="min-w-0 flex-1 h-14 bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none text-base"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="icon-button shrink-0 text-text-3 hover:text-text-1">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div ref={listRef} id="command-results" role="listbox" aria-label="Search results" className="max-h-[min(55dvh,28rem)] overflow-y-auto overscroll-contain py-2">
              {rows.length === 0 && (
                <div className="px-4 py-10 text-center text-text-3 text-sm">No matches for “{query.trim()}”.</div>
              )}
              {rows.map((row, i) => {
                const Icon = row.kind === "nav" ? Icons[row.icon] : Icons.Code;
                const selected = i === active;
                return (
                  <button
                    type="button"
                    role="option"
                    id={`command-result-${i}`}
                    aria-selected={selected}
                    tabIndex={-1}
                    key={row.href}
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(row)}
                    className={`pressable w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
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
    </Modal>
  );
}
