"use client";
/**
 * Client-side content deterrents. HONEST SCOPE: none of this prevents a
 * determined leak (a phone camera or OS tool beats it) — it only raises friction
 * against casual copying and shoulder-capture. The real protection is the
 * forensic Watermark + server-side account-sharing limits.
 *
 * - Blocks context menu, copy, and text selection.
 * - Covers the screen with a blur when the window loses focus / tab is hidden,
 *   so content isn't sitting exposed while the user is in a screenshot tool or
 *   sharing another window.
 */
import { useEffect, useState } from "react";

export function ProtectionGuard() {
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("selectstart", block);

    const hide = () => setObscured(true);
    const show = () => setObscured(false);
    const onVisibility = () => setObscured(document.hidden);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("selectstart", block);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!obscured) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-bg/80 backdrop-blur-xl text-center px-6">
      <div>
        <div className="font-display text-xl font-bold text-text-1">Paused</div>
        <p className="text-text-3 text-sm mt-2 max-w-xs">EYF content is protected. Return to this tab to continue.</p>
      </div>
    </div>
  );
}
