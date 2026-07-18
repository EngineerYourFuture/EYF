"use client";
import Link from "next/link";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

type Report = {
  id: string; company: string; role: string; driveDate: string;
  durationMin: number; sections: string[]; difficulty: string;
  patterns: string[]; helpfulCount: number;
  author: { name: string };
};

export default function Page() {
  const { data, mutate } = useApi<Report[]>("/oa?limit=50");
  const action = useApiAction();
  const confirm = useConfirm();

  async function del(r: Report) {
    if (!(await confirm({ title: `Delete OA report for ${r.company} · ${r.role}?`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await action(`/admin/mod/oa/${r.id}`, { method: "DELETE" }, { silent: true });
      toast.success("Deleted.");
      await mutate();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">OA Reports · moderation</h1>
      <p className="text-text-3 mt-2">{data?.length ?? 0} reports loaded</p>

      <div className="mt-8 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold">{r.company}</span>
                <Badge>{r.role}</Badge>
                <Badge tone={r.difficulty === "HARD" ? "hard" : r.difficulty === "EASY" ? "easy" : "medium"}>{r.difficulty}</Badge>
                <span className="text-text-3 text-xs">{new Date(r.driveDate).toLocaleDateString()} · {r.durationMin}m · 👍 {r.helpfulCount}</span>
              </div>
              <div className="text-text-3 text-xs mt-1">by {r.author.name}</div>
              {r.patterns.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.patterns.slice(0, 6).map((p) => (
                    <span key={p} className="text-xs font-mono text-text-3 px-2 py-0.5 border border-border rounded">{p}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href={`/oa/${r.id}`}><Button size="sm" variant="ghost">View</Button></Link>
              <Button size="sm" variant="ghost" onClick={() => del(r)} className="text-hard">Delete</Button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.target width={28} height={28} />} title="No reports yet"
            description="Community-submitted OA reports will appear here for curation." />
        )}
      </div>
    </div>
  );
}
