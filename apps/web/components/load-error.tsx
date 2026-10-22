import Link from "next/link";
import { ErrorState } from "@eyf/ui";
import { ApiClientError, isTerminalError } from "@/lib/api";

/**
 * Whether a page should swap its content for LoadError. A failed background
 * refresh keeps the stale record on screen; a missing, forbidden or plan-locked
 * one (404/403/402) replaces it even when cached, so revoked access ends.
 */
export function loadFailed(error: unknown, data: unknown): boolean {
  if (!error) return false;
  if (data == null) return true;
  const status = error instanceof ApiClientError ? error.status : 0;
  return status === 402 || status === 403 || status === 404;
}

/**
 * Inline state for a page whose main record failed to load. Worded by status:
 * a missing record or a forbidden one isn't retryable, so it offers the way
 * back instead; only network and server failures get a retry button.
 */
export function LoadError({ error, what, retry, back, page }: Readonly<{
  error: unknown;
  /** The record in plain words, e.g. "job" or "mock interview". */
  what: string;
  retry?: () => void;
  back?: { href: string; label: string };
  /** The error replaces the whole page, so its title is the page's h1. */
  page?: boolean;
}>) {
  const titleAs = page ? "h1" : undefined;
  const status = error instanceof ApiClientError ? error.status : 0;
  const backLink = back && (
    <p className="mt-4 text-center text-sm">
      <Link href={back.href} className="inline-flex min-h-11 items-center text-accent hover:underline">{back.label}</Link>
    </p>
  );

  if (status === 404) {
    return <><ErrorState titleAs={titleAs} title={`This ${what} isn’t available`} message="The link may be wrong, or it was removed." />{backLink}</>;
  }
  // 401 is not here: use-api keeps retrying it, since a token refresh can fix it.
  if (status === 403) {
    return <><ErrorState titleAs={titleAs} title="You don’t have access" message={`Your account can’t open this ${what}.`} />{backLink}</>;
  }
  if (status === 402) {
    return <><ErrorState titleAs={titleAs} title="Not included in your plan" message={(error as Error).message || `Your plan doesn’t include this ${what}.`} />{backLink}</>;
  }
  if (isTerminalError(error)) {
    return <><ErrorState titleAs={titleAs} title={`This ${what} couldn’t be opened`} message="Go back and open it again." />{backLink}</>;
  }
  return <ErrorState titleAs={titleAs} message={`We couldn’t load this ${what}. Check your connection and try again.`} retry={retry} />;
}
