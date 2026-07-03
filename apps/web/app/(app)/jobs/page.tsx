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
type App = { id: string; status: string; notes: string | null; job: Job };

const ROLES = ["SDE","FULLSTACK","BACKEND","FRONTEND","DATA","ML","DEVOPS","ANDROID","IOS","QA","PM","DESIGN"];
const STATUS_TONE: Record<string, "default" | "accent" | "medium" | "easy" | "hard"> = {
  SAVED: "default", APPLIED: "accent", OA: "medium", INTERVIEW: "medium", OFFER: "easy", REJECTED: "hard", WITHDRAWN: "default",
};
const lpa = (n: number) => Math.round(n / 100_000);

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
      await action(`/jobs/${slug}/save`, { method: "POST" }, { silent: true });
      toast.success("Saved to your tracker.");
      await mutate();
    } finally {
      setSaving(null);
    }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Find · save · track"
        title="Jobs"
        subtitle="Roles worth your time, with real comp bands — saved straight into a pipeline you can drive to an offer."
      />

      <div className="mt-6 flex items-center gap-2 text-sm">
        <label className="text-text-3 uppercase text-xs tracking-wider">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="bg-surface border border-border rounded-md px-2.5 py-1.5 focus:border-accent/50 outline-none">
          <option value="">All</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          {isLoading ? (
            <SkeletonRows rows={6} />
          ) : jobs && jobs.length === 0 ? (
            <EmptyState icon={<Icons.briefcase width={28} height={28} />} title="No jobs for this filter" description="Try a different role, or check back — new roles are added regularly." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {jobs?.map((j) => (
                <JobCard key={j.id} j={j} saved={savedSlugs.has(j.slug)} saving={saving === j.slug} onSave={() => save(j.slug)} />
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">My tracker</h2>
            <Link href="/pipeline" className="text-accent text-sm hover:underline">Open pipeline →</Link>
          </div>
          <div className="space-y-2">
            {apps?.map((a) => (
              <Link key={a.id} href={`/jobs/${a.job.slug}`}>
                <Card className="p-4 hover:border-edge transition-colors">
                  <div className="text-sm font-medium truncate">{a.job.title}</div>
                  <div className="text-text-4 text-xs">{a.job.company}</div>
                  <Badge tone={STATUS_TONE[a.status] ?? "accent"} className="mt-2">{a.status}</Badge>
                </Card>
              </Link>
            ))}
            {apps && apps.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-text-3 text-sm">Nothing saved yet.</p>
                <p className="text-text-4 text-xs mt-1">Save roles to track them to an offer.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageMotion>
  );
}

function JobCard({ j, saved, saving, onSave }: { j: Job; saved: boolean; saving: boolean; onSave: () => void }) {
  return (
    <Link href={`/jobs/${j.slug}`}>
      <Card interactive className="flex h-full flex-col">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-tint font-display font-bold text-accent">
            {j.company[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold leading-tight truncate">{j.title}</div>
            <div className="text-text-3 text-sm truncate">{j.company} · {j.location}</div>
          </div>
          {j.remote && <Badge tone="accent">Remote</Badge>}
        </div>

        {j.salaryMinInr ? (
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold">₹{lpa(j.salaryMinInr)}–{j.salaryMaxInr ? lpa(j.salaryMaxInr) : "?"}</span>
            <span className="text-text-4 text-sm">LPA</span>
          </div>
        ) : (
          <div className="mt-4 text-text-4 text-sm">Comp undisclosed</div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{j.role}</Badge>
        </div>

        <div className="mt-auto pt-5">
          {saved
            ? <Badge tone="easy">✓ Saved to tracker</Badge>
            : <Button size="sm" className="w-full" onClick={(e) => { e.preventDefault(); onSave(); }} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>}
        </div>
      </Card>
    </Link>
  );
}
