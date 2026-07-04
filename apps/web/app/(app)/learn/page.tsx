"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Badge, Button, SkeletonRows, EmptyState, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";

type Course = {
  id: string; title: string; description: string; org: string;
  audience: string; lessons: number; enrolled: boolean; progressPct: number;
};

export default function LearnPage() {
  const { data, isLoading, mutate } = useApi<Course[]>("/org/catalog");
  const action = useApiAction();
  const [busy, setBusy] = useState<string | null>(null);

  async function enroll(id: string) {
    setBusy(id);
    try {
      await action(`/org/courses/${id}/enroll`, { method: "POST" }, { silent: true });
      toast.success("Enrolled — start learning.");
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl">
        <PageHeader title="Learn" subtitle="Courses from partner organisations — enroll and track your progress." />
        {isLoading ? (
          <div className="mt-6"><SkeletonRows /></div>
        ) : !data?.length ? (
          <div className="mt-6">
            <EmptyState title="No courses yet" description="Partner organisations haven't published courses yet. Check back soon." />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {data.map((c) => (
              <Card key={c.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone="accent">{c.org}</Badge>
                  <span className="text-xs text-text-3 ml-auto">{c.lessons} lesson{c.lessons === 1 ? "" : "s"}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg leading-tight">{c.title}</h3>
                  {c.description && <p className="text-sm text-text-2 mt-1 line-clamp-2">{c.description}</p>}
                </div>
                {c.enrolled && (
                  <div>
                    <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${c.progressPct}%` }} />
                    </div>
                    <p className="text-xs text-text-3 mt-1">{c.progressPct}% complete</p>
                  </div>
                )}
                <div className="mt-auto pt-1">
                  {c.enrolled ? (
                    <Link href={`/learn/${c.id}`} className="block">
                      <Button className="w-full">{c.progressPct > 0 ? "Continue" : "Start"}</Button>
                    </Link>
                  ) : (
                    <Button className="w-full" onClick={() => enroll(c.id)} disabled={busy === c.id}>
                      {busy === c.id ? "Enrolling…" : "Enroll"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageMotion>
  );
}
