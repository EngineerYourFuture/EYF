"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/analytics";

/**
 * Cookie-consent gate (GDPR/DPDP). Analytics stays off until the user chooses.
 * Essential cookies (auth/session) are exempt and always allowed. Renders only
 * when consent hasn't been recorded yet.
 */
export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(getConsent() === null); }, []);
  if (!show) return null;

  const decide = (v: "granted" | "denied") => { setConsent(v); setShow(false); };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-xl border border-border glass-strong shadow-card-lg p-4 sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-sm text-text-2 leading-relaxed">
        We use essential cookies to run EYF, and optional analytics to improve it. See our{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-2">privacy policy</Link>.
      </p>
      <div className="mt-3 sm:mt-0 flex gap-2 shrink-0">
        <button
          onClick={() => decide("denied")}
          className="h-9 px-4 rounded-md border border-border bg-surface-2 text-text-1 text-sm hover:border-edge hover:bg-surface-3 transition-colors"
        >
          Essential only
        </button>
        <button
          onClick={() => decide("granted")}
          className="h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
