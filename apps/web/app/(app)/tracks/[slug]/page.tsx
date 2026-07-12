"use client";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

type Track = {
  id: string; slug: string; name: string; tagline: string; description: string;
  salaryMinInr: number; salaryMaxInr: number; weeks: number;
  patterns: string[]; topics: string[]; companies: string[];
  curriculum: { week: number; focus: string; problems?: string[]; notes?: string }[];
};

export default function Page({ params }: { params: { slug: string } }) {
  const { data } = useApi<Track>(`/tracks/${params.slug}`);
  const action = useApiAction();
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl font-bold tracking-tight">{data.name}</h1>
      <p className="text-text-3 mt-2 text-lg">{data.tagline}</p>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Card><div className="text-xs text-text-3 uppercase">Salary band</div><div className="font-display text-xl font-bold mt-1">₹{Math.round(data.salaryMinInr / 100_000)}–{Math.round(data.salaryMaxInr / 100_000)} LPA</div></Card>
        <Card><div className="text-xs text-text-3 uppercase">Prep arc</div><div className="font-display text-xl font-bold mt-1">{data.weeks} weeks</div></Card>
        <Card><div className="text-xs text-text-3 uppercase">Companies</div><div className="font-display text-xl font-bold mt-1">{data.companies.length}+</div></Card>
      </div>

      <Card className="mt-6 whitespace-pre-wrap text-text-2 leading-relaxed">{data.description}</Card>

      <Card className="mt-6">
        <h2 className="font-display text-xl font-bold">Curriculum</h2>
        <div className="mt-4 space-y-3">
          {data.curriculum?.map((c) => (
            <div key={c.week} className="border-l-2 border-accent pl-4">
              <div className="text-text-3 text-xs uppercase">Week {c.week}</div>
              <div className="font-medium">{c.focus}</div>
              {c.notes && <div className="text-text-3 text-sm mt-1">{c.notes}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="font-display text-lg font-bold mb-2">Key patterns</h3>
        <div className="flex flex-wrap gap-2">{data.patterns.map((p) => <Badge key={p} tone="accent">{p}</Badge>)}</div>
        <h3 className="font-display text-lg font-bold mt-4 mb-2">Target companies</h3>
        <div className="flex flex-wrap gap-2">{data.companies.map((c) => <Badge key={c}>{c}</Badge>)}</div>
      </Card>

      <div className="mt-8 sticky bottom-6">
        <Button size="lg" onClick={() => action(`/tracks/${params.slug}/choose`, { method: "POST" })}>
          Make this my primary track →
        </Button>
      </div>
    </div>
  );
}
