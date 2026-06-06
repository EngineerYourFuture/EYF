"use client";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

type Job = {
  id: string; slug: string; company: string; title: string; role: string;
  location: string; remote: boolean; salaryMinInr: number | null; salaryMaxInr: number | null;
  experienceMin: number; description: string; applyUrl: string; postedAt: string;
};

export default function Page({ params }: { params: { slug: string } }) {
  const { data } = useApi<Job>(`/jobs/${params.slug}`);
  const action = useApiAction();
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-2">
        <Badge>{data.role}</Badge>
        {data.remote && <Badge tone="accent">Remote</Badge>}
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight mt-3">{data.title}</h1>
      <p className="text-text-3 mt-1">{data.company} · {data.location}</p>
      {data.salaryMinInr && (
        <p className="mt-2 font-mono text-accent">
          ₹{Math.round(data.salaryMinInr / 100_000)}–{data.salaryMaxInr ? Math.round(data.salaryMaxInr / 100_000) : "?"} LPA
        </p>
      )}
      <Card className="mt-8 whitespace-pre-wrap text-text-2 leading-relaxed">{data.description}</Card>
      <div className="mt-6 flex gap-3">
        <a href={data.applyUrl} target="_blank" rel="noreferrer"><Button>Apply</Button></a>
        <Button variant="secondary" onClick={() => action(`/jobs/${params.slug}/save`, { method: "POST" })}>
          Save to tracker
        </Button>
      </div>
    </div>
  );
}
