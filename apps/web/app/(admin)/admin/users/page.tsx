"use client";
import { useState } from "react";
import { Card, Badge, Button, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

const ROLES = ["GUEST", "STUDENT_FREE", "STUDENT_BASIC", "STUDENT_PRO", "STUDENT_ELITE", "MENTOR", "MODERATOR", "CONTENT_CREATOR", "ADMIN"] as const;
const PLANS = ["FREE", "BASIC", "PRO", "ELITE"] as const;

type Row = {
  id: string; name: string; email: string; role: string; plan: string;
  college: string | null; createdAt: string; suspended: boolean; subscriptionStatus: string | null;
};

const selectCls = "h-8 px-2 rounded-md bg-surface border border-border text-text-2 text-xs focus:outline-none focus:border-accent";

export default function Page() {
  const [q, setQ] = useState("");
  const { data, mutate } = useApi<Row[]>(`/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  const { data: me } = useApi<{ user: { id: string } }>("/me");
  const action = useApiAction();
  const myId = me?.user?.id;

  async function patch(path: string, body: object) {
    try { await action(path, { method: "PATCH", body: JSON.stringify(body) }); } catch { /* toasted */ }
    await mutate(); // re-sync from server (reverts a rejected change)
  }
  const setRole = (id: string, role: string) => patch(`/admin/users/${id}/role`, { role });
  const setPlan = (id: string, plan: string) => patch(`/admin/users/${id}/plan`, { plan });
  async function toggleSuspend(u: Row) {
    if (!confirm(`${u.suspended ? "Restore" : "Suspend"} ${u.name}?`)) return;
    await patch(`/admin/users/${u.id}/status`, { suspended: !u.suspended });
  }

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
      <p className="text-text-3 mt-2">{data?.length ?? 0} users · manage roles, plans, and access.</p>

      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…"
        className="mt-6 w-full max-w-sm h-10 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent"
      />

      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={5} />}
        {data?.map((u) => {
          const isSelf = u.id === myId;
          return (
            <Card key={u.id} className={`flex items-center gap-4 py-3 ${u.suspended ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{u.name}</span>
                  {isSelf && <Badge tone="accent">You</Badge>}
                  {u.suspended && <Badge tone="hard">Suspended</Badge>}
                </div>
                <div className="text-text-4 text-xs mt-0.5 truncate">
                  {u.email}{u.college ? ` · ${u.college}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select className={selectCls} value={u.role} disabled={isSelf}
                  onChange={(e) => setRole(u.id, e.target.value)} title={isSelf ? "You can't change your own role" : "Role"}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className={selectCls} value={u.plan}
                  onChange={(e) => setPlan(u.id, e.target.value)} title="Plan">
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <Button size="sm" variant={u.suspended ? "secondary" : "ghost"} disabled={isSelf} onClick={() => toggleSuspend(u)}>
                  {u.suspended ? "Restore" : "Suspend"}
                </Button>
              </div>
            </Card>
          );
        })}
        {data?.length === 0 && <p className="text-text-3 text-sm py-8 text-center">No users match &quot;{q}&quot;.</p>}
      </div>
    </div>
  );
}
