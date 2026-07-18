"use client";
/**
 * Course player — members read block content and complete lessons (PRD §15.3).
 * Renders the block array authored in the builder; completing a tagged lesson
 * writes Skill Ledger evidence server-side. Sequential progress with a rail.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { useApi, useApiAction } from "@/lib/use-api";

type Block = { type: string; data: Record<string, unknown> };
type Lesson = { id: string; title: string; type: string; blocks: Block[] | null; estMinutes: number; completed: boolean };
type Course = { id: string; title: string; description: string; lessons: Lesson[] };

export default function PlayerPage() {
  const { orgId, courseId } = useParams<{ orgId: string; courseId: string }>();
  const action = useApiAction();
  const { data: course, mutate } = useApi<Course>(`/orgs/${orgId}/work/courses/${courseId}`);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!course || activeId) return;
    // Land on the first incomplete lesson, else the first.
    setActiveId((course.lessons.find((l) => !l.completed) ?? course.lessons[0])?.id ?? null);
  }, [course, activeId]);

  const active = course?.lessons.find((l) => l.id === activeId) ?? null;
  const idx = course?.lessons.findIndex((l) => l.id === activeId) ?? -1;
  const doneCount = course?.lessons.filter((l) => l.completed).length ?? 0;

  async function complete() {
    if (!active) return;
    setBusy(true);
    try {
      await action(`/orgs/${orgId}/work/lessons/${active.id}/complete`, { method: "POST" });
      await mutate();
      const next = course?.lessons[idx + 1];
      if (next) setActiveId(next.id);
    } catch { /* toasted */ } finally { setBusy(false); }
  }

  if (!course) return <div className="px-6 py-12"><Skeleton className="h-8 w-64" /></div>;

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <Link href="/orgs" className="text-text-3 hover:text-text-1 text-sm">← My learning</Link>
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-2xl font-bold">{course.title}</h1>
          <span className="font-mono text-sm text-text-3 tabular-nums">{doneCount}/{course.lessons.length} done</span>
        </div>
        <div
          className="mt-3 h-1.5 rounded-full bg-surface-3 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={course.lessons.length}
          aria-valuenow={doneCount}
          aria-valuetext={`${doneCount} of ${course.lessons.length} lessons complete`}
          aria-label="Course progress"
        >
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${course.lessons.length ? (doneCount / course.lessons.length) * 100 : 0}%` }} />
        </div>

        <div className="mt-6 grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          <nav aria-label="Lessons" className="min-w-0 space-y-1.5">
            {course.lessons.map((l) => (
              <button key={l.id} onClick={() => setActiveId(l.id)}
                aria-current={activeId === l.id ? "true" : undefined}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeId === l.id ? "bg-surface border border-accent/50" : "hover:bg-surface-3"}`}>
                <span className={`shrink-0 ${l.completed ? "text-easy" : "text-text-4"}`} aria-hidden="true">{l.completed ? "✓" : "○"}</span>
                <span className="truncate">{l.title}</span>
                {l.completed && <span className="sr-only">(completed)</span>}
              </button>
            ))}
          </nav>

          {active ? (
            <Card className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">{active.title}</h2>
                {active.completed && <Badge tone="easy">Completed</Badge>}
              </div>
              <div className="mt-5 space-y-4">
                {(active.blocks ?? []).map((b, i) => <BlockView key={i} block={b} />)}
                {(active.blocks?.length ?? 0) === 0 && <p className="text-text-3 text-sm">This lesson has no content yet.</p>}
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <Button onClick={complete} disabled={busy || active.completed}>
                  {active.completed ? "Completed" : busy ? "Saving…" : idx + 1 < course.lessons.length ? "Complete & next →" : "Complete lesson"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card><p className="text-text-3 text-sm">This course has no lessons yet.</p></Card>
          )}
        </div>
      </div>
    </PageMotion>
  );
}

function BlockView({ block }: { block: Block }) {
  const text = (k: string) => String(block.data[k] ?? "");
  switch (block.type) {
    case "heading": return <h3 className="font-display text-lg font-bold mt-2">{text("text")}</h3>;
    case "rich_text": return <p className="text-text-2 leading-relaxed whitespace-pre-wrap">{text("text")}</p>;
    case "callout": return (
      <div className="rounded-lg border border-accent/30 bg-accent-tint/30 px-4 py-3 flex gap-2.5">
        <span className="text-accent shrink-0"><Icons.sparkle width={16} height={16} /></span>
        <p className="text-text-2 text-sm whitespace-pre-wrap">{text("text")}</p>
      </div>
    );
    case "code": return <pre className="rounded-lg bg-surface-2 border border-border p-3 overflow-x-auto text-sm font-mono text-text-1">{text("code")}</pre>;
    case "video": case "embed": {
      const url = text("url");
      return url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline text-sm">▶ Open {block.type} ↗</a> : null;
    }
    case "judged_code": {
      const slug = text("problemSlug");
      return slug ? <Link href={`/problems/${slug}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:border-edge"><Icons.code width={15} height={15} /> Solve exercise: {slug}</Link> : null;
    }
    case "divider": return <hr className="border-border" />;
    default: return null;
  }
}
