"use client";
import { useState } from "react";
import { Card, Badge, Button, SkeletonRows, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";
import { BackButton } from "@/components/back-button";

type Lesson = { id: string; title: string; content: string; completed: boolean };
type CourseLearn = { id: string; title: string; org: string; lessons: Lesson[] };

export default function CoursePlayer({ params }: Readonly<{ params: { courseId: string } }>) {
  const { data, isLoading, mutate } = useApi<CourseLearn>(`/org/courses/${params.courseId}/learn`);
  const action = useApiAction();
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);

  async function complete(lessonId: string) {
    setBusy(true);
    try {
      await action(`/org/lessons/${lessonId}/complete`, { method: "POST" }, { silent: true });
      toast.success("Lesson complete.");
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="px-4 sm:px-6 lg:px-10 py-8"><SkeletonRows /></div>;
  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 text-text-3">Course not found.</div>;

  const lessons = data.lessons;
  const done = lessons.filter((l) => l.completed).length;
  const lesson = lessons[active];

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <BackButton className="mb-4" />
        <PageHeader title={data.title} subtitle={`${data.org} · ${done}/${lessons.length} lessons complete`} />
        <div className="mt-6 grid md:grid-cols-[240px_1fr] gap-6">
          <nav aria-label="Lessons" className="flex flex-col gap-1">
            {lessons.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                className={`text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i === active ? "bg-surface-3" : "hover:bg-surface-2"}`}
              >
                <span className={`h-4 w-4 rounded-full flex-shrink-0 grid place-items-center text-[10px] ${l.completed ? "bg-easy text-white" : "border border-border"}`} aria-hidden="true">
                  {l.completed ? "✓" : ""}
                </span>
                <span className="truncate">{l.title}</span>
                {l.completed && <span className="sr-only">(completed)</span>}
              </button>
            ))}
          </nav>
          <main>
            {lesson ? (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display text-xl">{lesson.title}</h2>
                  {lesson.completed && <Badge tone="easy" className="ml-auto">Done</Badge>}
                </div>
                <div className="text-sm text-text-2 whitespace-pre-wrap leading-relaxed">{lesson.content || "No content yet."}</div>
                {!lesson.completed && (
                  <Button className="mt-6" onClick={() => complete(lesson.id)} disabled={busy}>
                    {busy ? "Saving…" : "Mark complete"}
                  </Button>
                )}
              </Card>
            ) : (
              <p className="text-text-3">This course has no lessons yet.</p>
            )}
          </main>
        </div>
      </div>
    </PageMotion>
  );
}
