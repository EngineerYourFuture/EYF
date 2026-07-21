"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Internship = {
  id: string; slug: string; company: string; role: string;
  duration: string; stipendInr: number; location: string; remote: boolean;
  description: string; applyUrl: string; eligibility: string | null;
  ppoConversion: number | null; deadlineAt: string | null;
};
type App = { id: string; status: string; internship: { slug: string } };

const fmtDuration = (d: string) => {
  const [unit, n] = d.split("_");
  return n ? `${n} ${unit!.toLowerCase()}` : d.toLowerCase();
};

export default function Page() {
  const params = useParams<{ slug: string }>();
  const { data } = useApi<Internship>(`/internships/${params.slug}`);
  const { data: apps, mutate } = useApi<App[]>("/internships/me/applications");
  const action = useApiAction();
  const [saving, setSaving] = useState(false);
  const saved = (apps ?? []).some((a) => a.internship.slug === params.slug);

  async function save() {
    setSaving(true);
    try {
      await action(`/internships/${params.slug}/save`, { method: "POST" }, { silent: true });
      toast.success("Saved to your tracker.");
      await mutate();
    } catch {
      toast.error("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  const ppo = data?.ppoConversion != null ? Math.round(data.ppoConversion * 100) : null;
  const daysLeft = data?.deadlineAt ? Math.ceil((new Date(data.deadlineAt).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <PageMotion className="relative">
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <Link href="/internships" className="text-text-3 hover:text-text-1 text-sm inline-flex items-center gap-1.5">
          <span className="rotate-180"><Icons.arrow width={14} height={14} /></span> All internships
        </Link>

        {!data ? (
          <div className="mt-6 space-y-4"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
        ) : (
          <>
            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-tint font-display text-2xl font-bold text-accent">
                {data.company[0]}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-bold tracking-tight">{data.role}</h1>
                <p className="text-text-3 mt-1">{data.company} · {data.location}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.remote && <Badge tone="accent">Remote</Badge>}
                  <Badge>{fmtDuration(data.duration)}</Badge>
                  {daysLeft != null && daysLeft >= 0 && <Badge tone={daysLeft <= 5 ? "hard" : "medium"}>{daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Card>
                <div className="text-xs font-mono uppercase tracking-wider text-text-3">Stipend</div>
                <div className="mt-1 font-display text-2xl font-bold">₹{data.stipendInr.toLocaleString("en-IN")}<span className="text-text-4 text-base font-semibold">/mo</span></div>
              </Card>
              {ppo != null && (
                <Card>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-wider text-text-3">PPO conversion</span>
                    <span className="font-mono text-easy">{ppo}%</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-easy" style={{ width: `${ppo}%` }} />
                  </div>
                  <div className="text-text-4 text-xs mt-2">of interns convert to a full-time offer</div>
                </Card>
              )}
            </div>

            {data.eligibility && (
              <Card className="mt-4">
                <div className="text-xs font-mono uppercase tracking-wider text-text-3 mb-1">Eligibility</div>
                <p className="text-text-2 text-sm">{data.eligibility}</p>
              </Card>
            )}

            <Card className="mt-4 whitespace-pre-wrap text-text-2 leading-relaxed">{data.description}</Card>

            <div className="mt-6 flex gap-3">
              <a href={data.applyUrl} target="_blank" rel="noreferrer"><Button glow>Apply <Icons.arrow width={14} height={14} /></Button></a>
              {saved
                ? <Button variant="secondary" disabled><span className="text-easy">✓</span> Saved</Button>
                : <Button variant="secondary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save to tracker"}</Button>}
            </div>
          </>
        )}
      </div>
    </PageMotion>
  );
}
