"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEyfAuth } from "@/lib/auth";
import { useConfirm } from "@/components/confirm";

export type LessonDraft = { title: string; skill: string; blocks: { type: string; data: Record<string, unknown> }[] };
type Store = { get: (key: string) => LessonDraft | undefined; put: (key: string, draft: LessonDraft) => void; remove: (key: string) => void };
const DraftContext = createContext<Store | null>(null);

/** Private lesson drafts live only in this account's mounted workspace, never browser storage. */
export function AuthoringDrafts({ children }: Readonly<{ children: ReactNode }>) {
  const { userId } = useEyfAuth();
  const account = useRef<{ id: string | null; drafts: Map<string, LessonDraft> }>({ id: userId, drafts: new Map() });
  if (account.current.id !== userId) account.current = { id: userId, drafts: new Map() };
  const store = useMemo<Store>(() => ({
    get: (key) => account.current.id === userId ? account.current.drafts.get(key) : undefined,
    put: (key, value) => { if (userId && account.current.id === userId) account.current.drafts.set(key, value); },
    remove: (key) => { if (account.current.id === userId) account.current.drafts.delete(key); },
  }), [userId]);
  return <DraftContext.Provider key={userId ?? "signed-out"} value={store}>{children}</DraftContext.Provider>;
}
export function useAuthoringDrafts() {
  const store = useContext(DraftContext);
  if (!store) throw new Error("Authoring drafts require the LMS workspace.");
  return store;
}

/** Capture every ordinary link exit, including shared chrome; history navigation recovers the in-memory draft. */
export function useAuthoringExit(dirty: boolean) {
  const confirm = useConfirm();
  const router = useRouter();
  const pending = useRef(false);
  const mayLeave = useCallback(async () => !dirty || await confirm({
    title: "Leave with unsaved changes?", message: "Your draft stays available while this workspace is open. Save it before closing this browser tab or signing out.",
    confirmLabel: "Leave lesson", cancelLabel: "Keep editing",
  }), [dirty, confirm]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol) || (url.pathname === location.pathname && url.search === location.search)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (pending.current) return;
      pending.current = true;
      void mayLeave().then((leave) => {
        if (!leave) return;
        if (url.origin === location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
        else location.assign(url.href);
      }).finally(() => { pending.current = false; });
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty, mayLeave, router]);
  return mayLeave;
}
