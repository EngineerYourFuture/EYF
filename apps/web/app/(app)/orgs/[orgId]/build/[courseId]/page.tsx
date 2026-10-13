"use client";
/**
 * Course builder — the block editor (PRD §16). Finishes Phase 1: authors now
 * compose real block content, not just titles. Lessons hold an ordered block
 * array; blocks are typed nodes edited inline. Saves per lesson via the
 * existing PATCH /lessons/:id. Publish flows through submit → publish with the
 * two-person rule enforced server-side.
 */
import { editorId, editorRow, type EditorRow } from "@/lib/editor-rows";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { canInOrg } from "@eyf/types";
import { useAuthoringDrafts, useAuthoringExit } from "@/components/lms/authoring-drafts";
import { PrivateMediaUpload, PrivateMediaLibrary } from "@/components/lms/private-media";
import { LessonBlocks } from "@/components/lms/lesson-blocks";
import { countLabel, workspaceHref } from "@/components/lms/roles";
import { LoadError, fieldClass } from "@/components/lms/shared";
import { useApi, useApiAction } from "@/lib/use-api";

type Block = { type: string; data: Record<string, unknown> };
const choiceIds = Symbol("choiceIds");
type EditorBlock = EditorRow<Block> & { [choiceIds]: string[] };
const fieldText = (value: unknown) => typeof value === "string" ? value : "";
function editableBlock(block: Block): EditorBlock {
  const existing = (block as Partial<EditorBlock>)[choiceIds];
  const choices = Array.isArray(block.data.choices) ? block.data.choices : [];
  return { ...editorRow(block), [choiceIds]: existing ?? choices.map(() => crypto.randomUUID()) };
}
function correctAfterRemoval(correct: number, removed: number) {
  if (correct === removed) return 0;
  return correct > removed ? correct - 1 : correct;
}
const MEDIA_ACCEPT: Record<string, string> = { image: "image/png,image/jpeg,image/webp,image/gif", video: "video/mp4,video/webm", file: ".pdf,.txt,.csv,.zip,.vtt" };

type Lesson = { id: string; title: string; type: string; blocks: Block[] | null; estMinutes: number; orderIndex: number; skill?: { slug: string } | null };
type Course = { id: string; title: string; description: string; status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED"; version: number; lessons: Lesson[] };

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", field: "text", placeholder: "Section heading" },
  { type: "rich_text", label: "Text", field: "text", placeholder: "Write the lesson content…" },
  { type: "callout", label: "Callout", field: "text", placeholder: "An important note" },
  { type: "code", label: "Code", field: "code", placeholder: "// example code" },
  { type: "video", label: "Video", field: "url", placeholder: "https://… video URL" },
  { type: "embed", label: "Embed", field: "url", placeholder: "https://… (figma, youtube…)" },
  { type: "judged_code", label: "Judged exercise", field: "problemSlug", placeholder: "problem-slug from the bank" },
  { type: "image", label: "Image", field: "url", placeholder: "https://… image URL" },
  { type: "file", label: "File", field: "url", placeholder: "https://… file URL" },
  { type: "toggle", label: "Expandable text", field: "text", placeholder: "Additional explanation" },
  { type: "quiz", label: "Quiz", field: "question", placeholder: "Question" },
  { type: "divider", label: "Divider", field: null, placeholder: "" },
] as const;
const meta = (t: string) => BLOCK_TYPES.find((b) => b.type === t) ?? BLOCK_TYPES[1];
const statusTone = { DRAFT: "default", IN_REVIEW: "medium", PUBLISHED: "easy", ARCHIVED: "hard" } as const;

export default function BuilderPage() {
  const { orgId, courseId } = useParams<{ orgId: string; courseId: string }>();
  return <CourseBuilder key={`${orgId}:${courseId}`} orgId={orgId} courseId={courseId} />;
}

function CourseBuilder({ orgId, courseId }: Readonly<{ orgId: string; courseId: string }>) {
  const router = useRouter();
  const action = useApiAction();
  const { data: course, error, mutate } = useApi<Course>(`/orgs/${orgId}/courses/${courseId}`);
  const [activeId, setActiveId] = useState<string | null>(null);
  const memberships = useApi<{ roles: string[]; org: { id: string } }[]>("/orgs/mine");
  const canPublish = canInOrg(memberships.data?.find((m) => m.org.id === orgId)?.roles ?? [], "learn:publish").granted;
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const mayLeave = useAuthoringExit(dirty);
  const [newLesson, setNewLesson] = useState("");

  useEffect(() => { if (course && !activeId && course.lessons[0]) { setActiveId(course.lessons[0].id); } }, [course, activeId]);
  const active = course?.lessons.find((l) => l.id === activeId) ?? null;
  const editable = course?.status === "DRAFT" || course?.status === "IN_REVIEW";

  async function addLesson() {
    if (newLesson.trim().length < 1) { return; }
    if (!(await mayLeave())) { return; }
    setBusy(true);
    try {
      const l = await action<Lesson>(`/orgs/${orgId}/courses/${courseId}/lessons`, { method: "POST", body: JSON.stringify({ title: newLesson.trim(), blocks: [], orderIndex: Math.max(-1, ...(course?.lessons.map((l) => l.orderIndex) ?? [])) + 1 }) });
      setNewLesson(""); await mutate(); setDirty(false); setActiveId(l.id);
    } catch { /* toasted */ } finally { setBusy(false); }
  }
  async function lifecycle(verb: "submit" | "publish") {
    if (dirty) { toast.error("Save your lesson before submitting or publishing."); return; }
    setBusy(true);
    try { await action(`/orgs/${orgId}/courses/${courseId}/${verb}`, { method: "POST" }); await mutate(); toast.success(verb === "publish" ? "Published" : "Submitted for review"); }
    catch { /* toasted (incl. two-person rule) */ } finally { setBusy(false); }
  }

  if (error) { return <div className="px-6 py-12"><Link href={workspaceHref(orgId, "courses")} className="underline">Back to courses</Link><LoadError error={error} retry={mutate} /></div>; }
  if (!course) { return <div className="px-6 py-12"><Skeleton className="min-h-11 w-64" /></div>; }

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <Link href={workspaceHref(orgId, "courses")} className="inline-flex min-h-11 items-center text-text-3 hover:text-text-1 text-sm underline underline-offset-4">Back to courses</Link>
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold truncate">{course.title}</h1>
            <div className="text-text-4 text-xs mt-1 flex items-center gap-2">
              <Badge tone={statusTone[course.status]}>{course.status.replace("_", " ")}</Badge> v{course.version} · {countLabel(course.lessons.length, "lesson")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {course.status === "DRAFT" && <Button size="sm" variant="secondary" disabled={busy || dirty} onClick={() => lifecycle("submit")}>Submit for review</Button>}
            {editable && canPublish && <Button size="sm" disabled={busy || dirty} onClick={() => lifecycle("publish")}>Publish</Button>}
            {['PUBLISHED', 'ARCHIVED'].includes(course.status) && <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); try { const draft = await action<{ id: string }>(`/orgs/${orgId}/courses/${courseId}/revise`, { method: "POST" }); router.push(`/orgs/${orgId}/build/${draft.id}`); } catch { /* toasted */ } finally { setBusy(false); } }}>Create revision</Button>}
            {course.status === "PUBLISHED" && <Link href={`/orgs/${orgId}/course/${courseId}`}><Button size="sm" variant="secondary">Preview as learner</Button></Link>}
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Lesson list */}
          <div className="min-w-0 space-y-2">
            {course.lessons.map((l) => (
              <button type="button" key={l.id} onClick={async () => { if (l.id !== activeId && await mayLeave()) { setDirty(false); setActiveId(l.id); } }}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${activeId === l.id ? "border-accent/50 bg-surface" : "border-border bg-surface-2/40 hover:border-edge"}`}>
                <div className="truncate">{l.title}</div>
                <div className="text-text-4 text-[11px]">{countLabel(l.blocks?.length ?? 0, "block")} · {l.estMinutes}m</div>
              </button>
            ))}
            {editable && (
              <div className="flex gap-1.5 pt-1">
                <input className="flex-1 min-w-0 min-h-11 px-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-accent" aria-label="New lesson title" placeholder="New lesson" value={newLesson} onChange={(e) => setNewLesson(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { void addLesson(); } }} />
                <Button size="sm" disabled={busy || !newLesson.trim()} onClick={addLesson}>Add lesson</Button>
              </div>
            )}
          </div>

          {/* Lesson editor */}
          {active ? (
            <LessonEditor key={active.id} courseId={courseId} orgId={orgId} lesson={active} editable={!!editable} onSaved={mutate} onDirty={setDirty} />
          ) : (
            <Card><p className="text-text-3 text-sm">Add a lesson to start building.</p></Card>
          )}
        </div>
      </div>
    </PageMotion>
  );
}

function LessonEditor({ orgId, courseId, lesson, editable, onSaved, onDirty }: Readonly<{ orgId: string; courseId: string; lesson: Lesson; editable: boolean; onSaved: () => void; onDirty: (dirty: boolean) => void }>) {
  const action = useApiAction();
  const drafts = useAuthoringDrafts();
  const draftKey = `${orgId}:${courseId}:${lesson.id}`;
  const [initial] = useState(() => editable ? drafts.get(draftKey) : undefined);
  const [title, setTitle] = useState(initial?.title ?? lesson.title);
  const [skill, setSkill] = useState(initial?.skill ?? lesson.skill?.slug ?? "");
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => (initial?.blocks ?? lesson.blocks ?? []).map(editableBlock));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(!!initial);
  const [restored, setRestored] = useState(!!initial);
  const [preview, setPreview] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState<{ block: EditorBlock; index: number } | null>(null);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => { if (dirty && editable) { drafts.put(draftKey, { title, skill, blocks }); } }, [dirty, editable, drafts, draftKey, title, skill, blocks]);
  const mut = (fn: (b: EditorBlock[]) => EditorBlock[]) => { setBlocks(fn); setDirty(true); setError(""); };
  const addBlock = (type: string) => mut((b) => [...b, editableBlock({ type, data: type === "quiz" ? { question: "", choices: ["", ""], correctIndex: 0 } : {} })]);
  const setField = (i: number, field: string, v: string) => mut((b) => b.map((bl, j) => j === i ? { ...bl, data: { ...bl.data, [field]: v } } : bl));
  const setQuiz = (i: number, choices: string[], correctIndex: number, ids?: string[]) => mut((b) => b.map((bl, j) => j === i ? { ...bl, [choiceIds]: ids ?? bl[choiceIds], data: { ...bl.data, choices, correctIndex } } : bl));
  const move = (i: number, d: -1 | 1) => mut((b) => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) { return b; } [n[i], n[j]] = [n[j]!, n[i]!]; return n; });
  async function save() {
    if (!title.trim()) { setError("Add a lesson title before saving."); return; }
    const invalidQuiz = blocks.findIndex((b) => b.type === "quiz" && (!fieldText(b.data.question).trim() || !Array.isArray(b.data.choices) || b.data.choices.length < 2 || b.data.choices.length > 6 || b.data.choices.some((c) => !fieldText(c).trim()) || !Number.isInteger(b.data.correctIndex) || Number(b.data.correctIndex) < 0 || Number(b.data.correctIndex) >= b.data.choices.length));
    if (invalidQuiz >= 0) { setError(`Check quiz ${invalidQuiz + 1}: add a question, two to six answers, and select the correct answer.`); return; }
    setSaving(true); setError("");
    try {
      await action(`/orgs/${orgId}/lessons/${lesson.id}`, { method: "PATCH", body: JSON.stringify({ title: title.trim(), blocks, skillSlug: skill.trim() || null }) });
      drafts.remove(draftKey); setDirty(false); setRestored(false); onDirty(false); onSaved(); toast.success("Lesson saved");
    } catch (error_) { setError(error_ instanceof Error ? error_.message : "Could not save this lesson. Your edits are still here; try again."); } finally { setSaving(false); }
  }
  return <Card className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><h2 className="text-lg font-semibold">{preview ? "Learner preview" : "Edit lesson"}</h2><Button variant="secondary" onClick={() => { setPreview(!preview); setAnswers({}); }} aria-pressed={preview}>{preview ? "Back to editing" : "Preview lesson"}</Button></div>
    {restored && <output  className="block mb-4 text-sm text-text-2">Your unsaved draft was restored. Review it and save when ready.</output>}
    {preview ? <section aria-label="Learner preview" className="space-y-5"><p className="text-sm text-text-2">This preview includes your current edits. Answers here do not change learner progress or publish the course.</p><h3 className="text-2xl font-semibold break-words">{title || "Untitled lesson"}</h3><LessonBlocks orgId={orgId} lessonId={`preview-${lesson.id}`} blocks={blocks} answers={answers} onAnswer={(key, choice) => setAnswers((value) => ({ ...value, [key]: choice }))} />{blocks.length === 0 && <p className="text-text-2">Add content to see it here.</p>}</section> : <>
      <label className="block font-medium">Lesson title<input className={`${fieldClass} mt-2`} value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} disabled={!editable || saving} /></label>
      {editable && <label className="block mt-4 text-sm">Skill tag (optional)<input className={`${fieldClass} mt-2`} placeholder="e.g. kafka" value={skill} onChange={(e) => { setSkill(e.target.value); setDirty(true); }} disabled={saving} /><span className="block mt-2 text-text-2">Connects lesson completion to the skill record.</span></label>}
      <fieldset disabled={!editable || saving} className="mt-6 space-y-5 min-w-0"><legend className="sr-only">Lesson content</legend>
        {blocks.map((b, i) => {
          const m = meta(b.type);
          const choices = Array.isArray(b.data.choices) ? b.data.choices.map(fieldText) : [];
          return <section key={b[editorId]} className="border-t border-border pt-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h3 className="text-sm font-semibold">{i + 1}. {m.label}</h3>{editable && <div className="flex gap-1"><Button variant="ghost" disabled={i === 0} aria-label={`Move block ${i + 1} up`} onClick={() => move(i, -1)}>Move up</Button><Button variant="ghost" disabled={i === blocks.length - 1} aria-label={`Move block ${i + 1} down`} onClick={() => move(i, 1)}>Move down</Button><Button variant="ghost" aria-label={`Remove block ${i + 1}`} onClick={() => { setRemoved({ block: b, index: i }); mut((items) => items.filter((_, j) => i !== j)); }}>Remove</Button></div>}</div>
            {b.type === "quiz" ? <div className="space-y-4"><label className="block">Question<input aria-label={`Quiz ${i + 1}`} className={`${fieldClass} mt-2`} value={fieldText(b.data.question)} onChange={(e) => setField(i, "question", e.target.value)} /></label><fieldset className="space-y-3"><legend className="mb-2 font-medium">Answers — select the correct one</legend>{choices.map((choice, j) => <div className="flex flex-wrap items-center gap-2" key={b[choiceIds][j]}><label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name={`correct-${lesson.id}-${i}`} checked={Number(b.data.correctIndex ?? 0) === j} onChange={() => setQuiz(i, choices, j)} /><span>Correct answer {j + 1}</span></label><input aria-label={`Quiz ${i + 1} answer ${j + 1}`} className={`${fieldClass} flex-1 min-w-[min(100%,10rem)]`} value={choice} onChange={(e) => setQuiz(i, choices.map((c, k) => k === j ? e.target.value : c), Number(b.data.correctIndex ?? 0))} /><Button variant="ghost" aria-label={`Remove quiz ${i + 1} answer ${j + 1}`} disabled={choices.length <= 2} onClick={() => { const correct = Number(b.data.correctIndex ?? 0); setQuiz(i, choices.filter((_, k) => k !== j), correctAfterRemoval(correct, j), b[choiceIds].filter((_, k) => k !== j)); }}>Remove</Button></div>)}</fieldset><Button variant="secondary" disabled={choices.length >= 6} onClick={() => setQuiz(i, [...choices, ""], Number(b.data.correctIndex ?? 0), [...b[choiceIds], crypto.randomUUID()])}>Add answer</Button></div> : <>
              {b.type === "image" && <label className="block mb-3">Image description<input className={`${fieldClass} mt-2`} value={fieldText(b.data.alt)} onChange={(e) => setField(i, "alt", e.target.value)} /></label>}
              {["video", "embed", "file", "toggle"].includes(b.type) && <label className="block mb-3">Resource title<input className={`${fieldClass} mt-2`} value={fieldText(b.data.title)} onChange={(e) => setField(i, "title", e.target.value)} /></label>}
              {b.type === "video" && <div className="mb-3"><PrivateMediaUpload orgId={orgId} accept=".vtt" label="Upload private captions (.vtt)" onUploaded={(asset) => mut((items) => items.map((item) => item[editorId] === b[editorId] ? { ...item, data: { ...item.data, captionsAssetId: asset.id, captionsUrl: "" } } : item))} />{b.data.captionsAssetId ? <p className="text-sm text-text-2">Private captions attached.</p> : <label className="block mb-3">Captions URL (optional, WebVTT)<input className={`${fieldClass} mt-2`} value={fieldText(b.data.captionsUrl)} onChange={(e) => setField(i, "captionsUrl", e.target.value)} /></label>}</div>}
              {["image", "video", "file"].includes(b.type) && <div className="mb-4 space-y-2"><PrivateMediaUpload orgId={orgId} accept={MEDIA_ACCEPT[b.type] ?? ""} onUploaded={(asset) => mut((items) => items.map((item) => item[editorId] === b[editorId] ? { ...item, data: { ...item.data, assetId: asset.id, filename: asset.filename, url: "" } } : item))} />{fieldText(b.data.assetId) ? <p className="text-sm">Private upload: {fieldText(b.data.filename)} <Button type="button" variant="ghost" onClick={() => mut((items) => items.map((item) => item[editorId] === b[editorId] ? { ...item, data: { ...item.data, assetId: undefined, filename: undefined } } : item))}>Use an external URL instead</Button></p> : <p className="text-sm text-text-2">External links keep their original host’s access settings. Upload confidential material here.</p>}</div>}
              {m.field && !b.data.assetId && <label className="block text-sm">{m.label} content{["rich_text", "code", "callout", "toggle"].includes(b.type) ? <textarea className={`${fieldClass} mt-2 min-h-28 ${b.type === "code" ? "font-mono" : ""}`} aria-label={`${m.label} ${i + 1}`} placeholder={m.placeholder} value={fieldText(b.data[m.field])} onChange={(e) => setField(i, m.field!, e.target.value)} /> : <input className={`${fieldClass} mt-2`} aria-label={`${m.label} ${i + 1}`} placeholder={m.placeholder} value={fieldText(b.data[m.field])} onChange={(e) => setField(i, m.field!, e.target.value)} />}</label>}
            </>}
          </section>;
        })}
        {blocks.length === 0 && <p className="text-text-2 text-sm">No content yet. Choose Add content to start this lesson.</p>}
      </fieldset>
      {editable && <div className="mt-5 space-y-4">{removed && <output  className="flex flex-wrap items-center gap-3 text-sm"><span>Content removed.</span><Button variant="secondary" disabled={saving} onClick={() => { mut((items) => { const next = [...items]; next.splice(Math.min(removed.index, next.length), 0, removed.block); return next; }); setRemoved(null); }}>Undo removal</Button></output>}
        <details className="border-y border-border py-2"><summary className="min-h-11 cursor-pointer flex items-center font-medium">Add content</summary><div className="py-3 grid gap-5 sm:grid-cols-3">{[{ name: "Writing", types: ["heading", "rich_text", "callout", "toggle"] }, { name: "Media", types: ["video", "embed", "image", "file"] }, { name: "Practice and structure", types: ["code", "judged_code", "quiz", "divider"] }].map((group) => <div key={group.name}><h3 className="text-sm font-medium mb-2">{group.name}</h3><div className="flex flex-col items-stretch gap-1">{BLOCK_TYPES.filter((b) => group.types.includes(b.type)).map((b) => <Button variant="ghost" className="justify-start" key={b.type} disabled={saving} onClick={() => addBlock(b.type)}>+ {b.label}</Button>)}</div></div>)}</div></details>
      </div>}
    </>}
    {editable && <div className="mt-6 border-t border-border pt-4 space-y-3">{error && <p role="alert" className="text-hard">{error}</p>}<div className="flex flex-wrap items-center gap-3"><Button onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save lesson"}</Button><output  className="text-sm text-text-2">{dirty ? "Unsaved changes" : "All changes saved"}</output></div><p className="text-xs text-text-2">Save before closing this browser tab or signing out.</p></div>}
    {editable && <PrivateMediaLibrary orgId={orgId} />}
  </Card>;
}
