"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

type Cert = {
  title: string; score: number | null; type: string;
  issuedAt: string; recipient: string; college: string | null;
};

/**
 * Public certificate verification — no login. An employer who scans the QR /
 * opens the link lands here and sees whether the certificate is genuine.
 */
export default function VerifyPage({ params }: { params: { code: string } }) {
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");
  const [cert, setCert] = useState<Cert | null>(null);

  useEffect(() => {
    fetch(`${API}/certificates/verify/${encodeURIComponent(params.code)}`)
      .then((r) => r.json())
      .then((j) => { if (j?.success) { setCert(j.data); setState("ok"); } else setState("bad"); })
      .catch(() => setState("bad"));
  }, [params.code]);

  return (
    <main className="min-h-screen bg-bg text-text-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="font-display text-2xl font-bold tracking-tight">EYF</div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3 mt-1">Certificate verification</div>
        </div>

        {state === "loading" && (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-3">Verifying…</div>
        )}

        {state === "bad" && (
          <div className="rounded-2xl border border-hard/30 bg-surface p-8 text-center shadow-card">
            <div className="text-hard text-4xl leading-none">✕</div>
            <h1 className="font-display text-xl font-bold mt-3">Not verified</h1>
            <p className="text-text-3 text-sm mt-2">This code doesn&apos;t match any certificate issued by EYF.</p>
          </div>
        )}

        {state === "ok" && cert && (
          <div className="rounded-2xl border border-easy/40 bg-surface p-8 shadow-card-lg">
            <div className="flex items-center gap-2 text-easy">
              <span className="text-2xl leading-none">✓</span>
              <span className="font-medium">Verified — genuine EYF certificate</span>
            </div>
            <div className="mt-6 space-y-3">
              <Row label="Recipient" value={cert.recipient + (cert.college ? ` · ${cert.college}` : "")} />
              <Row label="Certificate" value={cert.title} />
              <Row label="Type" value={cert.type.replace(/_/g, " ").toLowerCase()} />
              {cert.score != null && <Row label="Score" value={`${cert.score}/100`} />}
              <Row label="Issued" value={new Date(cert.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
            </div>
            <p className="text-text-4 text-xs mt-6 break-all">Verified against EYF&apos;s certificate registry · code {params.code}</p>
          </div>
        )}

        <p className="text-center text-text-4 text-xs mt-6">Engineer Your Future — placement operating system</p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
      <span className="text-text-3 text-sm shrink-0">{label}</span>
      <span className="text-text-1 font-medium text-sm text-right capitalize">{value}</span>
    </div>
  );
}
