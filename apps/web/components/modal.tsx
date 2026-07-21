"use client";
/**
 * Shared accessible modal dialog — focus moves in on open, Tab is trapped,
 * Escape / backdrop close, and focus returns to the trigger on close
 * (WCAG 2.1.2 / 2.4.3). The backdrop is a real <button> (keyboard-native, so no
 * a11y-lint suppression needed) kept out of the tab order — Escape is the
 * keyboard close path.
 */
import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open, onClose, children, labelledBy, panelClassName,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the heading element inside the panel, for aria-labelledby. */
  labelledBy?: string;
  /** Overrides the default panel styling. */
  panelClassName?: string;
}>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = (document.activeElement as HTMLElement) ?? null;
    const focusables = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusables()[0] ?? panelRef.current)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) { e.preventDefault(); panelRef.current?.focus(); return; }
      const first = f[0]!, last = f.at(-1)!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={panelClassName ?? "relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card-lg focus:outline-none"}
      >
        {children}
      </div>
    </div>
  );
}
