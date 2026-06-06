"use client";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

type Thread = {
  id: string; slug: string; title: string; category: string;
  pinned: boolean; locked: boolean; viewCount: number; postCount: number;
  lastPostAt: string; author: { name: string };
};

export default function Page() {
  const { data, mutate } = useApi<Thread[]>("/forum/threads?limit=50");
  const action = useApiAction();

  async function toggle(t: Thread, op: "lock" | "unlock" | "pin") {
    await action(`/admin/mod/forum/threads/${t.id}/${op}`, { method: "POST" });
    await mutate();
  }
  async function del(t: Thread) {
    if (!confirm(`Delete "${t.title}"? Irreversible.`)) return;
    await action(`/admin/mod/forum/threads/${t.id}`, { method: "DELETE" });
    await mutate();
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Forum moderation</h1>
      <p className="text-text-3 mt-2">Recent {data?.length ?? 0} threads</p>

      <div className="mt-8 space-y-2">
        {data?.map((t) => (
          <Card key={t.id} className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {t.pinned && <Badge tone="accent">📌</Badge>}
                {t.locked && <Badge tone="hard">🔒</Badge>}
                <Badge>{t.category}</Badge>
                <span className="font-display text-base">{t.title}</span>
              </div>
              <div className="text-text-3 text-xs mt-1">by {t.author.name} · {t.postCount} posts · {t.viewCount} views</div>
            </div>
            <div className="flex gap-2">
              {!t.pinned && <Button size="sm" variant="ghost" onClick={() => toggle(t, "pin")}>Pin</Button>}
              {t.locked
                ? <Button size="sm" variant="ghost" onClick={() => toggle(t, "unlock")}>Unlock</Button>
                : <Button size="sm" variant="ghost" onClick={() => toggle(t, "lock")}>Lock</Button>}
              <Button size="sm" variant="ghost" onClick={() => del(t)} className="text-hard">Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
