"use client";
import { Component, type ReactNode } from "react";

/**
 * Error boundary for NON-ESSENTIAL / decorative subtrees (e.g. the WebGL landing background).
 * If the child throws — a WebGL/reconciler failure, a locked-down browser, an old GPU — this
 * renders a fallback (default: nothing) instead of letting the error propagate to the app-level
 * error boundary and take down the whole page. A decorative widget failing must never mean the
 * visitor sees "Something broke on our end."
 */
export class SilentBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    /* swallow: decorative subtree, nothing user-actionable */
  }

  override render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
