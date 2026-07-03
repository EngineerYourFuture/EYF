"use client";
import { useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";
const KEY = "eyf-theme";

/**
 * Blocking script injected in <head> so the correct theme class is on <html>
 * before first paint — no flash of the wrong theme. Defaults to dark.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(!t){t="light";}var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);}catch(e){document.documentElement.classList.add("light");}})();`;

function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(KEY) as Theme) || "light";
}

function apply(theme: Theme) {
  const r = document.documentElement;
  r.classList.remove("light", "dark");
  r.classList.add(theme);
  try { localStorage.setItem(KEY, theme); } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => { setThemeState(getTheme()); }, []);
  const setTheme = useCallback((t: Theme) => { apply(t); setThemeState(t); }, []);
  const toggle = useCallback(() => setTheme(getTheme() === "dark" ? "light" : "dark"), [setTheme]);
  return { theme, setTheme, toggle };
}

const SunIcon = (p: { className?: string }) => (
  <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const MoonIcon = (p: { className?: string }) => (
  <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/** Compact theme toggle. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-3 border border-transparent hover:border-border transition-colors ${className}`}
    >
      {mounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
