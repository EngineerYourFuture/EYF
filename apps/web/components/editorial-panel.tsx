"use client";
import { useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Editorial = {
  approach: string;
  textSolution: string;
  timeComplexity: string;
  spaceComplexity: string;
  pitfalls?: string | null;
};
type Variant = {
  id: string; title: string; description: string; twistExplanation: string; createdAt: string;
};

export function EditorialPanel({ slug }: { slug: string }) {
  const [tab, setTab] = useState<"editorial" | "variants">("editorial");
  return (
    <Card className="mt-4">
      <div className="flex gap-1 border-b border-border mb-4">
        {(["editorial", "variants"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm border-b-2 transition-colors capitalize ${
              tab === t ? "border-accent text-text-1" : "border-transparent text-text-3 hover:text-text-2"
            }`}
          >{t}</button>
        ))}
      </div>
      {tab === "editorial" && <EditorialTab slug={slug} />}
      {tab === "variants"  && <VariantsTab slug={slug} />}
    </Card>
  );
}

function EditorialTab({ slug }: { slug: string }) {
  const { data, error } = useApi<Editorial>(`/admin/problems/${slug}/editorial`);
  if (error?.message?.includes("PLAN_UPGRADE_REQUIRED") || (error as { code?: string })?.code === "PLAN_UPGRADE_REQUIRED") {
    return (
      <div className="text-center py-8">
        <Badge tone="accent">Basic+</Badge>
        <p className="text-text-3 text-sm mt-3">Editorials are part of Basic. <a href="/billing" className="text-accent hover:underline">Upgrade</a> to read.</p>
      </div>
    );
  }
  if (error) return <p className="text-text-3 text-sm">No editorial yet — try again later.</p>;
  if (!data) return <p className="text-text-3 text-sm">Loading…</p>;
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs text-text-3 uppercase tracking-wider mb-1">Approach</h4>
        <p className="text-text-2">{data.approach}</p>
      </div>
      <div>
        <h4 className="text-xs text-text-3 uppercase tracking-wider mb-1">Walk-through</h4>
        <div className="whitespace-pre-wrap text-text-2 leading-relaxed">{data.textSolution}</div>
      </div>
      <div className="flex gap-3 text-sm">
        <Badge>Time: {data.timeComplexity}</Badge>
        <Badge>Space: {data.spaceComplexity}</Badge>
      </div>
      {data.pitfalls && (
        <div>
          <h4 className="text-xs text-text-3 uppercase tracking-wider mb-1">Pitfalls</h4>
          <p className="text-text-2 text-sm">{data.pitfalls}</p>
        </div>
      )}
    </div>
  );
}

function VariantsTab({ slug }: { slug: string }) {
  const { data } = useApi<Variant[]>(`/admin/problems/${slug}/variants`);
  if (!data) return <p className="text-text-3 text-sm">Loading…</p>;
  if (data.length === 0) return <p className="text-text-3 text-sm">No variants generated yet.</p>;
  return (
    <div className="space-y-4">
      {data.map((v) => (
        <div key={v.id} className="border-l-2 border-accent pl-4">
          <h4 className="font-display text-base font-semibold">{v.title}</h4>
          <p className="text-text-2 text-sm mt-1 whitespace-pre-wrap">{v.description}</p>
          <p className="text-text-3 text-xs mt-2 italic">{v.twistExplanation}</p>
          <Button size="sm" variant="ghost" className="mt-2">Try variant</Button>
        </div>
      ))}
    </div>
  );
}
