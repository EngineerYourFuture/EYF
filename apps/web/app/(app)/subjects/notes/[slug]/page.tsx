"use client";
import { Card, Badge } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Note = { title: string; subject: string; content: string; estMinutes: number; premium: boolean };

export default function Page({ params }: { params: { slug: string } }) {
  const { data, error } = useApi<Note>(`/subjects/notes/${params.slug}`);
  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Can&apos;t read this</h1>
        <p className="text-text-3 mt-2">{error.message}</p>
      </div>
    );
  }
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-3">
        <Badge>{data.subject}</Badge>
        <span className="text-text-3 text-xs">{data.estMinutes} min</span>
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight mt-3">{data.title}</h1>
      <Card className="mt-8 whitespace-pre-wrap text-text-2 leading-relaxed">
        {data.content}
      </Card>
    </div>
  );
}
