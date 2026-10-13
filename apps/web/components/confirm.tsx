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
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "@eyf/ui";
import { Modal } from "./modal";

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

export function ConfirmProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((opts) => {
    pending.current?.(false);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setState({ opts, resolve });
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    pending.current?.(ok);
    pending.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} role="alertdialog"
        labelledBy="confirm-title" describedBy={state?.opts.message ? "confirm-desc" : undefined}
        panelClassName="relative w-full max-w-sm rounded-2xl border border-border glass-strong p-6 shadow-card-lg">
        {state && <>
          <h2 id="confirm-title" className="font-display text-lg font-semibold tracking-tight">{state.opts.title}</h2>
          {state.opts.message && <p id="confirm-desc" className="text-text-2 text-sm mt-2 leading-relaxed">{state.opts.message}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => close(false)}>
              {state.opts.cancelLabel ?? "Cancel"}
            </Button>
            <Button variant={state.opts.danger ? "danger" : "primary"} size="sm" onClick={() => close(true)}>
              {state.opts.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </>}
      </Modal>
    </ConfirmContext.Provider>
  );
}
