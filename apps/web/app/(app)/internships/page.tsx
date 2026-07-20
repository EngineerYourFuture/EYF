"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonRows, EmptyState, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { InternshipExchange } from "@/components/internship-exchange";
import { Icons } from "@/components/icons";

type Internship = {
  id: string; slug: string; company: string; role: string;
  duration: string; stipendInr: number; location: string; remote: boolean;
  ppoConversion: number | null; deadlineAt: string | null;
};
type App = { id: string; status: string; internship: Internship };

const STATUS_TONE: Record<string, "default" | "accent" | "medium" | "easy" | "hard"> = {
  SAVED: "default", APPLIED: "accent", INTERVIEW: "medium", OFFER: "easy", REJECTED: "hard",
};
const fmtDuration = (d: string) => {
  const [unit, n] = d.split("_");
  return n ? `${n} ${unit!.toLowerCase()}` : d.toLowerCase();
};

export default function Page() {
  const { data, isLoading } = useApi<Internship[]>("/internships");
  const { data: apps, mutate } = useApi<App[]>("/internships/me/applications");
  const action = useApiAction();
  const [saving, setSaving] = useState<string | null>(null);
  const savedSlugs = new Set((apps ?? []).map((a) => a.internship.slug));

  async function save(slug: string) {
    setSaving(slug);
    try {
      await action(`/internships/${slug}/save`, { method: "POST" }, { silent: true });
      toast.success("Saved to your tracker.");
      await mutate();
    } finally {
      setSaving(null);
    }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Your entry point"
        title="Internships"
        subtitle="2nd or 3rd year? Start here. We surface PPO conversion data so you chase the internships that actually turn into jobs."
      />

      <div className="mt-8"><InternshipExchange /></div>

      <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          {(() => {
  if (isLoading) return (
            <SkeletonRows rows={5} />
          );
  if (data?.length === 0) return (
            <EmptyState icon={<Icons.building width={28} height={28} />} title="No internships listed" description="New roles are added each drive season. Check back soon." />
          );
  return (
            <div className="grid sm:grid-cols-2 gap-4">
              {data?.map((i) => (
                <InternCard key={i.id} i={i} saved={savedSlugs.has(i.slug)} saving={saving === i.slug} onSave={() => save(i.slug)} />
              ))}
            </div>
          );
})()}
        </div>

        <aside>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">My applications</h2>
            {apps && apps.length > 0 && <span className="text-text-4 font-mono text-xs">{apps.length}</span>}
          </div>
          <div className="space-y-2">
            {apps?.map((a) => (
              <Link key={a.id} href={`/internships/${a.internship.slug}`}>
                <Card className="p-4 hover:border-edge transition-colors">
                  <div className="text-sm font-medium truncate">{a.internship.role}</div>
                  <div className="text-text-4 text-xs">{a.internship.company}</div>
                  <Badge tone={STATUS_TONE[a.status] ?? "accent"} className="mt-2">{a.status}</Badge>
                </Card>
              </Link>
            ))}
            {apps?.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-text-3 text-sm">Nothing saved yet.</p>
                <p className="text-text-4 text-xs mt-1">Save internships to track them here.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageMotion>
  );
}

function InternCard({ i, saved, saving, onSave }: Readonly<{ i: Internship; saved: boolean; saving: boolean; onSave: () => void }>) {
  const ppo = i.ppoConversion != null ? Math.round(i.ppoConversion * 100) : null;
  return (
    <Link href={`/internships/${i.slug}`} className="min-w-0">
      <Card interactive className="flex h-full flex-col min-w-0">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-tint font-display font-bold text-accent">
            {i.company[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold leading-tight truncate">{i.role}</div>
            <div className="text-text-3 text-sm truncate">{i.company}</div>
          </div>
          {i.remote && <Badge tone="accent">Remote</Badge>}
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold">₹{i.stipendInr.toLocaleString("en-IN")}</span>
          <span className="text-text-4 text-sm">/mo</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{fmtDuration(i.duration)}</Badge>
          <Badge>{i.location}</Badge>
        </div>

        {ppo != null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-3">PPO conversion</span>
              <span className="font-mono text-easy">{ppo}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full rounded-full bg-easy" style={{ width: `${ppo}%` }} />
            </div>
          </div>
        )}

        <div className="mt-5 pt-1">
          {saved
            ? <Badge tone="easy">✓ Saved to tracker</Badge>
            : <Button size="sm" className="w-full" onClick={(e) => { e.preventDefault(); onSave(); }} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>}
        </div>
      </Card>
    </Link>
  );
}
