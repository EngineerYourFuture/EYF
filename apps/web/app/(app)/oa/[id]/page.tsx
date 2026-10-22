"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { difficultyTone } from "@/lib/ui-helpers";
import { LoadError, loadFailed } from "@/components/load-error";

type Report = {
  id: string; company: string; role: string; driveDate: string;
  durationMin: number; sections: string[]; difficulty: string;
  patterns: string[]; notes: string; helpfulCount: number;
  author: { name: string; college: string | null };
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data, error, mutate } = useApi<Report>(`/oa/${params.id}`);
  const action = useApiAction();
  const [voting, setVoting] = useState(false);
  if (loadFailed(error, data)) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto"><LoadError page error={error} what="report" retry={() => mutate()} back={{ href: "/oa", label: "All OA reports" }} /></div>;
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  async function helpful() {
    if (voting) { return; }
    setVoting(true);
    try {
      await action(`/oa/${params.id}/helpful`, { method: "POST" });
      await mutate();
    } catch {
      /* toasted */
    } finally { setVoting(false); }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-2">
        <Badge>{data.role}</Badge>
        <Badge tone={difficultyTone(data.difficulty)}>{data.difficulty}</Badge>
      </div>
      <h1 className="type-display mt-3">{data.company}</h1>
      <p className="text-text-3 mt-1">
        Drive on {new Date(data.driveDate).toLocaleDateString("en-IN")} · {data.durationMin}m · reported by {data.author.name}
        {data.author.college ? ` (${data.author.college})` : ""}
      </p>

      <Card className="mt-6">
        <div className="text-xs text-text-3 uppercase mb-2">Sections</div>
        <div className="flex flex-wrap gap-2">{data.sections.map((s) => <Badge key={s}>{s}</Badge>)}</div>
        {data.patterns.length > 0 && <>
          <div className="text-xs text-text-3 uppercase mt-4 mb-2">Patterns seen</div>
          <div className="flex flex-wrap gap-2">{data.patterns.map((p) => <Badge key={p} tone="accent">{p}</Badge>)}</div>
        </>}
      </Card>

      <Card className="mt-4 whitespace-pre-wrap text-text-2 leading-relaxed">{data.notes}</Card>

      <Button className="mt-4" variant="secondary" onClick={helpful} disabled={voting}>👍 Helpful ({data.helpfulCount})</Button>
    </div>
  );
}
