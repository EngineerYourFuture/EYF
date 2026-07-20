import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { companyReadiness, readinessBand, tierOf, SPOTLIGHT_COMPANIES } from "@/lib/company-readiness";
import { ScoreRing } from "@/components/score-ring";
import { companyLabel } from "@/lib/company";
import type { Pillar } from "@/lib/readiness";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

type Snapshot = {
  overall: number;
  band: string;
  pillars: { key: string; label: string; score: number; weight: number }[];
  name: string;
  college: string | null;
  graduationYear: number | null;
  targetRole: string | null;
  targetCompany: string | null;
};

type Share = { snapshot: Snapshot; issuedAt: string; code: string };

/**
 * Public EYF Score verification — no login. A recruiter or friend who opens
 * a shared link lands here and sees the server-computed score. Same trust
 * model as /verify (certificates): if it renders, EYF computed it.
 */
const getShare = cache(async (code: string): Promise<Share | null> => {
  try {
    const res = await fetch(`${API}/score/verify/${encodeURIComponent(code)}`, { cache: "no-store" });
    const json = await res.json();
    return json?.success ? (json.data as Share) : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const share = await getShare(params.code);
  if (!share) { return { title: "EYF Score — not found" }; }
  const s = share.snapshot;
  return {
    title: `${s.name} — EYF Score ${s.overall}/100`,
    description: `${s.band}. Verified Placement Readiness computed by EYF across DSA, interviews, aptitude, resume, consistency and projects.`,
  };
}

export default async function ScorePage({ params }: Readonly<{ params: { code: string } }>) {
  const share = await getShare(params.code);

  if (!share) {
    return (
      <Shell>
        <div className="rounded-2xl border border-hard/30 bg-surface p-8 text-center shadow-card">
          <div className="text-hard text-4xl leading-none">✕</div>
          <h1 className="font-display text-xl font-bold mt-3">Not verified</h1>
          <p className="text-text-3 text-sm mt-2">This code doesn&apos;t match any EYF Score snapshot.</p>
        </div>
      </Shell>
    );
  }

  const s = share.snapshot;
  // companyReadiness only reads key + score off each pillar; the rest of the
  // Pillar shape (icon/detail/href/action) is filler to satisfy the type.
  const pillars: Pillar[] = s.pillars.map((p) => ({ ...p, icon: "code" as Pillar["icon"], detail: "", href: "", action: "" }));
  const companies = SPOTLIGHT_COMPANIES.map((slug) => {
    const pct = companyReadiness(pillars, tierOf(slug));
    return { slug, pct, band: readinessBand(pct) };
  }).sort((a, b) => b.pct - a.pct);

  const issued = new Date(share.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const who = [s.college, s.graduationYear ? `Class of ${s.graduationYear}` : null].filter(Boolean).join(" · ");

  return (
    <Shell wide>
      <div className="rounded-2xl border border-easy/40 bg-surface p-8 shadow-card-lg">
        <div className="flex items-center gap-2 text-easy">
          <span className="text-2xl leading-none">✓</span>
          <span className="font-medium">Verified — computed by EYF on {issued}</span>
        </div>

        <div className="mt-8 grid sm:grid-cols-[auto_1fr] gap-8 items-center">
          <PageRing score={s.overall} />
          <div>
            <h1 className="font-display text-2xl font-bold">{s.name}</h1>
            {who && <p className="text-text-3 text-sm mt-1">{who}</p>}
            {s.targetRole && <p className="text-text-3 text-sm mt-1">Target: {s.targetRole}{s.targetCompany ? ` @ ${s.targetCompany}` : ""}</p>}
            <p className="text-text-1 font-medium mt-4">{s.band}</p>
            <p className="text-text-4 text-xs mt-1">
              Placement Readiness — one score across problem solving, interviews, aptitude, resume, consistency and projects.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {s.pillars.map((p) => (
            <div key={p.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-2">{p.label}</span>
                <span className="text-text-3 font-mono">{p.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${p.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-3">Company readiness</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {companies.map((c) => (
              <div key={c.slug} className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                <div className="text-sm font-medium truncate">{companyLabel(c.slug)}</div>
                <div className="font-display text-lg font-bold">{c.pct}%</div>
                <div className={`text-[11px] ${(() => { if (c.band.tone === "easy") { return "text-easy"; } if (c.band.tone === "hard") { return "text-hard"; } return "text-text-3"; })()}`}>{c.band.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-text-4 text-xs mt-8 break-all">
          Verified against EYF&apos;s score registry · code {share.code} · scores change as the student progresses; this is a snapshot from {issued}.
        </p>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-ink hover:bg-accent-hover transition-colors">
          Get your own EYF Score — free
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children, wide = false }: Readonly<{ children: React.ReactNode; wide?: boolean }>) {
  return (
    <main className="min-h-screen bg-bg text-text-1 flex items-center justify-center px-4 py-16">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="text-center mb-6">
          <div className="font-display text-2xl font-bold tracking-tight">
            EYF<span className="text-brand">.</span>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3 mt-1">EYF Score — verified placement readiness</div>
        </div>
        {children}
        <p className="text-center text-text-4 text-xs mt-6">Engineer Your Future — placement operating system</p>
      </div>
    </main>
  );
}

function PageRing({ score }: Readonly<{ score: number }>) {
  return (
    <div className="mx-auto w-40">
      <ScoreRing score={score} size={160} stroke={10} label="/ 100" />
    </div>
  );
}
