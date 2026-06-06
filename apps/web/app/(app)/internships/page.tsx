"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonRows, EmptyState, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";

type Internship = {
  id: string; slug: string; company: string; role: string;
  duration: string; stipendInr: number; location: string; remote: boolean;
  ppoConversion: number | null; deadlineAt: string | null;
};
type App = { id: string; status: string; internship: Internship };

export default function Page() {
  const { data, isLoading } = useApi<Internship[]>("/internships");
  const { data: apps, mutate } = useApi<App[]>("/internships/me/applications");
  const action = useApiAction();

  async function save(slug: string) {
    await action(`/internships/${slug}/save`, { method: "POST" });
    toast.success("Saved to your tracker.");
    await mutate();
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl">
      <PageHeader title="Internships" subtitle="2nd/3rd year? This is your entry point. PPO conversion data where we have it." />

      <div className="mt-8 grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-2">
          {isLoading && <SkeletonRows rows={5} />}
          {data && data.length === 0 && (
            <EmptyState icon="🎓" title="No internships listed" description="New roles are added each drive season. Check back soon." />
          )}
          {data?.map((i) => (
            <Link key={i.id} href={`/internships/${i.slug}`}>
              <Card className="hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold">{i.role}</span>
                      {i.remote && <Badge tone="accent">Remote</Badge>}
                      {i.ppoConversion != null && <Badge tone="easy">{Math.round(i.ppoConversion * 100)}% PPO</Badge>}
                    </div>
                    <div className="text-text-3 text-xs mt-1">
                      {i.company} · {i.location} · ₹{(i.stipendInr).toLocaleString("en-IN")}/mo · {i.duration.replace("_", " ")}
                    </div>
                  </div>
                  <Button size="sm" onClick={(e) => { e.preventDefault(); save(i.slug); }}>Save</Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <aside>
          <h2 className="font-display text-lg font-bold mb-3">My applications</h2>
          <div className="space-y-2">
            {apps?.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="text-sm font-medium">{a.internship.role}</div>
                <div className="text-text-3 text-xs">{a.internship.company}</div>
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
