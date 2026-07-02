"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Badge, Button, PageHeader, SkeletonRows, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Reveal } from "@/components/motion";
import { Icons, type IconName } from "@/components/icons";

type App = {
  id: string;
  status: Status;
  notes: string | null;
  appliedAt: string | null;
  job: {
    id: string; slug: string; company: string; title: string;
    role: string; location: string; closesAt: string | null;
  };
};

type Status = "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";

// The active funnel, in order. Closed states live in a separate drawer.
const STAGES: { key: Status; label: string; tone: "default" | "accent" | "medium" | "easy" }[] = [
  { key: "SAVED", label: "Saved", tone: "default" },
  { key: "APPLIED", label: "Applied", tone: "accent" },
  { key: "OA", label: "OA", tone: "medium" },
  { key: "INTERVIEW", label: "Interview", tone: "medium" },
  { key: "OFFER", label: "Offer", tone: "easy" },
];
const NEXT: Partial<Record<Status, Status>> = { SAVED: "APPLIED", APPLIED: "OA", OA: "INTERVIEW", INTERVIEW: "OFFER" };

export default function PipelinePage() {
  const { data: apps, isLoading, mutate } = useApi<App[]>("/jobs/me/applications");
  const action = useApiAction();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    try {
      await action(`/jobs/me/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, { silent: true });
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  const active = (apps ?? []).filter((a) => a.status !== "REJECTED" && a.status !== "WITHDRAWN");
  const closed = (apps ?? []).filter((a) => a.status === "REJECTED" || a.status === "WITHDRAWN");
  const byStage = (s: Status) => active.filter((a) => a.status === s);
  const offers = byStage("OFFER").length;
  const interviewing = byStage("INTERVIEW").length + byStage("OA").length;

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Your placement command center"
        title="Application Pipeline"
        subtitle="Every role you're chasing, from saved to offer. Move cards as you progress — deadlines surface automatically."
      />

      {/* Funnel stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Tracking" value={active.length} icon="briefcase" />
        <Stat label="In process" value={interviewing} icon="activity" tone="medium" />
        <Stat label="Offers" value={offers} icon="trophy" tone="easy" />
        <Stat label="Closed" value={closed.length} icon="doc" />
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} className="mt-8" />
      ) : active.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<Icons.briefcase width={28} height={28} />}
          title="Your pipeline is empty"
          description="Save roles from the jobs board and they'll appear here, ready to track through to an offer."
          action={<Link href="/jobs"><Button>Browse jobs</Button></Link>}
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {STAGES.map((stage) => {
            const items = byStage(stage.key);
            return (
              <div key={stage.key} className="rounded-2xl border border-border bg-surface-2/40 p-3">
                <div className="flex items-center justify-between px-1 mb-3">
                  <span className="font-display text-sm font-bold">{stage.label}</span>
                  <span className="text-text-4 font-mono text-xs">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.length === 0 && (
                    <div className="text-text-4 text-xs px-1 py-4 text-center">—</div>
                  )}
                  {items.map((a) => (
                    <AppCard
                      key={a.id}
                      app={a}
                      busy={busy === a.id}
                      onAdvance={NEXT[a.status] ? () => setStatus(a.id, NEXT[a.status]!) : undefined}
                      onReject={() => setStatus(a.id, "REJECTED")}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {closed.length > 0 && (
        <Reveal>
        <details className="mt-8 group">
          <summary className="cursor-pointer text-text-3 hover:text-text-1 text-sm select-none">
            Closed ({closed.length}) — rejected &amp; withdrawn
          </summary>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {closed.map((a) => (
              <Card key={a.id} className="opacity-70">
                <div className="text-sm font-medium">{a.job.title}</div>
                <div className="text-text-4 text-xs">{a.job.company}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={a.status === "OFFER" ? "easy" : "default"}>{a.status}</Badge>
                  <button onClick={() => setStatus(a.id, "SAVED")} className="text-accent text-xs hover:underline">Reopen</button>
                </div>
              </Card>
            ))}
          </div>
        </details>
        </Reveal>
      )}
    </PageMotion>
  );
}

function AppCard({ app: a, busy, onAdvance, onReject }: {
  app: App; busy: boolean; onAdvance?: () => void; onReject: () => void;
}) {
  const dl = deadline(a.job.closesAt);
  return (
    <div className={`rounded-xl border border-border bg-surface p-3 shadow-card transition-opacity ${busy ? "opacity-50" : ""}`}>
      <Link href={`/jobs/${a.job.slug}`} className="block group">
        <div className="text-sm font-semibold leading-snug group-hover:text-accent truncate">{a.job.title}</div>
        <div className="text-text-3 text-xs mt-0.5 truncate">{a.job.company} · {a.job.location}</div>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge>{a.job.role}</Badge>
        {dl && <Badge tone={dl.tone}>{dl.label}</Badge>}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {onAdvance && (
          <Button size="sm" onClick={onAdvance} disabled={busy} className="flex-1">
            Advance <Icons.arrow width={13} height={13} />
          </Button>
        )}
        <button
          onClick={onReject}
          disabled={busy}
          title="Mark closed"
          className="shrink-0 rounded-md border border-border px-2 py-1.5 text-text-4 hover:text-hard hover:border-hard/40 transition-colors text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function deadline(closesAt: string | null): { label: string; tone: "hard" | "medium" | "default" } | null {
  if (!closesAt) return null;
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Closed", tone: "default" };
  if (days === 0) return { label: "Closes today", tone: "hard" };
  if (days <= 3) return { label: `${days}d left`, tone: "hard" };
  if (days <= 7) return { label: `${days}d left`, tone: "medium" };
  return { label: `${days}d left`, tone: "default" };
}

function Stat({ label, value, icon, tone = "default" }: {
  label: string; value: number; icon: IconName; tone?: "default" | "medium" | "easy";
}) {
  const Icon = Icons[icon];
  const cls = tone === "easy" ? "text-easy" : tone === "medium" ? "text-medium" : "text-text-2";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-3">{label}</span>
        <span className={cls}><Icon width={16} height={16} /></span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold leading-none">{value}</div>
    </div>
  );
}
