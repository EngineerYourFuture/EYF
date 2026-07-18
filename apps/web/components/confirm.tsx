"use client";
/**
 * Design-system confirmation dialog — an accessible replacement for
 * window.confirm(). `useConfirm()` returns an imperative `confirm(opts) =>
 * Promise<boolean>`, so call sites read like the native API:
 *
 *   if (!(await confirm({ title: "Revoke key?", danger: true }))) return;
 *
 * The dialog is a WAI-ARIA alertdialog: focus moves in on open, Tab is trapped,
 * Escape / backdrop cancel, and focus returns to the trigger on close.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@eyf/ui";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Confirm = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback<Confirm>((opts) => {
    openerRef.current = (document.activeElement as HTMLElement) ?? null;
    return new Promise<boolean>((resolve) => setState({ opts, resolve }));
  }, []);

  const close = useCallback((ok: boolean) => {
    setState((s) => {
      s?.resolve(ok);
      return null;
    });
    openerRef.current?.focus();
  }, []);

  // Initial focus + focus trap + Escape (WCAG 2.1.2 / 2.4.3).
  useEffect(() => {
    if (!state) return;
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); close(false); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
      if (f.length === 0) return;
      const first = f[0]!, last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => close(false)} aria-hidden="true" />
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={state.opts.message ? "confirm-desc" : undefined}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-card"
          >
            <h2 id="confirm-title" className="font-display text-lg font-bold">{state.opts.title}</h2>
            {state.opts.message && (
              <p id="confirm-desc" className="text-text-3 text-sm mt-2 leading-relaxed">{state.opts.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => close(false)}>
                {state.opts.cancelLabel ?? "Cancel"}
              </Button>
              <Button ref={confirmBtnRef} variant={state.opts.danger ? "danger" : "primary"} size="sm" onClick={() => close(true)}>
                {state.opts.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
