"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi, useApiAction } from "@/lib/use-api";
import { Button } from "@eyf/ui";

type GateStatus = { required: boolean; passed: boolean };

/** Admin access-gate status. `enabled` gates the fetch to staff only. */
export function useAdminGate(enabled: boolean) {
  const { data, isLoading, mutate } = useApi<GateStatus>(enabled ? "/admin/gate/status" : null);
  return {
    loading: enabled && isLoading && !data,
    required: data?.required ?? false,
    passed: data?.passed ?? false,
    refresh: mutate,
  };
}

/** Access-code screen — the second gate on top of the staff login. */
export function AdminGate({ onPassed }: Readonly<{ onPassed: () => void }>) {
  const act = useApiAction();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await act<{ token: string | null }>(
        "/admin/gate",
        { method: "POST", body: JSON.stringify({ code }) },
        { silent: true },
      );
      if (res.token) window.sessionStorage.setItem("eyf-admin-gate", res.token);
      onPassed();
    } catch {
      setError("Incorrect access code.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-bg">
      <form onSubmit={submit} className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="font-display font-bold text-xl">EYF</span>
          <span className="text-xs font-mono uppercase tracking-widest text-hard border border-hard/40 rounded px-1.5 py-0.5">Admin</span>
        </div>
        <h1 className="font-display text-2xl font-bold">Admin access</h1>
        <p className="text-text-3 text-sm mt-2">
          Enter your access code to continue — required in addition to your staff login.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoComplete="off"
          placeholder="Access code"
          className="mt-6 w-full text-center tracking-[0.3em] font-mono rounded-lg border border-border bg-surface px-4 h-12 text-text-1 placeholder:text-text-4 focus:border-edge focus:outline-none"
        />
        {error && <p className="text-hard text-sm mt-3">{error}</p>}
        <Button type="submit" size="lg" className="w-full mt-4" disabled={busy || !code}>
          {busy ? "Verifying…" : "Unlock admin"}
        </Button>
        <Link href="/dashboard" className="text-text-3 text-sm mt-5 inline-block hover:text-text-1">
          ← Back to app
        </Link>
      </form>
    </div>
  );
}
