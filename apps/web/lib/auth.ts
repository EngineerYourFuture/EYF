"use client";
/**
 * Clerk-safe auth shim.
 *
 * In production (real Clerk keys) this delegates to Clerk's `useAuth`.
 * In local dev (placeholder keys, no ClerkProvider mounted) it falls back to a
 * dev-login JWT so the whole app is usable offline — and, crucially, so app
 * pages don't crash calling Clerk hooks that have no provider.
 *
 * `HAS_REAL_CLERK` is a build-time constant, so `useEyfAuth` resolves to exactly
 * one implementation per build — Rules of Hooks are satisfied.
 */
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const PLACEHOLDER = "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";
export const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== PLACEHOLDER;

// Which seed user the dev session logs in as. admin@eyf.dev is ELITE + ADMIN,
// so every feature (incl. admin panels + elite-gated flows) is explorable.
const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL ?? "admin@eyf.dev";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export type EyfAuth = {
  getToken: () => Promise<string | null>;
  userId: string | null;
  isSignedIn: boolean;
};

// ─── Dev path ─────────────────────────────────────────────────────

let devTokenPromise: Promise<string | null> | null = null;

/** True while the JWT still has >60s left. Guards against the dev-login token
 * (15-min exp) going stale and 401-ing every authed request until localStorage
 * is manually cleared. */
function tokenIsFresh(token: string): boolean {
  try {
    const part = token.split(".")[1]!.replaceAll("-", "+").replaceAll("_", "/");
    const exp = JSON.parse(atob(part)).exp as number | undefined;
    return typeof exp === "number" && exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

async function ensureDevToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem("eyf_dev_token");
  if (cached && tokenIsFresh(cached)) return cached;
  // Missing or stale → (re)fetch. Reset the memo when it settles so the next
  // expiry can trigger a fresh login instead of returning the old token forever.
  devTokenPromise ??= fetch(`${API}/auth/dev-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: DEV_EMAIL }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) {
          window.localStorage.setItem("eyf_dev_token", j.data.token);
          window.localStorage.setItem("eyf_dev_userid", j.data.user.id);
          return j.data.token as string;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        devTokenPromise = null;
      });
  return devTokenPromise;
}

function useDevAuth(): EyfAuth {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    ensureDevToken().then(() => {
      setUserId(window.localStorage.getItem("eyf_dev_userid"));
    });
  }, []);
  return { getToken: ensureDevToken, userId, isSignedIn: true };
}

// ─── Real Clerk path ──────────────────────────────────────────────

function useRealAuth(): EyfAuth {
  const a = useClerkAuth();
  return {
    getToken: () => a.getToken(),
    userId: a.userId ?? null,
    isSignedIn: !!a.isSignedIn,
  };
}

export const useEyfAuth: () => EyfAuth = HAS_REAL_CLERK ? useRealAuth : useDevAuth;
