"use client";
import { useState } from "react";
import { Card, Badge, SkeletonRows } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Log = {
  id: string; actorEmail: string; action: string; entity: string;
  entityId: string; summary: string; createdAt: string;
};

const ENTITIES = ["", "problem", "job", "career-track", "user"] as const;
const actionTone = (a: string) => {
  if (a === "create") return "easy";
  if (a === "delete") return "hard";
  if (a === "update") return "medium";
  return "accent";
};

export default function Page() {
  const [entity, setEntity] = useState("");
  const { data } = useApi<Log[]>(`/admin/audit${entity ? "?entity=" + entity : ""}`);

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Audit log</h1>
      <p className="text-text-3 mt-2">Who changed what in the back-office. Newest first.</p>

      <div className="mt-6 flex gap-1 flex-wrap">
        {ENTITIES.map((e) => (
          <button key={e || "all"} onClick={() => setEntity(e)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${entity === e ? "bg-surface text-text-1 border border-border" : "text-text-3 hover:text-text-1"}`}>
            {e || "All"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={6} />}
        {data?.map((l) => (
          <Card key={l.id} className="flex items-start gap-4 py-3">
            <Badge tone={actionTone(l.action)}>{l.action}</Badge>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-text-1">{l.summary}</div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                {l.actorEmail} · {l.entity} · {new Date(l.createdAt).toLocaleString("en-IN")}
              </div>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <p className="text-text-3 text-sm py-8 text-center">No audit entries{entity ? ` for ${entity}` : ""} yet.</p>
        )}
      </div>
    </div>
  );
}
