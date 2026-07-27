"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const KEY = "eyf-theme";
const DEFAULT: Theme = "dark";

/**
 * Blocking script injected in <head> so the correct theme class is on <html>
 * before first paint — no flash of the wrong theme. Defaults to dark.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t="${DEFAULT}";}var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);}catch(e){document.documentElement.classList.add("${DEFAULT}");}})();`;

function applyClass(theme: Theme) {
  const r = document.documentElement;
  r.classList.remove("light", "dark");
  r.classList.add(theme);
}

/**
 * The `<html>` class is the single source of truth. The blocking script above
 * sets it before first paint, so reading it here means a client render always
 * agrees with what is already on screen.
 */
function readTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/**
 * One store shared by every useTheme() consumer.
 *
 * Each call used to own a private useState, so a toggle only re-rendered the
 * component holding the switch. Consumers that pass the theme to a third party
 * — Clerk's `appearance` on the auth pages, the Monaco editor on a problem page
 * — kept their stale value until they happened to remount, leaving a dark editor
 * on a light page. Subscribing them all to one store fixes that at the root.
 */
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

let storageBound = false;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Bound once per document, not per subscriber. `storage` fires only in OTHER
  // tabs, so this is what keeps every open tab on the same theme.
  if (!storageBound) {
    storageBound = true;
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key !== KEY) return;
      applyClass(e.newValue === "light" || e.newValue === "dark" ? e.newValue : DEFAULT);
      emit();
    });
  }
  return () => {
    listeners.delete(onChange);
  };
}

export function useTheme() {
  // getServerSnapshot returns the SSR default, so hydration renders exactly what
  // the server sent; React then re-syncs to the real DOM value. That ordering is
  // what keeps this free of hydration warnings.
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT);

  // The hydration render is forced to use the server snapshot (DEFAULT), because
  // the server cannot know the visitor's saved theme. Nudge every subscriber to
  // re-read once mounted so a saved `light` actually propagates. Without this the
  // hook can sit on `dark` for the life of the page, which silently mis-themes
  // consumers that only read the value at mount — Clerk's `appearance` rendered a
  // fully dark widget behind a white card override (invisible heading, black input).
  useEffect(() => {
    if (readTheme() !== DEFAULT) emit();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    applyClass(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode / storage disabled — the class still applies for this session */
    }
    emit();
  }, []);

  const toggle = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}

const SunIcon = (p: { className?: string }) => (
  <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const MoonIcon = (p: { className?: string }) => (
  <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * Compact theme toggle.
 *
 * Both icons are always rendered and CSS picks the visible one off the `<html>`
 * class (see `.theme-icon-*` in globals.css). That keeps the button correct in
 * the server HTML and through hydration with no JS-driven swap, so there is no
 * icon flicker on load for anyone whose saved theme isn't the SSR default.
 */
export function ThemeToggle({ className = "" }: Readonly<{ className?: string }>) {
  const { toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle colour theme"
      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-3 border border-transparent hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      <SunIcon className="theme-icon-sun" />
      <MoonIcon className="theme-icon-moon" />
    </button>
  );
}
