"use client";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

type Report = {
  id: string; company: string; role: string; driveDate: string;
  durationMin: number; sections: string[]; difficulty: string;
  patterns: string[]; notes: string; helpfulCount: number;
  author: { name: string; college: string | null };
};

export default function Page({ params }: { params: { id: string } }) {
  const { data, mutate } = useApi<Report>(`/oa/${params.id}`);
  const action = useApiAction();
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  async function helpful() {
    await action(`/oa/${params.id}/helpful`, { method: "POST" });
    await mutate();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-2">
        <Badge>{data.role}</Badge>
        <Badge tone={data.difficulty === "HARD" ? "hard" : data.difficulty === "EASY" ? "easy" : "medium"}>{data.difficulty}</Badge>
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight mt-3">{data.company}</h1>
      <p className="text-text-3 mt-1">
        Drive on {new Date(data.driveDate).toLocaleDateString()} · {data.durationMin}m · reported by {data.author.name}
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

      <Button className="mt-4" variant="secondary" onClick={helpful}>👍 Helpful ({data.helpfulCount})</Button>
    </div>
  );
}
