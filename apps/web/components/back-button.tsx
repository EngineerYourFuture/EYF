"use client";
import { usePathname, useRouter } from "next/navigation";

// Top-level sections → their natural parent for the "back" fallback when
// there's no in-app history (e.g. deep-linked into a detail page).
const PARENT: Record<string, string> = {
  problems: "/problems",
  tracks: "/tracks",
  mentors: "/mentors",
  jobs: "/jobs",
  internships: "/internships",
  forum: "/forum",
  oa: "/oa",
  mocks: "/mocks",
  "peer-mocks": "/peer-mocks",
  resume: "/resume",
  subjects: "/subjects",
};

/**
 * Contextual back button. Renders only on detail pages (≥2 path segments).
 * Prefers in-app history; falls back to the section index when deep-linked.
 */
export function BackButton({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  function goBack() {
    // If we have app history, use it; otherwise go to the section index.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(PARENT[segments[0]!] ?? "/dashboard");
    }
  }

  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text-1 transition-colors ${className}`}
      aria-label="Go back"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
