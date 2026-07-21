"use client";
import { toast } from "sonner";
import { Card, Badge, Button, PageHeader, Skeleton } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";

type Idea = {
  id: string; slug: string; title: string; description: string;
  techStack: string[]; difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  weeks: number; tags: string[]; outcomes: string[]; premium: boolean;
};
type MyProj = {
  id: string; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  githubUrl: string | null; liveUrl: string | null;
  idea: Idea;
};

const tone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

export default function Page() {
  const { data: ideas } = useApi<Idea[]>("/projects");
  const { data: mine, mutate } = useApi<MyProj[]>("/projects/me/started");
  const action = useApiAction();
  const [starting, setStarting] = useState<string | null>(null);

  const startedSlugs = new Set((mine ?? []).map((m) => m.idea.slug));

  async function start(slug: string, title: string) {
    setStarting(slug);
    try {
      await action(`/projects/${slug}/start`, { method: "POST" });
      await mutate();
      toast.success(`Added “${title}” to your projects`);
    } finally {
      setStarting(null);
    }
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader eyebrow="Build the proof" title="BTech Projects" subtitle="Build the thing. Ship the link. Survive the interview." />

      {mine && mine.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold mb-3">In progress</h2>
          <div className="space-y-2">
            {mine.map((m) => (
              <Card key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="font-display text-base">{m.idea.title}</div>
                  <div className="text-text-3 text-xs mt-1">{m.idea.weeks} weeks · {m.idea.difficulty}</div>
                </div>
                <Badge tone={m.status === "COMPLETED" ? "easy" : "accent"}>{m.status.replaceAll("_", " ")}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-xl font-bold mt-10 mb-3">Idea catalog</h2>
      {!ideas ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((i) => {
            const started = startedSlugs.has(i.slug);
            return (
              <Card key={i.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold">{i.title}</h3>
                  <Badge tone={tone[i.difficulty]}>{i.difficulty}</Badge>
                </div>
                <p className="text-text-3 text-sm mt-2 flex-1">{i.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {i.techStack.slice(0, 6).map((t) => (
                    <span key={t} className="text-xs font-mono text-text-3 px-2 py-0.5 border border-border rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-text-3 text-xs">~{i.weeks} weeks</span>
                  {started ? (
                    <Badge tone="easy">✓ Started</Badge>
                  ) : (
                    <Button size="sm" onClick={() => start(i.slug, i.title)} disabled={starting === i.slug}>
                      {starting === i.slug ? "Starting…" : "Start"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageMotion>
  );
}
