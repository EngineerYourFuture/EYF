"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
type Diff = (typeof DIFFICULTIES)[number];

type Row = { id: string; slug: string; title: string; difficulty: Diff; weeks: number; premium: boolean; techStack: string[]; _count: { userProjects: number } };
type Full = Omit<Row, "_count"> & { description: string; tags: string[]; outcomes: string[] };
type Form = { slug: string; title: string; description: string; techStack: string; difficulty: Diff; weeks: number; tags: string; outcomes: string; premium: boolean };
const EMPTY: Form = { slug: "", title: "", description: "", techStack: "", difficulty: "MEDIUM", weeks: 4, tags: "", outcomes: "", premium: false };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const { data, mutate } = useApi<Row[]>("/admin/content/project-ideas");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/project-ideas/${id}`);
    setForm({ slug: x.slug, title: x.title, description: x.description, techStack: x.techStack.join(", "), difficulty: x.difficulty, weeks: x.weeks, tags: x.tags.join(", "), outcomes: x.outcomes.join(", "), premium: x.premium });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, techStack: csv(form.techStack), tags: csv(form.tags), outcomes: csv(form.outcomes) };
    try {
      if (editing?.id) await action(`/admin/content/project-ideas/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/project-ideas`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, title: string) {
    if (!(await confirm({ title: `Delete "${title}"? Only if no student has started it.`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/project-ideas/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to project ideas</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit project idea" : "New project idea"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Realtime chat app" /></Field>
            <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="realtime-chat" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Difficulty"><select className={inputCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Diff)}>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
            <Field label="Weeks"><input type="number" min={1} max={52} className={inputCls} value={form.weeks} onChange={(e) => set("weeks", Number(e.target.value))} /></Field>
          </div>
          <Field label="Description"><textarea className={`${inputCls} min-h-28 py-3 h-auto`} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Tech stack" hint="comma-separated"><input className={inputCls} value={form.techStack} onChange={(e) => set("techStack", e.target.value)} placeholder="Next.js, Postgres, WebSockets" /></Field>
          <Field label="Tags" hint="comma-separated"><input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="fullstack, realtime" /></Field>
          <Field label="Outcomes" hint="comma-separated"><input className={inputCls} value={form.outcomes} onChange={(e) => set("outcomes", e.target.value)} placeholder="deploy to vercel, auth flow" /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.premium} onChange={(e) => set("premium", e.target.checked)} /> Premium (paid plans only)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.description}>{saving ? "Saving…" : editing.id ? "Save changes" : "Create idea"}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Project ideas</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} ideas · the BTech project catalog students build from.</p>
        </div>
        <Button onClick={startNew}>+ New idea</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{x.title}</span>
                <Badge tone={x.difficulty === "EASY" ? "easy" : x.difficulty === "MEDIUM" ? "medium" : "hard"}>{x.difficulty}</Badge>
                <Badge>{x.weeks}w</Badge>
                {x.premium && <Badge tone="accent">Premium</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">{x.techStack.join(" · ")} · {x._count.userProjects} started</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id, x.title)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.cube width={28} height={28} />} title="No project ideas yet" description="Add the first idea — it appears in the student projects catalog immediately." />}
      </div>
    </div>
  );
}
