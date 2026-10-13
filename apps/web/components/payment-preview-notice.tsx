"use client";
import Link from "next/link";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

export function PaymentPreviewNotice() {
  // Public configuration must not trigger a login or an error toast on a
  // marketing page when the API is unavailable. Plan links remain usable.
  const { data } = useSWR<{ enabled: boolean }>("/billing/status", fetchApi, {
    shouldRetryOnError: false,
    onError: () => {},
  });
  if (data?.enabled !== false) return null;
  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border p-5">
      <p className="text-text-2 leading-relaxed">Payments are coming later. These are planned prices; you can explore EYF without payment during preview.</p>
      <Link href="/billing" className="mt-3 inline-flex min-h-11 items-center font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        Continue without payment
      </Link>
    </div>
  );
}
