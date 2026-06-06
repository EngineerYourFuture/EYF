"use client";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { Icons } from "@/components/icons";

type Pending = {
  id: string; company: string; jobTitle: string; yearsExp: number;
  expertise: string[]; hourlyRateInr: number; bio: string | null;
  verificationDocs: string[]; createdAt: string;
  user: { name: string; email: string };
};

export default function Page() {
  const { data, mutate } = useApi<Pending[]>("/admin/mod/mentors/pending");
  const action = useApiAction();

  async function verify(id: string) {
    if (!confirm("Verify this mentor?")) return;
    await action(`/admin/mod/mentors/${id}/verify`, { method: "POST" });
    await mutate();
  }
  async function reject(id: string) {
    if (!confirm("Reject + delete this application?")) return;
    await action(`/admin/mod/mentors/${id}/reject`, { method: "POST" });
    await mutate();
  }

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Mentor verification queue</h1>
      <p className="text-text-3 mt-2">{data?.length ?? 0} pending</p>

      <div className="mt-8 space-y-3">
        {!data && <SkeletonRows rows={2} />}
        {data?.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-display text-lg font-bold">{m.user.name}</div>
                <div className="text-text-3 text-xs">{m.user.email}</div>
                <div className="mt-2 text-sm">{m.jobTitle} @ {m.company} · {m.yearsExp}y · ₹{m.hourlyRateInr}/hr</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.expertise.map((e) => <Badge key={e} tone="accent">{e}</Badge>)}
                </div>
                {m.bio && <p className="text-text-2 text-sm mt-3 leading-relaxed">{m.bio}</p>}
                {m.verificationDocs.length > 0 && (
                  <div className="text-text-3 text-xs mt-2">{m.verificationDocs.length} verification doc(s) attached</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => verify(m.id)}>Verify</Button>
                <Button size="sm" variant="ghost" onClick={() => reject(m.id)}>Reject</Button>
              </div>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.users width={28} height={28} />} title="Queue is clear"
            description="No mentor applications waiting for review. New applications will appear here." />
        )}
      </div>
    </div>
  );
}
