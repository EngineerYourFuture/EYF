"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { CohortOperations } from "./cohort-operations";
import { fieldClass, LoadError } from "./shared";
import { countLabel, workspaceHref } from "./roles";

type Path = { id: string; title: string; published: boolean; _count: { items: number; cohorts: number } };
type PathDetail = Path & { items: { courseId: string; orderIndex: number; required: boolean; course: { id: string; title: string } }[] };
type Cohort = { id: string; name: string; path: { title: string }; _count: { enrollments: number } };
type Work = { cohortId: string; pathTitle: string; cohortName: string; progressPct: number; courses: { id: string; title: string; completedCount: number; lessonCount: number }[] };
type Funnel = { rows: { member: { id: string; name: string }; progressPct: number; stuckFlag: boolean }[]; funnel: { enrolled: number; completed: number; stuck: number } };

export function ProgramsTab({ orgId, canAuthor, canPublish, canEnroll, canEditDrive = false, mode = "programs" }: Readonly<{ mode?: "programs" | "cohorts" | "learning"; orgId: string; canAuthor: boolean; canPublish: boolean; canEnroll: boolean; canEditDrive?: boolean }>) {
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [query, setQuery] = useState("");
  const base = `/orgs/${orgId}`;
  const action = useApiAction();
  const paths = useApi<Path[]>(canAuthor || canEnroll || canPublish ? `${base}/paths` : null);
  const courses = useApi<{ id: string; title: string; status: string }[]>(canAuthor ? `${base}/courses` : null);
  const cohorts = useApi<Cohort[]>(canEnroll ? `${base}/cohorts` : null);
  const members = useApi<{ id: string; user: { name: string; email: string } }[]>(canEnroll ? `${base}/learning-members` : null);
  const work = useApi<Work[]>(`${base}/work/paths`);
  const [selectedPath, setSelectedPath] = useState("");
  const detail = useApi<PathDetail>(selectedPath && canAuthor ? `${base}/paths/${selectedPath}` : null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [cohortPath, setCohortPath] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const funnel = useApi<Funnel>(selectedCohort ? `${base}/cohorts/${selectedCohort}/funnel` : null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function perform(fn: () => Promise<unknown>, message: string) {
    setBusy(true); setNotice("");
    try { await fn(); await Promise.all([paths.mutate(), detail.mutate(), cohorts.mutate(), funnel.mutate(), work.mutate()]); setNotice(message); }
    catch { /* action shows server validation without losing the form */ } finally { setBusy(false); }
  }
  return <div className="space-y-8">
    {notice && <output  className="block text-text-1 font-medium">{notice}</output>}
    {mode === "programs" && (canAuthor || canPublish) && <section className="space-y-4" aria-labelledby="programs-title">
      <div><h2 id="programs-title" className="text-2xl sm:text-3xl font-semibold tracking-tight">Learning programs</h2><p className="mt-2 text-text-2">Group published courses into a path for your learners.</p></div>
      <div className="flex flex-wrap items-end gap-3"><label className="flex-1 min-w-0 text-sm">Search programs<input type="search" className={`${fieldClass} mt-2`} value={query} onChange={(e) => setQuery(e.target.value)} /></label>{canAuthor && <Button onClick={() => setCreatingProgram((value) => !value)} aria-expanded={creatingProgram} aria-controls="new-program">{creatingProgram ? "Cancel new program" : "New program"}</Button>}</div>
      {canAuthor && creatingProgram && <form id="new-program" className="flex flex-wrap gap-3 border-y border-border py-5" onSubmit={(e) => { e.preventDefault(); void perform(async () => { const p = await action<Path>(`${base}/paths`, { method: "POST", body: JSON.stringify({ title }) }); setTitle(""); setCreatingProgram(false); setSelectedPath(p.id); }, "Program created. Add its courses below."); }}>
        <label className="flex-1 min-w-0">Program title<input className={`${fieldClass} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={120} /></label>
        <Button className="self-end" disabled={busy || title.trim().length < 2}>Create program</Button>
      </form>}
      <LoadError error={paths.error} retry={paths.mutate} />
      {paths.isLoading && <SkeletonRows rows={2} />}
      {paths.data?.length === 0 && <p className="text-text-2">No programs yet. Publish a course first, then add it to a program. You can prepare a draft program at any time.</p>}
      {paths.data?.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())).map((p) => <div key={p.id} className="border-b border-border py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[min(100%,12rem)]"><p className="font-medium break-words">{p.title}</p><p className="text-sm text-text-2">{countLabel(p._count.items, "course")} · {countLabel(p._count.cohorts, "cohort")}</p></div>
        <Badge>{p.published ? "Published" : "Draft"}</Badge>
        {canAuthor && <Button variant="secondary" onClick={() => { setSelectedPath(p.id); setCourseId(""); }}>Manage courses</Button>}
        {canPublish && !p.published && <Button disabled={busy || p._count.items === 0} onClick={() => void perform(() => action(`${base}/paths/${p.id}/publish`, { method: "POST" }), "Program published. You can now create a cohort.")}>Publish program</Button>}
      </div>)}
      {!!query && paths.data && !paths.data.some((p) => p.title.toLowerCase().includes(query.toLowerCase())) && <output  className="block text-text-2">No matching programs. Try another title or clear your search.</output>}
      <LoadError error={detail.error} retry={detail.mutate} />
      {detail.data && <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">Courses in {detail.data.title}</h3><Button variant="ghost" onClick={() => setSelectedPath("")}>Close program</Button></div>
        <ol className="space-y-3">{detail.data.items.map((item, index) => <li key={item.course.id} className="flex flex-wrap items-center gap-3"><span className="flex-1 min-w-0">{index + 1}. {item.course.title}</span>{!detail.data?.published && <Button variant="ghost" disabled={busy} onClick={() => void perform(() => action(`${base}/paths/${selectedPath}/items/${item.course.id}`, { method: "DELETE" }), "Course removed from this program.")}>Remove {item.course.title}</Button>}</li>)}</ol>
        {detail.data.published ? <p className="text-sm text-text-2">This program is published. Create another program to change the courses without changing existing cohorts.</p> : <form className="flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); void perform(async () => { await action(`${base}/paths/${selectedPath}/items`, { method: "POST", body: JSON.stringify({ courseId, orderIndex: Math.max(-1, ...detail.data!.items.map((i) => i.orderIndex)) + 1 }) }); setCourseId(""); }, "Course added."); }}>
          {courses.data && !courses.data.some((c) => c.status === "PUBLISHED") && <p className="w-full text-text-2">Publish a course before adding it here. <Link className="underline underline-offset-4" href={workspaceHref(orgId, "courses")}>Open courses</Link></p>}
          <label className="flex-1 min-w-0">Published course<select className={`${fieldClass} mt-1`} value={courseId} onChange={(e) => setCourseId(e.target.value)} required><option value="">Choose a course</option>{courses.data?.filter((c) => c.status === "PUBLISHED" && !detail.data?.items.some((i) => i.course.id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
          <Button className="self-end" disabled={busy || !courseId}>Add course</Button><LoadError error={courses.error} retry={courses.mutate} />
        </form>}
      </div>}
    </section>}
    {mode === "programs" && <section className="border-t border-border pt-6"><h3 className="text-lg font-semibold">From course to cohort</h3><ol className="mt-4 grid gap-5 sm:grid-cols-3 list-decimal list-inside text-sm"><li><span className="font-medium">Publish a course</span><p className="mt-2 text-text-2">Prepare lessons and review the learner preview.</p></li><li><span className="font-medium">Build a program</span><p className="mt-2 text-text-2">Add published courses in learning order, then publish the program.</p></li><li><span className="font-medium">Enroll a cohort</span><p className="mt-2 text-text-2">Assign the program to a group of learners.</p>{canEnroll && <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={workspaceHref(orgId, "cohorts")}>Open cohorts</Link>}</li></ol></section>}
    {mode === "cohorts" && canEnroll && <section className="space-y-4" aria-labelledby="cohorts-title">
      <div className="flex flex-wrap gap-4 items-start justify-between"><div><h2 id="cohorts-title" className="text-2xl sm:text-3xl font-semibold tracking-tight">Cohorts and enrollment</h2><p className="mt-2 text-text-2">Choose a cohort to enroll learners and follow up on progress.</p></div><Button onClick={() => setCreatingCohort((value) => !value)} aria-expanded={creatingCohort} aria-controls="new-cohort">{creatingCohort ? "Cancel new cohort" : "New cohort"}</Button></div>
      {paths.data && !paths.data.some((p) => p.published) && <p className="text-text-2">A published program is needed before creating a cohort. {canAuthor || canPublish ? <Link className="underline underline-offset-4" href={workspaceHref(orgId, "programs")}>Open programs</Link> : "Ask a learning manager to publish a program."}</p>}
      {creatingCohort && <form id="new-cohort" className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void perform(async () => { const c = await action<Cohort>(`${base}/cohorts`, { method: "POST", body: JSON.stringify({ pathId: cohortPath, name: cohortName, ...(endDate ? { endsAt: new Date(`${endDate}T23:59:59`).toISOString() } : {}) }) }); setSelectedCohort(c.id); setCreatingCohort(false); setCohortName(""); setMemberIds([]); }, "Cohort created. Select learners to enroll."); }}>
        <label>Published program<select className={`${fieldClass} mt-1`} value={cohortPath} onChange={(e) => setCohortPath(e.target.value)} required><option value="">Choose a program</option>{paths.data?.filter((p) => p.published).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>Cohort name<input className={`${fieldClass} mt-1`} value={cohortName} onChange={(e) => setCohortName(e.target.value)} required minLength={2} maxLength={80} /></label>
        <label>End date (optional)<input type="date" className={`${fieldClass} mt-1`} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        <Button className="self-end justify-self-start" disabled={busy || !cohortPath || cohortName.trim().length < 2}>Create cohort</Button>
      </form>}
      <LoadError error={paths.error || cohorts.error} retry={() => { void paths.mutate(); return cohorts.mutate(); }} />
      <label className="block">Manage cohort<select className={`${fieldClass} mt-1`} value={selectedCohort} onChange={(e) => { setSelectedCohort(e.target.value); setMemberIds([]); }}><option value="">Choose a cohort</option>{cohorts.data?.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.path.title}</option>)}</select></label>
      {selectedCohort && <div className="space-y-4">
        <LoadError error={members.error || funnel.error} retry={() => { void members.mutate(); return funnel.mutate(); }} />
        <fieldset><legend className="font-medium mb-2">Learners to enroll</legend><div className="max-h-64 overflow-auto space-y-2">{members.data?.filter((m) => !funnel.data?.rows.some((r) => r.member.id === m.id)).map((m) => <label key={m.id} className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={memberIds.includes(m.id)} onChange={(e) => setMemberIds((ids) => e.target.checked ? [...ids, m.id] : ids.filter((id) => id !== m.id))} /><span className="min-w-0 break-words">{m.user.name} <span className="text-sm text-text-2">{m.user.email}</span></span></label>)}</div></fieldset>
        <Button disabled={busy || !memberIds.length} onClick={() => void perform(async () => { const result = await action<{ rejected: string[] }>(`${base}/cohorts/${selectedCohort}/enroll`, { method: "POST", body: JSON.stringify({ memberIds }) }); setMemberIds(result.rejected); if (result.rejected.length) throw new Error("Some members could not be enrolled."); }, "Learners enrolled.")}>Enroll selected learners</Button>
        <CohortOperations key={selectedCohort} orgId={orgId} cohortId={selectedCohort} canEditDrive={canEditDrive} onEnrolled={() => Promise.all([cohorts.mutate(), funnel.mutate(), work.mutate()])} />
      </div>}
    </section>}
    {mode === "learning" && <section className="space-y-4" aria-labelledby="my-programs"><h2 id="my-programs" className="text-2xl sm:text-3xl font-semibold tracking-tight">My programs</h2>
      <LoadError error={work.error} retry={work.mutate} />{work.isLoading && <SkeletonRows rows={2} />}
      {work.data?.length === 0 && <p className="text-text-2">Your assigned programs will appear here.</p>}
      {work.data?.map((p) => <div key={p.cohortId} className="border-b border-border pb-4"><h3 className="font-semibold">{p.pathTitle}</h3><p className="text-text-2 mt-1">{p.cohortName} · {p.progressPct}% complete</p><ul className="mt-3 space-y-2">{p.courses.map((c) => <li key={c.id}><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/orgs/${orgId}/course/${c.id}`}>{c.title} — {c.completedCount}/{c.lessonCount} lessons</Link></li>)}</ul></div>)}
    </section>}
  </div>;
}
