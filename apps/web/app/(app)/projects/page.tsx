"use client";
import Link from "next/link";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";

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

  async function start(slug: string) {
    await action(`/projects/${slug}/start`, { method: "POST" });
    await mutate();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">BTech Projects</h1>
      <p className="text-text-3 mt-2">Build the thing. Ship the link. Survive the interview.</p>

      {mine && mine.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-3">In progress</h2>
          <div className="space-y-2">
            {mine.map((m) => (
              <Card key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="font-display text-base">{m.idea.title}</div>
                  <div className="text-text-3 text-xs mt-1">{m.status}</div>
                </div>
                <Badge tone="accent">{m.status}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        {ideas?.map((i) => (
          <Card key={i.id} className="flex flex-col">
            <div className="flex items-center justify-between">
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
              <Button size="sm" onClick={() => start(i.slug)}>Start</Button>
            </div>
          </Card>
        ))}
      </div>
      <Link href="/dashboard" className="hidden">noop</Link>
    </div>
  );
}
