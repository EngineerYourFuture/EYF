"use client";
/**
 * Course player — members read block content and complete lessons (PRD §15.3).
 * Renders the block array authored in the builder; completing a tagged lesson
 * writes Skill Ledger evidence server-side. Sequential progress with a rail.
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { LessonBlocks } from "@/components/lms/lesson-blocks";
import { LoadError } from "@/components/lms/shared";
import { useApi, useApiAction } from "@/lib/use-api";
import { countLabel, workspaceHref } from "@/components/lms/roles";
import { useMotionPreference } from "@/components/interaction-motion";

type Block = { type: string; data: Record<string, unknown> };
type Lesson = { id: string; title: string; type: string; blocks: Block[] | null; estMinutes: number; completed: boolean };
type AssignedProgram = { cohortId: string; pathTitle: string; courses: { id: string; title: string; lessonCount: number; completedCount: number }[] };
type Course = { id: string; title: string; description: string; lessons: Lesson[] };

export default function PlayerPage() {
  const { orgId, courseId } = useParams<{ orgId: string; courseId: string }>();
  return <CoursePlayer key={`${orgId}:${courseId}`} orgId={orgId} courseId={courseId} />;
}

function CoursePlayer({ orgId, courseId }: Readonly<{ orgId: string; courseId: string }>) {
  const action = useApiAction();
  const { data: course, error, mutate } = useApi<Course>(`/orgs/${orgId}/work/courses/${courseId}`);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});
  const [completionError, setCompletionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusLesson = useRef(false);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const reduce = useMotionPreference();

  function selectLesson(id: string) {
    focusLesson.current = true;
    setActiveId(id);
    setOutlineOpen(false);
    setCompletionError("");
  }

  useEffect(() => {
    if (!focusLesson.current) return;
    focusLesson.current = false;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [activeId, outlineOpen, reduce]);

  useEffect(() => {
    if (!course || activeId) { return; }
    // Land on the first incomplete lesson, else the first.
    setActiveId((course.lessons.find((l) => !l.completed) ?? course.lessons[0])?.id ?? null);
  }, [course, activeId]);

  const active = course?.lessons.find((l) => l.id === activeId) ?? null;
  const idx = course?.lessons.findIndex((l) => l.id === activeId) ?? -1;
  const doneCount = course?.lessons.filter((l) => l.completed).length ?? 0;
  const courseComplete = !!course?.lessons.length && doneCount === course.lessons.length;
  const programs = useApi<AssignedProgram[]>(courseComplete ? `/orgs/${orgId}/work/paths` : null);
  const assigned = programs.data?.find((program) => program.courses.some((item) => item.id === courseId));
  const nextCourse = assigned?.courses.find((item) => item.id !== courseId && item.completedCount < item.lessonCount);


  async function complete() {
    if (!active) { return; }
    setBusy(true); setCompletionError("");
    try {
      await action(`/orgs/${orgId}/work/lessons/${active.id}/complete`, { method: "POST", body: JSON.stringify({ answers: answers[active.id] ?? {} }) });
      await mutate();
      const next = course?.lessons[idx + 1];
      if (next && activeIdRef.current === active.id) selectLesson(next.id);
    } catch (error) { setCompletionError(error instanceof Error ? error.message : "Could not save this lesson. Try again."); } finally { setBusy(false); }
  }

  if (error) return <div className="px-6 py-12"><Link href={workspaceHref(orgId, "learning")} className="underline">Back to my programs</Link><LoadError error={error} retry={mutate} /></div>;
  if (!course) { return <div className="px-6 py-12"><Skeleton className="h-8 w-64" /></div>; }

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <Link href={workspaceHref(orgId, "learning")} className="inline-flex min-h-11 items-center text-text-3 hover:text-text-1 text-sm underline underline-offset-4">Back to my programs</Link>
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">{course.title}</h1>
          <span className="font-mono text-sm text-text-3 tabular-nums">{doneCount}/{course.lessons.length} done</span>
        </div>
        {course.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-2">{course.description}</p>}
        <progress className="eyf-progress mt-3 h-1.5 w-full" value={doneCount} max={Math.max(1, course.lessons.length)}
          aria-valuetext={`${doneCount} of ${course.lessons.length} lessons complete`} aria-label="Course progress" />

        {courseComplete && <section className="mt-6 border-y border-border py-6 space-y-3" aria-labelledby="course-complete-title" aria-live="polite"><h2 id="course-complete-title" className="text-xl font-semibold">Course complete</h2><p className="text-text-2">{countLabel(doneCount, "lesson")} completed. Your lesson progress is saved. Assessments and certificates have separate requirements.</p><div className="flex flex-wrap gap-3">{nextCourse && <Link className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-accent-ink font-medium" href={`/orgs/${orgId}/course/${nextCourse.id}`}>Continue: {nextCourse.title}</Link>}<Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 font-medium" href={workspaceHref(orgId, "learning")}>{assigned ? `View ${assigned.pathTitle}` : "Back to my programs"}</Link></div><LoadError error={programs.error} retry={programs.mutate} /></section>}

        <div className="mt-6 grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          <div className="min-w-0 lg:sticky lg:top-24">
            <button type="button" aria-expanded={outlineOpen} aria-controls="lesson-outline" onClick={() => setOutlineOpen((value) => !value)}
              className="pressable flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm lg:hidden">
              <span><span className="block font-medium">Course contents</span><span className="text-text-3">Lesson {idx + 1} of {course.lessons.length}</span></span>
              <span aria-hidden="true" className={`transition-transform ${outlineOpen ? "rotate-180" : ""}`}>⌄</span>
            </button>
            <p className="hidden lg:block mb-3 px-3 text-xs font-medium tracking-wide text-text-3">COURSE CONTENTS</p>
            <nav id="lesson-outline" aria-label="Lessons" className={`${outlineOpen ? "block" : "hidden"} lg:block mt-2 lg:mt-0 space-y-1.5`}>
            {course.lessons.map((l) => (
              <button type="button" key={l.id} onClick={() => selectLesson(l.id)}
                aria-current={activeId === l.id ? "true" : undefined}
                className={`pressable w-full min-h-11 border text-left rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeId === l.id ? "bg-surface border-border font-medium" : "border-transparent hover:bg-surface-3"}`}>
                <span className={`shrink-0 ${l.completed ? "text-easy" : "text-text-4"}`} aria-hidden="true">{l.completed ? "✓" : "○"}</span>
                <span className="min-w-0 break-words">{l.title}</span>
                {l.completed && <span className="sr-only">(completed)</span>}
              </button>
            ))}
            </nav>
          </div>

          {active ? (
            <Card className="min-w-0">
              <p className="mb-2 text-xs font-medium tracking-wide text-text-3">Lesson {idx + 1}{active.estMinutes > 0 ? ` · ${active.estMinutes} min` : ""}</p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-20 font-display text-xl font-semibold tracking-tight focus:outline-none">{active.title}</h2>
                {active.completed && <Badge tone="easy">Completed</Badge>}
              </div>
              <div className="mt-5 space-y-4">
                <LessonBlocks orgId={orgId} lessonId={active.id} blocks={active.blocks ?? []} answers={answers[active.id] ?? {}} onAnswer={(key, choice) => setAnswers((a) => ({ ...a, [active.id]: { ...a[active.id], [key]: choice } }))} completed={active.completed} />
                {(active.blocks?.length ?? 0) === 0 && <p className="text-text-3 text-sm">This lesson has no content yet.</p>}
              </div>
              {completionError && <p role="alert" className="mt-4 text-hard">{completionError}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                {idx > 0 && <Button variant="ghost" onClick={() => selectLesson(course.lessons[idx - 1]!.id)}>← Previous lesson</Button>}
                <Button onClick={complete} disabled={busy || active.completed}>
                  {(() => { if (active.completed) { return "Completed"; } if (busy) { return "Saving…"; } if (idx + 1 < course.lessons.length) { return "Complete & next →"; } return "Complete lesson"; })()}
                </Button>
                {active.completed && idx + 1 < course.lessons.length && <Button variant="secondary" onClick={() => selectLesson(course.lessons[idx + 1]!.id)}>Next lesson →</Button>}
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
