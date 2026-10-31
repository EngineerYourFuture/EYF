"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UI_FADE, UI_SPRING, useMotionPreference } from "./interaction-motion";

type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  label?: string;
  role?: "dialog" | "alertdialog";
  panelClassName?: string;
  placement?: "center" | "top" | "left";
}>;

// A nested dialog must not unlock the page while its parent is still open.
let scrollLocks = 0;
let originalOverflow = "";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';

/** Native top-layer dialogs keep background content inert and restore focus.
 * Presence preserves the same panel through a reversed opening/closing spring.
 */
export function Modal({ open, ...props }: ModalProps) {
  return <AnimatePresence>{open && <DialogSurface key="dialog" {...props} />}</AnimatePresence>;
}

function DialogSurface({
  onClose, children, labelledBy, describedBy, label, role = "dialog", panelClassName, placement = "center",
}: Omit<ModalProps, "open">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduce = useMotionPreference();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const panel = dialog.querySelector<HTMLElement>(".eyf-dialog-panel");
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });
    if (scrollLocks++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      dialog.close();
      if (--scrollLocks === 0) document.body.style.overflow = originalOverflow;
      // React removes the dialog before passive cleanup, so the native close
      // algorithm may already have lost its opener. Restore it explicitly.
      const remainingDialog = Array.from(document.querySelectorAll("dialog:modal")).at(-1);
      if (opener?.isConnected && (!remainingDialog || remainingDialog.contains(opener))) opener.focus({ preventScroll: true });
    };
  }, []);

  const origins = {
    left: { opacity: 1, x: "-100%", y: 0, scale: 1 },
    top: { opacity: 0, x: 0, y: -8, scale: 0.98 },
    center: { opacity: 0, x: 0, y: 8, scale: 0.98 },
  };
  const closed = reduce ? { opacity: 0, x: 0, y: 0, scale: 1 } : origins[placement];
  const alignment = {
    left: "items-stretch justify-start",
    top: "items-start justify-center p-4 pt-[min(12vh,5rem)]",
    center: "items-center justify-center p-4",
  }[placement];

  return (
    <motion.dialog
      ref={dialogRef}
      role={role}
      aria-modal="true"
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="eyf-dialog"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const panel = dialogRef.current?.querySelector(".eyf-dialog-panel");
        const focusable = Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
          .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = focusable[0], last = focusable.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      initial="closed" animate="open" exit="closed"
    >
      <motion.button
        type="button" tabIndex={-1} aria-label="Close dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
        onClick={onClose}
        variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
        transition={UI_FADE}
      />
      <div className={`pointer-events-none absolute inset-0 flex ${alignment}`}>
        <motion.div
          tabIndex={-1}
          className={`eyf-dialog-panel pointer-events-auto ${panelClassName ?? "relative w-full max-w-md rounded-2xl border border-border glass-strong p-6 shadow-card-lg"}`}
          variants={{ closed, open: { opacity: 1, x: 0, y: 0, scale: 1 } }}
          transition={reduce ? UI_FADE : UI_SPRING}
        >
          {children}
        </motion.div>
      </div>
    </motion.dialog>
  );
}
