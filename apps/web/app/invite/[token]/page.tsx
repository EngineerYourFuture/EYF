"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { ApiClientError } from "@/lib/api";
import { ThemeToggle } from "@/components/theme";

type Result =
  | { kind: "loading" }
  | { kind: "success"; orgId: string }
  | { kind: "signin" }
  | { kind: "error"; title: string; message: string };

/**
 * Accept an org invite from an emailed link (NEXT_PUBLIC_APP_URL/invite/<token>).
 * Auto-accepts on load for a signed-in user, and renders a specific state for
 * each outcome the API defines: expired/invalid, email mismatch, or not signed
 * in (which sends the invitee through sign-in and back here).
 */
export default function InviteAcceptPage({ params }: Readonly<{ params: { token: string } }>) {
  const { token } = params;
  const action = useApiAction();
  const [result, setResult] = useState<Result>({ kind: "loading" });
  const ran = useRef(false); // guard React strict-mode double-invoke

  async function accept() {
    setResult({ kind: "loading" });
    try {
      // silent: we render our own outcome UI rather than a toast.
      const data = await action<{ orgId: string }>(
        "/orgs/invites/accept",
        { method: "POST", body: JSON.stringify({ token }) },
        { silent: true },
      );
      setResult({ kind: "success", orgId: data.orgId });
    } catch (e) {
      if (e instanceof ApiClientError) {
        if (e.status === 401) return setResult({ kind: "signin" });
        if (e.code === "INVITE_EMAIL_MISMATCH") {
          return setResult({
            kind: "error",
            title: "Wrong account",
            message: "This invite was sent to a different email. Sign in with the invited address, then open the link again.",
          });
        }
        if (e.code === "INVITE_INVALID") {
          return setResult({
            kind: "error",
            title: "Invite expired",
            message: "This invite is no longer valid — it may have expired or already been used. Ask your admin to send a new one.",
          });
        }
      }
      setResult({
        kind: "error",
        title: "Something went wrong",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent("/invite/" + token)}`;

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-8 h-16">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">EYF<span className="text-brand">.</span></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-card"
          aria-live="polite"
          aria-busy={result.kind === "loading"}
        >
          {result.kind === "loading" && (
            <>
              <output className="mx-auto block h-10 w-10 rounded-full border-2 border-border border-t-accent animate-spin" aria-label="Accepting invite" />
              <h1 className="font-display text-xl font-bold mt-6">Accepting your invite…</h1>
              <p className="text-text-3 text-sm mt-2">One moment while we add you to the organization.</p>
            </>
          )}

          {result.kind === "success" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-easy/15 text-easy text-2xl" aria-hidden="true">✓</div>
              <h1 className="font-display text-xl font-bold mt-6">You&apos;re in!</h1>
              <p className="text-text-3 text-sm mt-2 leading-relaxed">Your invite was accepted. Head to your organization console to get started.</p>
              <Link href="/orgs" className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-ink hover:bg-accent-hover transition-colors">
                Go to organization →
              </Link>
            </>
          )}

          {result.kind === "signin" && (
            <>
              <h1 className="font-display text-xl font-bold mt-2">Sign in to accept</h1>
              <p className="text-text-3 text-sm mt-2 leading-relaxed">You need to be signed in with the invited email to join this organization.</p>
              <Link href={signInHref} className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-ink hover:bg-accent-hover transition-colors">
                Sign in & accept →
              </Link>
            </>
          )}

          {result.kind === "error" && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-hard/15 text-hard text-2xl" aria-hidden="true">!</div>
              <h1 className="font-display text-xl font-bold mt-6">{result.title}</h1>
              <p className="text-text-3 text-sm mt-2 leading-relaxed">{result.message}</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => void accept()}>Try again</Button>
                <Link href="/dashboard" className="text-sm text-text-3 hover:text-text-1">Go to dashboard</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
