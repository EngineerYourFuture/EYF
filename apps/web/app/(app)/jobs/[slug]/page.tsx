"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Job = {
  id: string; slug: string; company: string; title: string; role: string;
  location: string; remote: boolean; salaryMinInr: number | null; salaryMaxInr: number | null;
  experienceMin: number; description: string; applyUrl: string; postedAt: string;
};
type App = { id: string; status: string; job: { slug: string } };

const lpa = (n: number) => Math.round(n / 100_000);

export default function Page() {
  const params = useParams<{ slug: string }>();
  const { data } = useApi<Job>(`/jobs/${params.slug}`);
  const { data: apps, mutate } = useApi<App[]>("/jobs/me/applications");
  const action = useApiAction();
  const [saving, setSaving] = useState(false);
  const saved = (apps ?? []).some((a) => a.job.slug === params.slug);

  async function save() {
    setSaving(true);
    try {
      await action(`/jobs/${params.slug}/save`, { method: "POST" }, { silent: true });
      toast.success("Saved to your tracker.");
      await mutate();
    } catch {
      toast.error("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageMotion className="relative">
      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <Link href="/jobs" className="text-text-3 hover:text-text-1 text-sm inline-flex items-center gap-1.5">
          <span className="rotate-180"><Icons.arrow width={14} height={14} /></span> All jobs
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
                <h1 className="font-display text-3xl font-bold tracking-tight">{data.title}</h1>
                <p className="text-text-3 mt-1">{data.company} · {data.location}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge>{data.role}</Badge>
                  {data.remote && <Badge tone="accent">Remote</Badge>}
                  {data.experienceMin > 0 && <Badge>{data.experienceMin}+ yrs</Badge>}
                </div>
              </div>
            </div>

            {data.salaryMinInr && (
              <Card className="mt-6">
                <div className="text-xs font-mono uppercase tracking-wider text-text-3">Compensation</div>
                <div className="mt-1 font-display text-2xl font-bold">₹{lpa(data.salaryMinInr)}–{data.salaryMaxInr ? lpa(data.salaryMaxInr) : "?"}<span className="text-text-4 text-base font-semibold"> LPA</span></div>
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
