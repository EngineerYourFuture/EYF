"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonRows, EmptyState, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Job = {
  id: string; slug: string; company: string; title: string;
  role: string; location: string; remote: boolean;
  salaryMinInr: number | null; salaryMaxInr: number | null;
  postedAt: string;
};
type App = {
  id: string; status: string; notes: string | null;
  job: Job;
};

const ROLES = ["SDE","FULLSTACK","BACKEND","FRONTEND","DATA","ML","DEVOPS","ANDROID","IOS","QA","PM","DESIGN"];

export default function Page() {
  const [role, setRole] = useState<string>("");
  const { data: jobs, isLoading } = useApi<Job[]>(`/jobs${role ? `?role=${role}` : ""}`);
  const { data: apps, mutate } = useApi<App[]>("/jobs/me/applications");
  const action = useApiAction();
  const [saving, setSaving] = useState<string | null>(null);
  const savedSlugs = new Set((apps ?? []).map((a) => a.job.slug));

  async function save(slug: string) {
    setSaving(slug);
    try {
      await action(`/jobs/${slug}/save`, { method: "POST" });
      toast.success("Saved to your tracker.");
      await mutate();
    } finally {
      setSaving(null);
    }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <PageHeader title="Jobs" subtitle="Find them, save them, track them — Kanban for your apps." />

      <div className="mt-6 flex items-center gap-2 text-sm">
        <label className="text-text-3 uppercase text-xs tracking-wider">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="bg-surface border border-border rounded-md px-2 py-1">
          <option value="">All</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-2">
          {isLoading && <SkeletonRows rows={6} />}
          {jobs && jobs.length === 0 && (
            <EmptyState icon={<Icons.briefcase width={28} height={28} />} title="No jobs for this filter" description="Try a different role, or check back — new roles are added regularly." />
          )}
          {jobs?.map((j) => (
            <Card key={j.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold">{j.title}</span>
                  <Badge>{j.role}</Badge>
                  {j.remote && <Badge tone="accent">Remote</Badge>}
                </div>
                <div className="text-text-3 text-xs mt-1">
                  {j.company} · {j.location}
                  {j.salaryMinInr && ` · ₹${Math.round(j.salaryMinInr / 100_000)}–${j.salaryMaxInr ? Math.round(j.salaryMaxInr / 100_000) : "?"} LPA`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/jobs/${j.slug}`}><Button size="sm" variant="ghost">View</Button></Link>
                {savedSlugs.has(j.slug)
                  ? <Badge tone="easy">✓ Saved</Badge>
                  : <Button size="sm" onClick={() => save(j.slug)} disabled={saving === j.slug}>{saving === j.slug ? "…" : "Save"}</Button>}
              </div>
            </Card>
          ))}
        </div>

        <aside>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">My tracker</h2>
            <Link href="/pipeline" className="text-accent text-sm hover:underline">Open pipeline →</Link>
          </div>
          <div className="space-y-2">
            {apps?.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="text-sm font-medium">{a.job.title}</div>
                <div className="text-text-3 text-xs">{a.job.company}</div>
                <Badge tone="accent" className="mt-2">{a.status}</Badge>
              </Card>
            ))}
            {apps && apps.length === 0 && <p className="text-text-3 text-sm">Nothing saved yet.</p>}
          </div>
        </aside>
      </div>
    </PageMotion>
  );
}
